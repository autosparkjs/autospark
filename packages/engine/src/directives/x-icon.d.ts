import { AutoSparkDirectiveBase } from "../features/directive/base";
/**
 * x-icon：图标渲染指令（ADR-0058 symbol 机制，取代 ADR-0046/0047 的 mask 管线）。
 *
 * 宿主元素不变，注入唯一子节点 `<svg aria-hidden><use href="#as-…"/></svg>`（撑满宿主）。
 * 名字解析走**图标域**（scope 链就近 → 全局注册表兜底，与 getComponentDeclaration 同构）；**值两栖**
 * ——表达式求值优先，求值空/非法时原值形匹配才回退字面量（裸名不是合法 JS，状态命中优先、
 * 字面量为空值兜底），值为响应式表达式（切换即换图标）。**待定名**（已声明未到达）空占位；
 * 未命中 warn + 渲染**默认图标**（缺图不破相）；注册/远程到达/失败经变更总线按名唤醒重渲染。
 *
 * **颜色主权在宿主**：currentColor 经 CSS 继承直达 use 内容——`color` 选项内联 `color`
 * 覆盖（原 `background-color` 语义随 mask 下线，ADR-0058 决策 6）；`strokeWidth` 经
 * `--as-icon-sw` 变量（收集期已剥离全部 stroke-width，CSS 继承覆盖永远可靠）；`size` /
 * `padding` / `badge` / `button` / `pointer` 为盒模型层选项照旧（ADR-0049 不受影响）。
 */
export declare class IconDirective extends AutoSparkDirectiveBase {
    static readonly priority = 0;
    static readonly singleton = true;
    private destroyed;
    /** use 元素（created 期随载体 svg 一次性创建；SSR 无 document 为 null） */
    private useEl;
    /** 待定/未命中的请求名（变更总线按名唤醒重渲染） */
    private missName;
    /** 当前渲染名（registry delete 联动回退默认图标） */
    private activeName;
    /** 最近一次渲染值（全局配置变更广播时重渲染用） */
    private lastRaw;
    /** 变更总线退订句柄 */
    private offChange;
    created(): void;
    /** 求值结果 → 渲染值：空值时原值形匹配（图标名）则回退字面量，否则空占位 */
    private _valueOf;
    destroy(): void;
    /** 变更总线联动：待定/未命中名到达补渲染、使用中名被删回退默认图标、全局配置变更重渲染 */
    private _onIconChange;
    /** 渲染序：空值/待定 → 空 use（无 href）；就绪 → href；未命中 → warn + 默认图标 */
    private _render;
    /** 创建 use 渲染载体（宿主内唯一 `<svg><use/></svg>` 子节点；幂等） */
    private _ensureIconSvg;
    /** href 写/清（无 href 的 use 渲染为空——待定与空占位的天然姿态） */
    private _applyHref;
    /** 四级配置链读取：指令选项 > 宿主选项（ADR-0007 回退）> 全局默认（icons.options）> undefined（内置默认由各消费点自理） */
    private _opt;
    /** 生效默认 sw（全局配置层，「是否内联 --as-icon-sw」的判定基准） */
    private _defaultSw;
    /** 指令级 sw（含宿主回退）> 生效默认 */
    private _strokeWidth;
    /**
     * badge 选项归一化（标量三形态，**形态即启用**）：boolean true / number 板 padding
     * （→ px，须 ≥ 0 且有限，否则 warn + 按 true）/ string 板 padding（CSS 值直传，
     * 空串按布尔 true）。false / null / undefined 未启用；其他类型 warn 剪枝为未启用。
     * 返回 null = 未启用；pad null = 板 padding 走「显式 padding 选项 > 默认 0.3em」链
     * （badge 带值时压倒独立 padding 选项——badge 的值就是板 padding 的就近声明）。
     */
    private _badge;
    /** badge 无效值 warn（按 String(v) 去重） */
    private _warnBadge;
    /**
     * 选项静态样式（每次渲染重放，对称写/清——全局配置变更可回收旧值）：
     * size 默认 1em 走基础规则、padding 默认无、color 默认 currentColor（继承），均为显式声明才内联。
     * strokeWidth：与生效默认一致零内联（基础规则 `var(--as-icon-sw,1.25)` 兜底），非默认才
     * 内联变量覆盖。修饰：badge 挂修饰类（规则常驻基础样式表，标量三形态）；button 挂修饰类
     * （载体动效，ADR-0049——有板挂 wrapper 作用于板、无板挂宿主作用于图形，载体唯一不双挂）；
     * pointer 内联 cursor。读取走四级配置链（指令 > 宿主 > 全局 > 内置）。
     */
    private _applyStaticStyle;
    /**
     * badge 包裹层挂/拆（幂等）：badge 启用时为宿主包一层同类名 wrapper（wrapper 自身
     * 做淡色圆角板，图形子元素完整渲染不受板影响）；未启用时拆包还原。拆包用 `replaceWith`
     * 保留宿主位置；wrapper 随子树消亡（x-if detach 等以子树为单位）。
     */
    private _applyBadgeWrap;
}
