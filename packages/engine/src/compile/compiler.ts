/**
 * 模板编译器
 *
 * 基于 transformElement 深度优先重建模板树：对每个含指令的元素，浅克隆（保留
 * 普通属性）、移除指令属性、创建 AutoSparkScope 并执行其指令生命周期。
 *
 * **浅克隆是安全的**：transformElement 命中 transformer 后会用返回的新元素替换原节点，
 * 并继续递归**原节点的子节点**挂到新元素下——因此子树会被完整重建（等价深克隆，
 * 但允许每个子节点各自走 transformer 处理）。
 *
 * 编译期通过 templateScopeMap 建立 scope 父子关系（向上查找最近指令祖先），
 * 并让子作用域继承父的 localData（供 x-for 注入的 item/index 向下传递到嵌套子元素）。
 */
import { AutoSparkScope } from "../scope";
import { SCOPES_KEY } from "../engine";
import { removeDirectives } from "../directives/utils/removeDirectives";
import { isDirectiveAttr } from "../directives/utils/isDirectiveAttr";
import { DirectiveKind } from "../directives/base";
import { ModelDirective } from "../directives/presets/model";
import type { AutoDirectiveInfo } from "../directives/types";
import type { AutoSpark } from "../engine";
import {
    transformElement,
    type NodeTransformer,
    type OwnsChildrenResult,
} from "../utils/transformElement";
import { hasDirectives } from "../directives/utils/hasDirectives";
import { hasMustache, isRawTextElement, parseInterpolation, synthAttrExpr } from "./mustache";
import { collectDataScripts, isDataScript, type DataScriptStash } from "./dataScript";
import {
    getDirectiveAttrValue,
    isAsyncDataValue,
    isAsyncHtmlValue,
} from "../directives/presets/async-source";
import { buildComponentDef } from "./collect";
import { resolveComponentData } from "./setup";
import type { ComponentDataBasis, ComponentDef } from "../directives/component-def";
import type { SlotContent } from "../utils/slot";
import { mountComponentScopedAttr, injectComponentStyle } from "../utils/scopedStyle";
import { coerceStyleValue, type StyleBind } from "../utils/styleBind";
import { iconRegistry } from "../icons/registry";

/**
 * 元素是否含插值（需建 scope 的判据之一）。
 *
 * 探测两处 `{{`：**直接文本子节点**（文本插值）与**自身非指令属性值**（属性插值）。
 * 均非递归、O(直接子节点/属性数)，绝不退化成 O(n²)。raw-text 元素（SCRIPT/STYLE）
 * 一律不插值（见 ADR-0004 决策 7）。
 */
function hasInterpolation(el: HTMLElement): boolean {
    if (isRawTextElement(el)) return false;
    for (let i = 0; i < el.childNodes.length; i++) {
        const child = el.childNodes[i];
        if (child && child.nodeType === Node.TEXT_NODE && hasMustache(child.nodeValue)) return true;
    }
    for (let i = 0; i < el.attributes.length; i++) {
        const attr = el.attributes[i];
        if (attr && !isDirectiveAttr(attr.name) && hasMustache(attr.value)) return true;
    }
    return false;
}

/**
 * 元素是否声明某指令属性（含修饰符形态）。
 *
 * `hasAttribute("x-if")` 对 `x-if.keepalive`（属性名含修饰符后缀）为 false，孤儿分支
 * 判据若用精确匹配会把 keepalive 宿主的分支误报孤儿——本 helper 匹配 `x-if` 与
 * `x-if.<modifiers>` 两种形态（ADR-0034 keepalive 误 warn 的修复，ADR-0037 同构沿用）。
 */
function hasDirectiveAttr(el: HTMLElement, name: string): boolean {
    for (let i = 0; i < el.attributes.length; i++) {
        const attrName = el.attributes[i]!.name;
        if (attrName === name || attrName.startsWith(`${name}.`)) return true;
    }
    return false;
}

export class AutoSparkCompiler {
    readonly engine: AutoSpark;
    /** 编译期：原树模板元素 → scope 映射，用于建立 scope 父子关系与 localData 继承 */
    private templateScopeMap = new WeakMap<HTMLElement, AutoSparkScope>();
    /**
     * 编译期：scope → 数据脚本预扫产物（ADR-0032）。compileElement 在 scope.compile() 前
     * 写入，DataDirective.created()（优先级 200，compile 内最先执行）一次性消费后删除——
     * 每实例编译各写各的，无跨实例共享。
     */
    private dataScriptStash = new WeakMap<AutoSparkScope, DataScriptStash>();

    constructor(engine: AutoSpark<any>) {
        this.engine = engine;
    }

    private _getTransformers(): NodeTransformer<HTMLElement>[] {
        return [
            // 前置：<script type="autospark/actions"> 提取为局部 action 后剪枝（普通 script 原样保留）。
            // 提取/解析/注入收编于 ActionManager；scope 解析留在 compiler（依赖私有 templateScopeMap）
            [
                (node: Node) =>
                    node instanceof HTMLScriptElement && node.type === "autospark/actions",
                (script: HTMLElement) =>
                    this.engine.actionsManager.extractScript(
                        script as HTMLScriptElement,
                        this._findNearestScope(script as HTMLScriptElement),
                    ),
            ],
            // 前置：旧写法 <script type="actions">（ADR-0031 更名前）——warn 提示迁移 + 剪枝不执行
            [
                (node: Node) => node instanceof HTMLScriptElement && node.type === "actions",
                () => {
                    this.engine.logger.warn(
                        `<script type="actions"> 已更名为 <script type="autospark/actions">（ADR-0031），该脚本未注册`,
                    );
                    return null;
                },
            ],
            // 前置：<script type="autospark/data"> ——内容已在父元素编译期预扫消费
            //（compileElement 调 collectDataScripts，ADR-0032），此处仅剪枝（不进渲染 DOM）
            [(node: Node) => isDataScript(node), () => null],
            // 前置：x-fallback 特例子节点（ADR-0033 决策 4 / ADR-0035 决策 3-4）——直接父元素为
            // 异步源宿主（异步 x-data，或异步 x-html 且宿主无双异步 x-data——双异步时 fallback
            // 归 x-data 独占）时已被物种指令采集（collectFallback），剪枝不进渲染 DOM；
            // 孤立 x-fallback（父无异步源）→ warn + 当普通元素放行（默认浅克隆继续编译）。
            // 指令属性值读取兼容修饰符变体（x-data.global / x-html.compile，getDirectiveAttrValue）
            [
                (node: Node) => node instanceof HTMLElement && node.hasAttribute("x-fallback"),
                (el: HTMLElement) => {
                    const parent = el.parentElement;
                    if (parent) {
                        const dataVal = getDirectiveAttrValue(parent, "x-data");
                        // x-data 侧认领（ADR-0033）；双异步时 x-data 优先独占（ADR-0035 决策 6）
                        if (dataVal !== null && isAsyncDataValue(dataVal)) return null;
                        // x-html 侧认领（ADR-0035）：仅宿主无异步 x-data 时（fallback 归属唯一）
                        const htmlVal = getDirectiveAttrValue(parent, "x-html");
                        if (htmlVal !== null && isAsyncHtmlValue(htmlVal)) return null;
                    }
                    this.engine.logger.warn(
                        `x-fallback: 父元素未声明异步源（异步 x-data / 异步 x-html），按普通元素渲染（ADR-0033/0035）`,
                    );
                    return el.cloneNode(false) as HTMLElement;
                },
            ],
            // 前置：x-else-if / x-else 条件分支（ADR-0034）——分支快照由 IfDirective 在宿主 created 期
            // 主动扫描直接子元素克隆收集（模板只读），本层仅负责**剪枝**：分支是备选模板、
            // 永不进结果 DOM（eager 的 compileSubtree 与 keepalive 的主 walk 两条子树编译通道统一拦截）。
            // 父元素无 x-if 指令属性（含修饰符形态）→ 孤儿分支：warn + 丢弃（同 x-define 孤儿惯例）
            [
                (node: Node) =>
                    node instanceof HTMLElement &&
                    (node.hasAttribute("x-else-if") || node.hasAttribute("x-else")),
                (el: HTMLElement) => {
                    const parent = el.parentElement;
                    if (!(parent && hasDirectiveAttr(parent, "x-if"))) {
                        this.engine.logger.warn(
                            `x-else-if/x-else: 父元素未声明 x-if，分支被丢弃。分支必须是 x-if 宿主的直接子元素（ADR-0034）`,
                        );
                    }
                    return null;
                },
            ],
            // 前置：x-case / x-default 分支选择（ADR-0037）——与 x-else-if/x-else 同构：快照由
            // SwitchDirective 在宿主 created 期克隆收集，本层仅负责剪枝（两条子树编译通道统一拦截）。
            // 父元素无 x-switch 指令属性（含修饰符形态）→ 孤儿分支：warn + 丢弃（含误写在 x-if 宿主内的 x-case）
            [
                (node: Node) =>
                    node instanceof HTMLElement &&
                    (node.hasAttribute("x-case") || node.hasAttribute("x-default")),
                (el: HTMLElement) => {
                    const parent = el.parentElement;
                    if (!(parent && hasDirectiveAttr(parent, "x-switch"))) {
                        this.engine.logger.warn(
                            `x-case/x-default: 父元素未声明 x-switch，分支被丢弃。分支必须是 x-switch 宿主的直接子元素（ADR-0037）`,
                        );
                    }
                    return null;
                },
            ],
            // 前置：x-define 命名组件定义（ADR-0054 更名自 x-component）——收集冻结快照到
            // 最近祖先 scope.components 后剪枝（不进结果 DOM）。
            // 须排在 HTMLElement 通用规则（compileElement）之前，first-match-wins 命中后不再走通用编译，
            // 故 x-define 元素不建 scope、不实例化其上其他指令（同元素 x-text 等随组件冻结，ADR-0022）。
            // 修饰符形态（x-define.open 等，ADR-0053）同命中——属性名带 . 段、值仍是组件名。
            [
                (node: Node) => node instanceof HTMLElement && this._matchComponentAttr(node),
                (componentEl: HTMLElement) => this._collectComponent(componentEl),
            ],
            // 前置：x-icon-define 图标定义（ADR-0046）——声明性资源：取首个 <svg> 子元素上交全局
            // 图标注册表（AutoSpark.icons）后剪枝（不进结果 DOM）。指令类仅为名位（x-define 同构），
            // 永不被实例化。动态区域（x-for 项模板 / x-html.compile / 组件快照）内重复定义幂等覆盖。
            [
                (node: Node) => node instanceof HTMLElement && node.hasAttribute("x-icon-define"),
                (iconEl: HTMLElement) => this._collectIconDefine(iconEl),
            ],
            // 文本节点插值：含 {{}} 的文本节点拆分 + 注册。scope 经父元素查 templateScopeMap
            // （父元素在自身 walk 前已建 scope，含插值的 directive-less 元素亦由 hasInterpolation
            // 触发建 scope）。无 scope（raw-text 父等）则原样克隆。见 ADR-0004 决策 1/4。
            [
                (node: Node) =>
                    node.nodeType === Node.TEXT_NODE && hasMustache((node as Text).nodeValue),
                (node: Node) => {
                    const parent = node.parentElement;
                    const scope = parent ? this.templateScopeMap.get(parent) : undefined;
                    if (!scope) return node.cloneNode(true);
                    return this.compileTextNode(node as Text, scope);
                },
            ],
            [
                (node: Node) => node instanceof HTMLElement,
                (current: HTMLElement) => this.compileElement(current),
            ],
        ];
    }

