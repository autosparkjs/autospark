import { setVal } from "autostore";
import type { AutoSpark } from "../../engine";
import type { AutoSparkScope } from "../../scope";
import { isSimpleStatePath } from "../../scope";
import { relaxedToJson } from "../../utils/relaxedToJson";
import { MASK_CLASS, PANEL_CLASS } from "../../overlay/container";
import type { OverlayInstance } from "../../overlay/instance";
import { splitReservedKeys } from "../../overlay/types";
import { OverlayDirective } from "./overlay";

/**
 * x-dialog：覆盖物消费者的**模态形态**（ADR-0052 修订版，共识 4 薄子类）。
 *
 * 仅叠加模态形态于 {@link OverlayDirective} 基座之上：遮罩外壳（`autospark-dialog-mask`）、
 * `closeOnMask`、flex 居中默认；查找/防护/等待/props/配置链/scope 基准全部继承基座。
 * `x-drawer` / `x-popup` / `x-popover` 为未来同构薄子类（fast-follow）。
 *
 * **纯状态驱动**（决策 8）：宿主是纯声明点（无隐式点击），visible 绑定真值即开。
 * 值四形态：
 * - 简单路径 `x-dialog:login="ui.flag"`——watch，可写回（请求关闭回写 false）；
 * - 表达式 `x-dialog:pay="ui.step === 2"`——watch 只读；UI 关闭后依赖变化重求值仍真会重开
 *   （文档明示的已知边界，ADR-0052 决策 7）；
 * - 字面量 `x-dialog:login="true"`——挂载即开（公告类）；"false" 永不开；
 * - 对象形态 `x-dialog:login="{visible: 'ui.flag', closeOnMask: false, title: 'x'}"`
 *   ——relaxed-json；`visible` 为驱动保留键，`closeOnMask`/`animate`/`at`/`scope` 为
 *   配置保留键（合并链最顶层，共识 6），**其余键全部作 props** 注入组件 data 域（共识 7，
 *   `params` 键已删除）。
 *
 * 请求关闭写回（决策 7）：visible 为简单路径时，关闭触点（ESC/遮罩/close action）经落点解析
 * 回写 `false`（locals → x-data 响应式域 → 全局 state 依次落点）。
 */
/** 全局样式 <style> 的 id（首次 initialize 时注入一次，常驻不回收——多 engine 共享先例） */
const STYLES_ID = "autospark-dialog-styles";

/**
 * 注入 dialog 模态外壳默认样式（幂等）：
 * - 遮罩 fixed 全屏 + flex 居中（锚定模式下面板 position:fixed 脱离 flex 流，不受影响）；
 * - 面板相对定位（居中模式由 flex 承载）；z-index 走 CSS 变量（用户可全局调层）；
 * - 箭头**双伪元素**（载体由 floating-ui arrow middleware 定位，决策 24）：
 *   `::before` 带阴影菱形（8×8 旋转 45°，立体感）；`::after` 无阴影同色菱形**尺寸外扩 1px**
 *   （10×10，对角半径 ≈7.07px）并按最终 placement 朝面板内侧偏移 4px（= 阴影模糊半径）：
 *   内向覆盖 7.07+4 = 11.07px ≥ 阴影最远端 ≈10.66px（嵌入段阴影完整遮蔽），外向 7.07-4 =
 *   3.07px < 5.66px（完全藏在带阴影菱形轮廓内，箭头尖锐度不受影响）——露出段阴影保留
 *   （立体感）、嵌入段与面板同色融合。偏移方向经 `data-overlay-placement` 前缀选择器表达
 *   （placement 已由定位管线写回面板）。
 * - **`border: true`**（面板 1px 边框，`data-overlay-border` 标记；面板级配置，与锚定无关）：面板画 border，
 *   箭头双层**变色**融合——`::before` 变**边框色**（`--autospark-overlay-border`）、`::after`
 *   变**面板背景色**（`--autospark-overlay-bg`）并外扩至 12×12（对角半径 ≈8.49px）：外向
 *   8.49-4 = 4.49px，距带阴影菱形外尖 5.66px 留出 ≈1.17px **边框色斜带**（视觉 ≈1px，与
 *   面板 border 在两个交点连续）；内向 8.49+4 = 12.49px ≥ 10.66px（嵌入段边框色与阴影仍被
 *   完整盖掉，无 V 形残留）。
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
  background: var(--autospark-overlay-bg, #fff);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
  transform: rotate(45deg);
}
/* 无阴影覆盖层：尺寸外扩 1px（10×10，对角半径 ≈7.07px）+ 朝面板内侧偏移 4px（= 阴影模糊半径）——
   内向覆盖到 ≈11.07px ≥ 阴影最远端 ≈10.66px（嵌入段阴影完整遮蔽）；外向 ≈3.07px 不出带阴影
   菱形轮廓（5.66px），箭头尖锐度不受影响 */
