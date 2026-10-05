import { setVal } from "autostore";
import { AutoSparkDirectiveBase } from "../base";
import { isSimpleStatePath } from "../../scope";
import type { AutoSpark } from "../../engine";
import type { AutoSparkScope } from "../../scope";
import {
    createCollapseTrigger,
    parseRailCoord,
    registerTriggerStyles,
    SHARED_TRIGGER_CSS,
} from "./expandable-trigger";
import { resolveResizeConstraints, ResizeSession, type ResizeDirection } from "./resize";

/**
 * x-expandable：展开折叠（ADR-0069）——宿主元素的通用展开/折叠指令，值为**显式展开态布尔**
 * （true=展开）双向绑定；**全引擎折叠机制唯一实现**（ADR-0070 组合落定：x-splitter 面板
 * `data-expandable` 全机制组合、x-drawer 经共享把手模块统一把手层）。
 *
 * **值形态**（决策二）：简单路径（如 `ui.open`）双向——点击把手经 setVal 回写翻转
 * （x-model 防循环纪律：watcher 等值短路）；复杂表达式 warn 一次 + **只读降级**（点击
 * no-op，不本地假切换——UI 与状态背离是隐性 bug 源）；`true`/`false` 字面量（裸或引号）
 * 恒定态；空值 warn + 指令不作为。
 *
 * **direction = 收起方向**（决策三，停靠边）：`left`=向左收起（把手骑活动边=右边缘）、
 * 默认 `left`；top/bottom 走 height 轴。
 *
 * **折叠双通道由 minSize 分派**（决策四）：
 * - `minSize=0`（默认）= **滑出折叠**，宽度/高度**保持不改**，终态持续保持不归零：
 *   - `collapse:'margin'`（默认）：inline 负 margin 滑出（占位归零、兄弟流入、内容不挤压，
 *     与 splitter slide 通道同构）；需要父容器 `overflow:hidden` 裁剪（见「父容器注入」）。
 *   - `collapse:'slide'`：`translateX/Y(±100%)` 平移（占位不变，服务 fixed 覆盖形态）。
 * - `minSize>0` = 纯尺寸收缩（width/height 过渡至 minSize），子内容**不隐藏**。
 * 展开：maxSize 有值写 inline 尺寸、缺省**移除** inline 尺寸让 CSS 决定（不快照记忆）；
 * auto↔数值的展开/折叠动画经全局 `interpolate-size: allow-keywords` 渐进增强
 * （Chrome 129+/Safari 18.2+ 生效，不支持浏览器瞬跳——需要确定性动画显式声明 maxSize）。
 *
 * **渐变遮盖**（`fadeSize`，默认 0 不启用）：>0 时收缩折叠态在活动边显示渐隐层
 * （宿主 ::before，零 DOM），指示内容被截断（业界惯例）；显示判据 `data-shrunk`
 * （仅收缩折叠挂的宿主级标记，兼作页面 CSS 感知收缩态的通用钩子）。
 * 初始值 false：编译期挂终态、**无动画**（splitter「初始折叠不派发事件」惯例）；margin
 * 通道的滑出距离依赖布局测量，整体推迟到编译后微任务（x-resize 先例——元素挂载后执行）。
 *
 * **子内容隐藏**（决策五）：滑出折叠态经 `[data-collapsed] > :not(把手){visibility:hidden}`
 * 隐藏——**宿主自身不能 overflow:hidden**（宽度保持的盒子会把 absolute 把手一并裁掉）；
 * 编译后微任务检测宿主 overflow 非 visible（hidden/clip/auto/scroll 任一轴）warn 一次
 * （裁掉/滚走骑边把手防线，overflow 需求由内层包裹承载）。宿主 `data-collapsed` 仅滑出
 * 折叠挂（内容隐藏钩子），把手 `data-collapsed` 独立挂（箭头翻转，minSize>0 折叠也翻转
 * ——两处分离，splitter 先例）。
 *
 * **把手**（决策六 + ADR-0070 共享模块）：构建/箭头矩阵/半圆视觉在 expandable-trigger.ts
 * 唯一实现（20px 圆 + 全局图标 `arrow`、role=button、Enter/Space、指针 stopPropagation，
 * drawer 为第二消费者）；滑轨坐标 `pos` 三态（`'center'` 默认 ≡ `'50%'` / number=px /
 * CSS 长度串负值距对端，越界样式表钳制——把手是唯一重开触点）；`offset` 额外偏移
 * （固定轴语义：+ = 把手跨轴正方向右/下，负值反向——splitter 注入分隔条宽度一半
 * 使把手中分分隔条）。
 * **显隐策略**（`showTrigger`，默认 `'hover'`）：opacity 隐藏不丢命中；感应边条覆盖
 * 整条活动边线（pos 自定义后把手位置不可预知；启用内建 resize 时感应载体让位手柄带，
 * 见「内建单边 resize」——两者同骑一条边线）；常驻仅限滑出折叠（minSize=0——
 * 感应载体随宿主隐藏）与触屏，minSize>0 收缩折叠保持 hover 控制；Tab 聚焦显形；
 * `'always'` 恒常驻。
 * **动态挂载（reparent）**：展开态挂宿主骑活动边；滑出折叠**完成后**（transitionend /
 * 600ms 兜底）移入父容器贴停靠边内侧（宿主滑出后其内子元素随容器裁剪，把手外迁保常驻
 * 可达）；展开动画**启动前**移回宿主。两态定位全 CSS 化（`--as-pos` 变量 + 样式表
 * 钳制，splitter 手法）：展开态相对宿主（rail=活动边长）、折叠态相对父容器（rail=停靠
 * 边长）——同名变量两套规则，reparent 零 JS 测量（实施修订：较 ADR 草案的 rect 快照
 * 反算更简，happy-dom 无布局可测）。`minSize>0` 折叠**永不迁移**（宿主不滑出）。
 *
 * **父容器注入**（决策七）：margin 通道需要父容器裁剪滑出部分。默认
 * `injectOverflow:true` **折叠期间**由指令注入——折叠开始挂 `data-autospark-expandable-clip`
 * （overflow:hidden；父容器本为 hidden/clip 幂等跳过）+ `data-autospark-expandable-dock`
 * （position:relative，把手 reparent 的定位上下文，恒注入），**保持至展开动画完成后**
 * （属性驱动，用户 inline/类样式不受影响；多实例共享父容器 WeakMap 引用计数、最后一个
 * 展开完成才摘）；原值 `auto/scroll` 滚动条折叠期间暂失为已知副作用。`false` 显式禁用
 * 后回落检测：父容器 computed overflow 非 hidden/clip 时 warn 一次、用户自负。
 *
 * **内建单边 resize**（ADR-0072）：`resize` 选项启用单边调节（方向由折叠方向自动推导、
 * 复用 x-resize 的 ResizeSession 核心、拖出尺寸接管 `_maxDecl` 展开尺寸真相；同元素
 * x-resize 互斥自失效——边线交互单指令独占）。**把手与手柄同骑活动边线，两层协调**：
 * ① *把手压手柄之上*（宿主挂 `data-resize` → 样式表抬至 z11：手柄带 z10 全长覆盖边线，
 * 压住 z5 把手会让调节线横穿把手圆面、把手圆面区命中被拦 → hover 模式下把手不可见且
 * 折叠不可点）；② *手柄 hover 桥接显形*（`data-edge-hover` 统一契约，splitter/drawer
 * 同款）：感应边条 z4 被手柄带完全盖住收不到 hover，hover 模式的边线感应由手柄转译。
 *
 * **事件**（决策八）：`expandable:expand` / `expandable:collapse`（宿主派发、DOM 冒泡、
 * detail `{ size }`——展开为 maxSize 格式化值或 null，折叠为 0 或 minSize 格式化值）；
 * 初始应用不派发。
 *
 * **静态特性**（决策一）：Compile（编译期 createElement 注入把手——不在模板树、天然
 * 不被 walk，无需 ownsChildren）、priority 50（bind/on 同级）、singleton。
 */