    /**
     * 元素是否带 x-define 声明属性（含修饰符形态，ADR-0053；指令名 ADR-0054）。
     *
     * 命中形态：`x-define`（正身）与 `x-define.open` 等带 `.` 修饰符段的属性名；
     * `x-define-options`（指令选项属性）**不是**声明形态——不命中（`x-define-` 前缀
     * 与 `x-define.` 修饰符前缀是两个不同边界，与 dispatcher 的保留规则同构）。
     * 实例化指令 `x-component:名称` 亦不命中（属性名整体是 `x-component:xxx`，与上述前缀均不同）。
     */
    private _matchComponentAttr(el: HTMLElement): boolean {
        if (el.hasAttribute("x-define")) return true;
        for (const attr of Array.from(el.attributes)) {
            if (attr.name.startsWith("x-define.")) return true;
        }
        return false;
    }

    /**
     * 解析 x-define 声明属性：组件名（值，无值 `default`）+ 修饰符段（属性名 `.` 后段）。
     * 未知修饰符 warn + 忽略；`open` 修饰符注入边界开关（ADR-0053）。
     */
    private _parseComponentAttr(el: HTMLElement): { name: string; modifierOpen: boolean } {
        let attrName = "x-define";
        let rawName = el.getAttribute("x-define");
        if (rawName == null) {
            for (const attr of Array.from(el.attributes)) {
                if (attr.name.startsWith("x-define.")) {
                    attrName = attr.name;
                    rawName = attr.value;
                    break;
                }
            }
        }
        const segments = attrName.slice("x-define".length).split(".").filter(Boolean);
        for (const seg of segments) {
            if (seg !== "open") {
                this.engine.logger.warn(
                    `x-define: 未知修饰符 ".${seg}"，已忽略（ADR-0053 仅提供 .open）`,
                );
            }
        }
        return {
            name: (rawName ?? "").trim() || "default",
            modifierOpen: segments.includes("open"),
        };
    }

    /**
     * 收集 x-define 命名组件定义（ADR-0022 承接 ADR-0021；指令名 ADR-0054 更名自 x-component）。
     *
     * 编译期前置 transformer 命中 x-define 元素时调用：把该元素**深克隆**为冻结快照，
     * 按名存入**最近祖先 scope** 的 `components`，然后返回 `null` 剪枝——组件元素及其子树
     * **不进结果 DOM、不建 scope、不实例化指令**。
     *
     * 消费者（x-loading/x-empty/x-error…）经 `scope.getComponent(name)` 沿 parent 链就近取用本快照
     * （到顶兜底全局组件），clone 后编译渲染、替换其默认 UI（组件兜底）。详见 ADR-0022。
     *
     * **default 唯一性已放宽**（ADR-0022 决策四-4）：同名组件直接归属同一 scope 时 warn + 后者覆盖
     * （不再抛错）。沿 parent 链的就近覆盖由 getComponent 就近原则处理。
     *
     * @param componentEl 原树中的 x-define 元素（只读编译输入，仅读取其属性与结构）
     * @returns 固定 `null`（剪枝，x-define 永不进结果 DOM）
     */
    private _collectComponent(componentEl: HTMLElement): null {
        const { name, modifierOpen } = this._parseComponentAttr(componentEl);
        // 沿原树向上找最近祖先 scope（与 _linkParent 同构：跨中间无 scope 的纯 div）。
        // walk 是 DFS，祖先元素已先 transform，若建了 scope 必已 templateScopeMap.set。
        // 注：实例化父组件时 compileSubtree 编译其快照子树，内层 x-define 经 transformElement
        // 再次命中本收集器，归属到父组件的**实例 scope**——运行期 scope 链天然实现嵌套私有子组件。
        let owner: AutoSparkScope | undefined;
        let p: HTMLElement | null = componentEl.parentElement;
        while (p) {
            owner = this.templateScopeMap.get(p);
            if (owner) break;
            p = p.parentElement;
        }
        if (!owner) {
            // 无归属：编译期 warn + 丢弃（不进 components、不进 DOM）。与引擎静默处理冗余/异常属性的风格一致。
            this.engine.logger.warn(
                `x-define: 组件 "${name}" 未找到任何祖先 scope，无法归属。请在祖先元素上声明 x-scope（或任意指令）使其建 scope。`,
            );
            return null;
        }
        // default 唯一性放宽（ADR-0022 决策四-4）：同名组件直接归属本 scope → warn + 后者覆盖（不再抛错）。
        // 沿 parent 链的就近覆盖由 getComponent 就近原则处理（不在此校验）。
        if (owner.components && Object.prototype.hasOwnProperty.call(owner.components, name)) {
            this.engine.logger.warn(
                `[x-define] 组件 "${name}" 在同一 scope 下重复声明，后者覆盖前者（ADR-0022 决策四-4 放宽 default 唯一性）。`,
            );
        }
        // 组装组件定义：提取 <script setup>/<style>、求值合并 setup、深克隆冻结快照（已剥离 script/style）。
        // declarerScope 归属本祖先 scope（ADR-0053 declarer 基准的数据视图挂链目标）；.open 修饰符并入边界声明。
        const def = buildComponentDef(
            componentEl,
            name,
            (msg) => this.engine.logger.warn(msg),
            owner,
            modifierOpen,
        );
        // scope.components 仍存 HTMLElement 快照（保持 getComponent 的 HTMLElement 契约，x-loading 等消费者不变）；
        // ComponentDef 元数据（setup/hooks/styles）以快照根为 key 注册到 engine，供 x-component 实例化时反查。
        this.engine.registerComponentDef(def);
        if (!owner.components) owner.components = {};
        owner.components[name] = def.snapshot;
        return null;
    }