.autospark-overlay-arrow::after {
  content: '';
  position: absolute;
  inset: -1px;
  background: var(--autospark-overlay-bg, #fff);
  transform: rotate(45deg);
}
/* config.border（默认 true）—— 外壳模式（Tippy 同构）：面板视觉（背景 + 边框 + 圆角）由
   panel 外壳统一承担，同色背景填平圆角微差（引擎无法预知用户的视觉面板是哪层 div，方角
   外壳包圆角内容必露缝）。箭头双层变色融合：::before 变边框色（露出段形成斜向边框带）、
   ::after 变面板背景色并外扩至 12×12（对角半径 ≈8.49px）：外向 8.49-4 = 4.49px，距带阴影
   菱形外尖 5.66px 留出 ≈1.17px 边框色斜带（视觉 ≈1px，与面板 border 在两个交点连续）；
   内向 8.49+4 = 12.49px ≥ 10.66px（嵌入段的边框色与阴影仍被完整盖掉，无 V 形残留）。
   颜色/圆角经 --autospark-overlay-border / --autospark-overlay-bg / --autospark-overlay-radius 定制。 */
.autospark-dialog {
  border-radius: var(--autospark-overlay-radius, 8px);
}
.autospark-dialog[data-overlay-border] {
  border: 1px solid var(--autospark-overlay-border, rgba(0, 0, 0, 0.1));
  background: var(--autospark-overlay-bg, #fff);
}
.autospark-dialog[data-overlay-border] > .autospark-overlay-arrow::before {
  background: var(--autospark-overlay-border, rgba(0, 0, 0, 0.1));
}
.autospark-dialog[data-overlay-border] > .autospark-overlay-arrow::after {
  inset: -2px;
}
/* 覆盖层偏移方向 = 面板内侧（嵌入段所在方向）。语义推导（防反向）：
   placement 'top' = 面板在锚点上方 → 箭头在面板底边 → 嵌入段是菱形上尖 → 覆盖层向上偏 -y；
   placement 'left' = 面板在锚点左侧 → 箭头在面板右边（朝右侧锚点）→ 嵌入段是菱形左尖 → 向 -x。 */
[data-overlay-placement^="top"] > .autospark-overlay-arrow::after {
  translate: 0 -4px;
}
[data-overlay-placement^="bottom"] > .autospark-overlay-arrow::after {
  translate: 0 4px;
}
[data-overlay-placement^="left"] > .autospark-overlay-arrow::after {
  translate: -4px 0;
}
[data-overlay-placement^="right"] > .autospark-overlay-arrow::after {
  translate: 4px 0;
}`;
    document.head.appendChild(style);
}

export class DialogDirective extends OverlayDirective {
    /** 类级初始化：注入模态外壳默认样式（幂等；FOUC 防御——先于任何实例打开） */
    static override initialize(_engine: AutoSpark): void {
        injectStyles();
    }

    /** 模态形态（共识 4）：遮罩外壳 + closeOnMask + 居中默认 */
    protected override get _modalMask(): boolean {
        return true;
    }

    /** 可写回的 visible 状态路径（简单路径形态才有；表达式/字面量 null） */
    private _visiblePath: string | null = null;
    /** visible 驱动表达式（非字面量形态） */
    private _visibleExpr: string | null = null;
    /** 值对象解析出的静态 props（非保留键，共识 7；每次打开注入） */
    private _props: Record<string, any> | undefined;

    override created(): void {
        const raw = String(this.value ?? "").trim();
        if (raw.startsWith("{")) {
            if (!this._parseObject(raw)) return;
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
            if (literal) {
                this._driveOn = true;
                this._open(this._props);
            }
            return;
        }
        // 反应式：可见性驱动（相对消费处 scope 求值，ADR-0052 决策 6）
        this._visiblePath =
            this._visibleExpr != null && isSimpleStatePath(this._visibleExpr)
                ? this._visibleExpr
                : null;
        const initial = this.binding.watch(this._visibleExpr!, ({ value }) =>
            this._toggle(!!value),
        );
        this._toggle(!!initial);
    }

    /** 消费者销毁：打开中的实例走请求关闭（写回 false）；等待中的 x-import 监听经 super 清理 */
    override destroy(): void {
        const inst = this._overlayInstance;
        this._overlayInstance = null;
        if (inst && !inst.destroyed && inst.visible) inst.requestClose("consumer-destroyed");
        super.destroy();
    }

    /** 模态形态的请求关闭写回（决策 7）：visible 为简单路径时回写 false（落点解析） */
    protected override _makeCloseRequest(): ((
        inst: OverlayInstance,
        source: string,
    ) => void) | null {
        return this._visiblePath ? () => this._writeVisible(false) : null;
    }

    // ── 内部 ──────────────────────────────────────────────────────────

    /** 可见性驱动总入口（状态归假 → 直接 close，不走写回——状态已是 false） */
    private _toggle(on: boolean): void {
        this._driveOn = on;
        if (on) {
            this._open(this._props);
        } else {
            this._close();
        }
    }

    /**
     * 对象形态解析（共识 6/7）：`visible` 驱动保留键（字符串状态路径，相对消费处 scope）；
     * `closeOnMask`/`animate`/`at`/`scope` 配置保留键 → `_inlineConfig`（合并链最顶层）；
     * **其余键全部作 props**（静态注入，每次打开传入）。解析失败返回 false（指令被忽略）。
     */
    private _parseObject(raw: string): boolean {
        let obj: Record<string, any>;
        try {
            const parsed: unknown = JSON.parse(relaxedToJson(raw));
            if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
                this.warn(`x-dialog:${this.attr}: 对象形态须解析为对象，指令被忽略`);
                return false;
            }
            obj = parsed as Record<string, any>;
        } catch (e: any) {
            this.warn(`x-dialog:${this.attr}: 对象形态解析失败: ${e?.message ?? e}`);
            return false;
        }
        // visible：驱动保留键，须为字符串状态路径（相对消费处 scope）
        if (typeof obj.visible === "string" && obj.visible.trim() !== "") {
            this._visibleExpr = obj.visible.trim();
            this._visiblePath = isSimpleStatePath(this._visibleExpr) ? this._visibleExpr : null;
            if (this._visiblePath === null) {
                this.warn(
                    `x-dialog:${this.attr}: 对象形态的 visible 须为简单状态路径字符串（如 "ui.flag"）——非路径表达式不可回写，仅按表达式只读驱动`,
                );
            }
        } else {
            this.warn(
                `x-dialog:${this.attr}: 对象形态缺少 visible（字符串状态路径），指令被忽略`,
            );
            return false;
        }
        // 保留配置键 → 合并链顶层；其余键 → props（封闭清单分流，共识 7）
        const { visible: _v, ...rest } = obj;
        const { config, props } = splitReservedKeys(rest);
        this._inlineConfig = config;
        this._props = props;
        return true;
    }

    /** 字面量判定：`true`/`false`（大小写不敏感）为静态布尔，其余 null 走反应式 */
    private _resolveLiteral(expr: string | null): boolean | null {
        const v = (expr ?? "").trim().toLowerCase();
        if (v === "true") return true;
        if (v === "false") return false;
        return null;
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
}