export type ExpandableDirection = "left" | "right" | "top" | "bottom";
export type ExpandableMode = "margin" | "slide";

/** 方向合法值集 */
const DIRECTIONS: readonly ExpandableDirection[] = ["left", "right", "top", "bottom"];
/** 滑出通道合法值集 */
const MODES: readonly ExpandableMode[] = ["margin", "slide"];

/** 滑出折叠的 transform 位移（slide 通道，% 相对自身——无需布局测量） */
const SLIDE_TRANSFORMS: Record<ExpandableDirection, string> = {
    left: "translateX(-100%)",
    right: "translateX(100%)",
    top: "translateY(-100%)",
    bottom: "translateY(100%)",
};

/** 滑出折叠的负 margin 属性（margin 通道，按收起方向分派） */
const MARGIN_PROPS: Record<ExpandableDirection, string> = {
    left: "margin-left",
    right: "margin-right",
    top: "margin-top",
    bottom: "margin-bottom",
};

/**
 * 父容器注入引用计数（决策七）：父元素 → 活跃折叠实例数；归零摘除 dock/clip 属性
 * （多实例共享父容器时最后一个展开完成才恢复原值）。
 */
const dockCounts = new WeakMap<HTMLElement, number>();

/** 滑轨钳制表达式（把手圆心坐标钳到 [half, rail−half]，splitter 手法）：定义一次复用 */
const RAIL_CLAMP = "max(var(--as-pos-half),min(calc(100% - var(--as-pos-half)),var(--as-pos,50%)))";