    /**
     * 收集 x-icon-define 图标定义（ADR-0046 决策 1）。
     *
     * 编译期前置 transformer 命中 x-icon-define 元素时调用：值 = 图标名（指令值装名，
     * 对齐 x-define 惯例）、template 内容装 SVG（浏览器原生不渲染 template，零转义容器）。
     * 取**首个 `<svg>` 子元素**的 outerHTML 上交全局图标注册表（名称校验/规范化/覆盖 warn
     * 去重收编于 IconRegistry.add），然后返回 `null` 剪枝——定义元素永不进结果 DOM。
     * 非法名 / 无 svg 子元素 warn + 跳过注册（元素照剪）；svg 之外的多余根节点 warn 但仍取首个 svg。
     *
     * @param iconEl 原树中的 x-icon-define 元素（只读编译输入）
     * @returns 固定 `null`（剪枝）
     */
    private _collectIconDefine(iconEl: HTMLElement): null {
        const name = (iconEl.getAttribute("x-icon-define") ?? "").trim();
        // template 的子节点在 .content（DocumentFragment）；非 template 宿主退化为元素自身
        const root: ParentNode = iconEl instanceof HTMLTemplateElement ? iconEl.content : iconEl;
        let svg: Element | null = null;
        let extraRoots = 0;
        for (const child of root.children) {
            if (child.tagName.toLowerCase() === "svg") {
                if (!svg) svg = child;
            } else {
                extraRoots++;
            }
        }
        if (!name) {
            this.engine.logger.warn(`x-icon-define: 缺少图标名（值留空），定义被跳过（ADR-0046）`);
            return null;
        }
        if (!svg) {
            this.engine.logger.warn(
                `x-icon-define: 图标 "${name}" 未找到 <svg> 子元素，定义被跳过（ADR-0046）`,
            );
            return null;
        }
        if (extraRoots > 0) {
            this.engine.logger.warn(
                `x-icon-define: 图标 "${name}" 的声明含 ${extraRoots} 个 svg 之外的根节点，已忽略（ADR-0046）`,
            );
        }
        iconRegistry.add(name, svg.outerHTML);
        return null;
    }

    /**
     * 编译含 `{{}}` 的文本节点（文本插值，ADR-0004 决策 1/3）。
     *
     * 拆为「字面量段 + 表达式段」，每表达式段一个 text node + 一个 `scope.watch`；
     * 返回由段 text node 组成的 `DocumentFragment`（调用方 appendChild 搬入父）。
     *
     * **x-text / 非 compile 的 x-html 在场 → 返回 null（剪枝）**：x-text 整体覆写 textContent，
     * 若插值已建段 text node + watcher，首次 compile 后段 node 被清空成游离节点、watcher 仍订阅 →
     * 孤儿 watcher 泄漏。故编译期剪枝该文本节点（非「建了让 x-text 覆盖」）。见 ADR-0004 决策 5。
     *
     * **x-html.compile 例外（ADR-0017）**：compile 模式把注入内容作为子模板编译，其顶层文本插值
     * 应正常编译（由 recompileSubtree 注入），故 compile 模式的 html 指令不触发剪枝——宿主原生
     * 子节点反正被注入内容覆盖，无孤儿 watcher 风险。
     *
     * @returns DocumentFragment（段 text node 集合）；x-text / 非 compile 的 x-html 在场返回 null（剪枝）
     */
    private compileTextNode(node: Text, scope: AutoSparkScope): DocumentFragment | null {
        if (
            scope.directives.some(
                (d) =>
                    d.info.name === "text" || (d.info.name === "html" && !d.info.options?.compile),
            )
        ) {
            return null;
        }
        const segments = parseInterpolation(node.nodeValue ?? "");
        const frag = document.createDocumentFragment();
        if (!segments) {
            // 无 {{}}（filter 已筛，兜底）：原样克隆
            frag.appendChild(node.cloneNode(true));
            return frag;
        }
        for (const seg of segments) {
            if ("literal" in seg) {
                frag.appendChild(document.createTextNode(seg.literal));
            } else {
                const segNode = document.createTextNode("");
                const initial = scope.watch(seg.expr, ({ value }) => {
                    segNode.nodeValue = value == null ? "" : String(value);
                });
                segNode.nodeValue = initial == null ? "" : String(initial);
                frag.appendChild(segNode);
            }
        }
        return frag;
    }

    /**
     * 属性插值 desugar（ADR-0004 决策 9-12）。
     *
     * 扫描 `el` 的非指令属性，对值含 `{{}}` 者：① 同属性已有显式 bind → 抛错（互斥）；
     * ② `removeAttribute` 移除原生平属性（防字面 `{{}}` 泄漏 DOM）；③ 合成表达式；
     * ④ 实例化 `BindDirective` 复用其五路 patch 分派（class diff / style / property /
     * boolean / 普通）。watcher 经 `scope.watch` 自动入 `scope.watchers`/`_updates`，
     * destroy/refresh 自动，无需手动登记。
     */
    private _compileAttrInterpolation(el: HTMLElement, scope: AutoSparkScope): void {
        const targets: Array<{ name: string; value: string }> = [];
        for (let i = 0; i < el.attributes.length; i++) {
            const attr = el.attributes[i];
            if (attr && !isDirectiveAttr(attr.name) && hasMustache(attr.value)) {
                targets.push({ name: attr.name, value: attr.value });
            }
        }
        for (const { name, value } of targets) {
            // 冲突检测：同属性已有显式 bind（:name / x-bind:name / x-class 等）
            const conflict = scope.directives.some(
                (d) => d.info.name === "bind" && d.info.attr === name,
            );
            if (conflict) {
                throw new Error(
                    `[插值冲突] 属性 "${name}" 已有显式绑定（:${name}/x-bind:${name}），与插值 ${name}="${value}" 互斥。\n` +
                        `请二选一：用插值 ${name}="${value}"，或显式 :${name}="<expr>"。`,
                );
            }
            const synthExpr = synthAttrExpr(value);
            el.removeAttribute(name);
            const BindCls = this.engine.directives.get("bind");
            if (!BindCls) {
                this.engine.logger.warn(`属性插值：未注册 bind 指令，跳过 ${name}="${value}"`);
                continue;
            }
            const info: AutoDirectiveInfo = { name: "bind", attr: name, value: synthExpr };
            const bind = new BindCls(this.engine, scope, info);
            bind.created();
        }
    }

    /**
     * x-model 元数据自动注入（ADR-0020）：含 x-model 的元素从 configManager schema 合成隐式 `@` 绑定。
     *
     * 与 `_compileAttrInterpolation` 并列，在 scope.compile() 后调用。合成知识封装在
     * `ModelDirective.synthesizeSchemaBindings` 静态方法（compiler 只管调用时机）。合成实体是
     * 标准 BindDirective 实例（复用 ADR-0019 全部能力）。无 x-model 的元素直接跳过。
     */
    private _synthesizeModelSchemaBindings(el: HTMLElement, scope: AutoSparkScope): void {
        const modelDirective = scope.directives.find((d) => d instanceof ModelDirective);
        if (!modelDirective) return;
        ModelDirective.synthesizeSchemaBindings(this.engine, scope, el, modelDirective.info);
    }

