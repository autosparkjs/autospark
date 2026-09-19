import { AutoSparkDirectiveBase } from "../base";
import type { AutoDirectiveInfo } from "../types";
import { isSimpleStatePath, type AutoSparkScope } from "../../scope";
import { isDataScript } from "../../compile/dataScript";
import { resolveAnimate } from "../../animate";
import type { AutoSpark } from "../../engine";

// ── 虚拟列表常量 ──────────────────────────────────────────────────────────────

/** 默认滚动条样式 <style> 的 id（static initialize 幂等注入） */
const VIRTUAL_STYLES_ID = "x-for-virtual-styles";

/** 虚拟列表容器属性名（标记 + 选择器） */
const VIRTUAL_ATTR = "autospark-virtual";

/** 默认 overscan 项数 */
const DEFAULT_OVERSCAN = 5;

/** 默认回收池倍数（池大小 = visibleCount * POOL_MULTIPLIER） */
const POOL_MULTIPLIER = 2;

/** data-index 属性名 */
const DATA_INDEX_ATTR = "data-index";

/** x-for 单个列表项的运行时实体（v2 key-based 复用） */
type ForItemEntry = {
    /** 项数据对象（复用时若引用变，原地更新 localData 后 refresh） */
    item: any;
    /** 项在当前列表中的位置序号（index 变 → 项内订阅路径含旧 index 失效 → 重建） */
    index: number;
    /** 该项各成员的 scope（复合项 >1，与 nodes 同序） */
    scopes: AutoSparkScope[];
    /** 该项各成员的渲染节点（与 scopes 同构、同序） */
    nodes: HTMLElement[];
    /** 该项共享的局部作用域（复用时 Object.assign 原地更新，禁止替换引用） */
    localData: Record<string, any>;
};

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
export class ForDirective extends AutoSparkDirectiveBase {
    static override readonly priority = 100;
    static override readonly singleton = true;
    /** x-for 永远占有子树：其子节点是项模板，由本指令逐项克隆编译，通用 walk 不得递归 */
    static override ownsChildren(_info: AutoDirectiveInfo): boolean {
        return true;
    }

    /** 注入默认虚拟列表滚动条样式（幂等；多 engine 实例共享 document） */
    static override initialize(_engine: AutoSpark): void {
        if (typeof document === "undefined" || !document.head) return;
        if (document.getElementById(VIRTUAL_STYLES_ID)) return;
        const style = document.createElement("style");
        style.id = VIRTUAL_STYLES_ID;
        style.textContent = `
/* x-for 虚拟列表默认滚动条样式 */
[${VIRTUAL_ATTR}] {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.3) transparent;
}
[${VIRTUAL_ATTR}]::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
[${VIRTUAL_ATTR}]::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
}
[${VIRTUAL_ATTR}]::-webkit-scrollbar-track {
  background: transparent;
}`;
        document.head.appendChild(style);
    }

    /**
     * "容器内渲染一次的特例子节点"描述符表。
     *
     * 每条描述一个命名空状态：用 `match` 属性在容器子节点中识别其模板、用 `when(raw)` 判定
     * 何时激活、多个同时激活时按 `priority` 取最高。**加新特例（如 x-loading）只改此表，不碰 render()。**
     *
     * `when` 收**原始** items 值（未经 Array.isArray 归一化），使 `undefined`（未加载）与 `[]`（真空）
     * 可被不同描述符分别认领——例如未来 x-loading 以更高 priority 认领 `undefined`，x-empty 只认空数组。
     */
    private static readonly SPECIAL_CHILDREN: ReadonlyArray<{
        name: string;
        /** 子节点上用于识别该特例模板的属性名（如 "x-empty"） */
        match: string;
        /** 是否激活。入参为原始 items 值（未归一化） */
        when: (rawItems: any) => boolean;
        /** 多个特例同时激活时的优先级，大者胜出 */
        priority: number;
    }> = [
        {
            name: "empty",
            match: "x-empty",
            // 只认"真数组且长度为 0"——把 undefined/null/非数组留给未来 x-loading（priority 更高者认领），
            // 避免"加载中（items 尚为 undefined）"被误判为"无数据"。
            when: (raw) => Array.isArray(raw) && raw.length === 0,
            priority: 10,
        },
    ];

    private itemName = "item";
    private indexName = "index";
    private itemsPath = "";
    private keyExpr: string | null = null;
    /** 复合项模板：容器下【非 special】的元素子节点（单子节点时长度为 1）。
     *  命中 SPECIAL_CHILDREN.match（如 x-empty）的子节点已分入 specialTemplates，不在此列。 */
    private itemTemplates: HTMLElement[] = [];
    /** special 子节点模板：name → 模板数组（文档序）。如 x-empty 子节点。
     *  与 itemTemplates 同源（均取自 this.template.children，clone 重建已保证脱离 live DOM）。 */
    private specialTemplates = new Map<string, HTMLElement[]>();
    /** 当前激活的 special 名（null=无 special、显示 items）。作幂等锚点：同名则跳过重挂载。 */
    private activeSpecial: string | null = null;
    /** 已挂载 special 的 scope 与 DOM 节点——精确清理用。
     *  ⚠️ 不能 clear 整个 binding.children：它与 item scope 共享同一 Set（compileChild 都 addChild 到 binding）。 */
    private specialScopes: AutoSparkScope[] = [];
    private specialNodes: HTMLElement[] = [];
    /** 列表项运行时实体索引：key → ForItemEntry。
     *  v2 按 key 复用/增删/重建；无 :key 时 key=index（evalKey 回退）。 */
    private itemMap = new Map<unknown, ForItemEntry>();
    /** 上次 render 的 items 长度：P2 脏标记——length 未变且 item 引用未变时跳过该项 refresh。
     *  -1 哨兵：首次 render 必 lengthChanged（但首次均走 create 分支，不进复用，无副作用）。 */
    private _lastRenderLength = -1;
    /**
     * 首次渲染守卫（ADR-0039 决策 6）：首渲 N 项不整队播进场动画；此后状态变化引起的
     * 项增删 / special 挂卸才播。与 x-if / x-switch / x-show 的同款守卫一致。
     */
    private firstRender = true;
    /** 动画配置缓存（DRY：避免每次事件重复 resolveAnimate + getOption） */
    private _anim = resolveAnimate(undefined);

    // ── 虚拟列表状态 ──────────────────────────────────────────────────────────

