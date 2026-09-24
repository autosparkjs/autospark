import { AutoSparkDirectiveBase, DirectiveKind, type RuntimeDirective } from "../base";
import type { AutoSpark } from "../../engine";
import { SCOPES_KEY } from "../../engine";
import type { AutoSparkScope } from "../../scope";
import { isSimpleStatePath } from "../../scope";
import { getVal, type Watcher } from "autostore";
import { rgba } from "../../utils/colors";import { relaxedToJson } from "../../utils/relaxedToJson";
import { queryRelElement } from "../../utils/queryRelElement";
import { parseHtmlFragment } from "../../utils/transformElement";
import { buildAction } from "../../actions/buildAction";
import type { ActionDesc } from "../../actions/types";
import type { AutoSparkActionContext } from "./on/types";

/**
 * x-loading：在宿主元素上覆盖一个「加载中」层。（**运行时指令**，走 observer 通道）
 *
 * **运行时语义**（详见 docs/adr/0001-directive-kind-system.md、0003-engine-event-bus.md）：
 * - 编译器致盲——`x-loading` 属性**保留**在结果 DOM 上，允许通过 DOM API
 *   （`setAttribute` / `removeAttribute`）改值或删除，运行时动态生效。
 * - observer 通道由 **engine 级 RuntimeObserverDispatcher** 统一管理（ADR-0003 决策 7）：
 *   engine.el 上单一共享 MutationObserver 监听所有 runtime 指令的增/删/属性变化，
 *   add→`mounted`、remove→`unmounted`、值变→`attrChanged`，并广播 `directive/loading/**`。
 *   指令**不再自建 observer**——只实现三个生命周期钩子。
 * - 反应式来源为 **`engine.store`（全局绝对路径/表达式）**——运行时无 scope，不支持
 *   x-data 局部变量 / x-for item 等 scope 相对表达式。
 *
 * 两态绑定：
 * - **快速绑定** `x-loading="order.isSubmit"` / `x-loading="isLoading"`：整值即 value 表达式，
 *   其余配置全默认。value 经 `engine.store` 求值。
 * - **配置绑定** `x-loading="{ value:'isLoading', message:'正在加载', bgColor:'white',
 *   color:'red', opacity:0.5, delay:300 }"`：字段化配置，value 必填。
 *
 * **值类型判定**：`this.value` 去空白后以 `{` 开头 → 配置绑定（relaxedToJson 解析），
 * 否则 → 快速绑定（整值作 value 表达式）。
 *
 * **显隐**：value 求值为 truthy → 挂载覆盖层；falsy → 移除覆盖层 DOM（重建式，非 display 隐藏）。
 *
 * **修饰符**：`.screen` → 覆盖层 `position:fixed;inset:0` 撑满视口（留在宿主子树，不 teleport）。
 *
 * **动作按钮（ADR-0038）**：配置 `actions:['close','retry']` 在 message 下方渲染动作按钮行——
 * 挂载时经 getAction 链解析 `title`（`ActionDesc.title ?? name`）注入块 data，渲染归块作者
 * （DEFAULT_BLOCK 以 x-for 渲染）；触发走指令侧 **data-action 点击委托**（块内任意
 * `data-action="<name>"` 元素）：已注册走真 action，未注册**合成透传 descriptor** 照播双通道
 * （总线 `actions/<name>/{pending,resolved}` + DOM `action:<name>` 冒泡）；点击后按
 * `ActionDesc.hide`（默认 true）自动隐藏覆盖层——先完整广播再纯 DOM 移除，不写状态。
 * *
 * **已知限制**：修饰符形式 `x-loading.screen` 的运行时**值变化**不触发 attrChanged
 * （共享 observer 的 attributeFilter 仅含裸 `x-loading`）；其增/删仍生效。
 *
 * 详见 `docs/x-loading.md`。
 *
 * @example 快速绑定
 * <div x-loading="order.isSubmit"></div>
 * // state.order.isSubmit=true → 挂载覆盖层；=false → 移除
 *
 * @example 配置绑定（白色半透明遮罩 + 红色 loader + 防闪烁）
 * <div x-loading="{ value:'isLoading', bgColor:'white', color:'red', delay:300 }"></div>
 *
 * @example 全屏 loading
 * <div x-loading.screen="{ value:'pageLoading', message:'加载中…' }"></div>
 */

