/**
 * 共享折叠把手模块（ADR-0070 决策二）：圆形折叠把手的**元素构建 / 滑轨坐标解析 /
 * 箭头旋转矩阵 / 半圆折叠态视觉**的唯一实现——x-expandable（宿主内置 + reparent）
 * 与 x-drawer（覆盖物容器常驻 fixed）两个消费者共用。
 *
 * 消费边界：**定位应用、z-index 基准、生命周期宿主、显隐策略**由消费方自行承载
 * （expandable = CSS 两态定位 + hover 边条感应；drawer = JS fixed 定位 + 恒常驻），
 * 不进本模块。类名与 CSS 变量族 `--autospark-expandable-trigger-*` 即全引擎折叠
 * 把手的唯一契约（ADR-0070 breaking：`.autospark-drawer-trigger` 已删除）。
 */

/** 把手类名（全引擎折叠把手唯一契约） */
export const TRIGGER_CLASS = "autospark-expandable-trigger";

/** 把手直径 CSS 变量（半圆数学/钳制的公共基准；默认 20px） */
export const TRIGGER_SIZE_VAR = "--autospark-expandable-trigger-size";

export interface CollapseTriggerOptions {
    /** 初始收起方向（left/right/top/bottom）——把手自带 data-direction，箭头矩阵按它分派（随身属性，reparent 后仍生效） */
    direction: string;
    /** 点击 / Enter / Space 触发回调（键盘与点击同管线） */
    onActivate: () => void;
    /** 无障碍标签（默认「展开/折叠」） */
    label?: string;
}

/**
 * 构建折叠把手：`div.autospark-expandable-trigger[role=button][data-direction]` +
 * 内置全局图标 `arrow`（registry 模块加载时已注入 sprite；use 文档全局解析，用户同名
 * 覆盖自动跟随）。指针 down 做 stopPropagation（父级 preventDefault 会抑制合成 click，
 * splitter 先例）；键盘 Enter/Space 同管线。
 */
export function createCollapseTrigger(opts: CollapseTriggerOptions): HTMLElement {
    const trigger = document.createElement("div");
    trigger.className = TRIGGER_CLASS;
    trigger.setAttribute("role", "button");
    trigger.setAttribute("aria-label", opts.label ?? "展开/折叠");
    trigger.tabIndex = 0;
    trigger.setAttribute("data-direction", opts.direction);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", "#as-arrow");
    svg.appendChild(use);
    trigger.appendChild(svg);
    trigger.addEventListener("click", () => opts.onActivate());
    trigger.addEventListener("keydown", (ev) => {
        if (ev.key !== "Enter" && ev.key !== " ") return;
        ev.preventDefault();
        opts.onActivate();
    });
    return trigger;
}

export interface RailCoord {
    /** CSS 坐标值（无符号，如 "50%" / "32px"） */
    value: string;
    /** 负坐标 = 距对端（bottom/right 锚定） */
    negative: boolean;
}

/**
 * 滑轨坐标解析（边缘锚定模型，家族三态惯例）：`'center'`（默认）≡ `'50%'`；
 * `number` = px（负值距对端）；`string` = CSS 长度（负号 = 距对端）。
 * 非法返回 null（由消费方 warn 回退居中——消息文案属消费方语境）。
 */
export function parseRailCoord(raw: unknown): RailCoord | null {
    if (raw === true || raw == null || raw === "" || raw === "center") {
        return { value: "50%", negative: false };
    }
    if (typeof raw === "number") {
        if (!Number.isFinite(raw)) return null;
        return { value: `${Math.abs(raw)}px`, negative: raw < 0 };
    }
    if (typeof raw === "string") {
        const s = raw.trim();
        if (s === "center") return { value: "50%", negative: false };
        const m = /^(-?[\d.]+)\s*(%|px|rem|em|vw|vh)?$/i.exec(s);
        if (!m) return null;
        return {
            value: `${m[1]!.replace("-", "")}${m[2]?.toLowerCase() ?? "px"}`,
            negative: m[1]!.startsWith("-"),
        };
    }
    return null;
}