    /**
     * 沿 parentElement 向上查找最近的已注册 scope（templateScopeMap）。
     * 与 `_linkParent` 查找逻辑一致，用于把 script action 挂到最近祖先作用域
     * （查好后作为入参传给 actionsManager.extractScript，见 _getTransformers）。
     */
    private _findNearestScope(el: HTMLElement): AutoSparkScope | undefined {
        let p: HTMLElement | null = el.parentElement;
        while (p) {
            const scope = this.templateScopeMap.get(p);
            if (scope) return scope;
            p = p.parentElement;
        }
        return undefined;
    }

    /**
     * 编译整棵模板，返回重建后的根元素（已移除指令属性、各元素挂载 scope）。
     * 每次 compile 重建 templateScopeMap（编译期临时结构）。
     */
    compile(): HTMLElement {
        this.templateScopeMap = new WeakMap();
        return transformElement(this.engine.template, this._getTransformers());
    }

    /**
     * 正向桥：模板元素 → scope（ADR-0002 决策 2）。
     *
     * 供 `engine.patch` 经 selector（对 `engine.template` querySelector）定位 patch 目标的 scope，
     * 再取 `scope.el` 得运行元素。仅含指令或 `{{}}` 插值的元素（有 scope）能命中；
     * 纯静态裸元素返回 undefined（需挂 `x-scope` 哨兵建 scope）。
     */
    getScopeByTemplate(templateEl: HTMLElement): AutoSparkScope | undefined {
        return this.templateScopeMap.get(templateEl);
    }

    /**
     * 单条指令是否占有子树（ownsChildren）的纯判定谓词。
     *
     * 查指令类的静态 `ownsChildren(info)`。提取为谓词后，`scopeOwnsChildren`（boolean 查询）
     * 与 `_resolveOwnership`（需计数以检测多 owner 冲突）共用同一真相源。
     */
    private _ownsChildrenDirective(d: { info: AutoDirectiveInfo }): boolean {
        const cls = this.engine.directives.get(d.info.name);
        return !!cls?.ownsChildren?.(d.info);
    }

    /**
     * scope 是否被任意结构指令（ownsChildren）占有子树——纯判定，不抛错。
     *
     * 供 `engine.patch` 的动态区域守卫（ADR-0002 决策 5）：patch 目标自身或祖先链上有
     * ownsChildren 指令（x-for / eager x-if / x-isolate / eager x-switch）即处于动态区域，
     * 正向桥不可靠，拒绝。
     */
    scopeOwnsChildren(scope: AutoSparkScope): boolean {
        return scope.directives.some((d) => this._ownsChildrenDirective(d));
    }

    /**
     * 编译单个模板元素（transformElement 回调）。
     *
     * - 无指令：原样返回，transformElement 会默认浅克隆并递归子节点；
     * - 有指令：浅克隆 + 移除指令属性 + 建 scope + 建立 parent 关系 + 继承 localData + 执行指令。
     * - 含结构指令（ownsChildren，如 x-for / eager x-if）：返回 `ownsChildren` 信号，
     *   让 transformElement 跳过该元素子节点的自动递归——子节点由指令自行编译，
     *   避免"正常通道编译一次 + 指令克隆再编译"的双重冲突。
     *
     * 同元素出现多个结构指令（如 `x-for` + eager `x-if`）会在 `_resolveOwnership` 中抛错。
     */
    compileElement(template: HTMLElement): HTMLElement | OwnsChildrenResult {
        // 数据脚本预扫（ADR-0032）：直接子级 <script type="autospark/data"> 先于指令求值
        // 收集合成，与 x-data 合成单一数据对象走既有注入管道（desugar：位置无关）
        const dataStash = collectDataScripts(this.engine, template);
        // 含插值（文本/属性）但无指令的元素也需建 scope（隐式指令，ADR-0004 决策 2）；
        // 含数据脚本亦同——父元素等效持有 x-data（即便无任何指令属性，脚本独立成立）
        if (!hasDirectives(template) && !hasInterpolation(template) && !dataStash) {
            // 必须浅克隆：transformElement 用 live NodeList 遍历原节点子节点并挂到返回的新节点下，
            // 若返回原节点，appendChild 会写回原节点自身、其 childNodes 持续增长，导致 live 遍历无限循环。
            return template.cloneNode(false) as HTMLElement;
        }
        const el = template.cloneNode(false) as HTMLElement;
        removeDirectives(el, "x-", this._runtimeKeepAttr());
        const scope = new AutoSparkScope(this.engine, el, template);
        this._linkParent(template, scope);
        this.templateScopeMap.set(template, scope);
        this.engine.scopes.set(new WeakRef(el), scope);
        // 冲突检测先于 compile：让 x-for + eager x-if 同元素在跑任何指令生命周期前即失败
        const ownsChildren = this._resolveOwnership(scope);
        if (dataStash) {
            if (ownsChildren) {
                // 结构指令宿主的直接子级是项模板材料（ownsChildren），数据脚本无处挂载——
                // warn 放弃（脚本稍后仍被剪枝 transformer 移出渲染 DOM，不泄漏）
                this.engine.logger.warn(
                    `<script type="autospark/data"> 不能直接声明在结构指令（x-for/eager x-if/x-isolate）宿主的直接子级（其子节点是项模板）。请移入项模板内目标元素的直接子级（ADR-0032 决策 7）。`,
                );
            } else {
                this._applyDataScriptStash(scope, dataStash);
            }
        }
        scope.compile();
        // 属性插值 desugar（compile 后；合成 bind 独立注册，复用 BindDirective 五路分派）
        this._compileAttrInterpolation(el, scope);
        // x-model 元数据自动注入（ADR-0020）：含 x-model 的元素从 schema 合成隐式 @ 绑定
        this._synthesizeModelSchemaBindings(el, scope);
        // 结构指令占有子树：返回 ownsChildren 信号，跳过子节点自动递归（由指令自行编译）。
        if (ownsChildren) {
            return { node: el, ownsChildren: true };
        }
        return el;
    }

    /**
     * 把数据脚本预扫产物交给 scope 的 DataDirective 消费（ADR-0032 决策 4）。
     *
     * 元素已有 x-data → stash 挂 WeakMap，由 DataDirective.created()（scope.compile 内
     * 按优先级最先执行）消费合并；无 x-data → 合成空值 DataDirective 入列——「脚本独立成立」
     * 等效 x-data。入列后按类静态 priority 重排（data=200 恒最先，保证先于兄弟指令注入，
     * 首渲即可读到数据；重排兼容未来更高优先级的自定义指令）。
     */
    private _applyDataScriptStash(scope: AutoSparkScope, stash: DataScriptStash): void {
        if (!scope.directives.some((d) => d.info.name === "data")) {
            const DataCls = this.engine.directives.get("data");
            if (!DataCls) {
                this.engine.logger.warn(`数据脚本：未注册 data 指令，已忽略`);
                return;
            }
            scope.directives.unshift(new DataCls(this.engine, scope, { name: "data" }));
            const priority = (d: { info: AutoDirectiveInfo }) =>
                this.engine.directives.get(d.info.name)?.priority ?? 0;
            scope.directives.sort((a, b) => priority(b) - priority(a));
        }
        this.dataScriptStash.set(scope, stash);
    }

    /** 消费 scope 的数据脚本预扫产物（DataDirective.created 一次性读取，读后即删） */
    consumeDataScriptStash(scope: AutoSparkScope): DataScriptStash | undefined {
        const stash = this.dataScriptStash.get(scope);
        if (stash) this.dataScriptStash.delete(scope);
        return stash;
    }

