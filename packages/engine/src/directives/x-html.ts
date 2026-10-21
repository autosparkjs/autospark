import { AutoSparkDirectiveBase } from "../features/directive/base";
import { sanitizeHtml } from "../utils/sanitize";
import { createEmptyRenderer, resolveEmptyValues } from "../features/directive/utils/emptyPlaceholder";
import { recompileSubtree } from "../utils/recompileSubtree";
import { AsyncSourceRunner, createAsyncOnError } from "../features/directive/async-source";
import { dispatchLoadError, type RemoteLoadError } from "../features/directive/remote-load";
import type { AutoSparkAction } from "../features/action/types";
import { isAsyncHtmlValue } from "../features/directive/async-source-utils";
import { getId } from "../utils/getId";
import {
    injectHostScopedStyle,
    mountComponentScopedAttr,
} from "../utils/scopedStyle";
import {
    BIND_CALL_RE,
    bindStyleVars,
    extractStyleBinds,
    type StyleBind,
} from "../utils/styleBind";
import type { Watcher } from "autostore";

/**
 * x-html：将状态值作为原始 HTML 注入元素的 innerHTML。（**默认消毒**，见 ADR-0005）
 *
 * 与 x-text 同构：`created` 经 `scope.watch` 订阅（纯路径走精准 watch，表达式走
 * collectDependencies），用返回的当前值首渲；后续变化由 scheduler 微任务合并后 patch。
 * 差别仅 patch 写 `innerHTML`（解析为 DOM），而非 x-text 的 `textContent`（转义文本）。
 *
 * **安全姿态（safe-by-default）**：默认经 `engine.options.sanitizer`（缺省 = 内置极简
 * `sanitizeHtml`，剥 `<script>`、`on*` 事件属性、危险协议 URL）消毒后再写 innerHTML——与本引擎 `{{}}`
 * 插值默认 XSS 安全（ADR-0004 决策 6）的哲学一致。注入**受信内容**时用 `.raw` 修饰符
 * 退出消毒、原样写入：`<div x-html.raw="trustedHtml"></div>`。
 *
 * **空值占位（ADR-0014）**：与 x-text 同构——`emptyValues`（默认 `[null, undefined, NaN]`）内的值
 * 渲染 `empty` 占位（默认空串，**也过 sanitize**）；`.hide` 修饰符空值隐藏宿主。空值/隐藏逻辑与
 * x-text 共享 `createEmptyRenderer`，差别仅写内容走 `innerHTML`（± sanitize）。
 *
 * **默认不编译注入内容**：注入 HTML 为静态快照，不递归走转换器/不建 scope/不注册 watcher。
 *
 * **`.compile` 修饰符（ADR-0017）**：反转上述定位——把绑定值作为**子模板编译执行**。
 * 注入内容写回 `scope.template` 后调 `recompileSubtree`，建 scope/watcher、继承宿主作用域
 * （localData/data 经 `_linkParent` 自动传递），支持嵌套 x-data/x-for/x-if，与正常模板一致。
 * - **隐式强制跳过消毒**（sanitize 会剥 x-* 指令属性致模板失效），安全等级**高于 `.raw`**：
 *   `.raw` 的 `<script>` 经 innerHTML 不执行，`.compile` 注入的 `x-on` 会真实绑定执行——须确保来源可信。
 * - 每次值变全量销毁旧子树 + 重编译（无 diff）；空值销毁子树 + 清空宿主、忽略 `empty` 文案
 *   （结构空状态无文案占位语义），`.hide` 仍生效。
 * - **样式通道（组件样式管线复用，ADR-0022 决策四 / ADR-0087）**：注入内容中的 `<style>`
 *   按组件同款语义处理——非 global 段提取出模板树，`bind()` 提取为 CSS 变量订阅后经
 *   `rewriteScopedCss` 改写注入 head（宿主 + 编译后代打 `data-cmp-{实例id}`，id 为指令实例级
 *   `getId()` 随机串——bind 变量挂各自宿主，样式表不跨实例共享）；`<style global>` 留模板
 *   原位置随子树编译进结果 DOM（浏览器原生全局生效，随子树重编译回收；global 段 bind 告警
 *   姿态同组件 ADR-0087）。空值 / destroy 同步回收样式表与 bind watcher。
 *
 * **远程异步 HTML 源（ADR-0035 / ADR-0122）**：值以 url 前缀（`/`、`//`、`http(s)://`、`./`、`../`）或
 * `标识符(实参)`（**必须带调用括号**——裸词恒为表达式读状态键，与 x-data 判定的关键差异）
 * 开头即异步形态：url 经 fetch `res.text()` 直取、action 经 getAction 链执行（返回非字符串
 * 按加载失败处理），产物按上述既有双通道消费（默认模式写 innerHTML **维持默认消毒**——
 * 远程比本地更不可信；`.compile` 模式作为远程模板编译）。url `{expr}` 单括号插值依赖变化
 * 自动重取（保旧值不闪断、竞态按序号丢弃、destroy 中止）。反馈三件套：元键注入（`$loading`/`$error`
 * 写宿主 scope locals，模板直读）+ 合成 `x-loading` 字面量切换（`"true"`/`"false"`，
 * 经 attrChanged 驱动显隐）+ 用户可用 x-if/x-else-if/x-else 做条件渲染。同元素双异步
 * （异步 x-data + 异步 x-html）时视觉通道归 x-html 独占（x-data 不合成 overlay）。
 *
 * **与 x-text 同元素**：x-html 确定性胜出（x-text 让步 no-op，见 ADR-0005 决策 6）。
 *
 * **`<script>` 不执行**：`innerHTML=` 本就不执行脚本（浏览器约束），默认消毒还会剥除。
 */