// 全局样式（类级 initialize 注入，幂等；CSS 变量定制视觉，对齐 splitter 惯例）。
// 把手基座/箭头矩阵/半圆视觉在共享模块（ADR-0070，registerTriggerStyles 注入），
// 本文件只承载宿主级规则与显隐/定位策略
const EXPANDABLE_STYLE_ID = "autospark-expandable-styles";
const EXPANDABLE_CSS = `
${SHARED_TRIGGER_CSS}
/* 宿主：滑出折叠子内容隐藏（visibility 不触发子树 reflow，把手排除——宿主不可自身
   overflow:hidden：宽度保持的盒子会把把手一并裁掉，ADR-0069 决策五）。
   把手 absolute 定位上下文不在此强制（JS 微任务补——CSS 强写 position:relative 会覆盖
   fixed/absolute 宿主，而 fixed 覆盖形态恰是 slide 通道的目标场景） */
.autospark-expandable[data-collapsed]>:not(.autospark-expandable-trigger){visibility:hidden;}
/* 展开尺寸缺省（maxSize 不设）= 移除 inline 尺寸回落 auto——auto 与数值默认不可插值
   （瞬跳无动画）；allow-keywords 启用 auto↔数值过渡（Chrome 129+/Safari 18.2+，
   不支持浏览器渐进降级瞬跳、不劣化——需要确定性动画请显式声明 maxSize） */
.autospark-expandable{interpolate-size:allow-keywords;}
/* 折叠态翻转动画（决策四）：margin（滑出）/ width/height（收缩）/ transform（slide）统一时长 */
.autospark-expandable[data-animating]{transition:width var(--autospark-expandable-duration,.25s) ease,height var(--autospark-expandable-duration,.25s) ease,margin var(--autospark-expandable-duration,.25s) ease,transform var(--autospark-expandable-duration,.25s) ease;}
/* 把手显隐策略（opacity 归本指令——drawer 恒常驻不走此处，ADR-0070）：默认隐藏
   （opacity:0 不丢命中，可点可聚焦）；**常驻仅限滑出折叠**（minSize=0：宿主滑出后
   边条感应载体随宿主 visibility 隐藏，把手是唯一重开触点必须常驻）——两阶段选择器：
   动画期间把手尚在宿主内（宿主 data-collapsed 已挂）+ 终态 reparent 后（父容器 dock；
   多实例时仅命中 dock 直接子的折叠把手，展开态把手不受影响）。minSize>0 收缩折叠
   宿主可见、边条感应仍在——把手保持 hover 显隐控制（动画期间由 data-animating 规则
   保持显形）。触屏（hover:none）常驻、Tab 聚焦显形；always = 恒常驻（宿主级属性）。
   同规则承载滑轨钳制表达式变量（越界静默钳到 [half, rail−half]——把手是唯一重开触点） */
.autospark-expandable>.autospark-expandable-trigger,
[data-autospark-expandable-dock]>.autospark-expandable-trigger{--as-pos-clamp:${RAIL_CLAMP};opacity:0;}
/* 把手显隐策略（showTrigger，默认 hover）：opacity:0 不丢命中（可点可聚焦）；
   **常驻仅限滑出折叠**（minSize=0：宿主滑出后边条感应载体随宿主 visibility 隐藏，
   把手是唯一重开触点必须常驻）——两阶段选择器：动画期间把手尚在宿主内（宿主
   data-collapsed 已挂）+ 终态 reparent 后（父容器 dock；多实例时仅命中 dock 直接子的
   折叠把手，展开态把手不受影响）。minSize>0 收缩折叠宿主可见、边条感应仍在——
   把手保持 hover 显隐控制（动画期间由 data-animating 规则保持显形）。
   触屏（hover:none）常驻、Tab 聚焦显形；always = 恒常驻（宿主级属性） */
.autospark-expandable[data-collapsed]>.autospark-expandable-trigger[data-collapsed],
[data-autospark-expandable-dock]>.autospark-expandable-trigger[data-collapsed],
.autospark-expandable-trigger:focus-visible{opacity:1;}
.autospark-expandable[data-show-trigger="always"]>.autospark-expandable-trigger{opacity:1;}
.autospark-expandable[data-animating]>.autospark-expandable-trigger{opacity:1;}
/* 边线交互元素桥接显形（ADR-0070 修订 + ADR-0072 契约收敛）：活动边上存在另一交互
   元素（分隔条 / resize 手柄）时，元素 hover 即为感应事件——消费方置位把手 data-edge-hover
   属性显形（统一契约：splitter 分隔条桥接 / drawer 面板手柄桥接；**同元素**边线元素只有
   内建单边 resize 手柄一种，由本指令 _bridgeHandleHover 自行接线）；hover 模式下生效，
   always 模式无副作用（恒显） */
.autospark-expandable-trigger[data-edge-hover]{opacity:1;}
@media (hover: hover) {
  .autospark-expandable-trigger:hover{opacity:1;}
}
@media (hover: none) {
  .autospark-expandable-trigger{opacity:1;}
}
/* 感应边条（showTrigger:'hover'）：贴活动边线整条、厚 24px（跨边内外各 12px）——
   pos 自定义把手位置后不可预知，鼠标移到边线任何位置都应显形把手；hover 模式
   展开态启用（折叠态随宿主 data-collapsed 的 visibility 规则隐藏、触屏不启用）。
   边条遮挡边线附近内容的点击（hover 模式固有代价）。z-index 低于把手（把手区
   hover 直接命中把手本体） */
.autospark-expandable-edge{position:absolute;display:none;z-index:4;}
@media (hover: hover) {
  .autospark-expandable[data-show-trigger="hover"]>.autospark-expandable-edge{display:block;}
  .autospark-expandable-edge:hover~.autospark-expandable-trigger{opacity:1;}
}
.autospark-expandable[data-direction="left"]>.autospark-expandable-edge{right:-12px;top:0;bottom:0;width:24px;}
.autospark-expandable[data-direction="right"]>.autospark-expandable-edge{left:-12px;top:0;bottom:0;width:24px;}
.autospark-expandable[data-direction="top"]>.autospark-expandable-edge{bottom:-12px;left:0;right:0;height:24px;}
.autospark-expandable[data-direction="bottom"]>.autospark-expandable-edge{top:-12px;left:0;right:0;height:24px;}
/* 内建单边 resize 层级（ADR-0072 修订：把手压手柄之上）：把手与手柄**同骑活动边线**
   ——手柄带 z10 全长覆盖边线，z5 把手被压在下：调节线（2px）横穿把手圆面、把手圆面区
   命中被手柄拦走（hover 模式下把手又不可见 → 折叠不可点）。宿主挂 data-resize 时把把手
   抬至 z11 全量盖过调节线，调节线在把手 20px 之外照常拖拽（边线交互唯一入口的把手优先，
   与 drawer 让位语义的方向相反：drawer 的把手在覆盖物容器、层级封顶抬不动只能让位）。
   感应载体同步让位：边条（z4）被手柄带完全盖住收不到 hover，hover 模式「移到边线即见
   把手」改由手柄桥接承担（_bridgeHandleHover → data-edge-hover） */
.autospark-expandable[data-resize]>.autospark-expandable-trigger{z-index:11;}
/* 渐变遮盖（fadeSize>0，收缩折叠态）：贴活动边线的渐隐层，指示内容被截断（业界惯例）。
   宿主 ::before（零 DOM）；data-shrunk 仅收缩折叠挂（滑出折叠走 data-collapsed）——
   折叠态渐显、展开摘属性渐隐（复用 --autospark-expandable-duration）；pointer-events
   关闭不挡交互；z-index 低于边条(4)/把手(5)。厚度经 --as-fade-size（JS 写值 CSS 消费），
   颜色经 --autospark-expandable-fade-color 定制（默认 slate 半透明） */
.autospark-expandable[data-fade]::before{content:"";position:absolute;z-index:2;pointer-events:none;opacity:0;transition:opacity var(--autospark-expandable-duration,.25s) ease;}
.autospark-expandable[data-fade][data-direction="left"]::before{right:0;top:0;bottom:0;width:var(--as-fade-size,0px);background:linear-gradient(to left,var(--autospark-expandable-fade-color,white),transparent);}
.autospark-expandable[data-fade][data-direction="right"]::before{left:0;top:0;bottom:0;width:var(--as-fade-size,0px);background:linear-gradient(to right,var(--autospark-expandable-fade-color,white),transparent);}
.autospark-expandable[data-fade][data-direction="top"]::before{bottom:0;left:0;right:0;height:var(--as-fade-size,0px);background:linear-gradient(to top,var(--autospark-expandable-fade-color,white),transparent);}
.autospark-expandable[data-fade][data-direction="bottom"]::before{top:0;left:0;right:0;height:var(--as-fade-size,0px);background:linear-gradient(to bottom,var(--autospark-expandable-fade-color,white),transparent);}
.autospark-expandable[data-fade][data-shrunk]::before{opacity:1;}
/* 把手展开态定位（宿主内）：**圆心骑活动边线**（一半突出宿主外）+ 沿边滑轨
   （--as-pos 圆心坐标，负值距对端）——滑出全程圆心恒贴边线，reparent 零跳变。
   offset（--as-offset，固定轴语义）：把手沿边线法线的额外偏移，+ = 轴向正方向
   （left/right 方向 = 向右、top/bottom 方向 = 向下）——splitter 注入分隔条宽度
   一半使把手中分分隔条（首位 + / 次位 −），展开态与 dock 态跨轴属性方向相反
   （活动边翻边）故符号逐规则固定 */
.autospark-expandable[data-direction="left"]>.autospark-expandable-trigger{right:calc(-1*var(--as-pos-half) - var(--as-offset,0px));top:calc(var(--as-pos-clamp) - var(--as-pos-half));}
.autospark-expandable[data-direction="left"]>.autospark-expandable-trigger[data-pos-negative]{top:auto;bottom:calc(var(--as-pos-clamp) - var(--as-pos-half));}
.autospark-expandable[data-direction="right"]>.autospark-expandable-trigger{left:calc(-1*var(--as-pos-half) + var(--as-offset,0px));top:calc(var(--as-pos-clamp) - var(--as-pos-half));}
.autospark-expandable[data-direction="right"]>.autospark-expandable-trigger[data-pos-negative]{top:auto;bottom:calc(var(--as-pos-clamp) - var(--as-pos-half));}
.autospark-expandable[data-direction="top"]>.autospark-expandable-trigger{bottom:calc(-1*var(--as-pos-half) - var(--as-offset,0px));left:calc(var(--as-pos-clamp) - var(--as-pos-half));}
.autospark-expandable[data-direction="top"]>.autospark-expandable-trigger[data-pos-negative]{left:auto;right:calc(var(--as-pos-clamp) - var(--as-pos-half));}
.autospark-expandable[data-direction="bottom"]>.autospark-expandable-trigger{top:calc(-1*var(--as-pos-half) + var(--as-offset,0px));left:calc(var(--as-pos-clamp) - var(--as-pos-half));}
.autospark-expandable[data-direction="bottom"]>.autospark-expandable-trigger[data-pos-negative]{left:auto;right:calc(var(--as-pos-clamp) - var(--as-pos-half));}
/* 半圆折叠态（滑出折叠）由把手自带 data-half 承载（_applyExpanded 挂摘）——视觉规则
   在共享模块；minSize>0 收缩折叠不挂 data-half（全圆、图标不缩放不平移，只翻转指向） */
/* 把手折叠态定位（reparent 至父容器后）：**圆心骑停靠边线**——外一半被父容器
   overflow 裁掉呈半圆（drawer 把手折叠态形态）；rail=父容器边长；
   与展开态规则天然互斥（把手同一时刻只在一处），同名 --as-pos 变量复用 */
[data-autospark-expandable-dock]>.autospark-expandable-trigger[data-direction="left"]{left:calc(-1*var(--as-pos-half) + var(--as-offset,0px));top:calc(var(--as-pos-clamp) - var(--as-pos-half));}
[data-autospark-expandable-dock]>.autospark-expandable-trigger[data-direction="left"][data-pos-negative]{top:auto;bottom:calc(var(--as-pos-clamp) - var(--as-pos-half));}
[data-autospark-expandable-dock]>.autospark-expandable-trigger[data-direction="right"]{right:calc(-1*var(--as-pos-half) - var(--as-offset,0px));top:calc(var(--as-pos-clamp) - var(--as-pos-half));}
[data-autospark-expandable-dock]>.autospark-expandable-trigger[data-direction="right"][data-pos-negative]{top:auto;bottom:calc(var(--as-pos-clamp) - var(--as-pos-half));}
[data-autospark-expandable-dock]>.autospark-expandable-trigger[data-direction="top"]{top:calc(-1*var(--as-pos-half) + var(--as-offset,0px));left:calc(var(--as-pos-clamp) - var(--as-pos-half));}
[data-autospark-expandable-dock]>.autospark-expandable-trigger[data-direction="top"][data-pos-negative]{left:auto;right:calc(var(--as-pos-clamp) - var(--as-pos-half));}
[data-autospark-expandable-dock]>.autospark-expandable-trigger[data-direction="bottom"]{bottom:calc(-1*var(--as-pos-half) - var(--as-offset,0px));left:calc(var(--as-pos-clamp) - var(--as-pos-half));}
[data-autospark-expandable-dock]>.autospark-expandable-trigger[data-direction="bottom"][data-pos-negative]{left:auto;right:calc(var(--as-pos-clamp) - var(--as-pos-half));}
/* 父容器注入（决策七，折叠期间挂、展开完成摘）：dock=把手 reparent 定位上下文（恒注入）、
   clip=滑出溢出裁剪（injectOverflow 通道，父容器本为 hidden/clip 时不挂——幂等） */
[data-autospark-expandable-dock]{position:relative;}
[data-autospark-expandable-clip]{overflow:hidden;}
`;

