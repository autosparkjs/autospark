import { setVal } from "autostore";
import { AutoSparkDirectiveBase } from "../base";
import type { AutoSpark } from "../../engine";
import type { AutoSparkScope } from "../../scope";
import { isSimpleStatePath } from "../../scope";
import { relaxedToJson } from "../../utils/relaxedToJson";
import { OverlayInstance } from "../../overlay/instance";
import { acquireInstance, resolveOverlayConfig } from "../../overlay/handle";
import { MASK_CLASS, PANEL_CLASS } from "../../overlay/container";
import type { OverlayConfig, OverlayDef } from "../../overlay/types";

/**
 * x-dialog：覆盖层消费者（v1 唯一消费者，ADR-0052 决策 6–12）。
 *
 * **纯状态驱动**（决策 8）：宿主是纯声明点（无隐式点击），visible 绑定真值即开。
 * 值三形态：
 * - 简单路径 `x-dialog:login="ui.flag"`——watch，可写回（请求关闭回写 false）；
 * - 表达式 `x-dialog:pay="ui.step === 2"`——watch 只读；UI 关闭后依赖变化重求值仍真会重开
 *   （文档明示的已知边界，ADR-0052 决策 7）；
 * - 字面量 `x-dialog:login="true"`——挂载即开（公告类）；"false" 永不开。
 * - 对象形态 `x-dialog:login="{visible: 'ui.flag', params: {...}, closeOnMask: false}"`
 *   ——relaxed-json；`visible`/`params` 为保留键，**其余键并入配置合并链最顶层**
 *   （per-实例配置通道，决策 6）。params 支持对象字面量（静态）或字符串表达式
 *   （打开时对消费处 scope 求值快照，决策 9）。
 *
 * 查找（决策 5）：消费者沿 scope 链就近（`scope.getOverlay(name)`）→ engine 全局表兜底；
 * 未命中 warn + 不渲染；类型不匹配 warn 仍渲染（类型是文档契约非门槛，决策 3）。
 *
 * scope 基准（决策 11 三合一）：`declarer`（默认）实例 scope 挂声明处 scope（近永续）；
 * `consumer` 挂消费者 scope（消费者销毁 → 实例级联强拆）。
 *
 * 请求关闭写回（决策 7）：visible 为简单路径时，关闭触点（ESC/遮罩/close action/`close()`）
 * 经落点解析回写 `false`（locals → x-data 响应式域 → 全局 state 依次落点）。
 */
/** 全局样式 <style> 的 id（首次 initialize 时注入一次，常驻不回收——多 engine 共享先例） */
const STYLES_ID = "autospark-dialog-styles";

/**
 * 注入 dialog 外壳默认样式（幂等）：
 * - 遮罩 fixed 全屏 + flex 居中（锚定模式下面板 position:fixed 脱离 flex 流，不受影响）；
 * - 面板相对定位（居中模式由 flex 承载）；z-index 走 CSS 变量（用户可全局调层）；
 * - 箭头载体 + 伪元素视觉（8×8 旋转 45°，决策 24）——载体由 floating-ui arrow middleware 定位。
 */
function injectStyles(): void {
    if (typeof document === "undefined" || !document.head) return;
    if (document.getElementById(STYLES_ID)) return;
    const style = document.createElement("style");
    style.id = STYLES_ID;
    style.textContent = `
.${MASK_CLASS} {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--autospark-overlay-z, 1000);
}
.${PANEL_CLASS} {
  position: relative;
}
.autospark-overlay-arrow {
  position: absolute;
  width: 8px;
  height: 8px;
  pointer-events: none;
}
.autospark-overlay-arrow::before {
  content: '';
  position: absolute;
  inset: 0;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
  transform: rotate(45deg);
}`;
    document.head.appendChild(style);
}

export class DialogDirective extends AutoSparkDirectiveBase {
    /** 类级初始化：注入外壳默认样式（幂等；FOUC 防御——先于任何实例打开） */
    static override initialize(_engine: AutoSpark): void {
        injectStyles();
    }