export class HtmlDirective extends AutoSparkDirectiveBase {
    static override readonly priority = 0;
    static override readonly singleton = true;

    override created() {
        if (this.value == null || this.value === "") return;
        const raw = String(this.value);
        // 异步形态（ADR-0035）优先分流：url / action(带括号)，产物进入下方两条既有通道之一
        if (isAsyncHtmlValue(raw)) {
            this._createdAsync(raw);
            return;
        }
        // .compile 修饰符走子模板编译分支；否则走默认 innerHTML 注入（± sanitize + 空值占位）
        if (this.getOption("compile")) {
            this._createdCompile();
        } else {
            this._createdDefault();
        }
    }

    /**
     * 默认模式：把绑定值作为原始 HTML 写入 innerHTML（± sanitize + 空值占位）。
     *
     * `.raw` 退出消毒；否则用 engine 注入的 sanitizer，缺省回退内置极简 `sanitizeHtml`。
     * 空值/隐藏逻辑与 x-text 共享 `createEmptyRenderer`（ADR-0007 决策 1，统一经 getOption 读取）。
     */
    private _createdDefault() {
        const sanitize = this.getOption("raw") ? null : this.engine.options.sanitizer ?? sanitizeHtml;
        const apply = createEmptyRenderer(
            this.el,
            this.getOption("emptyValues"),
            String(this.getOption("empty") ?? ""),
            !!this.getOption("hide"),
            (text) => {
                if (this.el) this.el.innerHTML = sanitize ? sanitize(text) : text;
            },
        );
        const initial = this.binding.watch(this.value, ({ value }) => apply(value));
        apply(initial);
    }

