import type { AutoSpark } from "../../engine/engine";
import type { AutoSparkScope } from "../../engine/scope";
import type { ComponentDef } from "./component-def";
import type { DirectiveManager } from "../directive/manager";
import { presetDirectives } from "../../directives";
import { ComponentDirective } from "../../directives/x-component";
import { CompileError } from "../../errors";
import { relaxedToJson } from "../../utils/relaxedToJson";

/**
 * 元素名组件（ADR-0117；推导与撞名规则 ADR-0133 修订）：组件**缺省注册**为 **元素名形态
 * 指令**（`x-define-options.tag` 缺省按 {@link deriveComponentTag} 归一化推导，`false`
 * 显式关闭）——`<x-counter>` 直接写元素标签即实例化，与 `<div x-component:counter>`
 * 完全等价（宿主化身组件根、插槽/props/事件全量同构）。
 *
 * ## 机制（编译期剥除 + created 折叠，两段协作）
 *
 * - **编译期**（compiler.compileElement）：元素名命中自动组件类时，把 `:expr` 形态的
 *   响应式 props 属性从模板**临时剥除**（防被通用管线误实例化为 bind 指令）并 stash，
 *   scope 构建完成后原样恢复（原树不留痕，重编译幂等）；
 * - **运行期**（{@link createAutoComponentClass} 生成类的 created）：在调用 super 前
 *   注入组件名（`this.attr`）与折叠产物（`this.value` props 字面量 + `this.options`），
 *   随后走 ComponentDirective 既有通道——props 响应式、loader、边界覆盖、pending 重试
 *   等机制零复制。静态 props 属性折叠后从宿主移除（不留结果 DOM 残留）。
 *
 * ## 撞名就近遮蔽（ADR-0133）
 *
 * 不同组件声明派生同一标签（`autospark.counter` 与局部 `counter` 同归 `<x-counter>`）
 * 不再跳过：生成类持有**候选名列表**，created 时经 `scope.resolveNearestComponentDeclaration`
 * 按使用处 scope 链取最近命中（内层胜外层、同层后声明胜）——官方短标签可被子树局部
 * 定义就近覆盖。撞指令名（预设/自定义/其他元素名指令）升格 **error**（全局注册语义
 * 无就近可言，fail-fast）。
 *
 * ## props 折叠规则（元素名形态专属）
 *
 * - 保留属性（不折叠）：`class` / `style` / `id` / `data-*` / `x-*` / `@event`（事件
 *   本就是同元素 OnDirective）；
 * - `:name="expr"`：表达式条目（binding.watch 响应式），同名**覆盖**静态条目；
 * - 其余静态属性：类型推断——纯数字 → number、`true`/`false` → boolean、`{`/`[` 开头 →
 *   宽松 JSON（失败回退原字符串）、否则原样字符串；
 * - 优先级（ADR-0117 决策）：`:expr` > 静态属性 > `x-{标签基名}-options.props`（兼容
 *   `x-component-options` 别名；ADR-0133 起按**标签基名**读取——组件名可含点号/大写，
 *   依其拼属性名不可书写，标签才是作者直接书写面）——由值通道覆盖 options 通道的既有
 *   合并序天然保证。
 */

/** 撞名就近遮蔽的候选条目（ADR-0133）：组件名 + 声明处 scope（同 scope 撞名 warn 判据） */
export interface AutoComponentCandidate {
    name: string;
    /** 声明处 scope；全局声明（options.components / 插件表）与运行时注册为 null */
    declarerScope: AutoSparkScope | null;
}

/** 自动组件生成类的静态标记（撞名判定 / 所有权豁免的判定依据） */
const AUTO_COMPONENT_MARKER = "__autosparkAutoComponent__";

/** 自动组件类的形态（工厂产物；静态携带组件名与元素名）——类型面由 typeof ComponentDirective 承载 */

/** 判定指令类是否为本机制生成的自动组件类 */
export function isAutoComponentClass(cls: unknown): cls is typeof ComponentDirective {
    return (
        !!cls &&
        typeof cls === "function" &&
        (cls as { [AUTO_COMPONENT_MARKER]?: true })[AUTO_COMPONENT_MARKER] === true
    );
}