    /** 是否启用虚拟列表模式 */
    private _virtual = false;
    /** 每项高度（像素）。由 x-for-options="{itemHeight:40}" 指定，或自动检测 */
    private _itemHeight = 0;
    /** 自动检测的 itemHeight（用户未指定时使用） */
    private _autoItemHeight = 0;
    /** 缓冲区项数 */
    private _overscan = DEFAULT_OVERSCAN;
    /** 当前第一个可见项索引 */
    private _firstVisibleIndex = 0;
    /** 可见项数（含 overscan） */
    private _visibleCount = 0;
    /** 滚动事件 rAF 句柄 */
    private _scrollRafId: number | null = null;
    /** ResizeObserver 实例 */
    private _resizeObserver: ResizeObserver | null = null;
    /** data-index 绑定的状态路径（用户通过 :data-index="xxx" 绑定） */
    private _dataIndexBinding: string | null = null;
    /** 是否正在程序化滚动（避免滚动事件循环） */
    private _isScrollingToIndex = false;
    /** 是否正在由滚动/渲染更新 data-index（防止 MutationObserver 反馈循环） */
    private _isUpdatingDataIndex = false;
    /** 虚拟列表底部垫片元素（撑起总高度使滚动条正确） */
    private _spacerEl: HTMLElement | null = null;
    /** 虚拟列表顶部垫片元素（将项推到正确的滚动位置） */
    private _topSpacerEl: HTMLElement | null = null;

    // ── 分页状态 ──────────────────────────────────────────────────────────

    /** 是否启用分页模式（.paging 修饰符） */
    private _paging = false;
    /** 当前页码（1-based） */
    private _page = 1;
    /** 每页条数 */
    private _pageSize = 10;
    /** 总页数（0=未知，load-more 模式） */
    private _pageCount = 0;
    /** 是否还有下一页 */
    private _hasMore = true;
    /** 是否正在加载 */
    private _loading = false;
    /** 错误信息 */
    private _error: string | null = null;
    /** loader action 名 */
    private _loaderName: string | null = null;
    /** :data-paging 绑定的状态路径 */
    private _pagingBindingPath: string | null = null;
    /** autoLoad 开关 */
    private _autoLoad = true;
    /** loader 模式是否已完成过一次加载（autoLoad:false 手动首载：未加载过时同值 page 写入放行触发） */
    private _hasLoaded = false;

    override created() {
        this._anim = resolveAnimate(this.getOption("animate"));
        this.parse();
        // 既无项模板也无 special 模板才放弃：允许"仅有 x-empty、无项模板"的容器继续（仅渲染空状态）
        if (
            !this.itemsPath ||
            (this.itemTemplates.length === 0 && this.specialTemplates.size === 0)
        )
            return;

        // 检测分页模式（.paging 修饰符）
        this._paging = this.info.modifiers?.includes("paging") === true
            || this.getOption("paging") === true;

        if (this._paging) {
            // 互斥：.paging + .virtual → 忽略 virtual
            if (this.getOption("virtual") === true) {
                this.warn("x-for: .paging 与 .virtual 互斥，virtual 已忽略");
            }
            this._virtual = false;

            // 读取分页配置
            this._loaderName = this.getOption("loader") ?? null;
            this._pageSize = Math.max(1, Number(this.getOption("pageSize")) || 10);
            this._autoLoad = this.getOption("autoLoad") !== false;

            // 检测 :data-paging 绑定
            const tpl = this.template;
            this._pagingBindingPath = tpl?.getAttribute(":data-paging")
                ?? tpl?.getAttribute("x-bind:data-paging")
                ?? null;

            // 初始化分页状态
            this._page = 1;
            this._pageCount = 0;
            this._hasMore = true;
            this._loading = false;
            this._error = null;

            // 从 :data-paging 读取初始值
            if (this._pagingBindingPath) {
                const bindingObj = this.binding.read(this._pagingBindingPath);
                if (bindingObj && typeof bindingObj === "object") {
                    if (typeof bindingObj.page === "number" && bindingObj.page >= 1) {
                        this._page = bindingObj.page;
                    }
                    if (typeof bindingObj.pageSize === "number" && bindingObj.pageSize >= 1) {
                        this._pageSize = bindingObj.pageSize;
                    }
                }
            }
            // 立即同步：重建 scope.paging 快照（无绑定也存在）+ 确保绑定对象上派生属性存在
            this._syncPagingState();
        }

        // 检测虚拟列表模式（分页模式下跳过）
        if (!this._paging) {
            this._virtual = this.getOption("virtual") === true;
            if (this._virtual) {
                this.setupVirtualOptions();
            }
        }

        // 监听 items 路径，变化时全量重建（回调经 scheduler 合并）
        this.binding.watch(this.itemsPath, () => this.render());
        // 项级监听（P0）：纯路径 itemsPath 时补 `items.*`，捕获 `items[i]={...}` 整体替换单项。
        // core 对单项替换发 path=items.{i}（type=update），watch(itemsPath) 精确匹配收不到 → 旧版静默不更新。
        // `items.*` 单层通配精确命中项级、不误伤字段级 `items.{i}.field`（`**` 才会误伤 → 退粗粒度）。
        // 表达式 itemsPath（如 items.filter）已由 watchExpression 的 collectDependencies 覆盖，无需补。
        // 走 watchPath 直通：scope.watch 对含 `*` 的路径会误判为表达式走 with 求值（语法错）。
        if (isSimpleStatePath(this.itemsPath)) {
            this.binding.watchPath(`${this.itemsPath}.*`, () => this.render());
        }

        // 分页模式：监听 :data-paging 绑定对象的 page/pageSize 变化。
        // ⚠️ 回调入参是 ScopeWatchListener 的 { value } 包装对象（scope.watchPath/watchExpression
        // 统一传 payload），必须解包 .value 后再 Number()——直接 Number(payload) 得 NaN，条件恒假，
        // 翻页静默失效（连带 hasMore 不回写、翻页按钮约束全部失效）。
        // page 上界钳位：pageCount 已知（>0）时拒绝越界页码（客户端模式 readItems 亦有钳位兜底）。
        if (this._paging && this._pagingBindingPath) {
            this.binding.watch(`${this._pagingBindingPath}.page`, (payload) => {
                let p = Number(payload?.value);
                if (!Number.isFinite(p) || p < 1) return;
                // 恒等早退防回写循环。例外：loader 模式尚未加载过时放行——autoLoad:false 的手动首载
                // 依赖绑定对象初值不预设 page（undefined→1 是值变化、有信号），写入同值 page 触发首载
                if (p === this._page && (!this._loaderName || this._hasLoaded)) return;
                if (this._pageCount > 0 && p > this._pageCount) {
                    // 越界页码钳位到末页：先更新 _page 再回写绑定对象（回写的是钳位值而非旧值）
                    p = this._pageCount;
                    this._page = p;
                    this._syncPagingState();
                } else {
                    this._page = p;
                }
                if (this._loaderName) {
                    this._loadPage(p);
                } else {
                    this.render();
                }
            });
            this.binding.watch(`${this._pagingBindingPath}.pageSize`, (payload) => {
                const s = Number(payload?.value);
                if (Number.isFinite(s) && s >= 1 && s !== this._pageSize) {
                    this._pageSize = s;
                    this._page = 1; // pageSize 变化时重置到第一页
                    if (this._loaderName) {
                        this._loadPage(1);
                    } else {
                        this.render();
                    }
                }
            });
        }

        // 分页模式：首次加载
        if (this._paging) {
            this.engine.scheduler.schedule(() => {
                if (this._loaderName && this._autoLoad) {
                    this._loadPage(this._page);
                } else {
                    this.render();
                }
            });
        } else {
            // 首次渲染延迟到 microtask：created 在 compileElement 内同步执行，
            // 此时容器尚未挂载到文档；经 engine.compile 的 flushAll 在容器挂载后执行 render，
            // 以 container.appendChild 把各项插入容器。
            this.engine.scheduler.schedule(() => this.render());
        }
    }