/** 全局样式 <style> 的 id（首次 initialize 时注入一次，常驻不回收） */
const STYLES_ID = "x-loading-styles";
/** 覆盖层根节点 class */
const OVERLAY_CLASS = "x-loading-overlay";
/** 全屏修饰符追加 class（覆盖 position 为 fixed） */
const SCREEN_CLASS = "x-loading-screen";
/** 居中盒子 class（纵向排列 loader + message） */
const BOX_CLASS = "x-loading-box";
/** 旋转圆环 class（颜色经 currentColor 注入） */
const LOADER_CLASS = "x-loading-loader";
/** 可选文本 class */
const MESSAGE_CLASS = "x-loading-message";
/** 动作按钮行容器 class（ADR-0038；空清单时 :empty 折叠为零占位） */
const ACTIONS_CLASS = "x-loading-actions";
/** 动作按钮 class */
const ACTION_CLASS = "x-loading-action";
/** 旋转动画名（独立命名空间，避免与宿主页面 keyframes 冲突） */
const SPIN_KEY = "x-loading-spin";

/** 默认配置（与 docs/x-loading.md 规格一致） */
const DEFAULTS = {
    bgColor: "black",
    color: "#888",
    opacity: 0.5,
    delay: 0,
    zIndex: 9999,
} as const;

/** 配置绑定字段（value 必填，其余可选） */
interface LoadingConfig {
    /** value 表达式（全局路径或表达式）；缺失 ≡ 裸属性恒显示（命令式 overlay 契约，ADR-0008） */
    value: string;
    message?: string;
    bgColor?: string;
    color?: string;
    opacity?: number;
    delay?: number;
    /**
     * 覆盖层挂载目标选择器（默认挂宿主）：
     * - 普通值（如 `'#target'`）→ 相对查询：在宿主后代上显示（支持 `'../'` 父级爬升、`'^'` closest、`'/'` 全局，见 queryRelElement）；
     * - 以 `@` 开头（如 `'@#modal'`）→ `document.querySelector(去掉@的部分)`，在宿主外/全局元素上显示；
     * - 选择器未命中或非法 → 回退到宿主元素显示。
     */
    selector?: string;
    /**
     * 动作按钮名数组（ADR-0038）：message 下方渲染动作按钮行，经 data-action 委托触发
     * （已注册走真 action / 未注册合成透传 descriptor，均双通道广播）；点击后按
     * `ActionDesc.hide`（默认 true）自动隐藏。非字符串元素 warn 剪枝。
     */
    actions?: string[];
}

/** 模块级样式注入标志：进程内只注入一次 */
let stylesInjected = false;

/**
 * 默认 loading 块模板（ADR-0021 决策 12）：x-loading 渲染统一走「编译块」路径，无自定义块时
 * 用本模板作默认实现。形态与公开示例同构——`overlay` 壳 > `box` > `loader`(`:style="color"`) +
 * `message`(`x-text="message"`)。`color`/`message` 经块 data 响应式注入（见 {@link mountOverlay}）。
 *
 * **由 LoadingDirective 持有**（非 engine 注册表）——是「某指令自带的、可被全局/局部 loading 组件
 * 覆盖的默认实现」，不违反「引擎不预定义 UI 态名册」。消费者取组件 = `getComponent('loading') ?? DEFAULT_BLOCK`。
 */
const DEFAULT_BLOCK = `<div class="${OVERLAY_CLASS}">
  <div class="${BOX_CLASS}">
    <div class="${LOADER_CLASS}" :style="{color}"></div>
    <div class="${MESSAGE_CLASS}" x-text="message"></div>
    <div class="${ACTIONS_CLASS}" x-for="a of actions">
      <button class="${ACTION_CLASS}" type="button" :data-action="a.name" x-text="a.title"></button>
    </div>
  </div>
</div>`;

