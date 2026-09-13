import { AutoSparkDirectiveBase } from "../base";
import { sanitizeHtml } from "../../utils/sanitize";
import { createEmptyRenderer, resolveEmptyValues } from "../utils/emptyPlaceholder";
import { recompileSubtree } from "../../utils/recompileSubtree";
import { AsyncSourceRunner } from "../async-source";
import { isAsyncHtmlValue } from "./async-source";
import { DataDirective } from "./data";

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
 *
 * **远程异步 HTML 源（ADR-0035）**：值以 url 前缀（`/`、`//`、`http(s)://`、`./`、`../`）或
 * `标识符(实参)`（**必须带调用括号**——裸词恒为表达式读状态键，与 x-data 判定的关键差异）
 * 开头即异步形态：url 经 fetch `res.text()` 直取、action 经 getAction 链执行（返回非字符串
 * 按加载失败处理），产物按上述既有双通道消费（默认模式写 innerHTML **维持默认消毒**——
 * 远程比本地更不可信；`.compile` 模式作为远程模板编译）。url `{expr}` 单括号插值依赖变化
 * 自动重取（保旧值不闪断、竞态按序号丢弃、destroy 中止）。反馈只走**视觉通道**（x-html
 * 无数据域、不注入 `$loading`/`$error` 元键）：合成 `x-loading` 字面量切换（`"true"`/`"false"`，
 * 经 attrChanged 驱动显隐）+ x-fallback **静态认领**（不编译不可插值，非就绪且宿主无已注入
 * 内容时显示）。同元素双异步（异步 x-data + 异步 x-html）时反馈通道归 x-data 独占。
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
            // 内容写回 template（空值清空、非空写入）+ 重编译子树。
            // 模板树污染是设计要求（ADR-0017）：_linkParent 靠模板树位置继承作用域。
            tpl.innerHTML = isEmpty ? "" : String(value);
            try {
                recompileSubtree(this.binding, el);
            } catch (e: any) {
                // 抛错时 recompileSubtree 已 destroy 旧子树 + 清空 el → el 保持清空（与 engine.patch 姿态一致）
                this.engine.logger.error(`x-html.compile: 编译注入内容失败: ${e?.message ?? e}`);
            }
        };
        const initial = this.binding.watch(this.value, ({ value }) => apply(value));
        // 首次 apply defer 到 microtask：created 在 compileElement 内同步跑，此时 transformElement
        // 尚未完成对宿主子节点的递归——若同步注入会污染 template 致注入内容被编译两次
        //（recompileSubtree 一次 + transformElement 递归一次）。defer 后递归已结束，注入仅由
        // recompileSubtree 编译一次。同 x-if 首渲 defer（if.ts）。engine.compile() 末尾 flushAll 同步消化。
        this.engine.scheduler.schedule(() => apply(initial));
    }

    // ── 远程异步 HTML 源（ADR-0035：url / action 形态，text-only + 视觉反馈）──────

    /** 共享取数执行器（ADR-0035 决策 5）：本指令只消费回调（text 校验 / 双通道注入 / 反馈） */
    private runner: AsyncSourceRunner | null = null;
    /** 在途请求标志（onLoading/onResult/onError 维护）——fallback 非就绪判定之一 */
    private loading = false;
    /** 最近一次失败（新一轮请求发起时清空，对应 x-data「发起时清 $error」语义） */
    private lastError: Error | null = null;
    /** 首次成功注入标志——fallback 显示条件 = 非就绪 && !hasArrived（重取保旧值不闪断） */
    private hasArrived = false;
    /** destroy 后拒收一切在途结果与 fallback 同步 */
    private destroyed = false;
    /** x-fallback 静态模板（template.children 中带 x-fallback 的元素，文档序；宿主无双异步 x-data 时认领） */
    private fallbackTpls: HTMLElement[] | null = null;
    /** 已挂载的 fallback 克隆节点（激活期存在——静态通道，不编译不可插值） */
    private fallbackEls: HTMLElement[] | null = null;
    /** 是否已合成 x-loading 覆盖层（字面量切换式：值在 "true"/"false" 间经 attrChanged 驱动显隐） */
    private loadingSynth = false;

    /**
     * 异步形态初始化（ADR-0035）：双异步互斥查询（反馈通道归 x-data 独占）→ x-fallback
     * 静态认领 → x-loading 合成（互斥默认）→ runner 首取 + 依赖 watch → scheduler 延迟
     * 首次 fallback 同步（编译完成后子树就位，挂载才有意义）。
     */
    private _createdAsync(raw: string): void {
        const hasAsyncData = this.binding.directives.some(
            (d) => d instanceof DataDirective && d.isAsyncSource(),
        );
        if (!hasAsyncData) this._collectFallback();
        this._synthesizeLoading(hasAsyncData);
        this.runner = new AsyncSourceRunner(this.binding, (k) => this.getOption(k), {
            responseParser: (res) => res.text(),
            onLoading: () => this._beginLoad(),
            onResult: (value) => this._arrive(value),
            onError: (err) => this._fail(err),
        });
        this.runner.start(raw);
        this.engine.scheduler.schedule(() => this._syncFallback());
    }

    /** 请求发起：在途置位 + 清上一轮失败（对应 x-data「新一轮请求发起时清 $error」） */
    private _beginLoad(): void {
        this.loading = true;
        this.lastError = null;
        this._setLoadingAttr(true);
    }

    /**
     * x-loading 覆盖层合成（ADR-0035 决策 3）：注入 `x-loading="true"` 字面量属性
     * （Runtime 指令属性保留在结果 DOM，dispatcher 拾取；字面量模式无订阅，值切换
     * `"true"`/`"false"` 经 attrChanged 驱动显隐——无数据域也可用）。互斥默认：
     * 有 x-fallback 且未显式声明 loading → 不合成（避免双重加载指示）；
     * `loading:false` 恒关；宿主手写 x-loading → 不叠加。双异步时归 x-data 独占
     * （显式声明 loading 被忽略并 warn）。
     */
    private _synthesizeLoading(hasAsyncData: boolean): void {
        const loadingOpt = this.getOption("loading");
        if (loadingOpt === false) return;
        if (this.fallbackTpls && loadingOpt === undefined) return;
        if (hasAsyncData) {
            if (loadingOpt !== undefined) {
                this.engine.logger.warn(
                    `x-html: 同元素双异步（异步 x-data + 异步 x-html），反馈通道归 x-data 独占，loading 选项被忽略（ADR-0035 决策 6）`,
                );
            }
            return;
        }
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
        this._hideFallback();
        // 产物进入既有双通道（决策 4）：.compile → 远程子模板编译；默认 → innerHTML（远程内容维持默认消毒）
        if (this.getOption("compile")) {
            const tpl = this.template;
            if (tpl) tpl.innerHTML = value;
            try {
                if (this.el) recompileSubtree(this.binding, this.el);
            } catch (e: any) {
                this.engine.logger.error(`x-html.compile: 编译远程模板失败: ${e?.message ?? e}`);
            }
        } else {
            const sanitize = this.getOption("raw") ? null : this.engine.options.sanitizer ?? sanitizeHtml;
            if (this.el) this.el.innerHTML = sanitize ? sanitize(value) : value;
        }
        this.engine.scheduler.schedule(() => this._syncFallback());
    }

    /** 加载失败：warn + 保旧值（不写内容）+ 反馈同步（fallback 认领失败态） */
    private _fail(err: Error): void {
        this.engine.logger.warn(`x-html: ${err.message}`);
        this.loading = false;
        this.lastError = err;
        this._setLoadingAttr(false);
        this.engine.scheduler.schedule(() => this._syncFallback());
    }

    /** 采集 x-fallback 特例子节点（template 直接子级，文档序；walk 到达前采集完毕） */
    private _collectFallback(): void {
        const tpl = this.template;
        if (!tpl) return;
        for (const child of tpl.children) {
            if (child instanceof HTMLElement && child.hasAttribute("x-fallback")) {
                (this.fallbackTpls ??= []).push(child);
            }
        }
    }

    /**
     * fallback 状态同步（scheduler 微任务驱动）：显示条件 = 非就绪（在途或有错）且
     * **宿主无已注入内容**（!hasArrived）——首载显示；重取保旧值、不闪断。静态通道：
     * 模板**克隆**挂载（不编译——fallback 内容的 `{{}}` 显示原文，ADR-0035 决策 3），
     * 注入内容写入前先移除（_hideFallback）。
     */
    private _syncFallback(): void {
        if (this.destroyed || !this.fallbackTpls) return;
        const notReady = this.loading || this.lastError !== null;
        const active = notReady && !this.hasArrived;
        if (active === !!this.fallbackEls) return;
        if (active) {
            this.fallbackEls = this.fallbackTpls.map((tpl) => {
                const clone = tpl.cloneNode(true) as HTMLElement;
                this.el?.appendChild(clone);
                return clone;
            });
        } else {
            this._hideFallback();
        }
    }

    /** 移除已挂载的 fallback 克隆（_arrive 写内容前 / 就绪复原时调用） */
    private _hideFallback(): void {
        if (!this.fallbackEls) return;
        for (const el of this.fallbackEls) el.remove();
        this.fallbackEls = null;
    }

    override destroy(): void {
        // 异步形态清理（ADR-0035 决策 7）：中止进行中 fetch、序号失效（action 在途结果不落地）。
        // fallback 克隆随宿主元素一起消亡，无需额外清理。
        this.destroyed = true;
        this.runner?.destroy();
    }
}