    /** 当前打开/复用的实例（关闭即置 null？否——单例隐藏态须持有引用，destroy 时清理） */
    private _instance: OverlayInstance | null = null;
    /** 生效配置（首次打开时组装；字面量恒开也走此链） */
    private _config: OverlayConfig | null = null;
    /** 可写回的 visible 状态路径（简单路径形态才有；表达式/字面量 null） */
    private _visiblePath: string | null = null;
    /** visible 驱动表达式（非字面量形态） */
    private _visibleExpr: string | null = null;
    /** params 声明（对象字面量 | 字符串表达式 | null） */
    private _paramsSpec: Record<string, any> | string | null = null;
    /** 对象形态内联配置键（visible/params 之外的键，决策 6） */
    private _inlineConfig: Record<string, any> | null = null;
    /** 类型不匹配 warn 只发一次 */
    private _typeWarned = false;

    override created(): void {
        const raw = String(this.value ?? "").trim();
        if (raw.startsWith("{")) {
            this._parseObject(raw);
        } else {
            this._visibleExpr = raw;
        }
        // 字面量分流（对齐 x-loading resolveLiteral：裸属性恒开语义不适用——dialog 无 visible 即非法）
        const literal = this._resolveLiteral(this._visibleExpr);
        if (literal !== null) {
            if (this._visibleExpr === "") {
                this.warn(
                    `x-dialog:${this.attr}: 缺少 visible 绑定，恒不打开。请声明状态路径、表达式或对象形态（ADR-0052 决策 6）`,
                );
                return;
            }
            if (literal) this._open();
            return;
        }
        // 反应式：可见性驱动（相对消费处 scope 求值，ADR-0052 决策 6）
        this._visiblePath =
            this._visibleExpr != null && isSimpleStatePath(this._visibleExpr)
                ? this._visibleExpr
                : null;
        const initial = this.binding.watch(this._visibleExpr!, ({ value }) => this._toggle(!!value));
        this._toggle(!!initial);
    }

    /** 消费者销毁：打开中的实例走请求关闭（写回 false）；隐藏态单例保持保活、解除引用 */
    override destroy(_el: HTMLElement): void {
        const inst = this._instance;
        this._instance = null;
        if (!inst || inst.destroyed) return;
        if (inst.visible) inst.requestClose("consumer-destroyed");
    }

    // ── 内部 ──────────────────────────────────────────────────────────