/**
 * 注入全局样式（initialize 首次调用，幂等）。
 *
 * loader 颜色用 `currentColor`（替换给定 CSS 里硬编码的 `#ffa516`），
 * 由 loader 元素的 `style.color` 注入；`-webkit-mask`/`mask` 不含色调，原样保留。
 */
function injectStyles(): void {
    if (stylesInjected) return;
    if (typeof document === "undefined" || !document.head) return;
    if (document.getElementById(STYLES_ID)) {
        stylesInjected = true;
        return;
    }
    const style = document.createElement("style");
    style.id = STYLES_ID;
    style.textContent = `
.${OVERLAY_CLASS} {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: ${DEFAULTS.zIndex};
}
.${OVERLAY_CLASS}.${SCREEN_CLASS} {
  position: fixed;
}
.${BOX_CLASS} {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.${LOADER_CLASS} {
  width: 36px;
  aspect-ratio: 1;
  border-radius: 50%;
  background:
    radial-gradient(farthest-side, currentColor 94%, #0000) top/4px 4px no-repeat,
    conic-gradient(#0000 30%, currentColor);
  -webkit-mask: radial-gradient(farthest-side, #0000 calc(100% - 4px), #000 0);
          mask: radial-gradient(farthest-side, #0000 calc(100% - 4px), #000 0);
  animation: ${SPIN_KEY} 1s infinite linear;
}
@keyframes ${SPIN_KEY} {
  100% { transform: rotate(1turn); }
}
.${MESSAGE_CLASS} {
  color: #fff;
  font-size: 14px;
  line-height: 1.4;
}
.${ACTIONS_CLASS} {
  display: flex;
  align-items: center;
  gap: 8px;
}
/* 无 actions 配置（空数组）时容器折叠为零占位——x-for 容器保留但子节点已被清空 */
.${ACTIONS_CLASS}:empty {
  display: none;
}
.${ACTION_CLASS} {
  padding: 4px 14px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 4px;
  background: transparent;
  color: #fff;
  font-size: 13px;
  line-height: 1.6;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.${ACTION_CLASS}:hover {
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.8);
}
.${ACTION_CLASS}:active {
  background: rgba(255, 255, 255, 0.1);
}`;
    document.head.appendChild(style);
    stylesInjected = true;
}

export class LoadingDirective extends AutoSparkDirectiveBase implements RuntimeDirective {
    /** 运行时指令：走 observer 通道（由 engine 级 RuntimeObserverDispatcher 驱动，见 ADR-0003 决策 7） */
    static override readonly kind = DirectiveKind.Runtime;

    /**
     * 类级初始化：注入全局样式。
     *
     * observer 通道（observer + 实例表 + 初始扫描）已移交 engine 级 RuntimeObserverDispatcher，
     * 指令不再自建。样式注入须在 dispatcher 初始扫描（触发首次 mounted → mountOverlay）**之前**完成
     * ——FOUC 防御；initializeAll 在 dispatcher.start() 之前调用，顺序保证。幂等（stylesInjected）。
     */
    static override initialize(_engine: AutoSpark): void {
        injectStyles();
    }

    /** 当前已挂载的覆盖层（= 编译后的块根；未挂载时为 null）；delay 窗口期内仍为 null */
    private overlay: HTMLElement | null = null;
    /** 已挂载覆盖层对应的块 scope（attrChanged 细粒度 patch 其 data；unmount 时 destroy） */
    private blockScope: AutoSparkScope | null = null;
    /** delay 定时器句柄（延迟挂载未触发时存在） */
    private delayTimer: ReturnType<typeof setTimeout> | null = null;
    /** 解析后的配置（mounted 中赋值，definite assignment） */
    private config!: LoadingConfig;
    /** value 当前值的读取函数（路径支路 getVal / 表达式支路 with(state) 求值） */
    private _read!: () => any;
    /** 未注册名的合成透传 descriptor 缓存（按名复用，ADR-0038 决策 4；随实例生死） */
    private _synthetics: Map<string, ActionDesc> = new Map();