    /**
     * `.compile` 模式：把绑定值作为子模板编译进宿主子树（ADR-0017）。
     *
     * 与默认模式的差异：
     * - **不消毒**：compile 隐式强制跳过 sanitize（sanitize 会剥 `x-on`/`@*`/`:*` 指令属性致模板失效）。
     * - **作为子模板编译**：写回 `this.template.innerHTML` 后调 `recompileSubtree`，建 scope +
     *   watcher + 绑定（反转 x-html「不编译注入内容」的原定位）。
     * - **空值**：清空 template → recompileSubtree 销毁旧子树 + 清空 el，忽略 `empty` 文案
     *   （结构空状态无文案占位语义）。
     * - **`.hide`**：仍生效（控宿主可见性，与内容来源正交）。
     *
     * `template` 是共享模板树元素，写回即污染（设计要求，ADR-0017）：编译器的 `_linkParent` 靠
     * 模板树位置继承作用域，离树编译会断链。
     */
    private _createdCompile() {
        const el = this.el;
        const tpl = this.template;
        if (!el || !tpl) return;
        const emptyValues = resolveEmptyValues(this.getOption("emptyValues"));
        const hide = !!this.getOption("hide");
        // 惰性缓存原内联 display：仅首次隐藏时读、恢复时还原（不读 getComputedStyle，避免固化 CSS 类计算值）。
        let prevDisplay: string | undefined;

        const apply = (value: any) => {
            const isEmpty = emptyValues.includes(value);
            // .hide：控宿主可见性，与内容来源正交
            if (hide) {
                if (isEmpty) {
                    if (prevDisplay === undefined) prevDisplay = el.style.display;
                    el.style.display = "none";
                } else if (prevDisplay !== undefined) {
                    el.style.display = prevDisplay;
                }
            }
            // 内容写回 template（空值清空、非空写入）+ 样式提取 + 重编译子树。
            // 模板树污染是设计要求（ADR-0017）：_linkParent 靠模板树位置继承作用域。
            this._compileInjected(isEmpty ? "" : String(value), "编译注入内容失败");
        };
        const initial = this.binding.watch(this.value, ({ value }) => apply(value));
        // 首次 apply defer 到 microtask：created 在 compileElement 内同步跑，此时 transformElement
        // 尚未完成对宿主子节点的递归——若同步注入会污染 template 致注入内容被编译两次
        //（recompileSubtree 一次 + transformElement 递归一次）。defer 后递归已结束，注入仅由
        // recompileSubtree 编译一次。同 x-if 首渲 defer（if.ts）。engine.compile() 末尾 flushAll 同步消化。
        this.engine.scheduler.schedule(() => apply(initial));
    }

    // ── 样式通道（组件样式管线复用：scoped 改写注入 + global 留置 + bind 响应式）────────

    /** 实例级 scoped 作用域 id（首次注入时生成，实例内稳定——重取/值变复用同一属性后缀与样式表 id） */
    private styleScopeId: string | null = null;
    /** 本轮注入的 scoped 样式表（head 级，值变 replace / 空值 / destroy 时移除） */
    private styleEl: HTMLStyleElement | undefined;
    /** 本轮 bind 订阅的 watcher（宿主 scope 无「内容级」销毁时机，指令自持换血防孤儿累积） */
    private bindWatchers: Watcher[] = [];
    /** 本轮已写入宿主的 CSS 变量名（释放时 removeProperty——变量无规则引用后是纯脏数据） */
    private bindVarNames: string[] = [];

    /**
     * 注入内容统一编译入口（`.compile` 同步通道与远程异步通道共用）：
     * 写回 template → 提取样式 → recompileSubtree → 挂载 scoped 样式与 bind 订阅。
     */
    private _compileInjected(html: string, errCtx: string): void {
        const el = this.el;
        const tpl = this.template;
        if (!el || !tpl) return;
        tpl.innerHTML = html;
        const { css, binds } = this._extractStyles(tpl);
        try {
            recompileSubtree(this.binding, el);
        } catch (e: any) {
            // 抛错时 recompileSubtree 已 destroy 旧子树 + 清空 el → 内容已无作用对象，样式同步回收
            this._releaseStyles();
            this.error(`x-html.compile: ${errCtx}: ${e?.message ?? e}`);
            return;
        }
        this._mountStyles(el, css, binds);
    }

    /**
     * 样式提取（写回 template 后、recompileSubtree 前——结果树由模板树克隆而来）：
     * - 非 global `<style>`：摘出模板树（不进结果 DOM），`bind()` 提取为 CSS 变量清单后
     *   交 `_mountStyles` 改写注入 head（组件同款管线）；
     * - `<style global>`：**留模板原位置**、剥 `global` 属性（语义已被本通道消费，剥除避免
     *   误触编译器「global 仅 x-define 生效」告警），随子树编译进结果 DOM 浏览器原生全局生效
     *   ——随子树重编译自然回收，与组件「注册期注入 head 永驻」有意分歧（内容是动态的）。
     */
    private _extractStyles(tpl: HTMLElement): { css: string[]; binds: StyleBind[] } {
        const bindMap = new Map<string, StyleBind>();
        const css: string[] = [];
        for (const node of Array.from(tpl.querySelectorAll("style"))) {
            const raw = node.textContent ?? "";
            if (node.hasAttribute("global")) {
                // 姿态同组件 ADR-0087：global 段不支持 bind（变量挂载点在全局语境无对应物），warn 后原样保留
                if (BIND_CALL_RE.test(raw)) {
                    this.warn(
                        `x-html.compile: <style global> 不支持 bind() 响应式，该声明已原样保留`,
                    );
                }
                node.removeAttribute("global");
                continue;
            }
            node.remove();
            css.push(extractStyleBinds(raw, bindMap).rewritten);
        }
        return { css, binds: Array.from(bindMap.values()) };
    }

