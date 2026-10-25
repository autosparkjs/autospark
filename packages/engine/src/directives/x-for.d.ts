import { AutoSparkDirectiveBase } from "../features/directive/base";
import type { AutoDirectiveInfo } from "../features/directive/types";
import type { AutoSpark } from "../engine/engine";
/**
 * x-for：列表渲染（B 容器语义，直写普通元素）。
 *
 * 语法：
 * ```html
 * <ul x-for="item of items" :key="item.id">
 *   <li x-text="item.name"></li>
 * </ul>
 * ```
 *
 * **B 语义**：带 x-for 的元素渲染一次作容器，其元素子节点二分：
 *  - 命中 special 描述符（当前 `x-empty`，见 SPECIAL_CHILDREN）的子节点 → **渲染一次的特例**（不随项重复）；
 *  - 其余元素子节点 → 作为一个**复合项模板**被整体重复 N 次、按文档顺序插入到该容器下。
 *  单子节点即单元素项；多子节点（如 `<dl>` 下的 dt/dd、卡片头/体）作为一组一起循环。
 *  `:key` 可选（缺省用 index），按"项"计——一个 key 对应一组 DOM 节点。
 *
 * **x-empty 空状态子节点**：items 为空数组时，容器内带 `x-empty` 的子节点渲染一次（多个则全显、按文档序）；
 * items 非空时拆除。空元素对**父作用域**求值（无 item/$index——空状态下它们无意义），与"把空元素挪到
 * x-for 外当兄弟"语义一致，但省去兄弟方案所需的外层包裹——空 `<li>` 天然继承容器 `ul>li` 的共享 CSS：
 * ```html
 * <ul x-for="item of items">
 *   <li x-text="item.name"></li>
 *   <li x-empty>没有数据</li>      <!-- items 为空时渲染此项 -->
 * </ul>
 * ```
 * **注意：空元素标签须匹配容器内容模型**（`<ul>→<li x-empty>`、`<select>→<option x-empty>`、
 * `<tbody>→<tr x-empty>`），与项模板同标签为佳；否则（如 `<div x-empty>` 在 `<ul>` 内非法）浏览器解析期
 * 可能挪动节点、破坏 CSS 共享。
 *
 * **契约变更**：原"容器内不支持只渲染一次的静态内容"现改为"命中 special 描述符的子节点是渲染一次的特例"。
 * 仍需放在列表之外的静态内容（分隔线、表头、汇总行——这些**不论 items 空否都要显示**）依旧放到 x-for 容器之外。
 * SPECIAL_CHILDREN 描述符表是类别的真接缝：未来 x-loading 等同类空状态只需加表项、按 priority 与 x-empty
 * 互斥（when 收原始 items 值，x-empty 只认空数组、把 undefined 留给 x-loading），不碰 render()。
 *
 * **为何需要 ownsChildren**：普通元素的子节点属于 childNodes，transformElement 默认会递归编译；
 * x-for 作为结构指令声明占有子树（compiler 对其返回 ownsChildren 信号），让通用 walk 跳过其子节点，
 * 由 x-for 在 `compileChild` 中逐项编译——避免"项模板被编译一次 + x-for 又克隆渲染"的重复冲突。
 *
 * **渲染策略（key-based 复用）**：监听 items（支持纯路径 `items` 或表达式 `items.filter(...)`），
 * 结构变化时按 `:key` 做 4-pass diff，**复用未变项**（保留 DOM/scope/订阅 → 焦点/输入态不丢），仅增删/重订阅差异项：
 * - 同 key + index 不变 → 复用：原地 `Object.assign(localData)` 更新 item + 全部 `$*`，再 `scope.refresh()` 重跑项内绑定。
 *   （项内订阅路径含 index、index 不变则订阅仍有效；引用变的内容差异由 refresh patch。）
 *   脏标记短路（P2）：item 引用未变 && length 未变 → 跳过 refresh（$* 随 assign 重算但值不变）。
 * - 同 key + index 变（移动）→ 重订阅（P1）：旧订阅路径含旧 index 已失效，**复用项根 DOM**（rebindItem），
 *   仅销毁旧 scope 重新 `compileChild`——保住项根本身焦点/属性；子树 DOM 清空重建
 *   （子节点焦点彻底保留需 core 对象身份订阅，见 v3 路线）。
 * - 新 key → 新建；消失 key → 销毁。
 * - DOM 重排（P2）：顺序已就位则跳过全量 `insertBefore`；否则从后向前、组内正序插入。
 * push/pop 等末尾增删不改其他项 index → 旧项零成本复用；unshift/中间 splice 致后续项 index 变 → 那些项重订阅。
 * `:key` 缺省时用 index；`:key` 提供时还用于重复 key 检测。
 *
 * **更新颗粒度（双轨 + 项级补盲）**：
 * - 字段级：`items[i].field=` 由项内 watcher 精准 patch，**不进 render**（细粒度）。
 * - 列表级：push/splice/整体赋值由 `watch(itemsPath)` 触发 render（结构 diff）。
 * - 项级补盲（P0）：纯路径 itemsPath 时补 `items.*`，捕获 `items[i]={...}` 整体替换单项
 *   （core 发 items.{i} update，watch(itemsPath) 精确匹配收不到 → 旧版静默不更新）。
 * - 颗粒度差异：纯路径 `items` 仅结构变触发 render（字段级细粒度保留）；表达式 `items.filter(...)`
 *   经 collectDependencies 订阅所有项被读字段 → 字段变更也触发 render（退化为列表级粗粒度）。
 *
 * 项内局部变量（item/index）经 `compileChild` 的 localData 注入；同一项的多个成员**共享同一 localData 引用**，
 * 各成员表达式 `item.name` 经各自 `scope.getContext()` 解析（localData 优先、parent 链回退到根 state）。
 *
 * **循环派生变量**（$ 前缀，固定可用、不占用户自定义命名空间）：每项 localData 还注入
 * `$index`(0-based 序号)、`$length`(本次渲染项数，filter/map 后即筛选后长度)、
 * `$begin`(首项)、`$end`(末项)、`$odd`(第 1,3,5... 行，对齐 CSS `:nth-child(odd)`)、
 * `$even`(第 2,4,6... 行)。典型用法：行间分隔线 `<hr x-if="!$end"/>`、末项汇总提示。
 *
 * 注意：
 * - **嵌套遮蔽**——内层 `$index` 等命中自身 localData、遮蔽外层同名变量；跨层引用外层序号请用自定义 index 名（如 `cell, cidx of ...` 后用 `cidx`）。
 * - **派生变量靠 refresh 重算**——`$end/$begin/$length` 随 items 增删而变，且这些 `$*` 是 localData 普通字段、非响应式（store 不会自动触发订阅为空的 watcher）。v2 对复用项原地重算全部 `$*` 并经 `scope.refresh()` 重跑项内绑定 patch，保证派生变量始终正确。
 * - **x-if 默认 eager（销毁子树）**——`<div x-if="$end">` 为假时移除其子树并销毁 watcher；叶子元素（hr/线，无子树）退化为 `display:none`。
 *   若需"假时仅隐藏、保留子树 watcher"（如隐藏期间继续累积最新值），用 `x-if.keepalive` / `x-show`。
 */