    /** 元素挂载（dispatcher 检测到 add / 初始扫描）：解析配置 + 字面量/反应式分流 + 首渲 */
    override mounted(): void {
        this.config = this.parseConfig();
        // 字面量模式：裸 x-loading ≡ "true"、显式 "true"/"false" 为特殊布尔值（非状态路径）→ 静态显隐，无订阅
        const literal = this.resolveLiteral(this.config.value);
        if (literal !== null) {
            this.toggle(literal);
            return;
        }
        // 反应式模式：value 为全局 store 路径/表达式
        this._bindValue();
        this.toggle(!!this._read());
    }

    /**
     * 判定 value 是否为字面量布尔。
     *
     * - 空（裸 `x-loading` / 未指定 value）≡ `true`：符合"加了就显示"的直觉；
     * - `true` / `false`（大小写不敏感）为特殊布尔字面量，**非**状态路径——便于静态快速控制显隐；
     * - 其余返回 null → 走反应式（`engine.store` 全局路径/表达式）。
     *
     * @returns true/false 表示字面量静态显隐；null 表示走反应式订阅
     */
    private resolveLiteral(value: string): boolean | null {
        const v = (value ?? "").trim();
        if (v === "") return true; // 裸属性 / 缺省 ≡ true
        const lv = v.toLowerCase();
        if (lv === "true") return true;
        if (lv === "false") return false;
        return null;
    }

    /** 元素移除（dispatcher 检测到 remove）：清理订阅 / 定时器 / 覆盖层 DOM */
    override unmounted(): void {
        this._teardown();
    }

    /**
     * 属性值变化（dispatcher 检测到 setAttribute）：细粒度 patch，不重编译块（ADR-0021 决策 12-(d)）。
     *
     * 解析新 config 后：
     * - **视觉字段**（message/color/bgColor/opacity）→ `Object.assign` 进块 data，块内绑定经
     *   响应式字段级细粒度更新；同时重算壳样式（bg/opacity 既是 data 值、又是 overlay 背景）写回块根；
     * - **value** → 重判显隐（show/hide），delay 重置定时器；
     * - **selector** → 变化需移位，重建 overlay（块随之重编译重注入）。
     *
     * 仅当 selector 变化（须移位）或覆盖层尚未挂载时走重建；否则走细粒度 patch，保留已编译块。
     */
    /**
     * 属性值变化（dispatcher 检测到 setAttribute）：重建 overlay（ADR-0021 决策 12-d）。
     *
     * 解析新 config 后整体 teardown + remount：块随新 config 重新编译、data 重新注入、
     * 壳样式重算。**不细粒度 patch 既有块**——attrChanged 是编程式 setAttribute 的罕见路径，
     * 重建最简且正确（避免块已编译的 data/订阅与 dispatcher 时序耦合）。块内 message/color
     * 等随新 config 重新编译即取新值。
     */
    attrChanged(newVal: string, _oldVal?: string): void {
        this.value = newVal;
        if (this.info) this.info.value = newVal;
        this.config = this.parseConfig();
        this._teardown();
        // 字面量模式：裸/true/false 静态显隐，无订阅
        const literal = this.resolveLiteral(this.config.value);
        if (literal !== null) {
            this.toggle(literal);
            return;
        }
        this._bindValue();
        this.toggle(!!this._read());
    }