    // ── 虚拟列表方法 ──────────────────────────────────────────────────────────

    /** 初始化虚拟列表选项并设置事件监听 */
    private setupVirtualOptions() {
        const container = this.el;
        if (!container) return;

        // 读取配置
        const itemHeightOpt = this.getOption("itemHeight");
        const overscanOpt = this.getOption("overscan");

        // itemHeight 配置验证
        if (itemHeightOpt !== undefined) {
            const h = Number(itemHeightOpt);
            if (!Number.isFinite(h) || h <= 0) {
                this.warn(
                    `x-for.virtual: itemHeight 值无效（${JSON.stringify(itemHeightOpt)}），退化为全量渲染`,
                );
                this._virtual = false;
                return;
            }
            this._itemHeight = h;
        }

        // overscan 配置
        if (overscanOpt !== undefined) {
            const o = Number(overscanOpt);
            if (Number.isFinite(o) && o >= 0) {
                this._overscan = Math.floor(o);
            }
        }

        // 添加虚拟列表标记属性
        container.setAttribute(VIRTUAL_ATTR, "");

        // 创建滚动高度垫片元素（撑起总高度使滚动条正确）
        this._createSpacers();

        // 检测 :data-index 绑定
        this._detectDataIndexBinding();

        // 设置滚动事件监听（passive + rAF）
        this._setupScrollListener();

        // 设置 ResizeObserver 监听容器尺寸变化
        this._setupResizeObserver();

        // 监听 data-index 属性变化以支持程序化滚动
        this._observeDataIndex();
    }

    /** 创建/更新滚动高度垫片元素 */
    private _createSpacers() {
        const container = this.el;
        if (!container) return;

        const spacerStyle = "margin:0;padding:0;overflow:hidden;pointer-events:none;";

        if (!this._topSpacerEl) {
            this._topSpacerEl = document.createElement("div");
            this._topSpacerEl.setAttribute("aria-hidden", "true");
            this._topSpacerEl.style.cssText = spacerStyle + "height:0;";
            container.appendChild(this._topSpacerEl);
        }

        if (!this._spacerEl) {
            this._spacerEl = document.createElement("div");
            this._spacerEl.setAttribute("aria-hidden", "true");
            this._spacerEl.style.cssText = spacerStyle + "height:0;";
            container.appendChild(this._spacerEl);
        }
    }

    /** 更新垫片高度以匹配总列表高度 */
    private _updateSpacerHeights(topHeight: number, visibleEndIndex: number) {
        if (this._topSpacerEl) {
            this._topSpacerEl.style.height = `${topHeight}px`;
        }
        if (this._spacerEl) {
            const items = this.readItems();
            const itemHeight = this._getItemHeight();
            if (items.length > 0 && itemHeight > 0) {
                // 底部垫片 = 剩余未渲染项的高度
                const remaining = Math.max(0, items.length - visibleEndIndex);
                this._spacerEl.style.height = `${remaining * itemHeight}px`;
            } else {
                this._spacerEl.style.height = "0px";
            }
        }
    }

    /** 检测 :data-index 绑定的状态路径 */
    private _detectDataIndexBinding() {
        const container = this.el;
        if (!container) return;

        // 检查容器上的 :data-index 或 x-bind:data-index 属性
        // 注意：removeDirectives 已从 el 上移除这些属性，需要检查 template
        const tpl = this.template;
        if (tpl) {
            const bindAttr =
                tpl.getAttribute(":data-index") ??
                tpl.getAttribute("x-bind:data-index");
            if (bindAttr) {
                this._dataIndexBinding = bindAttr.trim();
            }
        }
    }

    /** 设置滚动事件监听（passive + rAF 节流） */
    private _setupScrollListener() {
        const container = this.el;
        if (!container) return;

        const onScroll = () => {
            if (this._isScrollingToIndex) return;
            if (this._scrollRafId !== null) return;
            this._scrollRafId = requestAnimationFrame(() => {
                this._scrollRafId = null;
                this._onScroll();
            });
        };

        container.addEventListener("scroll", onScroll, { passive: true });
        // 保存引用以便销毁时移除
        this._scrollListener = onScroll;
    }

    /** 滚动事件监听器引用（用于销毁时移除） */
    private _scrollListener: (() => void) | null = null;

    /** 设置 ResizeObserver 监听容器尺寸变化 */
    private _setupResizeObserver() {
        if (typeof ResizeObserver === "undefined") return;

        const container = this.el;
        if (!container) return;

        this._resizeObserver = new ResizeObserver(() => {
            this._onResize();
        });
        this._resizeObserver.observe(container);
    }

    /** 滚动事件处理：更新可见项范围 */
    private _onScroll() {
        if (!this._virtual || this.activeSpecial) return;

        const container = this.el;
        if (!container) return;

        const items = this.readItems();
        if (items.length === 0) return;

        const itemHeight = this._getItemHeight();
        if (itemHeight <= 0) return;

        const scrollTop = container.scrollTop;
        const viewportHeight = container.clientHeight;

        // 计算第一个可见项索引
        const firstVisible = Math.floor(scrollTop / itemHeight);
        const clampedFirst = Math.max(0, Math.min(firstVisible, items.length - 1));

        // 如果可见项索引变化，更新并触发重渲染
        if (clampedFirst !== this._firstVisibleIndex) {
            this._firstVisibleIndex = clampedFirst;
            this._updateDataIndex(clampedFirst);
            this._renderVirtual();
        }
    }

    /** ResizeObserver 回调：容器尺寸变化时重新计算 */
    private _onResize() {
        if (!this._virtual || this.activeSpecial) return;

        const container = this.el;
        if (!container) return;

        const items = this.readItems();
        if (items.length === 0) return;

        // 重新计算可见项数
        const itemHeight = this._getItemHeight();
        if (itemHeight <= 0) return;

        const viewportHeight = container.clientHeight;
        const newVisibleCount = Math.ceil(viewportHeight / itemHeight) + this._overscan * 2;

        // 如果可见项数变化，触发重渲染
        if (newVisibleCount !== this._visibleCount) {
            this._visibleCount = newVisibleCount;
            this._renderVirtual();
        }
    }

    /** 获取当前 itemHeight（优先使用用户配置，否则自动检测） */
    private _getItemHeight(): number {
        if (this._itemHeight > 0) return this._itemHeight;
        if (this._autoItemHeight > 0) return this._autoItemHeight;
        return 0;
    }

    /** 自动检测 itemHeight：取第一项的实际高度 */
    private _autoDetectItemHeight() {
        if (this._itemHeight > 0 || this._autoItemHeight > 0) return;

        const container = this.el;
        if (!container || container.children.length === 0) return;

        // 取第一个子元素的高度（假设项等高）
        const firstChild = container.firstElementChild;
        if (firstChild) {
            const height = firstChild.getBoundingClientRect().height;
            if (height > 0) {
                this._autoItemHeight = height;
            }
        }
    }