/** 注入 x-expandable 全局样式（幂等；多 engine 共享、destroy 不移除——全局样式惯例） */
export function registerExpandableStyles(): void {
    if (document.getElementById(EXPANDABLE_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = EXPANDABLE_STYLE_ID;
    style.textContent = EXPANDABLE_CSS;
    document.head.appendChild(style);
}

/**
 * x-expandable 指令（ADR-0069）：Compile 类（priority 50、singleton、无 ownsChildren——
 * 把手 createElement 注入不在模板树，天然不被编译；宿主子树照常编译）。实现结构见类头注释。
 */
export class ExpandableDirective extends AutoSparkDirectiveBase {
    static override readonly priority = 50;
    static override readonly singleton = true;

    /** 类级初始化：注入全局样式（共享把手 + 本指令宿主级规则，均幂等） */
    static override initialize(_engine: AutoSpark): void {
        registerTriggerStyles();
        registerExpandableStyles();
    }

    // ── 配置（created 期静态读取，optionExprs 求值层已并入 getOption）────────

    /** 收起方向（停靠边），默认 left */
    private _dir: ExpandableDirection = "left";
    /** 把手显隐策略（showTrigger）：hover=边线感应显形（默认）；always=恒常驻 */
    private _showTrigger: "hover" | "always" = "hover";
    /** 滑出通道（仅 minSize=0 折叠生效），默认 margin */
    private _mode: ExpandableMode = "margin";
    /** maxSize 展开尺寸声明（null = 缺省：展开时移除 inline 尺寸、CSS 决定） */
    private _maxDecl: { value: number; unit: string } | null = null;
    /** minSize 折叠尺寸声明（null 或 ≤0 = 滑出折叠；>0 = 尺寸收缩） */
    private _minDecl: { value: number; unit: string } | null = null;
    /** 渐变遮盖厚度声明（null 或 ≤0 = 不启用；>0 = 收缩折叠态活动边渐隐遮盖） */
    private _fadeDecl: { value: number; unit: string } | null = null;
    /** 把手额外偏移（null = 未配置；非 "0px" 值写 --as-offset 供两态定位规则消费） */
    private _offsetCss: string | null = null;
    /** 折叠功能开关（enable 选项，默认 true）：false 时退化形态——不建把手、值绑定不订阅 */
    private _enable = true;
    /** 单边 resize 启用（resize 选项，默认关闭；修饰符 .resize 同效） */
    private _resizeOn = false;
    /** resize 透传约束（ResizeOptions 剥离 handles/aspectRatio 后的剩余键） */
    private _resizeOpts: Record<string, any> | null = null;
    /** 单边 resize 会话（复用 x-resize 的 ResizeSession 核心，ADR-0072） */
    private _resizeSession: ResizeSession | null = null;

    // ── 运行态 ──────────────────────────────────────────────────────────

    /** 当前展开态（UI 真相；watcher 等值短路的判据） */
    private _expanded = true;
    /** 双向回写路径（null = 字面量恒态或表达式只读降级——点击 no-op） */
    private _expandedPath: string | null = null;
    /** 值为空 → 指令不作为（不建把手） */
    private _dead = false;
    /** 表达式只读降级 warn 已发（一次） */
    private _warnedReadonly = false;
    /** injectOverflow=false 的父容器检测 warn 已发（一次） */
    private _warnedOverflow = false;
    /** 宿主 overflow 非 visible 的检测 warn 已发（一次） */
    private _warnedHostOverflow = false;
    /** 初始应用哨兵（初始态不派发事件） */
    private _initialized = false;
    /** 把手元素 */
    private _trigger: HTMLElement | null = null;
    /** 感应边条（showTrigger:'hover' 展开态整条边线感应，把手的前置兄弟） */
    private _edge: HTMLElement | null = null;
    /** 把手当前是否 reparent 在父容器（折叠滑出终态） */
    private _docked = false;
    /** 本指令写过主轴 inline 尺寸（maxSize/minSize 应用时置位——展开移除仅限自己写过的，
        用户模板自带 inline 尺寸不动） */
    private _ownSizeProp = false;
    /** 本实例已注入父容器（dock/clip 计数所有权） */
    private _injected = false;
    /** 动画摘除兜底计时器 */
    private _animTimer: ReturnType<typeof setTimeout> | null = null;
    /** 微任务初始应用前被销毁（快速 x-if 切换防护） */
    private _destroyed = false;

    // ── 生命周期 ──────────────────────────────────────────────────────

    // ── 组合通道（ADR-0070 决策三：宿主指令以内部布尔源驱动）──────────────

    /** 组合驱动器（null = 模板值绑定形态）：get 取初值；set 承接把手翻转（组合方仲裁尺寸写回后再驱动本指令） */
    private _driver: {
        get(): boolean;
        set(expanded: boolean): void;
        resized?(decl: { value: number; unit: string }): void;
    } | null = null;
    /** resize:* 事件派发目标（默认宿主；组合方可指定——drawer 用指令宿主保持监听位置） */
    private _eventTarget: HTMLElement | null = null;

    /**
     * 组合实例化（ADR-0070）：在 el 上以内部布尔源驱动本指令——**旁路模板值绑定**
     * （折叠布尔真相由组合方持有：把手点击经 driver.set 仲裁，组合方完成 lastSize
     * 记忆/状态写回后经 composeSet 驱动全管线）。生命周期由组合方顺序驱动
     * （created → compile → destroy；compile 的初始应用微任务与模板形态同一时机语义）。
     *
     * @param eventTarget resize:* 事件派发目标（可选，默认宿主 el——drawer 迁移用指令
     *                    宿主承接以保持 @resize:end 监听位置不变，ADR-0073）
     */
    static compose(
        engine: AutoSpark,
        binding: AutoSparkScope,
        el: HTMLElement,
        options: Record<string, any> | undefined,
        driver: {
            get(): boolean;
            set(expanded: boolean): void;
            /** resize 写回路由钩子（可选，ADR-0073）：内建单边 resize 应用后以拖出声明回调——组合方接管尺寸真相（splitter 同步 _curSize/lastSize/状态写回；drawer 记 _resizeMem） */
            resized?(decl: { value: number; unit: string }): void;
        },
        eventTarget?: HTMLElement,
    ): ExpandableDirective {
        const inst = new ExpandableDirective(engine, binding, {
            name: "expandable",
            attr: "x-expandable",
            value: "",
            options,
        } as any);
        inst.el = el; // 组合宿主（构造默认取 binding.el = 组合方宿主，须改指面板）
        inst._driver = driver;
        inst._eventTarget = eventTarget ?? el;
        return inst;
    }

    /** 组合面：外部翻转折叠态（真相变更 → 动画/事件/reparent 全管线；animate=false 服务拖拽会话瞬时） */
    composeSet(expanded: boolean, animate = true): void {
        if (this._destroyed) return;
        this._applyExpanded(expanded, animate);
    }

    /** 组合面：动态设置展开尺寸声明（splitter lastSize 恢复链专用；null = 缺省移除语义） */
    composeSetMaxSize(decl: { value: number; unit: string } | null): void {
        this._maxDecl = decl;
    }

    /** 组合面：边线交互元素 hover 桥接显形（splitter 分隔条 hover 桥接专用） */
    composeSetEdgeHover(on: boolean): void {
        this._trigger?.toggleAttribute("data-edge-hover", on);
    }

    /**
     * 组合面：收起方向变更（splitter 换轴重排）——清滑出痕迹（四向负 margin/transform，
     * 旧轴 inline 尺寸由组合方先行清理）后按当前态重应用终态。
     */
    composeSetDirection(dir: ExpandableDirection): void {
        if (this._destroyed || this._driver == null || dir === this._dir) return;
        for (const p of ["margin-left", "margin-right", "margin-top", "margin-bottom"]) {
            this.el.style.removeProperty(p);
        }
        this.el.style.removeProperty("transform");
        this._dir = dir;
        this.el.setAttribute("data-direction", dir);
        this._trigger?.setAttribute("data-direction", dir);
        this._applyExpanded(this._expanded, false);
    }

    override created(): void {
        // 选项成员表达式管道（pos 坐标可表达式化；热应用见 _onOptionExprChange）
        this._watchOptionExprs();
        this._readOptions();
        this._readEnableResize();
        if (this._dead) return;
        if (this._driver) {
            this._expanded = this._driver.get(); // 组合形态：初值由驱动器提供（旁路值绑定）
        } else if (this._enable) {
            this._setupValue();
        }
    }

    /**
     * enable / resize 选项（ADR-0072）：`enable: false` 关闭折叠功能（不建把手、值绑定
     * 不订阅——退化为 resize 壳）；`resize`（boolean | 对象，修饰符 `.resize` 同效）启用
     **单边调节**——方向 = 活动边法线自动推导，`handles`/`aspectRatio` 子键不适用
     * warn 忽略；双关 → warn + 指令完全不作为。
     */
    private _readEnableResize(): void {
        if (this.getOption("enable") === false) this._enable = false;
        const raw = this.getOption("resize");
        if (raw === true) {
            this._resizeOn = true;
        } else if (raw != null && typeof raw === "object") {
            this._resizeOn = true;
            if ("handles" in raw || "aspectRatio" in raw) {
                this.warn(
                    `x-expandable: resize 的 handles/aspectRatio 子键不适用于单边语义（方向由折叠方向自动推导），已忽略`,
                );
            }
            const { handles: _h, aspectRatio: _a, ...rest } = raw as Record<string, any>;
            this._resizeOpts = rest;
        } else if (raw != null && raw !== false && raw !== "") {
            this.warn(`x-expandable: resize 值须为 true/false 或选项对象，已忽略`);
        }
        if (!this._enable && !this._resizeOn) {
            this.warn(
                `x-expandable: enable 与 resize 均未启用，指令不作为（请至少启用其一或移除指令）`,
            );
            this._dead = true;
        }
    }

    override compile(): void {
        if (this._dead) return;
        // 宿主身份（退化态也保留：resize 手柄定位 CSS 按 data-direction 分派）
        this.el.classList.add("autospark-expandable");
        this.el.setAttribute("data-direction", this._dir);
        // 内建 resize 标记：样式表据此把把手抬到手柄之上（同一活动边线两层交互元素同宿主，
        // ADR-0072 修订）——手柄 z10 全长带会盖住 z5 把手，折叠不可点
        if (this._resizeOn) this.el.setAttribute("data-resize", "");
        if (this._enable) {
            // 渐变遮盖（fadeSize>0）：启用标记 + 厚度变量（JS 写值 CSS 消费，无布局测量）
            if (this._fadeDecl && this._fadeDecl.value > 0) {
                this.el.setAttribute("data-fade", "");
                this.el.style.setProperty("--as-fade-size", this._formatCss(this._fadeDecl));
            }
            this._buildTrigger();
            // 初始展开 + maxSize 有值：写 inline 展开尺寸（无布局依赖，编译期即可）
            if (this._expanded && this._maxDecl) {
                this.el.style[this._sizeProp as "width"] = this._formatCss(this._maxDecl);
                this._ownSizeProp = true;
            }
        }
        // 初始折叠：margin 通道的滑出距离与父容器检测依赖布局测量，推迟到编译后微任务
        // （x-resize 先例——元素挂载后执行；slide 通道 transform % 相对自身本可编译期写，
        //  统一走微任务保持路径单一）。无动画（splitter「初始折叠不派发事件」惯例）。
        // 同微任务补把手/手柄定位上下文：宿主 computed position 为 static 才 inline 补
        // relative（fixed/absolute 宿主不动——slide 通道的目标覆盖形态）。
        Promise.resolve().then(() => {
            if (this._destroyed) return;
            this._ensurePositionContext();
            if (this._enable) {
                this._warnHostOverflow();
                if (!this._expanded) {
                    this._applyExpanded(false, false);
                }
                this._initialized = true;
            }
        });
        if (this._resizeOn) this._setupResize();
    }

    override destroy(): void {
        this._destroyed = true;
        if (this._animTimer != null) {
            clearTimeout(this._animTimer);
            this._animTimer = null;
        }
        this._resizeSession?.destroy();
        this._resizeSession = null;
        this._releaseParentInjection();
        this._edge?.remove();
        this._edge = null;
        this._trigger?.remove();
        this._trigger = null;
    }

    /** 选项成员表达式热应用：pos 坐标 / offset 偏移变化即重定位把手（splitter collapsible 同款） */
    protected override _onOptionExprChange(key: string, _value: any): void {
        if (key === "pos" || key === "offset") this._positionTrigger();
    }

    // ── 配置读取 ──────────────────────────────────────────────────────

    /** direction / collapse / maxSize / minSize 静态读取（非法值 warn 回退默认） */
    private _readOptions(): void {
        const rawDir = this.getOption("direction");
        if (rawDir != null && rawDir !== "") {
            const v = typeof rawDir === "string" ? (rawDir.trim() as ExpandableDirection) : (null as any);
            if (typeof rawDir === "string" && DIRECTIONS.includes(v)) {
                this._dir = v;
            } else {
                this.warn(
                    `x-expandable: direction 值 "${rawDir}" 无效（left/right/top/bottom），已回退 left`,
                );
            }
        }
        const rawMode = this.getOption("collapse");
        if (rawMode != null && rawMode !== "") {
            if (rawMode === "slide" || rawMode === "margin") {
                this._mode = rawMode;
            } else {
                this.warn(`x-expandable: collapse 值 "${rawMode}" 无效（margin/slide），已回退 margin`);
            }
        }
        const rawVis = this.getOption("showTrigger");
        if (rawVis != null && rawVis !== "") {
            if (rawVis === "hover" || rawVis === "always") {
                this._showTrigger = rawVis;
            } else {
                this.warn(
                    `x-expandable: showTrigger 值 "${rawVis}" 无效（hover/always），已回退 hover`,
                );
            }
        }
        for (const [key, setter] of [
            ["maxSize", (d: any) => (this._maxDecl = d)],
            ["minSize", (d: any) => (this._minDecl = d)],
            ["fadeSize", (d: any) => (this._fadeDecl = d)],
        ] as const) {
            const raw = this.getOption(key);
            if (raw == null || raw === "") continue;
            const d = this._parseLength(raw);
            if (d == null) {
                this.warn(
                    `x-expandable: ${key} 值 "${raw}" 无法解析为 CSS 长度（支持 px/%/rem/em/vw/vh），已忽略`,
                );
            } else setter(d);
        }
        const rawOffset = this.getOption("offset");
        if (rawOffset != null && rawOffset !== "") {
            const o = this._parseOffset(rawOffset);
            if (o == null) {
                this.warn(
                    `x-expandable: offset 值 "${rawOffset}" 无法解析为偏移长度（number px/CSS 长度/calc() 表达式），已忽略`,
                );
            } else if (o !== "0px") {
                this._offsetCss = o;
            }
        }
    }

    /**
     * offset 解析（**固定轴语义**：+ = 把手跨轴的正方向——left/right 方向 = 向右、
     * top/bottom 方向 = 向下；负值反向）：number = px；string = CSS 长度（负值合法）
     * 或 `calc()`/`var()` 表达式原样透传（splitter 注入分隔条宽度补偿的载体）；非法 null。
     */
    private _parseOffset(raw: unknown): string | null {
        if (typeof raw === "number") return Number.isFinite(raw) ? `${raw}px` : null;
        if (typeof raw !== "string") return null;
        const s = raw.trim();
        if (s === "") return null;
        const d = this._parseLength(s);
        if (d) return this._formatCss(d);
        if (/^(calc|var)\(/i.test(s) && /^[\w\s\-+*/().,%]*$/.test(s)) return s;
        return null;
    }

    /** CSS 长度解析（number=px；非法 null）——splitter parseLength 同款 */
    private _parseLength(raw: unknown): { value: number; unit: string } | null {
        if (typeof raw === "number") {
            return Number.isFinite(raw) ? { value: raw, unit: "px" } : null;
        }
        if (typeof raw !== "string") return null;
        const m = /^(-?(?:\d+(?:\.\d+)?))\s*(px|%|rem|em|vw|vh)?$/i.exec(raw.trim());
        if (!m) return null;
        const value = parseFloat(m[1]!);
        return Number.isFinite(value) ? { value, unit: (m[2] ?? "px").toLowerCase() } : null;
    }

    /** CSS 值形态（写 inline）：px 整数、其余两位小数 */
    private _formatCss(d: { value: number; unit: string }): string {
        return d.unit === "px"
            ? `${Math.round(d.value)}px`
            : `${Math.round(d.value * 100) / 100}${d.unit}`;
    }

    // ── 值绑定 ────────────────────────────────────────────────────────

    /** 值解析：空 warn 不作为 / 字面量恒态 / 简单路径双向 / 表达式只读降级 */
    private _setupValue(): void {
        const raw = String(this.value ?? "").trim();
        if (raw === "") {
            this.warn(`x-expandable: 值须为展开状态路径或表达式（如 x-expandable="ui.open"），指令未生效`);
            this._dead = true;
            return;
        }
        // 字面量：裸或引号包裹的 true/false（恒定态，点击 no-op）
        const quoted = /^(['"])(.*)\1$/.exec(raw);
        const lit = quoted?.[2] ?? raw;
        if (lit === "true" || lit === "false") {
            this._expanded = lit === "true";
            return;
        }
        if (!isSimpleStatePath(raw) && !this._warnedReadonly) {
            this._warnedReadonly = true;
            this.warn(
                `x-expandable: 值 "${raw}" 非简单状态路径，退化为只读（状态→DOM 照常；点击把手不回写）`,
            );
        } else if (isSimpleStatePath(raw)) {
            this._expandedPath = raw;
        }
        const initial = this.binding.watch(raw, ({ value }) => this._applyFromState(value));
        this._expanded = !!initial;
    }

    /** 外部状态 → DOM（watcher 回调）：等值短路（防循环——点击回写触发的回流在此被吸收） */
    private _applyFromState(value: any): void {
        if (this._destroyed || value == null) return;
        const expanded = !!value;
        if (expanded === this._expanded) return; // 等值短路
        this._applyExpanded(expanded, true);
    }

    /** 把手点击：组合形态翻转仲裁权在组合方；模板形态仅双向路径回写（字面量/只读降级 no-op） */
    private _toggle(): void {
        if (this._destroyed) return;
        if (this._driver) {
            this._driver.set(!this._expanded);
            return;
        }
        if (this._expandedPath == null) return;
        try {
            setVal(
                this.engine.store.state,
                this._expandedPath.split(this.engine.store.delimiter),
                !this._expanded,
            );
        } catch (e: any) {
            this.warn(`x-expandable: 状态写回失败（"${this._expandedPath}"）: ${e?.message ?? e}`);
        }
    }

    /**
     * 把手 absolute 定位上下文保障：宿主 computed position 为 static 时 inline 补
     * `position:relative`（微任务挂载后检测——detached 元素 computed 不可靠）。fixed /
     * absolute / 用户显式定位**不动**（slide 通道的目标覆盖形态是 fixed 宿主，CSS 强写
     * relative 会把它覆盖掉）。
     */
    private _ensurePositionContext(): void {
        const el = this.el;
        if (typeof getComputedStyle !== "function") return;
        const pos = getComputedStyle(el).position;
        // 空串视同 static（happy-dom 对未声明属性返回空串；默认值本就是 static）——
        // fixed/absolute/sticky 宿主已是定位上下文，不动（slide 通道目标形态）
        if (pos === "static" || pos === "") {
            el.style.position = "relative";
        }
    }

    /**
     * 宿主 overflow 检测（编译后微任务、warn 一次）：hidden/clip 会裁掉骑边把手突出的
     * 外半圆，auto/scroll 会把把手随内容滚走（把手是唯一重开触点）——overflow 需求
     * （裁溢出 / 内部滚动）应由**内层包裹**承载，宿主保持 visible。正向枚举而非
     * `!== "visible"`：happy-dom 对未声明属性返回空串，负向判定会误报。
     */
    private _warnHostOverflow(): void {
        if (this._warnedHostOverflow || typeof getComputedStyle !== "function") return;
        const cs = getComputedStyle(this.el);
        const clipped = [cs.overflow, cs.overflowX, cs.overflowY].some(
            (v) => v === "hidden" || v === "clip" || v === "auto" || v === "scroll",
        );
        if (!clipped) return;
        this._warnedHostOverflow = true;
        this.warn(
            `x-expandable: 宿主声明了 overflow "${cs.overflow}"——会裁掉骑边把手突出的外半圆或把把手随内容滚走（把手是唯一重开触点）；overflow 需求请由内层包裹承载（子内容包一层声明 overflow，宿主保持 visible）`,
        );
    }

/** 手柄桥接接线落点：**同元素**边线交互元素只有内建单边 resize 手柄一种（x-resize 已随
     *  ADR-0072 互斥移除），由 `_bridgeHandleHover` 在装配期接线；跨元素桥接（splitter
     *  分隔条 / drawer 面板手柄）仍在消费方各自接线。 */

    // ── 把手 ──────────────────────────────────────────────────────────

    /** 构建把手（共享把手模块统一构建——元素/箭头/键盘管线唯一实现；点击行为本指令接线） */
    private _buildTrigger(): void {
        const trigger = createCollapseTrigger({
            direction: this._dir,
            onActivate: () => this._toggle(),
        });
        this._trigger = trigger;
        // 感应边条：createElement 注入不在模板树、天然不被编译（把手同款）；必须置于
        // 把手**之前**（兄弟选择器 .edge:hover ~ .trigger 显形的前提）。
        // showTrigger:'hover' 时覆盖整条活动边线——pos 自定义把手位置后不可预知，
        // 鼠标移到边线任何位置都应显形把手
        const edge = document.createElement("div");
        edge.className = "autospark-expandable-edge";
        edge.setAttribute("aria-hidden", "true");
        this._edge = edge;
        this.el.appendChild(edge);
        this.el.appendChild(trigger);
        this._positionTrigger();
    }

    /** 把手定位：inline 只写坐标变量 --as-pos/--as-offset + data-pos-negative（定位/钳制/偏移归样式表两态规则） */
    private _positionTrigger(): void {
        const t = this._trigger;
        if (!t) return;
        t.setAttribute("data-direction", this._dir);
        // 显隐策略挂宿主级（感应边条与把手两处消费；折叠态常驻走把手自身 data-collapsed，
        // 不依赖本属性——reparent 后宿主级规则不命中无碍）
        this.el.setAttribute("data-show-trigger", this._showTrigger);
        const pos = this._parsePos();
        t.style.setProperty("--as-pos", pos.value);
        t.toggleAttribute("data-pos-negative", pos.negative);
        // offset 附加偏移（变量随身——reparent 后仍生效；未配置摘除回退 0px 默认）
        if (this._offsetCss) t.style.setProperty("--as-offset", this._offsetCss);
        else t.style.removeProperty("--as-offset");
        t.toggleAttribute("data-collapsed", !this._expanded);
    }

    /**
     * pos 坐标解析（边缘锚定模型，共享模块 parseRailCoord——drawer 等消费方同源）：
     * 非法 warn 回退居中（消息文案属本指令语境）。
     */
    private _parsePos(): { value: string; negative: boolean } {
        const raw = this.getOption("pos");
        const parsed = parseRailCoord(raw);
        if (!parsed) {
            this.warn(
                `x-expandable: pos 值 "${raw}" 无法解析为坐标（center/数字 px/CSS 长度串），已按居中处理`,
            );
            return { value: "50%", negative: false };
        }
        return parsed;
    }

    // ── 折叠/展开应用（核心） ─────────────────────────────────────────

    /** 主轴尺寸属性：left/right → width、top/bottom → height */
    private get _sizeProp(): "width" | "height" {
        return this._dir === "top" || this._dir === "bottom" ? "height" : "width";
    }

    /** 滑出负 margin 属性（按收起方向分派：向哪边收起抵消哪边占位） */
    private get _marginProp(): "margin-left" | "margin-right" | "margin-top" | "margin-bottom" {
        return MARGIN_PROPS[this._dir] as any;
    }

    /** 是否滑出折叠形态（minSize 未声明或 ≤0） */
    private _isSlideCollapse(): boolean {
        return this._minDecl == null || this._minDecl.value <= 0;
    }

    /** 滑出距离：主轴 inline 数值优先（亚像素精确、无布局环境可用），布局 rect 兜底 */
    private _readExtent(): number {
        const prop = this._sizeProp;
        const inline = parseFloat(this.el.style[prop]);
        if (Number.isFinite(inline) && inline > 0) return inline;
        const rect = this.el.getBoundingClientRect();
        return rect[prop] || 0;
    }

    /** 应用展开/折叠终态（决策四双通道 + 决策六 reparent + 决策七注入 + 决策八事件） */
    private _applyExpanded(expanded: boolean, animate: boolean): void {
        const el = this.el;
        const from = this._expanded;
        const slideHide = !expanded && this._isSlideCollapse();
        this._expanded = expanded;
        // 宿主 data-collapsed 仅滑出折叠挂（子内容隐藏钩子）；data-shrunk 仅收缩折叠挂
        // （fadeSize 遮盖的显示判据 + 页面 CSS 感知收缩态的通用钩子——此前缺失）。
        // 把手 data-collapsed 独立挂（箭头翻转，minSize>0 折叠也翻转）——两处分离，splitter 先例
        el.toggleAttribute("data-collapsed", slideHide);
        el.toggleAttribute("data-shrunk", !expanded && !slideHide);
        this._trigger?.toggleAttribute("data-collapsed", !expanded);
        // 半圆形态判据（共享把手视觉）：仅滑出折叠挂——minSize>0 收缩折叠全圆不挂
        // （图标不缩放不平移，只翻转指向）；reparent 后属性随身生效
        this._trigger?.toggleAttribute("data-half", slideHide);

        if (expanded) {
            // 展开：清滑出痕迹 + 恢复尺寸（maxSize 有值写 inline、缺省移除**本指令写过的**
            // inline 让 CSS 决定——不快照；用户模板自带 inline 不动）
            this._clearSlide();
            if (this._maxDecl) {
                el.style[this._sizeProp] = this._formatCss(this._maxDecl) as any;
                this._ownSizeProp = true;
            } else if (this._ownSizeProp) {
                el.style.removeProperty(this._sizeProp);
                this._ownSizeProp = false;
            }
            // 把手迁回宿主须在**动画启动前**（ADR-0069 决策六——此刻宿主活动边在停靠边，位置连续）
            this._undockTrigger();
        } else if (slideHide) {
            // 折叠 = 滑出（minSize=0）：尺寸保持不改，终态持续保持
            this._dockParent();
            if (this._mode === "slide") {
                el.style.removeProperty(this._marginProp);
                el.style.transform = SLIDE_TRANSFORMS[this._dir];
            } else {
                el.style.removeProperty("transform");
                el.style[this._marginProp] = `-${this._readExtent()}px` as any;
            }
        } else {
            // 折叠 = 尺寸收缩（minSize>0）：纯尺寸动画，无滑出无隐藏，把手不迁移
            this._clearSlide();
            el.style[this._sizeProp] = this._formatCss(this._minDecl!) as any;
            this._ownSizeProp = true;
        }

        // 态翻转：动画（滑出折叠的把手 reparent 在动画完成后）；初始应用（from === expanded
        // ——created 已把 _expanded 同步为初值）无动画、直接迁移（_dockTrigger 幂等，重复
        // 折叠调用不重复移动）
        if (from !== expanded) {
            if (animate) {
                if (slideHide) this._playAnimation(() => this._dockTrigger());
                else this._playAnimation();
            } else if (slideHide) {
                this._dockTrigger();
            }
            // 翻转事件（初始应用不派发——事件只反馈变更）
            if (this._initialized) {
                el.dispatchEvent(
                    new CustomEvent(expanded ? "expandable:expand" : "expandable:collapse", {
                        detail: { size: this._detailSize(expanded) },
                        bubbles: true,
                    }),
                );
            }
        } else if (slideHide) {
            this._dockTrigger();
        }
    }

    /** 清滑出痕迹（负 margin / transform / 父容器注入释放） */
    private _clearSlide(): void {
        this.el.style.removeProperty(this._marginProp);
        this.el.style.removeProperty("transform");
        this._releaseParentInjection();
    }

    /** 事件 detail.size：展开 = maxSize 格式化值或 null（无约束）；折叠 = 0 或 minSize */
    private _detailSize(expanded: boolean): number | string | null {
        if (expanded) return this._maxDecl ? this._formatCss(this._maxDecl) : null;
        return this._minDecl && this._minDecl.value > 0 ? this._formatCss(this._minDecl) : 0;
    }

    /** 挂动画属性（data-animating → CSS transition），transitionend/兜底超时摘除 + 完成回调 */
    private _playAnimation(onDone?: () => void): void {
        if (this._animTimer != null) clearTimeout(this._animTimer);
        this.el.setAttribute("data-animating", "");
        const done = () => {
            this.el.removeAttribute("data-animating");
            if (this._animTimer != null) {
                clearTimeout(this._animTimer);
                this._animTimer = null;
            }
            onDone?.();
        };
        this.el.addEventListener("transitionend", done, { once: true });
        // transitionend 不触发的环境（无布局/happy-dom/被禁用）兜底摘除——600ms 后仍执行 reparent
        this._animTimer = setTimeout(done, 600);
    }

    // ── 内建单边 resize（ADR-0072）────────────────────────────────────

    /**
     * 单边 resize 装配（复用 x-resize 的 ResizeSession 核心——overlay 家族同款复用面）：
     * 方向 = 活动边法线自动推导（left → e / right → w / top → s / bottom → n），手柄骑
     * 活动边线。本指令独占边线交互（同元素 x-resize 已被互斥），把手/手柄/边条无跨指令
     * 抢夺。约束经 resolveResizeConstraints 透传（min/max/snap；handles/aspectRatio 已在
     * 选项读取时剥离）。手柄与把手同骑边线时的两层协调：把手压手柄之上（宿主 data-resize
     * → 样式表抬 z，命中与视觉都不被调节线拦），手柄 hover 桥接触发显形把手。
     */
    private _setupResize(): void {
        const dir: ResizeDirection =
            this._dir === "left"
                ? "e"
                : this._dir === "right"
                  ? "w"
                  : this._dir === "top"
                    ? "s"
                    : "n";
        this._resizeSession = new ResizeSession({
            target: this.el,
            eventTarget: this._eventTarget ?? this.el,
            handles: [dir],
            constraints: () =>
                resolveResizeConstraints(this._resizeOpts, this.el, (m) => this.warn(m)),
            apply: (width, height) => this._applyResized(width, height),
            warn: (m) => this.warn(m),
        });
        this._resizeSession.attach();
        this._bridgeHandleHover();
    }

    /**
     * 手柄 → 把手 hover 桥接（`data-edge-hover` 统一契约，splitter 分隔条 / drawer 面板
     * 手柄同款）：感应边条（z4）被手柄带（z10 全长）完全盖住收不到 hover，hover 模式
     * 「鼠标移到边线任何位置把手即淡入」须由手柄转译——否则启用 resize 后把手只剩命中
     * （不可见但可点）一条退路。enable:false 退化形态无把手，直接跳过。
     * 监听器随手柄/把手同生命周期消亡，无需显式解绑（与 drawer 面板手柄桥接同款）。
     */
    private _bridgeHandleHover(): void {
        const t = this._trigger;
        if (!t) return;
        const set = (on: boolean) => t.toggleAttribute("data-edge-hover", on);
        for (const h of this.el.querySelectorAll<HTMLElement>("[data-autospark-resize-handle]")) {
            h.addEventListener("mouseenter", () => set(true));
            h.addEventListener("mouseleave", () => set(false));
            h.addEventListener("focus", () => set(true));
            h.addEventListener("blur", () => set(false));
        }
    }

    /** resize 写路径：直写主轴 inline 尺寸 + **接管 maxSize**（Q4=A：拖出值成为展开尺寸
     *  真相——折叠/展开/detail.size 全走既有 maxSize 管线，零新增状态）；组合形态经
     *  driver.resized 路由（splitter 同步尺寸簿记 / drawer 记会话记忆） */
    private _applyResized(width: number, height: number): void {
        const v = Math.round(this._sizeProp === "width" ? width : height);
        this.el.style[this._sizeProp] = `${v}px`;
        const decl = { value: v, unit: "px" };
        this._maxDecl = decl;
        this._ownSizeProp = true;
        this._driver?.resized?.(decl);
    }

    // ── 父容器注入（决策七） ──────────────────────────────────────────

    /** injectOverflow 默认 true（显式 false 才禁用） */
    private _shouldInjectOverflow(): boolean {
        return this.getOption("injectOverflow") !== false;
    }

    /** 父容器 computed overflow 是否已裁剪（hidden/clip 任一轴） */
    private _parentClips(parent: HTMLElement): boolean {
        if (typeof getComputedStyle !== "function") return false;
        const cs = getComputedStyle(parent);
        return [cs.overflow, cs.overflowX, cs.overflowY].some((v) => v === "hidden" || v === "clip");
    }

    /** 折叠期间注入：dock（定位上下文，恒挂）+ clip（overflow，注入通道开启且父容器未裁剪时挂） */
    private _dockParent(): void {
        if (this._injected) return; // 幂等（本实例）
        const parent = this.el.parentElement;
        if (!parent) return;
        dockCounts.set(parent, (dockCounts.get(parent) ?? 0) + 1);
        parent.setAttribute("data-autospark-expandable-dock", "");
        if (this._shouldInjectOverflow()) {
            if (!this._parentClips(parent)) {
                parent.setAttribute("data-autospark-expandable-clip", "");
            }
        } else if (!this._warnedOverflow && !this._parentClips(parent)) {
            // 禁用注入回落检测（决策七）：warn 一次、用户自负
            this._warnedOverflow = true;
            this.warn(
                `x-expandable: injectOverflow 已禁用且父容器 overflow 非 hidden/clip——滑出折叠过程宿主将溢出父容器可见，请自行处理裁剪`,
            );
        }
        this._injected = true;
    }

    /** 展开完成后释放（引用计数归零才摘属性——多实例共享父容器） */
    private _releaseParentInjection(): void {
        if (!this._injected) return;
        this._injected = false;
        const parent = this.el.parentElement;
        if (!parent) return;
        const n = (dockCounts.get(parent) ?? 1) - 1;
        if (n <= 0) {
            dockCounts.delete(parent);
            parent.removeAttribute("data-autospark-expandable-dock");
            parent.removeAttribute("data-autospark-expandable-clip");
        } else {
            dockCounts.set(parent, n);
        }
    }

    // ── 把手 reparent（决策六：展开态宿主内 / 滑出折叠终态父容器内） ──

    /** 把手移入父容器（折叠滑出完成后；CSS 折叠态规则接管定位，零 JS 测量） */
    private _dockTrigger(): void {
        const t = this._trigger;
        const parent = this.el.parentElement;
        if (!t || !parent || this._destroyed) return;
        if (t.parentElement !== parent) parent.appendChild(t);
        this._docked = true;
    }

    /** 把手移回宿主（展开动画启动前；清 inline 无需——两态定位全在样式表） */
    private _undockTrigger(): void {
        const t = this._trigger;
        if (!t || !this._docked) return;
        this.el.appendChild(t);
        this._docked = false;
    }
}