    /**
     * 建立 value 订阅（engine.store 全局，无 scope）。
     *
     * - 路径支路（isSimpleStatePath）→ `store.watch(path)` 精准订阅，`getVal` 读当前值；
     * - 表达式支路（如 `a && !b`）→ `collectDependencies` 收集读依赖后订阅（仅全局 state，
     *   不支持 scope 局部变量）。回调经 toggle 显隐。
     */
    private _bindValue(): void {
        const store = this.engine.store;
        const expr = this.config.value;
        const onChange = () => this.toggle(!!this._read());
        if (isSimpleStatePath(expr)) {
            this._read = () => getVal(store.state, expr);
            this.watchers.push(store.watch(expr, onChange));
        } else {
            const getter = new Function("scope", `with(scope){ return (${expr}); }`) as (scope: any) => any;
            this._read = () => {
                try {
                    return getter(store.state);
                } catch (e: any) {
                    this.warn(`x-loading: eval "${expr}" failed: ${e?.message ?? e}`);
                    return undefined;
                }
            };
            const deps = store.collectDependencies(() => {
                this._read();
            }, "read");
            this.watchers.push(store.watch(deps, onChange));
        }
    }

    /** 清理本实例全部资源：off watcher + 清 delay 定时器 + 销毁块 scope + 移除覆盖层 DOM */
    private _teardown(): void {
        for (const w of this.watchers) {
            try {
                (w as Watcher).off?.();
            } catch {
                /* 忽略已 off 的 watcher */
            }
        }
        this.watchers.length = 0;
        if (this.delayTimer) {
            clearTimeout(this.delayTimer);
            this.delayTimer = null;
        }
        if (this.blockScope) {             // 销毁块 scope（off 块内 watcher）+ 回收其私有响应式域 $scopes[id]
            const id = this.blockScope.id;
            this.blockScope.destroy();
            const scopes = (this.engine.store.state as Record<string, any>)[SCOPES_KEY] as
                | Record<string, any>
                | undefined;
            if (scopes) delete scopes[id];
            this.blockScope = null;
        }
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }

    /**
     * 解析指令值：对象语法 → 配置绑定；否则 → 快速绑定（整值即 value）。
     *
     * 指令选项层（`x-loading-options`，ADR-0007 解析期合并进 `this.options`）承载**视觉字段**
     * 补充配置（message/color/bgColor/opacity/delay/selector）——异步源指令（x-data/x-html）
     * 合成的 `loading:{...}` 选项经此接线生效（ADR-0033/0035）。合并方向：属性值**内联声明
     * 优先**（`x-loading="{value,...}"` 是主语义，`-options` 是补充层，不覆盖主声明）。
     */
    private parseConfig(): LoadingConfig {
        const raw = String(this.value ?? "").trim();
        const inline: LoadingConfig = raw.startsWith("{") ? this.parseObject(raw) : { value: raw };
        const opt = this.options;
        if (!opt || typeof opt !== "object") return inline;
        for (const key of ["message", "bgColor", "color", "opacity", "delay", "selector", "actions"] as const) {
            const v = (opt as Record<string, any>)[key];
            if (v !== undefined && (inline as Record<string, any>)[key] === undefined) {
                (inline as Record<string, any>)[key] = v;
            }
        }
        return inline;
    }