/**
 * 共享把手样式（基座视觉 + 箭头矩阵 + 半圆折叠态）：
 * - 基座**不含显隐策略**（opacity 归消费方——expandable hover 边条感应 / drawer 恒常驻）
 *   与**不含定位规则**（expandable = CSS 两态 + reparent；drawer = JS fixed inline）；
 * - 箭头矩阵按把手自带 `data-direction` × `data-collapsed` 分派（属性随身——reparent /
 *   容器迁移后仍生效），基箭头指右、指向「下一步动作」方向；
 * - **半圆折叠态**按把手自带 `data-half`（消费方在「圆心骑边线只显内半圆」形态挂——
 *   expandable 滑出折叠 / drawer 折叠态；minSize>0 收缩折叠全圆不挂）：图标缩至 0.8 倍
 *   并平移 1/5 圆径移入半圆中心（translate 前置于 rotate——视觉坐标平移，不随旋转载向）。
 */
export const SHARED_TRIGGER_CSS = `
.${TRIGGER_CLASS}{position:absolute;z-index:5;width:var(--autospark-expandable-trigger-size,20px);height:var(--autospark-expandable-trigger-size,20px);border-radius:50%;border:1px solid var(--autospark-expandable-trigger-border,#cbd5e1);background:var(--autospark-expandable-trigger-bg,#fff);box-shadow:0 1px 3px rgba(0,0,0,.1);cursor:pointer;display:flex;align-items:center;justify-content:center;user-select:none;-webkit-user-select:none;transition:border-color .15s,background .15s,opacity .15s;color:var(--autospark-expandable-trigger-fg,#64748b);}
.${TRIGGER_CLASS}>svg{width:var(--autospark-expandable-trigger-icon-size,12px);height:var(--autospark-expandable-trigger-icon-size,12px);stroke-width:1.5;transition:transform .15s,width .15s,height .15s;}
.${TRIGGER_CLASS}:hover{border-color:var(--autospark-expandable-trigger-border-hover,#94a3b8);background:var(--autospark-expandable-trigger-bg-hover,#f8fafc);}
/* 滑轨定位基建：圆心半径变量（半圆数学/钳制表达式公共基准） */
.${TRIGGER_CLASS}{--as-pos-half:calc(var(--autospark-expandable-trigger-size,20px)/2);}
/* 箭头旋转矩阵（展开态指向收起方向） */
.${TRIGGER_CLASS}[data-direction="left"]>svg{transform:rotate(180deg);}
.${TRIGGER_CLASS}[data-direction="right"]>svg{transform:rotate(0deg);}
.${TRIGGER_CLASS}[data-direction="top"]>svg{transform:rotate(-90deg);}
.${TRIGGER_CLASS}[data-direction="bottom"]>svg{transform:rotate(90deg);}
/* 折叠态通用（全圆形态，minSize>0 收缩折叠）：仅翻转箭头指向「重开方向」 */
.${TRIGGER_CLASS}[data-collapsed][data-direction="left"]>svg{transform:rotate(0deg);}
.${TRIGGER_CLASS}[data-collapsed][data-direction="right"]>svg{transform:rotate(180deg);}
.${TRIGGER_CLASS}[data-collapsed][data-direction="top"]>svg{transform:rotate(90deg);}
.${TRIGGER_CLASS}[data-collapsed][data-direction="bottom"]>svg{transform:rotate(-90deg);}
/* 半圆折叠态（data-half）：图标缩至 0.8 倍并平移 1/5 圆径移入半圆中心 */
.${TRIGGER_CLASS}[data-half]>svg{width:calc(var(--autospark-expandable-trigger-icon-size,12px)*0.8);height:calc(var(--autospark-expandable-trigger-icon-size,12px)*0.8);}
.${TRIGGER_CLASS}[data-half][data-direction="left"]>svg{transform:translateX(calc(var(--autospark-expandable-trigger-size,20px)/5)) rotate(0deg);}
.${TRIGGER_CLASS}[data-half][data-direction="right"]>svg{transform:translateX(calc(var(--autospark-expandable-trigger-size,20px)*-1/5)) rotate(180deg);}
.${TRIGGER_CLASS}[data-half][data-direction="top"]>svg{transform:translateY(calc(var(--autospark-expandable-trigger-size,20px)/5)) rotate(90deg);}
.${TRIGGER_CLASS}[data-half][data-direction="bottom"]>svg{transform:translateY(calc(var(--autospark-expandable-trigger-size,20px)*-1/5)) rotate(-90deg);}
`;

/** 共享把手样式注入（幂等；多 engine 共享、destroy 不移除——全局样式惯例） */
export function registerTriggerStyles(): void {
    if (document.getElementById("autospark-trigger-styles")) return;
    const style = document.createElement("style");
    style.id = "autospark-trigger-styles";
    style.textContent = SHARED_TRIGGER_CSS;
    document.head.appendChild(style);
}