    /**
     * 判定某 scope 是否被结构指令占有子树（ownsChildren），并检测冲突。
     *
     * 任意指令类的静态 `ownsChildren(info)` 返回 true 即视为占有。同元素出现多个占有者
     * （如 `x-for` + eager `x-if`、`x-for` + eager `x-switch`）语义互斥——前者重复子树、
     * 后者条件销毁/挂卸子树——直接抛错（标题动态列出冲突指令名），提示改用不占子树的
     * 替代指令（`x-show` / `.keepalive` 变体）或外层包裹。
     */
    private _resolveOwnership(scope: AutoSparkScope): boolean {
        const owners = scope.directives.filter((d) => this._ownsChildrenDirective(d));
        if (owners.length > 1) {
            // component 计入所有权信号但**豁免多 owner 抛错**（ADR-0056 实现注记 1）：
            // 多 owner 抛错早于 scope.compile()（created），component 变 ownsChildren 后与 x-for
            // 同元素会先触发通用抛错而非 U3 友好 warn。处置：throwers 只计真正互斥的结构指令
            // （for/if/switch/isolate/slot/tree…），component 保留在 owners（占用子树信号）
            // 但不参与抛错——U3 检测留在 ComponentDirective.created 的友好 warn 路径。
            // （x-dialog/x-overlay 已不 ownsChildren，不会出现在 owners 中。）
            const throwers = owners.filter((d) => d.info.name !== "component");
            if (throwers.length > 1) {
                const names = throwers.map((d) => `x-${d.info.name}`).join(" + ");
                throw new Error(
                    `[结构指令冲突] ${names} 不能作用于同一元素（均占有子树，语义互斥）。\n` +
                        "若需组合使用，请改用（均不占子树，可与结构指令共存）：\n" +
                        '  • x-show="<expr>"        （display:none，宿主永留 DOM）\n' +
                        "  • 结构指令的 .keepalive 变体（detach 宿主，保活子树与 watcher）\n" +
                        "或用外层包裹，让两个结构指令各居一层。",
                );
            }
            return true; // component + 单结构指令：占用信号仍为 true（子树由该结构指令接管）
        }
        return owners.length === 1;
    }

    /**
     * 构建 removeDirectives 的 keepAttr 谓词：保留 Runtime/Hybrid 指令属性。
     *
     * 这些指令的属性须留在结果 DOM 上（供 static initialize 建立的 MutationObserver 检测、
     * 允许 DOM API 改值/删除），故编译期不剥除。Compile 指令属性照常剥除。
     *
     * 匹配规则：对每个 Runtime/Hybrid 指令名 `n`，保留 `x-${n}`、`x-${n}.*`（含修饰符形式，
     * 如 `x-loading.screen`）与 `x-${n}-options`（指令选项属性，ADR-0007——dispatcher 经
     * getDirectives 解析结果 DOM 建 Runtime 实例，选项属性被剥则手写声明失效）。
     * `.`/`-options` 边界避免 `x-loading` 误匹配 `x-loading-state`。
     * 仅考虑 `x-` 长前缀（Runtime 指令无 `@`/`:` 快捷形式）。
     */
    private _runtimeKeepAttr(): (attrName: string) => boolean {
        const names: string[] = [];
        for (const [name, cls] of this.engine.directives) {
            if (cls.kind === DirectiveKind.Runtime || cls.kind === DirectiveKind.Hybrid) {
                names.push(name);
            }
        }
        return (attrName: string) =>
            names.some(
                (n) =>
                    attrName === `x-${n}` ||
                    attrName.startsWith(`x-${n}.`) ||
                    attrName.startsWith(`x-${n}-options`),
            );
    }

    /**
     * 编译单个子节点（compileSubtree / compileChildNodes 共用的单节点逻辑）。
     *
     * - **HTMLElement → `transformElement`**（递归子节点 + 文本插值，建 scope / 合成 scope）
     * - **含 `{{}}` 文本节点 → `compileTextNode`**（插值拆分，返回 DocumentFragment 或 null 剪枝）
     * - 其余文本/注释 → `cloneNode(true)`
     *
     * **x-else-if / x-else（ADR-0034）与 x-case / x-default（ADR-0037）分支标记在此统一剪枝**：
     * 分支是备选模板，任何子树编译通道（eager x-if 的 then / x-for 项 / 分支快照内部的孤儿分支）
     * 都不进结果 DOM。若放行走 `transformElement`，分支作为其**根**被前置剪枝 transformer 置 null
     * 会触发单根约束抛「根元素被丢弃」（作为非根子孙时剪枝无此问题，keepalive 主 walk 路径即如此）。
     *
     * **铁律：HTMLElement 必须走 `transformElement`（递归），不可用 `compileElement`**——后者只浅克隆，
     * 会丢失整棵子树与插值（patch 替换自身的关键正确性保证）。
     *
     * @param scope 顶层文本插值节点注册 watcher 所用 scope（其父元素 scope）
     * @returns 编译后节点 / DocumentFragment（多段插值）/ null（剪枝）
     */
    private compileOneChild(child: Node, scope: AutoSparkScope | null): Node | null {
        if (child instanceof HTMLElement) {
            // 分支标记（x-else-if/x-else 条件链、x-case/x-default 分支选择）：剪枝（与前置
            // transformer 语义一致；孤儿检测的 warn 在主 walk 路径的 transformer 层发出，此处静默跳过）
            if (
                child.hasAttribute("x-else-if") ||
                child.hasAttribute("x-else") ||
                child.hasAttribute("x-case") ||
                child.hasAttribute("x-default")
            ) {
                return null;
            }
            // 声明性资源收集器直接命中本层根（x-define/x-icon-define 声明为组件快照、
            // x-for 项模板或 patch 节点的**直接子元素**）：transformElement 以其为根时收集器返回 null
            // 会触发"根元素被丢弃"抛错（收集已完成但中断当次 flush）——此处直接走收集并剪枝，
            // 与深层嵌套路径（transformElement walk 内层剪枝不抛错）语义一致（ADR-0022 嵌套私有子组件）。
            if (this._matchComponentAttr(child)) {
                return this._collectComponent(child);
            }
            if (child.hasAttribute("x-icon-define")) {
                return this._collectIconDefine(child);
            }
            return transformElement(child, this._getTransformers());
        }
        if (child.nodeType === Node.TEXT_NODE && hasMustache((child as Text).nodeValue)) {
            // 顶层文本插值需 scope 注册 watcher；无 scope（patch 替换到无祖先 scope 的根级）则原样克隆
            return scope ? this.compileTextNode(child as Text, scope) : child.cloneNode(true);
        }
        return child.cloneNode(true);
    }

    /**
     * 编译一组节点并返回运行节点列表（**不挂载**，挂载由调用方处理）。
     *
     * 供 `engine.patch` 替换自身：updater 返回的 `string`/`Node` 经解析为 templateNodes，
     * 本方法编译它们（HTMLElement 走 `transformElement` 递归、文本插值走 `compileTextNode`），
     * `DocumentFragment` 展开成实际子节点，收集为 runtimeNodes 供调用方 `replaceWith`。
     *
     * @param nodes  待编译的模板节点（通常来自 `parseHtmlFragment` 或 updater 返回的 Node）
     * @param scope  顶层文本插值节点的注册 scope（替换后挂父下，用父 scope）
     */
    compileChildNodes(nodes: Node[], scope: AutoSparkScope | null): Node[] {
        const result: Node[] = [];
        for (const child of nodes) {
            const compiled = this.compileOneChild(child, scope);
            if (compiled == null) continue;
            if (compiled instanceof DocumentFragment) {
                result.push(...Array.from(compiled.childNodes));
            } else {
                result.push(compiled);
            }
        }
        return result;
    }

    /**
     * 编译某模板的全部子节点并挂到指定父元素，返回已编译节点列表。
     *
     * 共享给结构指令（eager x-if 编译/重建子树 / x-for 项 / engine.data 重建子树 / `engine.patch`
     * 子树重建）：单节点编译委托 `compileOneChild`，挂载用 `appendChild`。`compileTextNode` 可能
     * 返回 `DocumentFragment`（多段插值）或 `null`（x-text 在场剪枝）：fragment 搬入父后展开成实际
     * 子节点入 `nodes`（供 if.ts 精确移除）；null 跳过（剪枝）。
     *
     * @param scope 子树根的 scope，供直接文本子节点插值注册（项 scope / x-if scope 等）
     */
    compileSubtree(
        parentEl: HTMLElement,
        templateEl: HTMLElement,
        scope: AutoSparkScope,
    ): ChildNode[] {
        const nodes: ChildNode[] = [];
        for (const child of Array.from(templateEl.childNodes)) {
            const compiled = this.compileOneChild(child, scope);
            if (compiled == null) continue; // 剪枝（如 x-text 在场的插值文本）
            if (compiled instanceof DocumentFragment) {
                // fragment：搬入父后展开成实际子节点入 nodes（供调用方精确移除）
                const moved = Array.from(compiled.childNodes);
                parentEl.appendChild(compiled);
                nodes.push(...moved);
            } else {
                // 非 fragment：HTMLElement/Text/Comment 等均为 ChildNode（可被调用方 remove）
                parentEl.appendChild(compiled);
                nodes.push(compiled as ChildNode);
            }
        }
        return nodes;
    }