    /** 解析对象配置（relaxedToJson）；非对象/抛错 → warn + 空 value */
    private parseObject(raw: string): LoadingConfig {
        try {
            const parsed: unknown = JSON.parse(relaxedToJson(raw));
            if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
                this.warn(`x-loading: 对象配置必须解析为对象，得到 ${JSON.stringify(parsed)}`);
                return { value: "" };
            }
            const obj = parsed as Record<string, any>;
            // 旧键 visible 已更名为 value：warn 提示迁移、忽略不生效（缺失 value ≡ 裸属性恒显示）
            if (obj.visible !== undefined) {
                this.warn(`x-loading: 配置键 "visible" 已更名为 "value"，该键被忽略`);
            }
            return {
                value: typeof obj.value === "string" ? obj.value : "",
                message: typeof obj.message === "string" ? obj.message : undefined,
                bgColor: typeof obj.bgColor === "string" ? obj.bgColor : undefined,
                color: typeof obj.color === "string" ? obj.color : undefined,
                opacity: typeof obj.opacity === "number" ? obj.opacity : undefined,
                delay: typeof obj.delay === "number" ? obj.delay : undefined,
                selector: typeof obj.selector === "string" ? obj.selector : undefined,
                actions: this._parseActionNames(obj.actions),
            };
        } catch (e: any) {
            this.warn(`x-loading: 对象配置解析失败: ${e?.message ?? e}`);
            return { value: "" };
        }
    }

    /** 显隐总入口 */
    private toggle(show: boolean): void {
        if (show) this.show();
        else this.hide();
    }

    /**
     * 显示覆盖层。
     *
     * 已挂载（overlay 非空）或延迟窗口期内（delayTimer 非空）直接返回，防重复。
     * delay>0 时 setTimeout 延迟挂载；否则立即挂载。
     */
    private show(): void {
        if (this.overlay || this.delayTimer) return;
        const delay = this.config.delay ?? DEFAULTS.delay;
        if (delay > 0) {
            this.delayTimer = setTimeout(() => {
                this.delayTimer = null;
                this.mountOverlay();
            }, delay);
            return;
        }
        this.mountOverlay();
    }

    /**
     * 隐藏：取消未触发的延迟挂载；移除已挂载的覆盖层（含块 scope 回收）。
     *
     * delay 窗口内回 false → 定时器取消、覆盖层从未挂载（防闪烁）。已挂载则销毁块 scope +
     * 移除覆盖层 DOM（重建式显隐，非 display 隐藏——与既有语义一致）。
     */
    private hide(): void {
        if (this.delayTimer) {
            clearTimeout(this.delayTimer);
            this.delayTimer = null;
        }
        if (this.blockScope) {
            const id = this.blockScope.id;
            this.blockScope.destroy();
            const scopes = (this.engine.store.state as Record<string, any>)[SCOPES_KEY] as
                | Record<string, any>
                | undefined;
            if (scopes) delete scopes[id];
            this.blockScope = null;
        }
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }

    /**
     * 构建并挂载覆盖层（= 编译后的组件根）到目标元素（ADR-0022 承接 ADR-0021 决策 12）。
     *
     * 渲染统一走「编译组件」路径：取组件 = `getComponent('loading') ?? DEFAULT_BLOCK`，深克隆 → 经 compileChild
     * 编译挂载（parentScope 为宿主 scope 使组件继承宿主数据上下文；**config 经 compileChild 第 5 参      * initialData 在 compile 前注入 data**，确保组件内 watch 首次求值即收集到 `$scopes.<id>.<field>`
     * 精准路径，后续 attrChanged 可字段级细粒度更新）→ 注入壳样式到组件根 → 挂到 target。
     */
    private mountOverlay(): void {
        if (this.overlay) return;
        const target = this.resolveTarget();
        if (!target) return;

        // 取组件快照：自定义 loading 组件（沿宿主 scope 链就近 + 全局兜底），未命中用 DEFAULT_BLOCK
        const snapshot = this._resolveLoadingComponent();
        const clone = snapshot.cloneNode(true) as HTMLElement;

        // config 视图：七字段，作为块根 data 在 compile 前注入（响应式，块内 x-text="message" 取用）
        const initialData = this._configData();
        // 编译块：parentScope = 宿主 scope（继承宿主数据上下文）；宿主无 scope（动态插入等）传 null
        // —— compileChild 支持空 parentScope，块 scope 独立、仅靠 initialData 的 data 提供上下文
        const parentScope = this.engine.findScopeByEl(this.el!) ?? null;
        const compiled = this.engine.compiler.compileChild(
            clone,
            parentScope,
            {},
            undefined,
            initialData,
        );
        const overlay = compiled.el;
        this.blockScope = compiled.scope;

        // 块根即 overlay 壳：注入壳样式（定位/背景/zindex/screen），追加在块作者声明样式之后
        this._applyShellStyle(overlay);

        target.appendChild(overlay);
        this.overlay = overlay;

        // 动作按钮点击委托（ADR-0038 决策 3）：块内 [data-action] 元素点击触发对应 action。
        // 监听器挂在 overlay 元素上，随元素生死（hide/teardown 移除元素即回收，无需显式解绑）。
        overlay.addEventListener("click", (e) => this._onOverlayClick(e, compiled.scope));
    }

    /**
     * 解析 loading 块快照：自定义块优先（宿主 scope 链 + 全局兜底），未命中回退 DEFAULT_BLOCK。
     *
     * DEFAULT_BLOCK 是字符串模板，每次解析为新的根元素（无缓存需求——仅作兜底，自定义组件才走
     * engine 全局缓存）。返回的快照形态与自定义组件一致（含 x-define、未编译、保留指令属性）。
     */
    private _resolveLoadingComponent(): HTMLElement {
        if (this.el) {
            const custom = this.engine.getComponent(this.el, "loading");
            if (custom) return custom;
        }
        // DEFAULT_BLOCK 字符串 → 解析取单根元素（parseHtmlFragment 已 trim，单顶级元素）
        const frag = parseHtmlFragment(DEFAULT_BLOCK);
        const root = (frag?.firstElementChild as HTMLElement | null) ?? null;
        if (root) return root;
        // 兜底（DEFAULT_BLOCK 解析失败，理论上不可达）：建空 overlay 防 NPE
        const fallback = document.createElement("div");
        fallback.className = OVERLAY_CLASS;
        return fallback;
    }

    /**
     * 注入覆盖层壳样式到块根（决策 12-(b)）：定位/铺满/背景/zindex/screen。
     *
     * 追加在块作者声明样式之后（覆盖定位冲突）。「覆盖层」语义由指令保证，块作者只管装内容。
     * screen 修饰符 → position:fixed 撑满视口；否则 position:absolute 撑满宿主（须宿主定位）。
     */
    private _applyShellStyle(overlay: HTMLElement): void {
        const bgColor = this.config.bgColor ?? DEFAULTS.bgColor;
        const opacity = this.config.opacity ?? DEFAULTS.opacity;
        const screen = this.modifiers?.includes("screen");
        overlay.style.position = screen ? "fixed" : "absolute";
        overlay.style.inset = "0";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.zIndex = String(DEFAULTS.zIndex);
        // 遮罩底色 + alpha：映射为 bgColor 的 alpha 通道（非元素 opacity，保证 loader/文字清晰）
        overlay.style.background = rgba(bgColor, opacity);
    }

    /**
     * 构造注入块 data 的 config 视图（八字段：原七字段 + actions，决策 12-(c) Q7 / ADR-0038 决策 2）。
     *
     * `value` 是表达式串（如 `"order.isSubmit"`）——块内若 x-if="value" 期待布尔会拿到字符串，
     * 属已知脚枪（value 是宿主显隐逻辑，控制 overlay 挂载与否，非块内消费字段），文档已标注。
     * `actions` 为挂载时解析的动作按钮视图 `[{name, title}]`（见 {@link _actionsData}）。
     */
    private _configData(): Record<string, any> {
        return {
            value: this.config.value,
            message: this.config.message ?? "",
            bgColor: this.config.bgColor ?? DEFAULTS.bgColor,
            color: this.config.color ?? DEFAULTS.color,
            opacity: this.config.opacity ?? DEFAULTS.opacity,
            delay: this.config.delay ?? DEFAULTS.delay,
            selector: this.config.selector ?? "",
            actions: this._actionsData(),
        };
    }

    /**
     * 解析动作按钮数据视图：`[{name, title}]`（ADR-0038 决策 2）。
     *
     * 挂载时经 getAction 链解析 `title = ActionDesc.title ?? name`（内置 close 自带「关闭」，
     * 后注册的显示 name 兜底——快照语义、不做响应式追踪，attrChanged 重建时重新解析）。
     * 查找基准与 parentScope 同源（宿主 scope 链；宿主无 scope 时直接查全局表）。
     */
    private _actionsData(): Array<{ name: string; title: string }> {
        const names = this.config.actions ?? [];
        const scope = this.el ? this.engine.findScopeByEl(this.el) : null;
        return names.map((name) => ({
            name,
            title: (scope?.getAction(name) ?? this.engine.actions[name])?.title ?? name,
        }));
    }

    /**
     * 校验 actions 配置字段：须为字符串数组（ADR-0038 决策 1）。
     *
     * 非数组 / 缺失 → undefined（无按钮行）；数组内非（非空）字符串元素 warn 剪枝。
     */
    private _parseActionNames(raw: unknown): string[] | undefined {
        if (raw === undefined || raw === null) return undefined;
        if (!Array.isArray(raw)) {
            this.warn(`x-loading: 配置键 "actions" 须为字符串数组，已忽略`);
            return undefined;
        }
        return raw.filter((v) => {
            const ok = typeof v === "string" && v.trim() !== "";
            if (!ok) {
                this.warn(
                    `x-loading: actions 数组元素须为非空字符串，已剪枝: ${JSON.stringify(v)}`,
                );
            }
            return ok;
        });
    }

    /**
     * 取未注册名的合成透传 descriptor（ADR-0038 决策 4，与 ADR-0036 决策 7 内置信号型同构）：
     * `{name, title: name, handle: (p) => p}` 经 buildAction 包装（local=false → 总线 + DOM 双发），
     * 按名缓存复用。让未注册名同样走完整双通道广播——pending+resolved 同 tick、无 rejected。
     */
    private _syntheticAction(name: string): ActionDesc {
        let desc = this._synthetics.get(name);
        if (!desc) {
            desc = buildAction((type, payload) => this.engine.emit(type as any, payload), {
                handle: (payload?: any) => payload,
                name,
            });
            this._synthetics.set(name, desc);
        }
        return desc;
    }

    /**
     * 覆盖层级 click 委托（ADR-0038 决策 3）：块内任意 `data-action="<name>"` 元素点击即触发。
     *
     * 逐次现查（与 x-on「查找延迟到触发时」同哲学）：已注册走真 action（getAction 链——块
     * scope 的 parent 是宿主 scope，局部/全局 action 均可达），未注册走合成透传 descriptor，
     * 均以标准 AutoSparkActionContext（el=被点元素）调用 → buildAction 双通道广播。
     * 随后按 hide 约定键（决策 5，点击时现读 `desc.hide !== false`）自动隐藏（决策 6：
     * **先完整广播再移除**——监听方同步跑完；async 到 pending 即隐藏不等待 resolved）。
     */
    private _onOverlayClick(event: Event, scope: AutoSparkScope): void {
        const target = (event.target as HTMLElement | null)?.closest?.("[data-action]") as
            | HTMLElement
            | null;
        if (!target || !this.overlay?.contains(target)) return;
        const name = target.getAttribute("data-action");
        if (!name) return;
        const desc = scope.getAction(name) ?? this._syntheticAction(name);
        const ctx: AutoSparkActionContext = {
            el: target,
            $event: event,
            data: scope.getContext(),
            scope,
            store: this.engine.store,
            globalState: this.engine.store.state,
            engine: this.engine,
            $options: {},
        };
        try {
            desc.handle.call(ctx);
        } catch {
            /* buildAction 已广播 rejected 并 rethrow；此处吞防委托监听器 uncaught（对齐 OnDirective finalHandler） */
        }
        if (desc.hide !== false) this.hide();
    }

    /**
     * 解析覆盖层挂载目标元素（经 {@link queryRelElement} 相对查询）。
     *
     * - 无 selector → 宿主元素 `this.el`；
     * - 其余按相对语法解析：普通选择器在宿主后代上查、`'../'` 父级爬升、`'/'` 全局、`'^'` closest；
     * - 未命中 / 非法选择器 → 回退宿主（命中失败不抛错、记 warn）。
     */
    private resolveTarget(): HTMLElement | null {
        const host = this.el;
        if (!host) return null;
        const sel = this.config.selector;
        if (!sel) return host;
        const found = queryRelElement(host, sel);
        return found instanceof HTMLElement ? found : host; // 未命中 / 非法 → 回退宿主
    }
}