    /**
     * 挂载本轮样式：换血（释放上一轮样式表 + off 旧 bind watcher）→ 打 scoped 属性 →
     * 注入改写样式（head）→ 建 bind 订阅（变量挂宿主 el，宿主 scope 求值——祖先 x-data 可读，
     * 与普通模板同一数据视图）。
     */
    private _mountStyles(el: HTMLElement, css: string[], binds: StyleBind[]): void {
        this._releaseStyles();
        if (css.length > 0) {
            this.styleScopeId ??= getId();
            // 宿主 + 编译后代打 data-cmp-{id}（组件同款属性，改写器/打标器零改动复用）
            mountComponentScopedAttr(el, this.styleScopeId);
            this.styleEl = injectHostScopedStyle(css, this.styleScopeId);
        }
        if (binds.length > 0) {
            this.bindWatchers = bindStyleVars(this.binding, el, binds);
            this.bindVarNames = binds.map((b) => b.varName);
        }
    }

    /** 释放样式资源：off 并摘出本轮 bind watcher + 移除 scoped 样式表 + 清宿主 CSS 变量 */
    private _releaseStyles(): void {
        for (const w of this.bindWatchers) {
            w.off();
            const idx = this.binding.watchers.indexOf(w);
            if (idx >= 0) this.binding.watchers.splice(idx, 1);
        }
        this.bindWatchers = [];
        this.styleEl?.remove();
        this.styleEl = undefined;
        for (const name of this.bindVarNames) {
            this.el?.style.removeProperty(name);
        }
        this.bindVarNames = [];
    }

    // ── 远程异步 HTML 源（ADR-0035 / ADR-0122：url / action 形态，text-only + 反馈三件套）──────

    /** 共享取数执行器（ADR-0035 决策 5）：本指令只消费回调（text 校验 / 双通道注入 / 反馈） */
    private runner: AsyncSourceRunner | null = null;
    /** 在途请求标志（onLoading/onResult/onError 维护）——元键 $loading 写入依据 */
    private loading = false;
    /** 最近一次失败（新一轮请求发起时清空，对应 x-data「发起时清 $error」语义） */
    private lastError: Error | null = null;
    /** 首次成功注入标志（保留：重取保旧值不闪断语义的判定依据之一） */
    private hasArrived = false;
    /** destroy 后拒收一切在途结果 */
    private destroyed = false;
    /** 是否已合成 x-loading 覆盖层（字面量切换式：值在 "true"/"false" 间经 attrChanged 驱动显隐） */
    private loadingSynth = false;

    /**
     * 异步形态初始化（ADR-0035 / ADR-0122）：x-loading 合成（ADR-0122：无互斥，恒合成）→
     * runner 首取 + 依赖 watch。元键 $loading/$error 经 runner 回调注入宿主 locals。
     */
    private _createdAsync(raw: string): void {
        this._synthesizeLoading();
        this.runner = new AsyncSourceRunner(this.binding, (k) => this.getOption(k), {
            responseParser: (res) => res.text(),
            onLoading: () => this._beginLoad(),
            onResult: (value) => this._arrive(value),
            onError: createAsyncOnError(
                (msg) => this.warn(`x-html: ${msg}`),
                (err) => {
                    this._fail(err);
                    // ADR-0121 决策 5：load 错误源事件派发（内部态照写；x-error 在场时接管呈现）
                    dispatchLoadError(this.el, err as RemoteLoadError, () => this.runner?.retry());
                },
            ),
        });
        // retry action 注入（ADR-0121 决策 4）：错误条件渲染块内 `@click="retry"` 经 getAction 链命中；
        // 用户同名 action 存在时不覆盖（用户声明优先）。
        const scope = this.binding;
        if (!scope.actions?.retry) {
            scope.actions = {
                ...(scope.actions ?? {}),
                retry: {
                    id: "retry",
                    title: "重试",
                    handle: () => this.runner?.retry(),
                } as AutoSparkAction,
            };
        }
        this.runner.start(raw);
    }