    /**
     * 编译插槽内容节点组并挂到出口元素（ADR-0056）。
     *
     * - **元素** → `compileChild`（显式 `parentScope` + `localData`，`configure` 置 `isSlotContent`）；
     * - **含 `{{}}` 文本** → 建轻量内容 scope（`isSlotContent` + 共享 `localData`）后 `compileTextNode`；
     * - **其余节点**（纯文本/注释等）→ 原样克隆挂载。
     *
     * 所有内容 scope 的 `parent` = `parentScope`（调用方基准），销毁经 SlotDirective 持引用回收
     * （幂等；同时随调用方 children 级联）。
     *
     * @param parentScope 调用方基准（x-component=宿主 scope / overlay=x-dialog binding）
     * @param localData   作用域形参容器（共享引用，出口侧 Object.assign 刷新；无参 null）
     * @param mountEl     出口元素（内容挂载点）
     * @returns 内容 scopes（供 SlotDirective.destroy 回收）
     */
    compileSlotNodes(
        nodes: Node[],
        parentScope: AutoSparkScope,
        localData: Record<string, any> | null,
        mountEl: HTMLElement,
    ): AutoSparkScope[] {
        const scopes: AutoSparkScope[] = [];
        for (const node of nodes) {
            if (node instanceof HTMLElement) {
                const { el, scope } = this.compileChild(
                    node,
                    parentScope,
                    localData,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    (s) => {
                        s.isSlotContent = true;
                    },
                );
                scopes.push(scope);
                mountEl.appendChild(el);
            } else if (node.nodeType === Node.TEXT_NODE && hasMustache((node as Text).nodeValue)) {
                // 文本插值：轻量内容 scope（无指令 dummy 模板，避免二次实例化 SlotDirective）
                const dummy = document.createElement("span");
                const textScope = new AutoSparkScope(this.engine, dummy, dummy);
                textScope.locals = localData;
                textScope.isSlotContent = true;
                parentScope.addChild(textScope);
                this.engine.scopes.set(new WeakRef(dummy), textScope);
                scopes.push(textScope);
                const frag = this.compileTextNode(node as Text, textScope);
                if (frag) mountEl.appendChild(frag);
            } else {
                mountEl.appendChild(node.cloneNode(true));
            }
        }
        return scopes;
    }

    /**
     * 供 x-for 编译单个列表项的模板。
     *
     * 手动建根 scope 并注入 localData（item/index），再用 transformElement
     * 递归编译其子节点（嵌套 scope 经 _linkParent 挂为本 scope 子代并继承 localData）。
     *
     * @param itemTemplate 单个项的模板元素（x-for 子模板的克隆）
     * @param parentScope  x-for 所在 scope，项 scope 挂为其子（删项时递归销毁）
     * @param localData   注入该项的局部变量（{ item, index }）
     * @param reuseEl      复用既有项根 DOM 节点（移动复用场景）；缺省则克隆模板。
     *                     复用时保留项根节点身份（保住项根本身的焦点/属性），但其子树 DOM 会被
     *                     清空重建（旧 scope 已销毁）→ 子节点焦点丢失，彻底保留需 core 对象身份订阅。
     */
    /**
     * 注入组件语义到既有 scope（ADR-0022 决策二/三）。
     *
     * 供 x-component 复用宿主 scope 化身组件实例（宿主 scope 本身即组件实例 scope，不另建），以及
     * compileChild 在新建 scope 后调用。注入内容：
     * - `isComponent=true` + `componentName=def.name`；
     * - `data`：data 默认值先注入、props 后覆盖（R1=A 合并顺序），写入响应式 `$scopes[id]` 域
     *   （ADR-0057：data 双形态——工厂每实例调用、字面量深克隆，per-instance）；
     * - `methods`：注入 `scope.actions`（复用 x-on action 查找）；
     * - `hooks`：克隆到 `scope.hooks`（四阶段生命周期，每阶段数组克隆避免多实例共享引用）。
     *
     * @param scope 目标 scope（x-component 的宿主 scope，或 compileChild 新建的 scope）
     * @param def   组件定义
     * @param props x-component 传入的 props（覆盖 data 默认值；undefined 则只注入默认值）
     */
    injectComponentSemantics(
        scope: AutoSparkScope,
        def: ComponentDef,
        props?: Record<string, any>,
    ): void {
        scope.isComponent = true;
        scope.componentName = def.name;
        const scopes = (this.engine.store.state as Record<string, any>)[SCOPES_KEY] as Record<
            string,
            any
        >;
        const hasComponentData = def.setup?.data != null;
        if (hasComponentData || props) {
            if (!scopes[scope.id]) scopes[scope.id] = {};
            const data = scopes[scope.id];
            scope._data = data;
            // 1) 组件 data 默认值（先；工厂调用 / 字面量深克隆，per-instance，ADR-0057）
            if (hasComponentData) {
                try {
                    const defaults = resolveComponentData(def.setup);
                    if (defaults && typeof defaults === "object") Object.assign(data, defaults);
                } catch (e: any) {
                    this.engine.logger.warn(
                        `x-define "${def.name}" data 求值失败，跳过默认值: ${e?.message ?? e}`,
                    );
                }
            }
            // 2) x-component props（后覆盖同名键，R1=A）
            if (props) Object.assign(data, props);
            // 失效 scope 的 _scopeView 缓存：宿主 scope 可能已缓存了 data 注入前的聚合视图
            // （如 x-component 宿主在 compileElement 阶段构建 _scopeView），注入 data 后须重建，否则
            // 后代 watch 经 getContext 读不到新 data 字段（与 DataDirective.invalidateScopeView 同理）。
            scope.invalidateScopeView();
        }
        // methods 注入 scope.methods（ADR-0022 决策二-3 修订：从 action 剥离为独立机制，
        // 不再进 scope.actions）。method 经 getMethod（组件边界）查找、getMethodThis（Proxy）调用。
        if (def.setup?.methods) {
            scope.methods = { ...def.setup.methods };
        }
        // 顶层私有变量注入 scope._locals（ADR-0057；ADR-0022 决策二-3 (10)：
        // 非响应式组件私有数据，不进聚合视图）。经 Proxy this 的 this.<key> 读写
        //（method/framework key/_data 优先级高于 _locals）。
        if (def.setup?.locals) {
            scope._locals = { ...def.setup.locals };
        }
        // hooks 克隆到 scope.hooks（每阶段函数数组克隆，避免多实例共享同一数组引用）
        if (def.hooks) {
            scope.hooks = {
                created: def.hooks.created.slice(),
                mounted: def.hooks.mounted.slice(),
                beforeUnmount: def.hooks.beforeUnmount.slice(),
                unmounted: def.hooks.unmounted.slice(),
            };
        }
    }