    /** 对象形态解析：visible/params 保留键 + 其余键入配置合并链最顶层（决策 6/17） */
    private _parseObject(raw: string): void {
        let obj: Record<string, any>;
        try {
            const parsed: unknown = JSON.parse(relaxedToJson(raw));
            if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
                this.warn(`x-dialog:${this.attr}: 对象形态须解析为对象，指令被忽略`);
                return;
            }
            obj = parsed as Record<string, any>;
        } catch (e: any) {
            this.warn(`x-dialog:${this.attr}: 对象形态解析失败: ${e?.message ?? e}`);
            return;
        }
        // visible：保留键，须为字符串状态路径（相对消费处 scope）
        if (typeof obj.visible === "string" && obj.visible.trim() !== "") {
            this._visibleExpr = obj.visible.trim();
            this._visiblePath = isSimpleStatePath(this._visibleExpr) ? this._visibleExpr : null;
            if (this._visiblePath === null) {
                this.warn(
                    `x-dialog:${this.attr}: 对象形态的 visible 须为简单状态路径字符串（如 "ui.flag"），"非路径表达式不可回写，仅按表达式只读驱动`,
                );
            }
        } else {
            this.warn(`x-dialog:${this.attr}: 对象形态缺少 visible（字符串状态路径），指令被忽略`);
            return;
        }
        // params：保留键（对象字面量 | 字符串表达式，决策 9）
        if (obj.params !== undefined) this._paramsSpec = obj.params;
        // 其余键 → 值对象内联配置（合并链最顶层）
        const { visible: _v, params: _p, ...rest } = obj;
        if (Object.keys(rest).length > 0) this._inlineConfig = rest;
    }

    /** 字面量判定：`true`/`false`（大小写不敏感）为静态布尔，其余 null 走反应式 */
    private _resolveLiteral(expr: string | null): boolean | null {
        const v = (expr ?? "").trim().toLowerCase();
        if (v === "true") return true;
        if (v === "false") return false;
        return null;
    }

    /** 查找定义（scope 链就近 → engine 全局兜底）+ 类型校验（warn 仍渲染，决策 3） */
    private _resolveDef(): OverlayDef | null {
        const def = this.binding.getOverlay(this.attr!);
        if (!def) {
            this.warn(
                `x-dialog:${this.attr}: 未找到覆盖层定义（scope 链与全局均未命中），不渲染（ADR-0052 决策 5）`,
            );
            return null;
        }
        if (def.type && def.type !== "dialog" && !this._typeWarned) {
            this._typeWarned = true;
            this.warn(
                `x-dialog:${this.attr}: 覆盖层定义类型为 "${def.type}"（非 dialog），仍按 dialog 渲染（类型是文档契约，ADR-0052 决策 3）`,
            );
        }
        return def;
    }

    /** 可见性驱动总入口（状态归假 → 直接 close，不走写回——状态已是 false） */
    private _toggle(on: boolean): void {
        if (on) {
            this._open();
        } else if (this._instance && this._instance.visible) {
            this._instance.close();
        }
    }

    /** 打开（单例复用走 acquire；命令式/声明式同池，决策 18） */
    private _open(): void {
        const def = this._resolveDef();
        if (!def) return;
        if (!this._config) {
            this._config = resolveOverlayConfig(def, this.options ?? null, this._inlineConfig);
        }
        const declarerAlive = !def.owner.destroyed;
        const parentScope =
            this._config.scope === "consumer"
                ? this.binding
                : declarerAlive
                  ? def.owner
                  : null; // 声明处已销毁（防御）：降级 rootless（仅全局视图）
        const inst = acquireInstance(this.engine, def, this._config, {
            parentScope,
            searchRoot: this.el ?? null,
        });
        this._instance = inst;
        inst.onCloseRequest = this._visiblePath ? this._makeCloseRequest() : null;
        inst.open(this._resolveParams());
    }

    /** 「请求关闭」写回回调（决策 7）：visible 为简单路径时回写 false（落点解析） */
    private _makeCloseRequest(): (inst: OverlayInstance, source: string) => void {
        return () => this._writeVisible(false);
    }

    /**
     * visible 写回落点解析：沿 scope 链找首个持有首段键的容器（locals → x-data 响应式域），
     * 逐段深入直写（_data 写即响应式）；全链无局部落点 → `setVal` 写全局 state（x-model 同款快路径）。
     */
    private _writeVisible(value: boolean): void {
        const path = this._visiblePath!;
        const segs = path.split(this.engine.store.delimiter);
        let s: AutoSparkScope | null = this.binding;
        while (s) {
            const container =
                s.locals && segs[0]! in s.locals
                    ? s.locals
                    : s._data && segs[0]! in s._data
                      ? s._data
                      : null;
            if (container) {
                let obj: any = container;
                for (let i = 0; i < segs.length - 1; i++) {
                    obj = obj?.[segs[i]!];
                    if (obj == null) return; // 中途断裂：状态源不完整，放弃写回
                }
                obj[segs[segs.length - 1]!] = value;
                return;
            }
            s = s.parent;
        }
        try {
            setVal(this.engine.store.state, segs, value);
        } catch (e: any) {
            this.warn(`x-dialog:${this.attr}: visible 回写失败（"${path}"）: ${e?.message ?? e}`);
        }
    }

    /** params 解析（打开时快照，决策 9）：对象字面量浅拷贝；字符串表达式对消费处 scope 求值 */
    private _resolveParams(): Record<string, any> | undefined {
        const spec = this._paramsSpec;
        if (spec == null) return undefined;
        if (typeof spec === "string") {
            const result = this.binding.read(spec);
            if (result == null || typeof result !== "object" || Array.isArray(result)) {
                this.warn(
                    `x-dialog:${this.attr}: params 表达式 "${spec}" 求值结果须为对象，得到 ${typeof result}，params 被忽略`,
                );
                return undefined;
            }
            return result;
        }
        return { ...spec };
    }
}