    /** 请求发起：在途置位 + 清上一轮失败 + 元键注入（$loading=true, $error=undefined） */
    private _beginLoad(): void {
        this.loading = true;
        this.lastError = null;
        this._setLoadingAttr(true);
        this._setMeta(true, undefined);
    }

    /**
     * x-loading 覆盖层合成（ADR-0035 决策 3 / ADR-0122 决策 3）：注入 `x-loading="true"` 字面量属性
     * （Runtime 指令属性保留在结果 DOM，dispatcher 拾取；字面量模式无订阅，值切换
     * `"true"`/`"false"` 经 attrChanged 驱动显隐）。ADR-0122 移除「有 x-fallback 不合成」
     * 互斥默认与双异步让位——恒合成，仅 `loading:false` 恒关、宿主手写 x-loading 不叠加。
     */
    private _synthesizeLoading(): void {
        const loadingOpt = this.getOption("loading");
        if (loadingOpt === false) return;
        if (this.el?.hasAttribute("x-loading")) return;
        this.el?.setAttribute("x-loading", "true");
        this.loadingSynth = true;
        if (loadingOpt && typeof loadingOpt === "object") {
            this.el?.setAttribute("x-loading-options", JSON.stringify(loadingOpt));
        }
    }

    /** 切换合成覆盖层显隐（仅合成方持有——未合成时 no-op） */
    private _setLoadingAttr(on: boolean): void {
        if (!this.loadingSynth) return;
        this.el?.setAttribute("x-loading", on ? "true" : "false");
    }

    /**
     * 元键注入宿主 scope locals（ADR-0122 决策 2）：`$loading`/`$error` 为普通对象字段，
     * 经 scope 链对子树可见（locals 优先级最高）。原地修改（不替换引用——子 scope 经
     * _linkParent 共享同一对象，替换会断链）。写入后 invalidateScopeView 让聚合视图缓存
     * 失效，再刷新子 scope 驱动依赖绑定重求值（x-text/x-if 等直读元键）。
     *
     * 注意：只刷新子 scope，不刷宿主 scope 自身——宿主 scope 上的 AsyncSourceRunner watcher
     * 监听 args 数据依赖，不应被 $loading/$error 变化触发，否则会形成
     * _setMeta → refresh → invokeAction → _beginLoad → _setMeta 的死循环。
     */
    private _setMeta(loading: boolean, error: Error | undefined): void {
        const scope = this.binding;
        if (!scope.locals) scope.locals = {};
        scope.locals.$loading = loading;
        scope.locals.$error = error;
        scope.invalidateScopeView();
        for (const child of scope.children) child.refresh();
    }

    /**
     * 产物到达（决策 2）：text-only——非字符串（action 返回对象/数字等）按加载失败处理
     * （与 x-data 对象-only 姿态对称：产物类型不符是 bug 信号，注入垃圾比显示错误更糟）。
     * 空串照既有语义清空宿主（空串不在默认 emptyValues 内，同步行为照旧）。
     */
    private _arrive(value: unknown): void {
        if (typeof value !== "string") {
            this._fail(
                new TypeError(`异步 HTML 源须返回字符串，实际得到 ${value === null ? "null" : typeof value}`),
            );
            return;
        }
        this.hasArrived = true;
        this.loading = false;
        this._setLoadingAttr(false);
        this._setMeta(false, undefined);
        // 产物进入既有双通道（决策 4）：.compile → 远程子模板编译；默认 → innerHTML（远程内容维持默认消毒）
        if (this.getOption("compile")) {
            this._compileInjected(value, "编译远程模板失败");
        } else {
            const sanitize = this.getOption("raw") ? null : this.engine.options.sanitizer ?? sanitizeHtml;
            if (this.el) this.el.innerHTML = sanitize ? sanitize(value) : value;
        }
    }

    /** 加载失败：warn + 保旧值（不写内容）+ 元键落地（$error） */
    private _fail(err: Error): void {
        this.warn(`x-html: ${err.message}`);
        this.loading = false;
        this.lastError = err;
        this._setLoadingAttr(false);
        this._setMeta(false, err);
    }

    override destroy(): void {
        // 异步形态清理（ADR-0035 决策 7）：中止进行中 fetch、序号失效（action 在途结果不落地）。
        // 样式通道清理：移除 scoped 样式表 + off bind watcher（global 段随子树消亡，无需额外清理）。
        this.destroyed = true;
        this.runner?.destroy();
        this._releaseStyles();
    }
}