    /**
     * 实例化组件到既有 scope（ADR-0022 决策五，供 x-component）。
     *
     * 宿主 scope 化身组件实例（T4=B 宿主化身组件根），步骤：
     * 1. 注册组件快照根到 templateScopeMap（映射到宿主 scope），使快照子树编译时 _linkParent 能找到宿主 scope；
     * 2. 注入组件语义（data/methods/hooks）到宿主 scope；
     * 3. compileSubtree 编译组件快照子树到宿主元素（快照内指令建子 scope，watch 时读到注入的 data）；
     * 4. 补触发 created/mounted hooks（宿主 compile() 早于组件注入，hooks 须补触发）；
     * 5. flush 调度器消化首次渲染。
     *
     * @param hostScope   宿主 scope（化身组件实例 scope）
     * @param snapshot    组件冻结快照根
     * @param def         组件定义（可空：纯快照组件无 setup）
     * @param props       x-component 传入的 props（覆盖 data() 默认）
     * @param basis       数据基准（ADR-0053，x-component 解析链的结论）。缺省 undefined = 不施加边界语义
     *                    （现行为，供 overlay 等非 x-component 路径）：
     *                    - `'closed'`：封闭——hostScope 打数据边界标志，子树数据视图止于
     *                      自身 data/locals/props + engine.state（getContext/hasLocalContext/相对挂载三处收口）；
     *                    - `'declarer'`：数据视图挂声明处 scope（def.declarerScope；全局组件无声明
     *                      scope 或声明 scope 已销毁 → 退化为封闭 + warn 一次）；
     *                    - `'host'`：消费处上下文（结构 parent 链，= 无边界标志的现行为）。
     */
    instantiateComponent(
        hostScope: AutoSparkScope,
        snapshot: HTMLElement,
        def: ComponentDef | null,
        props?: Record<string, any>,
        basis?: ComponentDataBasis,
        /**
         * 插槽内容 map（ADR-0056）：懒收集于 ComponentDirective._instantiate，stash 到宿主 scope
         * 供出口 SlotDirective 沿 parent 链查找。null/缺省 = 无内容（出口走 fallback）。
         */
        slotContents?: Map<string, SlotContent> | null,
        /**
         * 插槽内容的调用方视图基准（ADR-0056）：x-component 传宿主 scope 自身
         * （isSlotContent 走 getCallerContext，保留 x-for item locals 又跳过组件 _data/边界）。
         */
        slotCallerScope?: AutoSparkScope | null,
    ): void {
        // 1. 注册快照根到 templateScopeMap：子树编译时 _linkParent 沿 parentElement 找到此映射 → 宿主 scope
        this.templateScopeMap.set(snapshot, hostScope);
        // 1.5 插槽内容 stash（须早于 compileSubtree——出口 SlotDirective.created 在子树编译时查找）
        if (slotContents) {
            hostScope.slotContents = slotContents;
            hostScope.slotCallerScope = slotCallerScope ?? hostScope;
        }
        // 2. 注入组件语义
        if (def) {
            this.injectComponentSemantics(hostScope, def, props);
        } else if (props) {
            this.injectInitialData(hostScope, props);
        }
        // 2.1 数据基准施加（ADR-0053）：须早于 compileSubtree（子树 watch 首求值经 getContext
        // 读到的视图必须已是基准后的视图）。宿主 scope 可能已缓存注入前的 _scopeView，须失效重建。
        this._applyDataBasis(hostScope, def, basis);
        const hostEl = hostScope.el!;
        // 2.5 响应式 <style> bind 订阅（ADR-0022 决策四-4.1）：须在 data 注入（步骤2）后、compileSubtree 前。
        // 遍历 def.styleBinds 调 hostScope.watch——watcher 进 scope.watchers，随 scope.destroy 自动 off（零额外卸载接线）。
        // 首求值立即收集依赖并写首值；created hook 若在步骤4 改 data，会触发 watcher 重求值更新变量（响应式自动回流）。
        // 变量挂组件根元素 hostEl（每实例独立，与 data-cmp-{id} 同构隔离）；null/undefined 不写走 var(--name, unset) 回退。
        if (def?.styleBinds && def.styleBinds.length > 0) {
            this._bindStyleVars(hostScope, hostEl, def.styleBinds);
        }
        // 3. 编译快照子树到宿主元素（hostScope.el）
        this.compileSubtree(hostEl, snapshot, hostScope);
        // 3.5 组件作用域 CSS（ADR-0022 决策四-4）：给组件根+后代打 data-cmp-{id} 属性 + 注入改写后的样式
        if (def?.styles && def.styles.length > 0) {
            mountComponentScopedAttr(hostEl, hostScope.id);
            injectComponentStyle(def.name, def.styles, hostScope.id);
        }
        // 4. 补触发组件 created/mounted hooks
        if (def) {
            hostScope["_runHooks"]("created");
            hostScope["_runHooks"]("mounted");
        }
        // 5. flush 首次渲染
        this.engine.scheduler.flushAll();
    }

    /**
     * 数据基准施加（ADR-0053）：instantiateComponent（宿主化身，x-component）与
     * instantiateDetachedComponent（独立 scope，overlay 家族）共享。
     *
     * 须早于 compileSubtree（子树 watch 首求值经 getContext 读到的视图必须已是基准后的视图）；
     * 施加后失效 scope 的 _scopeView 缓存。basis 缺省/`'host'` 不施加（结构 parent 链现行为）。
     */
    private _applyDataBasis(
        scope: AutoSparkScope,
        def: ComponentDef | null,
        basis?: ComponentDataBasis,
    ): void {
        if (basis === "closed") {
            scope.dataBoundary = true;
            scope.invalidateScopeView();
        } else if (basis === "declarer") {
            const declarer = def?.declarerScope ?? null;
            if (!declarer) {
                // 全局组件（options.components 字符串）无声明 scope：declarer 无意义，退化封闭
                this._warnDeclarerFallback(def, "无声明处 scope（全局组件）");
                scope.dataBoundary = true;
            } else if (declarer.destroyed) {
                // 悬空守卫：声明处 scope 已销毁，降级封闭（不悬挂引用、不读已删数据）
                this._warnDeclarerFallback(def, "声明处 scope 已销毁");
                scope.dataBoundary = true;
            } else {
                scope.declarerDataScope = declarer;
            }
            scope.invalidateScopeView();
        }
    }

    /**
     * 实例化组件到**独立 scope + 独立元素**（非宿主化身，ADR-0052 修订版——组件化统一）。
     *
     * 供 overlay 家族（OverlayDirective / OverlayInstance）：组件快照克隆编译为新 scope 的子树，
     * 与 instantiateComponent（宿主化身，x-component）共享语义注入（data()/props、methods、hooks）与
     * 数据基准施加管道，另补齐 styleBinds 订阅与 scoped CSS 挂载（compileChild 不含这两步）。
     *
     * @param template    组件冻结快照根的克隆（调用方 cloneNode，每次实例化独立）
     * @param parentScope 挂链父 scope（基准 declarer→声明处 / host→消费处；null→rootless）
     * @param def         组件定义（可 null：纯快照组件无 setup）
     * @param props       注入组件 data 域的 props（覆盖 data() 默认）
     * @param basis       数据基准（ADR-0053；undefined = 不施加边界语义）
     * @returns 编译产物（el = 编译根；scope = 实例 scope，随挂链销毁级联）
     */
    instantiateDetachedComponent(
        template: HTMLElement,
        parentScope: AutoSparkScope | null,
        def: ComponentDef | null,
        props?: Record<string, any>,
        basis?: ComponentDataBasis,
        /** 插槽内容 map（ADR-0056，overlay 路径）——stash 到实例 scope，出口沿 parent 链查找 */
        slotContents?: Map<string, SlotContent> | null,
        /** 插槽内容调用方视图基准（ADR-0056）：overlay 传 x-dialog 消费者 binding */
        slotCallerScope?: AutoSparkScope | null,
    ): { el: HTMLElement; scope: AutoSparkScope } {
        const compiled = this.compileChild(
            template,
            parentScope,
            {},
            undefined,
            props,
            def ?? undefined,
            basis,
            (scope) => {
                if (slotContents) {
                    scope.slotContents = slotContents;
                    scope.slotCallerScope = slotCallerScope ?? parentScope;
                }
            },
        );
        // styleBinds 订阅（ADR-0022 决策四-4.1）：data 已注入（compileChild 内），首值写编译根；
        // watcher 进 scope.watchers 随 scope.destroy 自动 off（零额外卸载接线）
        if (def?.styleBinds && def.styleBinds.length > 0) {
            this._bindStyleVars(compiled.scope, compiled.el, def.styleBinds);
        }
        // 组件作用域 CSS（ADR-0022 决策四-4）：编译根 + 后代打 data-cmp-{id} + 注入改写样式
        if (def?.styles && def.styles.length > 0) {
            mountComponentScopedAttr(compiled.el, compiled.scope.id);
            injectComponentStyle(def.name, def.styles, compiled.scope.id);
        }
        return compiled;
    }

    /**
     * declarer 基准退化封闭的 warn 一次记录（ADR-0053）：按组件定义去重（def 多实例共享），
     * 防循环实例化场景刷屏。WeakSet 随 def 回收。
     */
    private _declarerFallbackWarned = new WeakSet<ComponentDef>();