    /** 更新 data-index 属性和绑定的状态 */
    private _updateDataIndex(index: number) {
        const container = this.el;
        if (!container) return;

        this._isUpdatingDataIndex = true;
        try {
            if (this._dataIndexBinding) {
                // 有 :data-index 绑定 → 只更新状态，由 BindDirective 响应式更新 DOM 属性
                try {
                    const state = this.engine.store.state as Record<string, any>;
                    const parts = this._dataIndexBinding.split(".");
                    let target: any = state;
                    for (let i = 0; i < parts.length - 1; i++) {
                        target = target[parts[i]];
                        if (target === undefined || target === null) return;
                    }
                    target[parts[parts.length - 1]] = index;
                } catch {
                    // 静默忽略写入错误
                }
            } else {
                // 无 :data-index 绑定 → 直接更新 DOM 属性
                container.setAttribute(DATA_INDEX_ATTR, String(index));
            }
        } finally {
            this._isUpdatingDataIndex = false;
        }
    }

    /** 监听 data-index 属性变化以支持程序化滚动 */
    private _observeDataIndex() {
        if (!this._virtual || !this._dataIndexBinding) return;

        const container = this.el;
        if (!container) return;

        // 使用 MutationObserver 监听 data-index 属性变化
        this._dataIndexObserver = new MutationObserver((mutations) => {
            // 正在由滚动/渲染更新 data-index → 跳过，避免反馈循环
            if (this._isUpdatingDataIndex) return;
            for (const mutation of mutations) {
                if (
                    mutation.type === "attributes" &&
                    mutation.attributeName === DATA_INDEX_ATTR
                ) {
                    const newIndex = Number(container.getAttribute(DATA_INDEX_ATTR));
                    if (Number.isFinite(newIndex) && newIndex !== this._firstVisibleIndex) {
                        this.scrollToIndex(newIndex);
                    }
                }
            }
        });
        this._dataIndexObserver.observe(container, { attributes: true });
    }

    /** data-index MutationObserver 实例 */
    private _dataIndexObserver: MutationObserver | null = null;

    /** 程序化滚动到指定索引 */
    private scrollToIndex(index: number) {
        const container = this.el;
        if (!container) return;

        const items = this.readItems();
        if (items.length === 0) return;

        const itemHeight = this._getItemHeight();
        if (itemHeight <= 0) return;

        const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
        const scrollTop = clampedIndex * itemHeight;

        this._isScrollingToIndex = true;
        container.scrollTop = scrollTop;
        this._firstVisibleIndex = clampedIndex;

        // 延迟重置标志（等滚动事件处理完毕）
        requestAnimationFrame(() => {
            this._isScrollingToIndex = false;
            this._renderVirtual();
        });
    }

    /** 虚拟列表渲染：只渲染可见项 + overscan */
    private _renderVirtual() {
        const container = this.el;
        if (!container || this.itemTemplates.length === 0) return;

        const items = this.readItems();
        const length = items.length;

        // 自动检测 itemHeight（首次渲染时）
        this._autoDetectItemHeight();

        const itemHeight = this._getItemHeight();
        if (itemHeight <= 0) {
            // itemHeight 无效，退化为全量渲染
            this.warn(
                `x-for.virtual: 无法确定 itemHeight（容器无子元素或高度为 0），退化为全量渲染`,
            );
            this._virtual = false;
            container.removeAttribute(VIRTUAL_ATTR);
            this.render();
            return;
        }

        const viewportHeight = container.clientHeight;
        this._visibleCount = Math.ceil(viewportHeight / itemHeight) + this._overscan * 2;

        // 计算可见范围
        const startIndex = Math.max(0, this._firstVisibleIndex - this._overscan);
        const endIndex = Math.min(length - 1, startIndex + this._visibleCount - 1);
        const visibleEndIndex = endIndex + 1;

        // 更新垫片：顶部垫片推到正确位置，底部垫片撑起剩余高度
        this._updateSpacerHeights(startIndex * itemHeight, visibleEndIndex);

        // 创建/复用可见范围内的项（同时收集 key 用于清理）
        const ordered: ForItemEntry[] = [];
        const visibleKeys = new Set<unknown>();

        for (let index = startIndex; index < visibleEndIndex; index++) {
            const item = items[index];
            const key = this.evalKey(item, index);
            visibleKeys.add(key);
            const old = this.itemMap.get(key);
            let entry: ForItemEntry;

            if (old && old.index === index) {
                // 复用
                entry = old;
                const itemChanged = old.item !== item;
                entry.item = item;
                Object.assign(entry.localData, this.buildLocalData(item, index, length));
                if (itemChanged) {
                    for (const scope of entry.scopes) scope.refresh();
                }
            } else if (old) {
                // 重绑定
                entry = this.rebindItem(old, item, index, length);
                this.itemMap.set(key, entry);
            } else {
                // 新建
                entry = this.createItem(item, index, length);
                this.itemMap.set(key, entry);
            }
            ordered.push(entry);
        }

        // 销毁不在可见范围内的项
        for (const key of this.itemMap.keys()) {
            if (!visibleKeys.has(key)) {
                this.destroyItem(key, false);
            }
        }

        // DOM 重排：结构为 [topSpacer, item0, item1, ..., bottomSpacer]
        // 先确保两个垫片在容器中
        if (this._topSpacerEl && this._topSpacerEl.parentNode !== container) {
            container.appendChild(this._topSpacerEl);
        }
        if (this._spacerEl && this._spacerEl.parentNode !== container) {
            container.appendChild(this._spacerEl);
        }

        const flatNodes = ordered.flatMap((e) => e.nodes);

        // 快速检查是否需要重排：只检查首尾节点
        let needsReorder = flatNodes.length === 0;
        if (!needsReorder) {
            const children = container.children;
            let firstItem: Element | null = null;
            let lastItem: Element | null = null;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (child !== this._topSpacerEl && child !== this._spacerEl) {
                    if (!firstItem) firstItem = child;
                    lastItem = child;
                }
            }
            needsReorder =
                !firstItem ||
                !lastItem ||
                firstItem !== flatNodes[0] ||
                lastItem !== flatNodes[flatNodes.length - 1];
        }

        if (needsReorder) {
            // 清除容器内所有非垫片子节点
            const toRemove: Node[] = [];
            for (const child of Array.from(container.children)) {
                if (child !== this._topSpacerEl && child !== this._spacerEl) {
                    toRemove.push(child);
                }
            }
            for (const node of toRemove) {
                container.removeChild(node);
            }
            // 按序插入：topSpacer → items → bottomSpacer
            for (const node of flatNodes) {
                container.insertBefore(node, this._spacerEl);
            }
        }