export declare class ForDirective extends AutoSparkDirectiveBase {
    static readonly priority = 100;
    static readonly singleton = true;
    /** x-for 永远占有子树：其子节点是项模板，由本指令逐项克隆编译，通用 walk 不得递归 */
    static ownsChildren(_info: AutoDirectiveInfo): boolean;
    /** 注入默认虚拟列表滚动条样式（幂等；多 engine 实例共享 document） */
    static initialize(_engine: AutoSpark): void;
    /**
     * "容器内渲染一次的特例子节点"描述符表。
     *
     * 每条描述一个命名空状态：用 `match` 属性在容器子节点中识别其模板、用 `when(raw)` 判定
     * 何时激活、多个同时激活时按 `priority` 取最高。**加新特例（如 x-loading）只改此表，不碰 render()。**
     *
     * `when` 收**原始** items 值（未经 Array.isArray 归一化），使 `undefined`（未加载）与 `[]`（真空）
     * 可被不同描述符分别认领——例如未来 x-loading 以更高 priority 认领 `undefined`，x-empty 只认空数组。
     */
    private static readonly SPECIAL_CHILDREN;
    private itemName;
    private indexName;
    private itemsPath;
    /**
     * 源路径的绝对段缓存（ADR-0076 项映射）：纯路径源且非分页时为段数组（如
     * ["items"] / 嵌套外层展开后的 ["rows","2","cells"]），null = 不可解析（表达式
     * 源 / 分页切片，无稳定状态路径，不记映射）。首次需要时解析并缓存。
     */
    private _itemSourceSegs;
    private keyExpr;
    /** 复合项模板：容器下【非 special】的元素子节点（单子节点时长度为 1）。
     *  命中 SPECIAL_CHILDREN.match（如 x-empty）的子节点已分入 specialTemplates，不在此列。 */
    private itemTemplates;
    /** special 子节点模板：name → 模板数组（文档序）。如 x-empty 子节点。
     *  与 itemTemplates 同源（均取自 this.template.children，clone 重建已保证脱离 live DOM）。 */
    private specialTemplates;
    /** 当前激活的 special 名（null=无 special、显示 items）。作幂等锚点：同名则跳过重挂载。 */
    private activeSpecial;
    /** 已挂载 special 的 scope 与 DOM 节点——精确清理用。
     *  ⚠️ 不能 clear 整个 binding.children：它与 item scope 共享同一 Set（compileChild 都 addChild 到 binding）。 */
    private specialScopes;
    private specialNodes;
    /** 列表项运行时实体索引：key → ForItemEntry。
     *  v2 按 key 复用/增删/重建；无 :key 时 key=index（evalKey 回退）。 */
    private itemMap;
    /** 上次 render 的 items 长度：P2 脏标记——length 未变且 item 引用未变时跳过该项 refresh。
     *  -1 哨兵：首次 render 必 lengthChanged（但首次均走 create 分支，不进复用，无副作用）。 */
    private _lastRenderLength;
    /**
     * 首次渲染守卫（ADR-0039 决策 6）：首渲 N 项不整队播进场动画；此后状态变化引起的
     * 项增删 / special 挂卸才播。与 x-if / x-switch / x-show 的同款守卫一致。
     */
    private firstRender;
    /** 动画配置缓存（DRY：避免每次事件重复 resolveAnimate + getOption） */
    private _anim;
    /** 是否启用虚拟列表模式 */
    private _virtual;
    /** 每项高度（像素）。由 x-for-options="{itemHeight:40}" 指定，或自动检测 */
    private _itemHeight;
    /** 自动检测的 itemHeight（用户未指定时使用） */
    private _autoItemHeight;
    /** 缓冲区项数 */
    private _overscan;
    /** 当前第一个可见项索引 */
    private _firstVisibleIndex;
    /** 可见项数（含 overscan） */
    private _visibleCount;
    /** 滚动事件 rAF 句柄 */
    private _scrollRafId;
    /** ResizeObserver 实例 */
    private _resizeObserver;
    /** data-index 绑定的状态路径（用户通过 :data-index="xxx" 绑定） */
    private _dataIndexBinding;
    /** 是否正在程序化滚动（避免滚动事件循环） */
    private _isScrollingToIndex;
    /** 是否正在由滚动/渲染更新 data-index（防止 MutationObserver 反馈循环） */
    private _isUpdatingDataIndex;
    /** 虚拟列表底部垫片元素（撑起总高度使滚动条正确） */
    private _spacerEl;
    /** 虚拟列表顶部垫片元素（将项推到正确的滚动位置） */
    private _topSpacerEl;
    /** 是否启用分页模式（.paging 修饰符） */
    private _paging;
    /** 当前页码（1-based） */
    private _page;
    /** 每页条数 */
    private _pageSize;
    /** 总页数（0=未知，load-more 模式） */
    private _pageCount;
    /** 是否还有下一页 */
    private _hasMore;
    /** 是否正在加载 */
    private _loading;
    /** 错误信息 */
    private _error;
    /** loader action 名 */
    private _loaderName;
    /** :data-paging 绑定的状态路径 */
    private _pagingBindingPath;
    /** autoLoad 开关 */
    private _autoLoad;
    /** loader 模式是否已完成过一次加载（autoLoad:false 手动首载：未加载过时同值 page 写入放行触发） */
    private _hasLoaded;
    created(): void;
    /** 初始化虚拟列表选项并设置事件监听 */
    private setupVirtualOptions;
    /** 创建/更新滚动高度垫片元素 */
    private _createSpacers;
    /** 更新垫片高度以匹配总列表高度 */
    private _updateSpacerHeights;
    /** 检测 :data-index 绑定的状态路径 */
    private _detectDataIndexBinding;
    /** 设置滚动事件监听（passive + rAF 节流） */
    private _setupScrollListener;
    /** 滚动事件监听器引用（用于销毁时移除） */
    private _scrollListener;
    /** 设置 ResizeObserver 监听容器尺寸变化 */
    private _setupResizeObserver;
    /** 滚动事件处理：更新可见项范围 */
    private _onScroll;
    /** ResizeObserver 回调：容器尺寸变化时重新计算 */
    private _onResize;
    /** 获取当前 itemHeight（优先使用用户配置，否则自动检测） */
    private _getItemHeight;
    /** 自动检测 itemHeight：取第一项的实际高度 */
    private _autoDetectItemHeight;
    /** 更新 data-index 属性和绑定的状态 */
    private _updateDataIndex;
    /** 监听 data-index 属性变化以支持程序化滚动 */
    private _observeDataIndex;
    /** data-index MutationObserver 实例 */
    private _dataIndexObserver;
    /** 程序化滚动到指定索引 */
    private scrollToIndex;
    /** 虚拟列表渲染：只渲染可见项 + overscan */
    private _renderVirtual;
    /**
     * 创建分页模式的 localData Proxy：拦截 $page/$pageSize 写操作，
     * 自动触发 loader 或 render。
     */
    private _createPagingLocals;
    /**
     * 加载指定页数据（服务端分页）。
     * 调用 loader action，将返回数据追加到 items，同步分页状态。
     */
    private _loadPage;
    /**
     * 去重追加数据到 items 数组。
     * 基于页偏移计算：loadedPage 页的数据从 items[(loadedPage-1)*pageSize] 开始。
     * 已有位置做替换，超出部分做追加。
     */
    private _appendItems;
    /**
     * 通过 store.state 写入 items 路径（用于 items 非数组时创建新数组）。
     */
    private _setItems;
    /**
     * 将分页状态同步到外部：先重建容器 scope 上的 paging 冻结快照（ADR-0042 分页状态读取器，
     * 有无 :data-paging 绑定均执行），再回写绑定对象（有绑定时）。
     */
    private _syncPagingState;
    /**
     * 强制所有项 scope refresh，让 $loading/$error 等变量在 DOM 中更新。
     */
    private _forceRefreshPagingVars;
    /**
     * 渲染容器（template 宿主修订）：B 语义下 x-for 元素自身是容器；`<template x-for>` 宿主
     * 的子节点在 content 隔离域、appendChild 进 content 不渲染——项改挂 template 的**父节点**，
     * template 元素自身保留在 DOM 作声明位标记（不渲染内容，无痕）。父节点缺失（未挂载）时
     * 兜底 this.el（后续 insertBefore 在挂载后执行，届时 parentElement 就位）。
     */
    private get _renderContainer();
    /**
     * 尾部锚点：普通宿主 = null（插到容器末尾）；template 宿主 = template 元素自身——
     * 项与 spacer 恒插其前，保持声明位置的文档序（template 是列表的「尾部边界」）。
     */
    private get _tailAnchor();
    /** 解析 "item of items" / "item,index of items" 与 :key（可选），并采集复合项模板 */
    private parse;
    private readItems;
    /**
     * key-based 渲染：4-pass diff（复用未变项、仅增删/重订阅差异项）。
     *
     * Pass 1 决策：同 key + index 不变 → 复用（原地更新 localData）；同 key + index 变 → 移动
     *   （旧订阅路径含旧 index 已失效，P1 复用项根 DOM 仅重订阅）；新 key → 新建。
     * Pass 2 清理：新列表中消失的旧 key → 销毁。
     * Pass 3 重排：DOM 已就位则跳过（P2）；否则从后向前、组内正序 insertBefore。
     * Pass 4 刷新：脏标记筛选后的复用项 refresh（P2：item 引用未变 && length 未变则跳过）。
     *
     * 虚拟列表模式（.virtual）：只渲染可见项 + overscan，由 _renderVirtual() 处理。
     */
    private render;
    /** 构造项的 localData（item/index + 全部循环派生变量 $*）。
     *  v2 复用时通过 Object.assign 原地写回同一对象——禁止替换引用，因 watchExpression 的
     *  _scopeView Proxy 闭包绑定了 localData 对象引用，换对象会使 refresh 取不到新值。
     *  分页模式下返回 Proxy 包装的对象，拦截 $page/$pageSize 写操作触发 loader。 */
    private buildLocalData;
    /** 新建单个列表项：编译全部成员模板，返回 entry。
     *  不插入 DOM、不登记 itemMap、不做重复 key 检测（均由 render 负责）。 */
    private createItem;
    /**
     * 解析源路径的绝对段（ADR-0076）：复用 resolveFieldAbsPath 的容器展开（嵌套 x-for
     * 的相对源 `row.cells` 沿链展开外层项映射/域前缀）。表达式源 / 分页切片返回 null
     * （无稳定状态路径，不记映射——项内 x-field 回退全局路径解释 + warn）。
     */
    private _resolveItemSourceSegs;
    /**
     * 在项 localData 上挂项映射（ADR-0076）：`item → [...源绝对段, String(index)]`，
     * 供项内 x-field 的 resolveFieldAbsPath 把 `item.name` 反解为 `items.<index>.name`。
     * 挂载时机在 compileChild 之前（localData 先于成员 scope 构造），保证嵌套 x-for
     * 的内层 created 期能沿链读到外层映射。复用分支（index 不变）映射不变，无须重挂；
     * Object.assign 原地更新不触碰 Symbol 键，映射天然不被冲掉。
     */
    private _attachLocalPaths;
    /**
     * 移动复用（P1）：同 key 但 index 变时，复用项根 DOM 节点，仅销毁旧 scope 重新编译订阅。
     *
     * 旧订阅路径含旧 index 已失效（core 路径驱动响应式的固有限制），必须重建订阅；但项根 DOM
     * 节点（old.nodes）保留——避免移动导致的 DOM 创建/销毁，保住项根本身的焦点/属性。子树 DOM
     * 由 compileChild(reuseEl) 清空重建（compileChild 会 removeChild 旧子节点）。
     *
     * **两阶段执行（ADR-0076）**：Pass 1 对全部 (B) 项先集中调 destroyItemScopes（清场），
     * 再统一调 compileRebound（注册）——单项内「先销毁后重建」正确，但逐项串行时同路径
     * 会交叉（A 的注销删掉 B 刚注册的 form 条目 / B 复用 A 尚未销毁的活条目错拿 initial），
     * 两阶段提供事务性，根除互换/插入推挤竞态。
     *
     * 注：子节点级焦点彻底保留需 core 提供「对象身份订阅」（订阅与 index 解耦），见 v3 路线。
     */
    private destroyItemScopes;
    private compileRebound;
    /**
     * 销毁单个列表项：destroy 全部成员 scope（递归清理子树 watcher + 自移除父级 children）+
     *  remove 全部成员节点 + 从 itemMap 移除。
     *
     * 进出场动画（ADR-0039 决策 9/10）：scope **立即销毁**（离场项 inert）、itemMap **立即除名**
     * （后续 render 视其为不存在）；DOM 移除延迟到离场动画播完——离场节点暂驻容器作「外来节点」，
     * Pass 3 相对序比对跳过之。同 key 快速删建时新旧节点短暂共处（与 eager 分支同权的共演语义）。
     */
    private destroyItem;
    /**
     * 销毁全部项 scope 并移除其 DOM。
     * render 全量重建前与 destroy 时共用（DRY）：按项分组逐成员清理，保证复合项的每个成员 scope/watcher 都被释放。
     */
    private clearItems;
    /**
     * 挂载当前激活的 special（如 x-empty）：逐模板 compileChild 克隆编译后按文档序 append 进容器。
     *
     * localData 传**空对象 {}**——不注入 item/$index（空状态下它们无意义），空元素上的绑定
     * （x-text/:class 等）经 scope.getContext() 回退到父作用域求值，与"把空元素挪到 x-for 外当兄弟"语义一致。
     * compileChild 内部 removeDirectives 会剥离 x-empty 属性，输出 DOM 无 x-empty 残留。
     * 多个 x-empty 全部渲染、按文档序占位。
     */
    private mountSpecial;
    /**
     * 拆除当前已挂载的 special：destroy 全部 scope（递归 off watcher + 移出 parent.children）+ remove 节点。
     *
     * ⚠️ 不能 clear 整个 binding.children——它与 item scope 共享同一 Set（compileChild 都 addChild 到 binding），
     * 全清会误杀 item。故用显式 specialScopes/specialNodes 数组精确清理（与 if.ts 的 destroyChildren 区别所在）。
     *
     * 离场动画（ADR-0039）：scope 立即销毁，节点移除延迟（同 destroyItem 语义）。
     */
    private destroySpecial;
    /** 求值 :key（如 item.id）。形参用项变量名，使嵌套场景自定义变量名（cell/row 等）的 :key 也能正确解析 */
    private evalKey;
    destroy(): void;
    /** 清理虚拟列表资源 */
    private _teardownVirtualScroll;
}