    /**
     * declarer 基准退化为封闭时的 warn（ADR-0053）：每个组件定义只 warn 一次。
     *
     * @param def   组件定义（可空：纯快照组件无 def，此时恒 warn——无去重载体）
     * @param reason 退化原因（进日志）
     */
    private _warnDeclarerFallback(def: ComponentDef | null, reason: string): void {
        if (def) {
            if (this._declarerFallbackWarned.has(def)) return;
            this._declarerFallbackWarned.add(def);
        }
        this.engine.logger.warn(
            `组件 "${def?.name ?? "?"}" 的 declarer 基准不可用（${reason}），已退化为封闭行为（ADR-0053）。如需恢复上下文继承请改用 dataContext:'host'。`,
        );
    }

    /**
     * 为组件实例的 `<style>` bind 建立 CSS 变量订阅（ADR-0022 决策四-4.1）。
     *
     * 遍历 `def.styleBinds`，对每个 bind 调 `hostScope.watch(expr)`——watch 返回当前值做首写、
     * watcher 进 `hostScope.watchers`（随 scope.destroy 自动 off，零额外卸载接线）。
     * 求值结果经 `coerceStyleValue` 归一化后写入组件根元素的 CSS 变量：null/undefined 不写
     * （removeProperty，CSS 走 `var(--name, unset)` 回退），其余 `String(value)` 写入。
     *
     * @param scope  组件实例 scope（watcher 寄主，destroy 时统一 off）
     * @param rootEl 组件根元素（变量挂载点，每实例独立）
     * @param binds  bind 清单（编译期提取、多实例共享只读）
     */
    private _bindStyleVars(scope: AutoSparkScope, rootEl: HTMLElement, binds: StyleBind[]): void {
        const apply = (varName: string, value: unknown) => {
            const coerced = coerceStyleValue(value);
            if (coerced == null) {
                rootEl.style.removeProperty(varName);
            } else {
                rootEl.style.setProperty(varName, coerced);
            }
        };
        for (const b of binds) {
            // watch 返回首值（同步求值 + 收集依赖），但首次 flush 前回调未触发——
            // 须用返回值手动写首值，否则首帧变量缺失（listener 仅在状态变化 flush 时才回调）。
            const first = scope.watch(b.expr, ({ value }) => apply(b.varName, value));
            apply(b.varName, first);
        }
    }

    /**
     * 仅注入响应式 data（无组件语义，ADR-0021 决策 12-c 保留路径）。
     *
     * 供 x-loading 等非组件消费者：把 initialData 写入 `store.state.$scopes[scope.id]` 并令 scope.data
     * 指向它。块内指令 watch 首次求值即收集到 `$scopes.<id>.<field>` 精准路径。
     */
    injectInitialData(scope: AutoSparkScope, initialData: Record<string, any>): void {
        const scopes = (this.engine.store.state as Record<string, any>)[SCOPES_KEY] as Record<
            string,
            any
        >;
        if (!scopes[scope.id]) scopes[scope.id] = {};
        const data = scopes[scope.id];
        scope._data = data;
        Object.assign(data, initialData);
    }

    compileChild(
        itemTemplate: HTMLElement,
        parentScope: AutoSparkScope | null,
        localData: Record<string, any> | null,
        reuseEl?: HTMLElement,
        /**
         * 编译前注入块根的**响应式** data（仿 DataDirective.applyLocal）。
         *
         * 与 localData（普通对象、非响应式）并列：在 `scope.compile()` 之前把数据写入
         * `store.state.$scopes[scope.id]` 并令 `scope.data` 指向它。块内指令 watch 首次求值时，
         * `getContext` 的 `_scopeView` 缓存即建成含 data 层的 Proxy，`collectDependencies`
         * 收集到 `$scopes.<id>.<field>` 精准路径——后续 `Object.assign` 进该响应式代理即字段级细粒度更新。
         *
         * 供 x-loading 等消费者把 config 注入块（ADR-0021 决策 12-c）；x-component 实例化组件时传入 props
         *（决策二-2，作为组件响应式状态域的覆盖值，后于 componentDef.state() 注入）。无此参则不注入。
         */
        initialData?: Record<string, any>,
        /**
         * 组件定义（ADR-0022 决策二/三）：x-component 实例化组件时传入，注入组件语义：
         * - `data()`：先于 initialData 注入 scope.data（默认值，被 props 覆盖，决策 R1=A 合并顺序）；
         * - `methods`：注入 scope.actions（复用 x-on action 查找，this=ComponentMethodContext）；
         * - `hooks`：克隆到 scope.hooks（四阶段生命周期，compile/destroy 时触发）。
         * 无此参（x-for/loading 等非组件场景）则跳过组件语义注入。
         */
        componentDef?: ComponentDef,
        /**
         * 数据基准（ADR-0053，instantiateDetachedComponent 的 overlay 路径传入）：须早于
         * compileSubtree / scope.compile() 施加（子树 watch 首求值读到的视图须已是基准后的视图）。
         * 缺省 = 不施加边界语义（现行为，x-component 走 instantiateComponent 的宿主化身路径）。
         */
        basis?: ComponentDataBasis,
        /**
         * scope 预配置回调（ADR-0056）：在 scope 创建后、`compileSubtree`/`scope.compile()` 前调用。
         *
         * 供插槽内容路径设置 `isSlotContent`/`slotContents`——须在子树 watch 首次求值前就位，
         * 否则 getContext/hasLocalContext 走错视图分支。
         */
        configure?: (scope: AutoSparkScope) => void,
    ): { el: HTMLElement; scope: AutoSparkScope } {
        const el = reuseEl ?? (itemTemplate.cloneNode(false) as HTMLElement);
        if (!reuseEl) removeDirectives(el, "x-", this._runtimeKeepAttr());
        // reuseEl：旧 scope 已 destroy，其子树 DOM 残留在 el 上，须清空后重建，否则 compileSubtree
        // 的 appendChild 会导致子节点重复。
        if (reuseEl) {
            while (el.firstChild) el.removeChild(el.firstChild);
        }
        const scope = new AutoSparkScope(this.engine, el, itemTemplate);
        scope.locals = localData;
        configure?.(scope);
        // 组件语义注入（须早于 scope.compile()——created hook 与各指令 watch 首次求值须读到完整 data/actions）。
        // 状态合并顺序 R1=A：componentDef.state() 先注入默认，initialData（x-component props）后覆盖。
        if (componentDef) {
            this.injectComponentSemantics(scope, componentDef, initialData);
        } else if (initialData) {
            // 非组件场景（x-loading 等消费者）仅注入 initialData 到响应式 data 域（无 data()/methods/hooks）
            this.injectInitialData(scope, initialData);
        }
        // 数据基准施加（ADR-0053，共享管道）：须早于 compileSubtree / scope.compile()。
        if (basis) {
            this._applyDataBasis(scope, componentDef ?? null, basis);
        }
        // parentScope 可空（rootless 块编译，如 x-loading 宿主无 scope 的动态插入场景）：跳过父子挂接，
        // 块 scope 独立（无祖先继承），仅靠 initialData 注入的 data 提供上下文。
        parentScope?.addChild(scope);
        this.templateScopeMap.set(itemTemplate, scope);
        this.engine.scopes.set(new WeakRef(el), scope);
        // 项根本身若是结构指令（嵌套 x-for，如 <ul x-for="row"><li x-for="cell">），
        // 其子节点由该内层结构指令在 render 时自行克隆编译，此处跳过手动编译以免双重冲突。
        if (!this._resolveOwnership(scope)) {
            this.compileSubtree(el, itemTemplate, scope);
        }
        scope.compile();
        // 项根属性插值 desugar（项根不走 compileElement，须在此补；复用 BindDirective）
        this._compileAttrInterpolation(el, scope);
        // x-model 元数据自动注入（ADR-0020）：项根含 x-model 时同样合成
        this._synthesizeModelSchemaBindings(el, scope);
        return { el, scope };
    }

    /**
     * 向上查找最近的已注册指令祖先 scope，把 scope 挂为其子，
     * 并继承祖先的 localData（让 item/index 向嵌套子元素传递）。
     */
    private _linkParent(template: HTMLElement, scope: AutoSparkScope): void {
        let p: HTMLElement | null = template.parentElement;
        while (p) {
            const parentScope = this.templateScopeMap.get(p);
            if (parentScope) {
                parentScope.addChild(scope);
                if (parentScope.locals) scope.locals = parentScope.locals;
                return;
            }
            p = p.parentElement;
        }
    }
}