/**
 * 元素名形态的保留属性（不折叠为 props，ADR-0117）：布局/标识属性留给宿主化身，
 * `x-*` 前缀是指令/选项族、`@` 前缀是事件绑定（同元素 OnDirective 承接）。
 */
export function isReservedElementAttr(name: string): boolean {
    return (
        name === "class" ||
        name === "style" ||
        name === "id" ||
        name.startsWith("data-") ||
        name.startsWith("x-")
    );
}

/** 静态属性值类型推断（ADR-0117 决策）：数字 / 布尔 / 宽松 JSON / 原样字符串 */
function inferStaticPropValue(raw: string): unknown {
    const value = raw.trim();
    if (value === "") return "";
    if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
    if (value === "true") return true;
    if (value === "false") return false;
    if (value.startsWith("{") || value.startsWith("[")) {
        try {
            return JSON.parse(relaxedToJson(value));
        } catch {
            return raw; // 非法 JSON 回退原字符串
        }
    }
    return raw;
}

/** props 字面量键的合法性（标识符形态裸键，否则 JSON 引号键） */
function propLiteralKey(key: string): string {
    return /^[$A-Za-z_][\w$]*$/.test(key) ? key : JSON.stringify(key);
}

/**
 * 折叠宿主元素属性为 props 对象字面量表达式文本。
 *
 * @param el     宿主元素（浅克隆，静态 props 属性在场；`:expr` 已被编译期剥除）
 * @param exprs  编译期 stash 的响应式 props（属性名 → 表达式文本）
 * @returns `{ value, foldedKeys }`；无任何可折叠属性时 value 为 undefined。
 *          字面量内表达式条目后置（同名覆盖静态条目，ADR-0117 优先级）。
 */
function foldElementProps(
    el: HTMLElement,
    exprs: Record<string, string>,
): { value: string | undefined; foldedKeys: string[] } {
    const staticEntries: string[] = [];
    const foldedKeys: string[] = [];
    for (const attr of Array.from(el.attributes)) {
        const name = attr.name;
        if (isReservedElementAttr(name) || name.startsWith(":") || name.startsWith("@")) continue;
        staticEntries.push(`${propLiteralKey(name)}: ${JSON.stringify(inferStaticPropValue(attr.value))}`);
        foldedKeys.push(name);
    }
    const exprEntries = Object.entries(exprs).map(
        ([key, expr]) => `${propLiteralKey(key)}: ${expr.trim()}`,
    );
    const entries = [...staticEntries, ...exprEntries];
    return { value: entries.length > 0 ? `{ ${entries.join(", ")} }` : undefined, foldedKeys };
}

/**
 * 读取元素名形态的组件选项属性（`x-{标签基名}-options` 打底，`x-component-options` 兼容别名）。
 *
 * 元素名形态无同名主指令，该族属性在 getDirectives 解析中是孤儿（静默丢弃）——由本函数
 * 原始读取。解析失败 warn + 忽略（与 x-define-options 容错纪律一致）。标签基名 = 元素名
 * 去 `x-` 前缀（ADR-0133：组件名可含点号/大写，依组件名拼属性名不可书写，标签是书写面）。
 */
function readElementComponentOptions(
    template: HTMLElement,
    tagBase: string,
    warn: (msg: string) => void,
): Record<string, any> | undefined {
    let merged: Record<string, any> | undefined;
    const legacy = template.getAttribute("x-component-options");
    if (legacy != null && legacy.trim() !== "") {
        try {
            const parsed = JSON.parse(relaxedToJson(legacy));
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) merged = parsed;
            else warn(`x-component-options: 值须为普通对象，已忽略`);
        } catch (e: any) {
            warn(`x-component-options 解析失败，已忽略: ${e?.message ?? e}`);
        }
    }
    const own = template.getAttribute(`x-${tagBase}-options`);
    if (own != null && own.trim() !== "") {
        try {
            const parsed = JSON.parse(relaxedToJson(own));
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                merged = { ...merged, ...parsed };
            } else {
                warn(`x-${tagBase}-options: 值须为普通对象，已忽略`);
            }
        } catch (e: any) {
            warn(`x-${tagBase}-options 解析失败，已忽略: ${e?.message ?? e}`);
        }
    }
    return merged;
}