        // 更新 data-index
        this._updateDataIndex(this._firstVisibleIndex);
    }

    // ── 分页方法 ──────────────────────────────────────────────────────────

    /**
     * 创建分页模式的 localData Proxy：拦截 $page/$pageSize 写操作，
     * 自动触发 loader 或 render。
     */
    private _createPagingLocals(base: Record<string, any>): Record<string, any> {
        const directive = this;
        return new Proxy(base, {
            set(target, prop: string | symbol, value) {
                if (prop === "$page") {
                    const newPage = Number(value);
                    if (Number.isFinite(newPage) && newPage >= 1 && newPage !== directive._page) {
                        directive._page = newPage;
                        directive._syncPagingState();
                        if (directive._loaderName) {
                            directive._loadPage(newPage);
                        } else {
                            directive.engine.scheduler.schedule(() => directive.render());
                        }
                    }
                    target[prop] = value;
                    return true;
                }
                if (prop === "$pageSize") {
                    const newPageSize = Number(value);
                    if (Number.isFinite(newPageSize) && newPageSize >= 1 && newPageSize !== directive._pageSize) {
                        directive._pageSize = newPageSize;
                        directive._page = 1;
                        target["$page"] = 1;
                        directive._syncPagingState();
                        if (directive._loaderName) {
                            directive._loadPage(1);
                        } else {
                            directive.engine.scheduler.schedule(() => directive.render());
                        }
                    }
                    target[prop] = value;
                    return true;
                }
                target[prop] = value;
                return true;
            },
        });
    }

    /**
     * 加载指定页数据（服务端分页）。
     * 调用 loader action，将返回数据追加到 items，同步分页状态。
     */
    private async _loadPage(page: number) {
        if (this._loading || !this._loaderName) return;

        this._loading = true;
        this._error = null;
        this._syncPagingState();
        this._forceRefreshPagingVars();

        try {
            const desc = this.binding.getAction(this._loaderName);
            if (!desc) {
                throw new Error(`x-for.paging: loader action "${this._loaderName}" 未找到`);
            }

            const ctx = {
                el: this.el,
                data: this.binding.getContext(),
                scope: this.binding,
                store: this.engine.store,
                state: this.engine.store.state,
                engine: this.engine,
            };

            const result = await desc.handle.call(ctx, { page, pageSize: this._pageSize });

            if (!result || !Array.isArray(result.data)) {
                throw new Error("x-for.paging: loader 必须返回 { data: [...], page, pageSize, pageCount }");
            }

            // 用服务端返回值更新状态
            this._page = result.page ?? page;
            this._pageSize = result.pageSize ?? this._pageSize;
            this._pageCount = result.pageCount ?? 0;
            this._hasLoaded = true;

            // 追加数据到 items（去重）
            this._appendItems(result.data, this._page);

            // 更新 hasMore
            this._hasMore = result.data.length > 0
                && (this._pageCount === 0 || this._page < this._pageCount);

            this._syncPagingState();
            this.engine.scheduler.schedule(() => this.render());
        } catch (e: any) {
            this._error = e instanceof Error ? e.message : String(e);
            this._syncPagingState();
        } finally {
            this._loading = false;
            this._syncPagingState();
            this._forceRefreshPagingVars();
        }
    }

    /**
     * 去重追加数据到 items 数组。
     * 基于页偏移计算：loadedPage 页的数据从 items[(loadedPage-1)*pageSize] 开始。
     * 已有位置做替换，超出部分做追加。
     */
    private _appendItems(loadedData: any[], loadedPage: number): void {
        const items = this.binding.read(this.itemsPath);
        if (!Array.isArray(items)) {
            this._setItems([...loadedData]);
            return;
        }

        if (loadedData.length === 0) return;

        // 计算该页数据在完整数据集中的起始偏移
        const startOffset = (loadedPage - 1) * this._pageSize;

        // 确保 items 长度足够（填充空位）
        while (items.length < startOffset) {
            items.push(undefined);
        }

        // 替换/追加
        for (let i = 0; i < loadedData.length; i++) {
            const idx = startOffset + i;
            if (idx < items.length) {
                items[idx] = loadedData[i];
            } else {
                items.push(loadedData[i]);
            }
        }
    }

    /**
     * 通过 store.state 写入 items 路径（用于 items 非数组时创建新数组）。
     */
    private _setItems(newItems: any[]): void {
        const path = this.itemsPath;
        const parts = path.split(".");
        let target: any = this.engine.store.state;
        for (let i = 0; i < parts.length - 1; i++) {
            target = target[parts[i]];
        }
        target[parts[parts.length - 1]] = newItems;
    }

    /**
     * 将分页状态同步到外部：先重建容器 scope 上的 paging 冻结快照（ADR-0042 分页状态读取器，
     * 有无 :data-paging 绑定均执行），再回写绑定对象（有绑定时）。
     */
    private _syncPagingState() {         // 快照冻结、每次变化整体重建（不可变）；挂 scope 实例（不进 state.$scopes），随 scope 生命周期回收
        this.binding.paging = Object.freeze({
            page: this._page,
            pageSize: this._pageSize,
            pageCount: this._pageCount,
            hasMore: this._hasMore,
            loading: this._loading,
            error: this._error,
            total: this._pageCount > 0 ? this._pageCount * this._pageSize : 0,
        });

        if (!this._pagingBindingPath) return;

        const parts = this._pagingBindingPath.split(".");
        let target: any = this.engine.store.state;
        for (let i = 0; i < parts.length - 1; i++) {
            target = target[parts[i]];
            if (target === undefined || target === null) return;
        }
        const obj = target[parts[parts.length - 1]];
        if (obj && typeof obj === "object") {
            // autoLoad:false 未首载时推迟回写 page：绑定对象初值省略 page 的话，用户首次写
            // page=1 才是值变化（有信号）——提前回写会把首载写变回同值赋值（autostore 不发信号，手动首载失效）
            const deferPage = !this._autoLoad && !this._hasLoaded;
            if (!deferPage) obj.page = this._page;
            obj.pageSize = this._pageSize;
            obj.pageCount = this._pageCount;
            obj.hasMore = this._hasMore;
            obj.loading = this._loading;
            obj.error = this._error;
            obj.total = this._pageCount > 0 ? this._pageCount * this._pageSize : 0;
        }
    }

    /**
     * 强制所有项 scope refresh，让 $loading/$error 等变量在 DOM 中更新。
     */
    private _forceRefreshPagingVars() {
        for (const entry of this.itemMap.values()) {
            for (const scope of entry.scopes) {
                scope.refresh();
            }
        }
    }

    /** 解析 "item of items" / "item,index of items" 与 :key（可选），并采集复合项模板 */
    private parse() {
        const raw = String(this.value ?? "").trim();
        const m = raw.match(/^([\w$]+)(?:\s*,\s*([\w$]+))?\s+of\s+(.+)$/);
        if (!m) {
            this.error(`x-for: invalid expression "${raw}"`);
            return;
        }
        const [, item, idx, path] = m;
        if (!item || !path) {
            this.error(`x-for: invalid expression "${raw}"`);
            return;
        }
        this.itemName = item;
        if (idx) this.indexName = idx;
        this.itemsPath = path.trim();
        // B 语义：x-for 元素自身是容器。其元素子节点二分为：
        //  - 命中 SPECIAL_CHILDREN.match（如 x-empty）→ specialTemplates（渲染一次的特例，不随项重复）
        //  - 其余 → itemTemplates（复合项模板，随每项重复）
        // tpl.children 仅含 Element 节点，空白/注释/文本节点天然排除。
        // 数据脚本（ADR-0032）在 compileElement 已 warn 放弃注入；x-fallback 特例子节点
        //（ADR-0033）由父元素 DataDirective 采集——项成员根以 cloneNode(false) 直建、绕过
        // transformer 剪枝，故二者均在此跳过采集（不进渲染 DOM、不随项重复）。
        // x-else-if / x-else 分支标记（ADR-0034）与 x-case / x-default 分支标记（ADR-0037）同理
        // 跳过：x-for 容器非 x-if / x-switch 宿主，其直接子级的分支标记是孤儿——且项成员编译
        // 走 compileChild 不经主 walk 剪枝层，不在此拦会被当普通项模板随每项渲染。
        const tpl = this.template;
        if (tpl) {
            for (const child of Array.from(tpl.children)) {
                if (
                    !(child instanceof HTMLElement) ||
                    isDataScript(child) ||
                    child.hasAttribute("x-fallback")
                ) {
                    continue;
                }
                if (child.hasAttribute("x-else-if") || child.hasAttribute("x-else")) {
                    this.warn(
                        `x-for: 容器直接子级不应声明 x-else-if/x-else（分支必须是 x-if 宿主的直接子元素），该分支被丢弃（ADR-0034）`,
                    );
                    continue;
                }
                if (child.hasAttribute("x-case") || child.hasAttribute("x-default")) {
                    this.warn(
                        `x-for: 容器直接子级不应声明 x-case/x-default（分支必须是 x-switch 宿主的直接子元素），该分支被丢弃（ADR-0037）`,
                    );
                    continue;
                }
                const matched = ForDirective.SPECIAL_CHILDREN.find((s) =>
                    child.hasAttribute(s.match),
                );
                if (matched) {
                    const arr = this.specialTemplates.get(matched.name) ?? [];
                    arr.push(child);
                    this.specialTemplates.set(matched.name, arr);
                } else {
                    this.itemTemplates.push(child);
                }
            }
        }
        if (this.itemTemplates.length === 0 && this.specialTemplates.size === 0) {
            this.error(
                `x-for: 缺少项模板（容器无元素子节点，path="${this.itemsPath}"）`,
            );
        }
        // :key 可选：未提供时 evalKey 回退用 index
        this.keyExpr = tpl?.getAttribute(":key") ?? tpl?.getAttribute("x-bind:key") ?? null;
    }

    private readItems(): any[] {
        // 经 scope.read 双轨求值：纯路径走 getVal，表达式（如 items.filter(...)）走 with(scope)。
        // 与 binding.watch 的求值方式一致，确保 watch 触发的重建读到同一份经筛选/映射的数据。
        const items = this.binding.read(this.itemsPath);
        const arr = Array.isArray(items) ? items : [];

        // 客户端分页（无 loader）：slice 当前页
        if (this._paging && !this._loaderName) {
            const start = (this._page - 1) * this._pageSize;
            const end = start + this._pageSize;

            // 重新计算 pageCount
            this._pageCount = Math.ceil(arr.length / this._pageSize);
            if (this._page > this._pageCount && this._pageCount > 0) {
                this._page = this._pageCount;
            }
            this._hasMore = this._page < this._pageCount;
            this._syncPagingState();

            return arr.slice(start, end);
        }

        // 服务端翻页渲染：总页数已知（pageCount>0）为翻页语义，只渲染当前页切片——
        // 数据仍全量累积在 items（_appendItems 按页偏移写入，(page-1)*pageSize 起的切片即当前页）。
        // pageCount=0（load-more，总页数未知）保持累积全量渲染（ADR-0042 追加式数据）。
        if (this._paging && this._loaderName && this._pageCount > 0) {
            const start = (this._page - 1) * this._pageSize;
            return arr.slice(start, start + this._pageSize);
        }

        return arr;
    }

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
    private render() {
        const container = this.el;
        if (!container || (this.itemTemplates.length === 0 && this.specialTemplates.size === 0))
            return;

        // 分页模式：加载中且无数据时不渲染（避免误触发 x-empty）
        if (this._paging && this._loading && this.itemMap.size === 0) {
            return;
        }

        // 首渲静默（ADR-0039 决策 6）：此后项增删 / special 挂卸才播进出场
        const animate = !this.firstRender;
        this.firstRender = false;

        // === special 决策：取 priority 最高、且有模板、且 when(raw) 为真的描述符 ===
        // special 决策必须先于虚拟列表模式判断，确保空列表时 x-empty 能正确显示
        const raw = this.binding.read(this.itemsPath);
        const activeSpecial = ForDirective.SPECIAL_CHILDREN.filter(
            (s) => this.specialTemplates.has(s.name) && s.when(raw),
        ).sort((a, b) => b.priority - a.priority)[0];

        if (activeSpecial) {
            // special 激活（如 x-empty：items 必为空数组）→ 挂载空状态、短路，跳过 4-pass diff。
            if (this.activeSpecial !== activeSpecial.name) {
                if (this.activeSpecial) {
                    this.destroySpecial(animate); // empty(S)→empty(T)：拆旧 special（items 已空，无需 clearItems）
                } else {
                    this.clearItems(animate); // items→empty：拆项
                }
                this.mountSpecial(activeSpecial, animate);
                this.activeSpecial = activeSpecial.name;
            }
            // empty(S)→empty(S)：幂等 no-op（C2，避免 items.* 反复触发重编译空节点）
            this._lastRenderLength = Array.isArray(raw) ? raw.length : 0;
            return; // C1：special 节点只在此分支进 container，跳过比较 container.children 的 Pass 3
        }

        // 无 special 激活 → 显示 items。若此前挂着 special（empty→items），先拆除。
        if (this.activeSpecial) {
            this.destroySpecial(animate);
            this.activeSpecial = null;
        }

        // 虚拟列表模式：委托给 _renderVirtual()
        if (this._virtual) {
            this._renderVirtual();
            return;
        }

        const items = this.readItems();
        const length = items.length;
        // P2 脏标记：length 变 → $length/$end/$begin 等派生变量变 → 复用项需 refresh
        const lengthChanged = this._lastRenderLength !== length;
        this._lastRenderLength = length;
        const seen = new Set<unknown>();
        // 本轮渲染的有序 entry 列表（含复用/重建/新建），供 Pass 3 重排
        const ordered: ForItemEntry[] = [];
        // 复用项集合，供 Pass 4 refresh
        const reuseEntries: ForItemEntry[] = [];
        // 新建项集合，供 Pass 3 后播进场动画（节点须已插入容器，ADR-0039 决策 10）
        const createdEntries: ForItemEntry[] = [];

        // === Pass 1：对新 items 逐项决策 reuse / recreate / create ===
        for (let index = 0; index < items.length; index++) {
            const item = items[index];
            const key = this.evalKey(item, index);
            if (this.keyExpr && seen.has(key)) {
                this.error(`x-for: duplicate key "${String(key)}"`);
            }
            seen.add(key);
            const old = this.itemMap.get(key);
            let entry: ForItemEntry;
            if (old && old.index === index) {
                // (A) 同 key + index 不变 → 复用 DOM/scope/订阅：原地更新 localData（item + 全部 $*）。
                //    订阅路径含 index、index 不变则订阅仍有效；引用变的内容差异由 Pass 4 refresh patch。
                //    铁律：Object.assign 原地改，禁止换 localData 对象（_scopeView Proxy 闭包绑定引用）。
                entry = old;
                const itemChanged = old.item !== item; // P2 脏标记
                entry.item = item;
                Object.assign(entry.localData, this.buildLocalData(item, index, length));
                // P2 短路：item 引用未变 && length 未变 → localData 内容未变，跳过 refresh
                // （$* 随 Object.assign 重算但值不变；项内字段变更已由字段级 watcher 精准 patch，未进 render）。
                if (itemChanged || lengthChanged) reuseEntries.push(entry);
            } else if (old) {
                // (B) 同 key + index 变（移动）→ 旧订阅路径含旧 index 已失效。
                //    P1：复用项根 DOM（old.nodes）仅销毁旧 scope 重订阅——保住项根本身焦点/属性；
                //    子树 DOM 由 compileChild(reuseEl) 清空重建（子节点焦点彻底保留需 core 对象身份订阅）。
                entry = this.rebindItem(old, item, index, length);
                this.itemMap.set(key, entry);
            } else {
                // (C) 新 key → compileChild 新建 scope+订阅+DOM（首次渲染取最新值）
                entry = this.createItem(item, index, length);
                this.itemMap.set(key, entry);
                createdEntries.push(entry);
            }
            ordered.push(entry);
        }

        // === Pass 2：消失的旧 key → 销毁（有离场动画则延迟移除 DOM，ADR-0039 决策 9/10）===
        for (const key of this.itemMap.keys()) {
            if (!seen.has(key)) {
                this.destroyItem(key, animate);
            }
        }

        // === Pass 3：DOM 重排（P2：相对序已就位则跳过，避免无结构变更的全量 insertBefore）===
        const flatNodes = ordered.flatMap((e) => e.nodes);
        // 相对序判定：只对「本列表当前项」的节点比对文档相对顺序，忽略容器内**外来节点**——
        // 离场动画中的旧项节点仍暂驻容器（延迟移除），旧 length/逐位比对会被其污染，
        // 在纯复用 render 里误判全量重排（ADR-0039 决策 10）。
        const nodeSet = new Set<Node>(flatNodes);
        let pos = 0;
        let needsReorder = false;
        for (const child of Array.from(container.children)) {
            if (!nodeSet.has(child)) continue; // 外来节点（在播离场项等）不参与序比对
            if (child !== flatNodes[pos]) {
                needsReorder = true;
                break;
            }
            pos++;
        }
        if (pos < flatNodes.length) needsReorder = true; // 尚有项节点未在容器中（新建项）
        if (needsReorder) {
            // insertBefore(node, anchor) 把 node 放到 anchor 之前；anchor=null 表示插到末尾。
            // 从后向前：末项先落位（anchor=null 到尾部），anchor 推进到本组首节点，
            // 前一项整组插到它之前。组内正序插入保证复合项成员文档顺序（0..n-1 自上而下）。
            let anchor: Node | null = null;
            for (let j = ordered.length - 1; j >= 0; j--) {
                const nodes = ordered[j]!.nodes;
                for (let k = 0; k < nodes.length; k++) {
                    container.insertBefore(nodes[k]!, anchor);
                }
                anchor = nodes[0]!;
            }
        }

        // === Pass 3.5：新项进场动画（节点已插入容器，ADR-0039 决策 10；复合项逐成员挂类）===
        if (animate && createdEntries.length > 0) {
            const phase = this._anim.enter;
            if (phase) {
                for (const entry of createdEntries) {
                    for (const n of entry.nodes) this.engine.animate.enter(n, phase);
                }
            }
        }

        // === Pass 4：复用项 refresh（localData 已原地更新，驱动项内绑定重求值 patch）===
        // 仅 reuse 项需要：recreate/create 已在 createItem/compileChild 首次渲染。
        // refresh 重算 $length/$end/$begin 等依赖全局长度的派生变量 + 引用变化项的内容。
        for (const entry of reuseEntries) {
            for (const scope of entry.scopes) scope.refresh();
        }
    }

    /** 构造项的 localData（item/index + 全部循环派生变量 $*）。
     *  v2 复用时通过 Object.assign 原地写回同一对象——禁止替换引用，因 watchExpression 的
     *  _scopeView Proxy 闭包绑定了 localData 对象引用，换对象会使 refresh 取不到新值。
     *  分页模式下返回 Proxy 包装的对象，拦截 $page/$pageSize 写操作触发 loader。 */
    private buildLocalData(item: any, index: number, length: number): Record<string, any> {
        const data: Record<string, any> = {
            [this.itemName]: item,
            [this.indexName]: index,
            // 循环派生变量（$ 前缀固定可用，不占用户自定义命名空间）
            $index: index,
            $length: length,
            $begin: index === 0,
            $end: index === length - 1,
            // 对齐 CSS :nth-child —— 第 1,3,5 行（$index 为偶数）为 $odd
            $odd: index % 2 === 0,
            $even: index % 2 === 1,
        };

        // 分页模式：注入分页变量
        if (this._paging) {
            data.$page = this._page;
            data.$pageSize = this._pageSize;
            data.$pageCount = this._pageCount;
            data.$hasMore = this._hasMore;
            data.$loading = this._loading;
            data.$error = this._error;
            data.$total = this._pageCount > 0 ? this._pageCount * this._pageSize : 0;
            // 用 Proxy 拦截 $page/$pageSize 写操作
            return this._createPagingLocals(data);
        }

        return data;
    }

    /** 新建单个列表项：编译全部成员模板，返回 entry。
     *  不插入 DOM、不登记 itemMap、不做重复 key 检测（均由 render 负责）。 */
    private createItem(item: any, index: number, length: number): ForItemEntry {
        const localData = this.buildLocalData(item, index, length);
        const scopes: AutoSparkScope[] = [];
        const nodes: HTMLElement[] = [];
        for (const tpl of this.itemTemplates) {
            const { el, scope } = this.engine.compiler.compileChild(tpl, this.binding, localData);
            scopes.push(scope);
            nodes.push(el);
        }
        return { item, index, scopes, nodes, localData };
    }

    /**
     * 移动复用（P1）：同 key 但 index 变时，复用项根 DOM 节点，仅销毁旧 scope 重新编译订阅。
     *
     * 旧订阅路径含旧 index 已失效（core 路径驱动响应式的固有限制），必须重建订阅；但项根 DOM
     * 节点（old.nodes）保留——避免移动导致的 DOM 创建/销毁，保住项根本身的焦点/属性。子树 DOM
     * 由 compileChild(reuseEl) 清空重建（compileChild 会 removeChild 旧子节点）。
     *
     * 注：子节点级焦点彻底保留需 core 提供「对象身份订阅」（订阅与 index 解耦），见 v3 路线。
     */
    private rebindItem(old: ForItemEntry, item: any, index: number, length: number): ForItemEntry {
        // 销毁旧 scope（off watcher + 清 children），但不 remove DOM——nodes 由 render Pass 3 管理
        for (const s of old.scopes) s.destroy();
        // 用新 localData（新 index）逐成员重新编译，复用 old.nodes 的项根 DOM（reuseEl）。
        // old.nodes 与 itemTemplates 同长（createItem 按模板顺序建 nodes），索引配对安全。
        const localData = this.buildLocalData(item, index, length);
        const scopes: AutoSparkScope[] = [];
        for (let i = 0; i < this.itemTemplates.length; i++) {
            const { scope } = this.engine.compiler.compileChild(
                this.itemTemplates[i]!,
                this.binding,
                localData,
                old.nodes[i]!,
            );
            scopes.push(scope);
        }
        return { item, index, scopes, nodes: old.nodes, localData };
    }

    /**
     * 销毁单个列表项：destroy 全部成员 scope（递归清理子树 watcher + 自移除父级 children）+
     *  remove 全部成员节点 + 从 itemMap 移除。
     *
     * 进出场动画（ADR-0039 决策 9/10）：scope **立即销毁**（离场项 inert）、itemMap **立即除名**
     * （后续 render 视其为不存在）；DOM 移除延迟到离场动画播完——离场节点暂驻容器作「外来节点」，
     * Pass 3 相对序比对跳过之。同 key 快速删建时新旧节点短暂共处（与 eager 分支同权的共演语义）。
     */
    private destroyItem(key: unknown, animate = true): void {
        const entry = this.itemMap.get(key);
        if (!entry) return;
        for (const s of entry.scopes) s.destroy();
        this.itemMap.delete(key);
        const phase = animate ? this._anim.leave : null;
        let deferred = false;
        if (phase) {
            for (const n of entry.nodes) {
                deferred = this.engine.animate.leave(n, phase, () => n.remove()) || deferred;
            }
        }
        if (!deferred) {
            for (const n of entry.nodes) n.remove();
        }
    }

    /**
     * 销毁全部项 scope 并移除其 DOM。
     * render 全量重建前与 destroy 时共用（DRY）：按项分组逐成员清理，保证复合项的每个成员 scope/watcher 都被释放。
     */
    private clearItems(animate = true) {
        for (const key of this.itemMap.keys()) {
            this.destroyItem(key, animate);
        }
        this.itemMap.clear();
    }

    /**
     * 挂载当前激活的 special（如 x-empty）：逐模板 compileChild 克隆编译后按文档序 append 进容器。
     *
     * localData 传**空对象 {}**——不注入 item/$index（空状态下它们无意义），空元素上的绑定
     * （x-text/:class 等）经 scope.getContext() 回退到父作用域求值，与"把空元素挪到 x-for 外当兄弟"语义一致。
     * compileChild 内部 removeDirectives 会剥离 x-empty 属性，输出 DOM 无 x-empty 残留。
     * 多个 x-empty 全部渲染、按文档序占位。
     */
    private mountSpecial(desc: { name: string }, animate = true) {
        const container = this.el;
        const templates = this.specialTemplates.get(desc.name);
        if (!container || !templates) return;
        const phase = animate ? this._anim.enter : null;
        for (const tpl of templates) {
            const { el, scope } = this.engine.compiler.compileChild(tpl, this.binding, {});
            container.appendChild(el);
            this.specialNodes.push(el);
            this.specialScopes.push(scope);
            // 空状态挂载与列表项同权播进场（ADR-0039 决策 10）
            if (phase) this.engine.animate.enter(el, phase);
        }
    }

    /**
     * 拆除当前已挂载的 special：destroy 全部 scope（递归 off watcher + 移出 parent.children）+ remove 节点。
     *
     * ⚠️ 不能 clear 整个 binding.children——它与 item scope 共享同一 Set（compileChild 都 addChild 到 binding），
     * 全清会误杀 item。故用显式 specialScopes/specialNodes 数组精确清理（与 if.ts 的 destroyChildren 区别所在）。
     *
     * 离场动画（ADR-0039）：scope 立即销毁，节点移除延迟（同 destroyItem 语义）。
     */
    private destroySpecial(animate = true) {
        for (const s of this.specialScopes) s.destroy();
        const nodes = this.specialNodes;
        this.specialScopes = [];
        this.specialNodes = [];
        const phase = animate ? this._anim.leave : null;
        let deferred = false;
        if (phase) {
            for (const n of nodes) {
                deferred = this.engine.animate.leave(n, phase, () => n.remove()) || deferred;
            }
        }
        if (!deferred) {
            for (const n of nodes) n.remove();
        }
    }

    /** 求值 :key（如 item.id）。形参用项变量名，使嵌套场景自定义变量名（cell/row 等）的 :key 也能正确解析 */
    private evalKey(item: any, index: number): any {
        if (!this.keyExpr) return index;
        try {
            const fn = new Function(this.itemName, this.indexName, `return (${this.keyExpr});`) as (
                item: any,
                index: number,
            ) => any;
            return fn(item, index);
        } catch {
            return index;
        }
    }

    override destroy() {
        // 清理虚拟列表资源
        this._teardownVirtualScroll();

        // 销毁清理不播动画（引擎/作用域拆除期，ADR-0039 决策 6 的镜像：非状态变化不动画）
        this.clearItems(false);
        if (this.activeSpecial) this.destroySpecial(false);
    }

    /** 清理虚拟列表资源 */
    private _teardownVirtualScroll() {
        // 移除滚动事件监听
        if (this._scrollListener && this.el) {
            this.el.removeEventListener("scroll", this._scrollListener);
            this._scrollListener = null;
        }

        // 取消待执行的 rAF
        if (this._scrollRafId !== null) {
            cancelAnimationFrame(this._scrollRafId);
            this._scrollRafId = null;
        }

        // 断开 ResizeObserver
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }

        // 断开 data-index MutationObserver
        if (this._dataIndexObserver) {
            this._dataIndexObserver.disconnect();
            this._dataIndexObserver = null;
        }

        // 移除垫片元素
        if (this._topSpacerEl && this._topSpacerEl.parentNode) {
            this._topSpacerEl.parentNode.removeChild(this._topSpacerEl);
        }
        this._topSpacerEl = null;
        if (this._spacerEl && this._spacerEl.parentNode) {
            this._spacerEl.parentNode.removeChild(this._spacerEl);
        }
        this._spacerEl = null;

        // 移除虚拟列表标记属性
        if (this.el) {
            this.el.removeAttribute(VIRTUAL_ATTR);
        }
    }
}