/**
 * 生成元素名组件指令类（ADR-0117；候选列表 ADR-0133）。
 *
 * 继承 {@link ComponentDirective} 全量机制（宿主化身、插槽、props 响应式、loader、
 * pending 重试、递归保护），特化：
 * - `static elementName = tag`：元素名触发（scope 构造期 findByElementName 命中即实例化）；
 * - `static autoComponentCandidates`：候选名列表（撞名就近遮蔽的真相源，注册期可追加）；
 * - `created()`：先就近代价解析注入组件名 + 折叠产物（props 字面量 → 值通道、选项属性 →
 *   options 通道），清理宿主残留属性，再走 super 既有流程。
 *
 * 属性参数形态兼容：若指令信息已带 attr/value（显式 `x-{组件名}="..."` 属性写法）或同元素
 * 存在显式 `x-component:*` 声明，则本类完全让位（不注入、不折叠，走解析管线既有语义）。
 */
export function createAutoComponentClass(candidates: AutoComponentCandidate[], tag: string) {
    class AutoSparkElementComponent extends ComponentDirective {
        static override readonly elementName = tag;
        static readonly [AUTO_COMPONENT_MARKER] = true;
        /** 候选名列表（ADR-0133 就近遮蔽；installAutoComponentTag 追加/摘除的原位数组） */
        static readonly autoComponentCandidates = candidates;
        /** 首候选名（单候选场景的兼容快捷访问） */
        static readonly autoComponentName = candidates[0]?.name;

        override created() {
            // 让位三态：属性参数形态（info 已带 attr/value）/ 同元素显式 x-component 声明——
            // 均按既有解析语义走，不注入元素名形态的合成信息
            if (
                this.info.attr !== undefined ||
                this.info.value !== undefined ||
                this.binding.directives.some((d) => d !== this && d.info.name === "component")
            ) {
                return;
            }
            const warn = (msg: string) => this.engine.logger.warn(msg);
            const template = this.template as HTMLElement;
            const names = (this.constructor as typeof AutoSparkElementComponent)
                .autoComponentCandidates.map((c) => c.name);
            // ① 组件名：候选沿使用处 scope 链就近解析（ADR-0133）——内层胜外层、同层后声明胜；
            //    全 miss 回退首候选，走 ComponentDirective 既有 pending 等待/重试
            this.attr = this.binding.resolveNearestComponentDeclaration(names) ?? names[0];
            // ② 选项属性合成（孤儿读取，见 readElementComponentOptions）——仅元素形态
            //    （info.options 未被解析管线填充）时生效；按标签基名读取（ADR-0133）
            if (!this.info.options && !this.info.optionExprs) {
                const opts = readElementComponentOptions(template, tag.slice(2), warn);
                if (opts) this.options = opts;
            }
            // ③ props 折叠（`:expr` 来自编译期 stash，静态属性来自宿主克隆）
            const exprs = this.engine.compiler.consumeAutoComponentProps(template) ?? {};
            const { value, foldedKeys } = foldElementProps(this.el, exprs);
            if (value !== undefined) this.value = value;
            for (const key of foldedKeys) this.el.removeAttribute(key);
            super.created();
        }
    }
    return AutoSparkElementComponent;
}

/**
 * 从既有自动组件类的候选列表摘除指定组件名（同组件换标签覆盖的前置，ADR-0133）。
 *
 * 候选数组与注册键同步维护：摘除后剩余候选的注册键保留（仍指同一类）；`name` 键删除；
 * 数组摘空的类不再被任何键引用（键随候选同步创建），无需额外清理。
 */
function detachAutoComponentCandidate(directives: DirectiveManager, name: string): void {
    for (const cls of directives.values()) {
        if (!isAutoComponentClass(cls)) continue;
        const candidates = cls.autoComponentCandidates as AutoComponentCandidate[];
        if (!candidates.some((c) => c.name === name)) continue;
        for (let i = candidates.length - 1; i >= 0; i--) {
            if (candidates[i].name === name) candidates.splice(i, 1);
        }
        break;
    }
    directives.delete(name);
}

/**
 * 安装元素名组件指令（ADR-0117；撞名规则 ADR-0133 修订，{@link createAutoComponentClass}
 * 产物的注册收口）。
 *
 * 由 `engine.registerComponentDef` 在 def 携带 `tag` 时调用（五条组件注册路径统一收口，
 * 凡注册必安装）。撞名规则（ADR-0133）：
 *
 * - 同注册名 + 同标签（本机制重复安装，嵌套声明随实例重复收集）：**静默幂等跳过**；
 * - 不同组件派生/声明同一标签（占用者为自动组件类）：**就近遮蔽**——新组件名并入既有类
 *   的候选列表（同 scope 撞名就近失灵，后声明胜 + warn；跨 scope 静默，遮蔽是特性）；
 * - 同注册名 + 标签变化（组件重声明且 tag 声明不同）：warn + 覆盖（组件定义本身已按覆盖
 *   语义更新，指令注册随之对齐；旧候选先摘除）；
 * - **组件名撞预设/自定义指令名**（注册键让位，ADR-0117 原语义）：warn + 跳过标签安装——
 *   组件本身仍注册，`x-component:名称` 照常可用（合法组件名可恰与指令名同名，error 会
 *   误伤组件注册本身，ADR-0133 实施期收窄）；
 * - **标签撞非组件指令的元素名**（作者明确要占该标签，如 `tag: "x-super"`）：CompileError
 *   （ADR-0133 升格——全局注册语义无就近可言，静默跳过会让标签失效难排查，fail-fast）。
 */
export function installAutoComponentTag(engine: AutoSpark<any>, def: ComponentDef): void {
    const name = def.name;
    const tag = def.tag!;
    const directives = engine.directives;
    const existing = directives.get(name);
    if (existing) {
        if (isAutoComponentClass(existing)) {
            const already =
                (existing.autoComponentCandidates as AutoComponentCandidate[]).some(
                    (c) => c.name === name,
                ) && existing.elementName === tag;
            if (already) return; // 幂等：同名同 tag（含并入候选列表后的重复收集）
            // 同组件换标签：先从既有候选摘除本名（旧标签类若因此候选摘空则随之消亡），再注册新类
            engine.logger.warn(
                `x-define-options.tag: 组件 "${name}" 重声明元素名为 "${tag}"（原 "${existing.elementName}"），指令注册已覆盖`,
            );
            detachAutoComponentCandidate(directives, name);
        } else {
            const preset = Object.prototype.hasOwnProperty.call(presetDirectives, name);
            engine.logger.warn(
                `x-define-options.tag: 组件 "${name}" 撞已注册${preset ? "预设" : "自定义"}指令名 "${name}"，元素名 "${tag}" 注册已跳过（组件本身可用，ADR-0117/0133）`,
            );
            return;
        }
    }
    const occupantName = directives.findByElementName(tag);
    if (occupantName !== undefined && occupantName !== name) {
        const occupant = directives.get(occupantName);
        if (occupant && isAutoComponentClass(occupant)) {
            // 不同组件撞同标签：就近遮蔽（ADR-0133）——并入候选列表，解析沿使用处 scope 链
            const candidates = occupant.autoComponentCandidates as AutoComponentCandidate[];
            const scope = def.declarerScope ?? null;
            const sameScope = candidates.some((c) => c.declarerScope === scope);
            if (sameScope) {
                engine.logger.warn(
                    `x-define-options.tag: 组件 "${name}" 与既有候选（${candidates
                        .map((c) => `"${c.name}"`)
                        .join("、")}）同作用域声明且同标签 "${tag}"，就近遮蔽失灵按声明序后者胜（ADR-0133）`,
                );
            }
            candidates.push({ name, declarerScope: scope });
            directives.set(name, occupant as any); // 同类多键：两注册名都指向合并类
            return;
        }
        throw new CompileError(
            "component-tag-conflict",
            `x-define-options.tag: 元素名 "${tag}" 已被指令 "${occupantName}" 占用，组件 "${name}" 的元素名注册失败（ADR-0133）`,
        );
    }
    directives.set(
        name,
        createAutoComponentClass(
            [{ name, declarerScope: def.declarerScope ?? null }],
            tag,
        ) as any,
    );
}
