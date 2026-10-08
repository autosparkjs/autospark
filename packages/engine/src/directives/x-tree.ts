import { AutoSparkDirectiveBase } from "../features/directive/base";
import type { AutoDirectiveInfo } from "../features/directive/types";
import type { AutoSparkScope } from "../engine/scope";
import type { AutoSpark } from "../engine/engine";
import { resolveAnimate, type ResolvedAnimate } from "../features/animate/animate";
import { parseHtmlFragment } from "../utils/transformElement";
import { isDataScript } from "../engine/compile/dataScript";

/** 行内运行时实体：一个已渲染的节点行（ADR-0040） */
interface TreeNodeEntry {
    /** 复用 key（idField 值，无 id 回退层级路径） */
    key: unknown;
    /** 节点数据（响应式代理引用，复用时原地更新 localData 后 refresh） */
    node: any;
    /** 兄弟内序号（变 → json 子层 watch 路径失效 → 销毁重建，P1 简化） */
    index: number;
    /** 行根元素（节点模板编译产物，带 data-x-tree-row 标记） */
    row: HTMLElement;
    /** 行 scope（watcher 归属：子层渲染器的 watch 挂在此，行销毁级联清理） */
    scope: AutoSparkScope;
    /** localData（node + 循环变量；复用 Object.assign 原地更新，禁止换引用） */
    localData: Record<string, any>;
    /** 行内子容器元素（模板缺 x-tree-children 时为 null——该模板不递归） */
    childrenEl: HTMLElement | null;
    /** 本行模板自身是否声明了 toggle 触点标记（createEntry 时缓存——此时子容器已清空，
     *  查询不会误命中孙行的标记；整行 toggle 与标记收窄的判定依据，决策 10） */
    hasToggle: boolean;
    /** 本行模板自身是否声明了 check 复选触点标记（缓存时机同 hasToggle，决策 10） */
    hasCheck: boolean;
    /** 子层渲染器（展开且已建立时非空；eager 折叠销毁置空、keepalive 保活留存） */
    sub: TreeLayerRenderer | null;
    /** 当前子容器展示态（数据先行模型的 DOM 侧镜像，syncVisibility 的 diff 基准） */
    shown: boolean;
    /** 懒加载在途标志（ADR-0090 决策 6：去重挂行生命周期——同次展开不重发；
     *  eager 折叠销毁子层时同步清 → 再展开重发即免 API 重试，keepalive 保留） */
    loading: boolean;
    /** 懒加载错误态（ADR-0090 修订决策 6：fail 通道；null = 无错）。挂行生命周期——
     *  eager 折叠清、keepalive 保留；成功结算 / 重发（重展开、失效重载）即清 */
    error: Error | null;
    /** 错误接管前的宿主 data-tooltip 原值（undefined = 未接管；null = 原本不存在，清除时还原） */
    prevTooltip: string | null | undefined;
}

/**
 * 层渲染器：一个子容器（或根容器）内同级节点行的渲染单元。
 *
 * 职责（ADR-0040 决策 8）：行列表 key-diff（复用/新建/销毁）+ 各行子容器显隐同步
 * （展开回退合成 + 惰性写回后由 watcher 驱动）。逐层细粒度订阅
 * （childrenPath / .\* / .\*.expandField 三类 watcher）。
 *
 * watcher 归属 ownerScope（根层 = 指令 binding / 子层 = 父行 scope）：scope.destroy
 * 时统一 off；行销毁经 destroyEntry 显式递归（sub.destroy → scope.destroy → row.remove）。
 */
class TreeLayerRenderer {
    /** 本层行索引：key → entry（文档序由 render 末尾重排保证） */
    readonly entries = new Map<unknown, TreeNodeEntry>();
    /** 首次渲染标志：首渲中的显隐定位不播动画（ADR-0039 决策 6 首渲静默） */
    private firstRender = true;
    /** 已销毁标志：拦截 destroy 后仍被 scheduler 执行的 pending 回调（同一 flush 内的入队） */
    private dead = false;
    /** 本层订阅的退订函数（scope.watchers 段切片——eager 折叠销毁子层时显式退订，
     *  不能只靠行 scope 级联：子层 watcher 挂在**父行** scope 上，父行不销毁） */
    private unsubs: Array<() => void> = [];
    /** 通配订阅是否已建（根层数据异步到达时延迟补订——watchPath 通配在数据 undefined
     *  时 getVal 抛错，autostore 边界；子层数据必已就绪，构造期即订） */
    private wildcardsWatched = false;

    constructor(
        /** 宿主指令（模板/配置/引擎设施的来源） */
        private directive: TreeDirective,
        /** 行插入目标容器（根层 = x-tree 宿主 / 子层 = 父行内子容器） */
        private containerEl: HTMLElement,
        /** watcher 归属 scope（销毁级联 off） */
        private ownerScope: AutoSparkScope,
        /** 本层 children 数组的 state 路径（根层 = 数据路径；子层逐层拼接；表达式数据源的深层 = null 无路径可订阅） */
        private childrenPath: string | null,
        /** 本层层级（根 = 0） */
        private level: number,
        /** 根到本层父节点的数据链（循环引用防呆：本层节点出现在链中 → warn + 跳过） */
        private ancestors: any[],
        /** 父节点数据引用（根层 null，注入 $parent） */
        private parentEntry: TreeNodeEntry | null,
    ) {
        this._watch();
    }

    /** 本层 children 数据（经指令抽象读取，隔离字段配置差异） */
    private readChildren(): any[] {
        return this.directive.childrenOf(this.parentEntry?.node ?? null);
    }

    /** 订阅并记录退订函数（切片 ownerScope.watchers 新增段） */
    private _track(subscribe: () => void) {
        const ws = this.ownerScope.watchers as Array<() => void>;
        const before = ws.length;
        subscribe();
        this.unsubs.push(...ws.slice(before));
    }

    /** 建立本层订阅：路径本体经 watchPath 直通（含数组索引数字段——scope.watch 双轨会把
     *  数字段误判为表达式走 with 求值，`nodes.0.children` 语法错；单段路径在数据 undefined
     *  时 getVal 安全返回 undefined，异步数据场景可构造期即订）；通配系列见 ensureWildcards */
    private _watch() {
        const path = this.childrenPath;
        if (!path || !this.directive.isSimplePath(path)) return;
        const d = this.directive;
        // 结构变化回调：根层走 rootRender（含空态挂卸与数据归一化——整体替换必经
        // rootRender 才能拆除 x-empty），子层直接行 diff
        const restructure = () => (this.level === 0 ? d.rootRender() : this.render());
        this._track(() => this.ownerScope.watchPath(path, restructure));
        // 子层数据必已就绪（其路径由就绪数据拼接），通配立即补订；根层由 rootRender 补
        if (this.level > 0) this.ensureWildcards();
    }

    /** 通配订阅（`.*` / `.*.expandField`）：数据就绪后才能建立。单根数据的根层特判：
     *  根层行即数据源本身（归一化包装数组在 state 无对应），显隐订阅直接下钻 expandField——
     *  `nodes.*.expand` 对对象键通配（nodes.id.expand 等）不含根对象自身。
     *  字段订阅（children/loaded/icon，ADR-0090 决策 7）同此特判：在途/错误结算 + 行局部刷新
     *  （localData 非响应式，$children/$leaf/$icon/$loading/$error 须显式刷——同刷 $expanded 模式）。 */
    ensureWildcards() {
        const path = this.childrenPath;
        if (this.wildcardsWatched || !path || !this.directive.isSimplePath(path)) return;
        this.wildcardsWatched = true;
        const d = this.directive;
        const single = this.level === 0 && d.singleRoot;
        if (single) {
            this._track(() =>
                this.ownerScope.watchPath(`${path}.${d.expandField}`, () => this.syncVisibility()),
            );
        } else {
            const restructure = () => (this.level === 0 ? d.rootRender() : this.render());
            this._track(() => this.ownerScope.watchPath(`${path}.*`, restructure));
            // 本层各节点展开字段变化 → 显隐同步（不 diff 行，只切换子容器 + $expanded 刷新）
            this._track(() =>
                this.ownerScope.watchPath(`${path}.*.${d.expandField}`, () => this.syncVisibility()),
            );
        }
        const fieldPath = (f: string) => (single ? `${path}.${f}` : `${path}.*.${f}`);
        // 懒加载字段（ADR-0090）：children 到达 → 结算在途 + 刷新；loaded 到达 → 结算 + 失效重载
        this._track(() => this.ownerScope.watchPath(fieldPath(d.childrenField), () => this.onLazyData("children")));
        this._track(() => this.ownerScope.watchPath(fieldPath(d.loadedField), () => this.onLazyData("loaded")));
        // 图标覆盖字段变化 → 仅刷新行（不结算在途）
        this._track(() => this.ownerScope.watchPath(fieldPath(d.iconField), () => this.refreshRows()));
    }

    /** 懒加载字段（ADR-0090）：children 到达 → 自动置 loaded=true + 结算在途；loaded 写 false → 失效重载 */
    private onLazyData(kind: "children" | "loaded") {
        if (this.dead) return;
        const d = this.directive;
        const length = this.readChildren().length;
        for (const entry of this.entries.values()) {
            // 加载完成（children 到达）→ 引擎自动翻转 loaded（ADR-0090 修订决策 4：宿主只写
            // children）。只挂 children 到达路径——loaded 写入是宿主权威信号（true = 手动完成、
            // false = 失效重载），同批翻转会把决策 8 的失效写回吃掉
            if (kind === "children" && Array.isArray(entry.node[d.childrenField]) && d.isUnloaded(entry.node)) {
                d.markLoaded(entry.node);
            }
            const arrived = Array.isArray(entry.node[d.childrenField]) || !d.isUnloaded(entry.node);
            if (entry.loading && arrived) {
                entry.loading = false;
                const children = entry.node[d.childrenField];
                d.emitTreeEvent("tree:loaded", entry, { children: Array.isArray(children) ? children : [] });
            } else if (kind === "loaded" && !entry.loading && d.isUnloaded(entry.node) && entry.childrenEl) {
                // 决策 8：写回 loaded:false 的失效重载——已展开原位重发，折叠态留待展开过渡
                d.requestLoad(entry);
            }
            // 错误态清路径之一（修订决策 6）：完成信号到达即清——fail 后宿主直接补写 children
            // （无在途不结算事件）或手动写 loaded:true 均恢复
            if (entry.error && arrived) {
                entry.error = null;
                d.syncError(entry);
            }
            this.refreshRow(entry, length);
        }
    }

    /** 本层全部行局部刷新（icon 字段变化等轻量路径——不结算在途） */
    private refreshRows() {
        if (this.dead) return;
        const length = this.readChildren().length;
        for (const entry of this.entries.values()) this.refreshRow(entry, length);
    }

    /** 单行 localData 重算 + refresh（buildLocalData 带当前在途/错误态，$children/$leaf/$icon/$loading/$error 同步） */
    private refreshRow(entry: TreeNodeEntry, length: number) {
        const d = this.directive;
        Object.assign(
            entry.localData,
            d.buildLocalData(entry.node, entry.index, length, this.level, this.parentEntry?.node ?? null, entry.loading, entry.error),
        );
        entry.scope.refresh();
    }

    /**
     * 行列表渲染：按 key diff（同 key 同 index 复用原地更新；异 index / 新 key 销毁重建——
     * P1 不做 x-for rebindItem 式行根 DOM 复用，树场景移动少见，留作 v2 优化点）。
     */
    render() {
        if (this.dead) return; // 已销毁：拦截 scheduler 中 pending 的回调
        const d = this.directive;
        const children = this.readChildren();
        const length = children.length;
        const seen = new Set<unknown>();
        const ordered: TreeNodeEntry[] = [];

        for (let i = 0; i < children.length; i++) {
            const node = children[i]!;
            // 循环引用防呆：节点对象已出现在祖先链上 → warn + 跳过（防无限递归）
            if (this.ancestors.includes(node)) {
                d.warn("检测到循环引用（节点是自身的祖先），该子树被跳过");
                continue;
            }
            const key = d.evalKey(node, this.parentEntry?.key, i);
            if (seen.has(key)) {
                d.warn(`duplicate key "${String(key)}"`);
            }
            seen.add(key);
            const old = this.entries.get(key);
            let entry: TreeNodeEntry;
            if (old && old.index === i) {
                // 复用：原地更新 localData（item 引用变才 refresh，对齐 x-for P2 脏标记）
                const nodeChanged = old.node !== node;
                entry = old;
                entry.node = node;
                Object.assign(entry.localData, d.buildLocalData(node, i, length, this.level, this.parentEntry?.node ?? null, entry.loading, entry.error));
                if (nodeChanged) entry.scope.refresh();
            } else {
                // 异 index（json 子层 watch 路径已失效）或新 key → 销毁重建
                if (old) this.destroyEntry(key);
                entry = d.createEntry(
                    node, key, i, length, this.level,
                    this.childrenPath, this.ancestors, this.parentEntry, this.ownerScope,
                );
                this.entries.set(key, entry);
            }
            ordered.push(entry);
        }

        // 消失的旧 key → 销毁
        for (const key of Array.from(this.entries.keys())) {
            if (!seen.has(key)) this.destroyEntry(key);
        }

        // DOM 重排（已就位则跳过；从后向前 insertBefore，同 x-for Pass3）
        let needsReorder = ordered.length !== this.containerEl.children.length;
        if (!needsReorder) {
            for (let i = 0; i < ordered.length; i++) {
                if (ordered[i]!.row !== this.containerEl.children[i]) {
                    needsReorder = true;
                    break;
                }
            }
        }
        if (needsReorder) {
            let anchor: Node | null = null;
            for (let j = ordered.length - 1; j >= 0; j--) {
                this.containerEl.insertBefore(ordered[j]!.row, anchor);
                anchor = ordered[j]!.row;
            }
        }

        this.firstRender = false;
    }

    /**
     * 显隐同步（展开 watcher 回调）：遍历本层行，比对有效展开态与 DOM 侧镜像，
     * 差异行切换子容器显隐（带动画）+ 更新 $expanded 并 refresh（箭头方向等行内绑定）。
     * O(本层行数)，不依赖 watcher 回调参数定位具体行。
     */
    syncVisibility() {
        if (this.dead) return; // 已销毁：拦截 scheduler 中 pending 的回调
        const d = this.directive;
        for (const entry of this.entries.values()) {
            const eff = d.effectiveExpanded(entry.node, this.level);
            if (eff && !entry.shown) this.show(entry);
            else if (!eff && entry.shown) this.hide(entry);
            if (entry.localData.$expanded !== eff) {
                entry.localData.$expanded = eff;
                d.syncIcon(entry); // 图标状态机随展开态换 folder/folder-open（ADR-0090）
                entry.scope.refresh();
            }
        }
    }

    /** 展示子容器：keepalive 复用既有子层；eager（或首次）重建；display 恢复 + enter 动画 */
    private show(entry: TreeNodeEntry) {
        const d = this.directive;
        entry.shown = true;
        const el = entry.childrenEl;
        if (!el) return;
        // 展开过渡 → 懒加载请求（ADR-0090 决策 5；在途去重，createEntry 初定位不经此）
        d.requestLoad(entry);
        if (!entry.sub) {
            entry.sub = d.mountSubLayer(entry, this.childrenPath, this.ancestors);
        }
        // 抢占：离场在播（display 尚未隐藏）时其 onDone 同步完成后再恢复显示（决策 9 语义）
        d.engine.animate.cancel(el);
        el.style.display = "";
        if (!this.firstRender) {
            d.engine.animate.enter(el, d.anim.enter);
        }
    }

    /** 隐藏子容器：leave 动画延迟最终态（display:none；eager 销毁子层——DOM inert 播完即清） */
    private hide(entry: TreeNodeEntry) {
        const d = this.directive;
        entry.shown = false;
        const el = entry.childrenEl;
        if (!el) return;
        const done = () => {
            el.style.display = "none";
            if (!d.keepalive) {
                entry.sub?.destroy();
                entry.sub = null;
                if (entry.loading || entry.error) {
                    // 在途/错误随子层销毁通道清（ADR-0090 决策 6 + 修订）：再展开即重发 = 免 API 重试
                    entry.loading = false;
                    entry.localData.$loading = false;
                    entry.error = null;
                    d.syncError(entry);
                    d.syncIcon(entry);
                    entry.scope.refresh();
                }
            }
        };
        if (this.firstRender) {
            done();
            return;
        }
        const ok = d.engine.animate.leave(el, d.anim.leave, done);
        if (!ok) done();
    }

    /** 销毁单行：递归销毁子层 → 行 scope.destroy（级联子层 watcher）→ 移除 DOM */
    destroyEntry(key: unknown) {
        const entry = this.entries.get(key);
        if (!entry) return;
        entry.sub?.destroy();
        entry.scope.destroy();
        entry.row.remove();
        this.directive.forgetRow(entry.row);
        this.entries.delete(key);
    }

    /** 仅清空本层全部行（不动 watcher、不置 dead）——根层空态（undefined / []）用：
     *  根层一旦建立常驻到指令销毁（空态退订本体 watcher 会让后续数据到达失聪）。 */
    clearRows() {
        for (const key of Array.from(this.entries.keys())) {
            this.destroyEntry(key);
        }
        this.entries.clear();
    }

    /** 销毁本层全部（指令 destroy / eager 折叠 / 父行销毁级联）。
     *  显式退订本层 watcher——子层 watcher 挂在父行 scope 上，父行不销毁时
     *  scope.destroy 级联够不到；不退订则折叠销毁后父对象变更通知仍会触发本层
     *  render 重建全部行（折叠视觉失效）。幂等（dead 早退；退订函数残留于
     *  ownerScope.watchers 为死引用，scope.destroy 再调一次 unwatch 无害）。 */
    destroy() {
        if (this.dead) return;
        this.dead = true;
        for (const unsub of this.unsubs) {
            try {
                unsub();
            } catch {
                // store 已销毁等边界：忽略
            }
        }
        this.unsubs = [];
        this.clearRows();
    }
}

/** 默认树样式 <style> 的 id（static initialize 幂等注入） */
const TREE_STYLES_ID = "x-tree-styles";

/** 默认节点模板（三级优先最末级）：箭头 + 图标 + nameField 字段 + 子容器，data-* 为运行时标记（编译后保留）。
 *  checkedField 显式声明时附带三态复选触点（零模板场景的复选启用通道——选项即标记，
 *  与 selectedField 声明哲学对称，ADR-0040 决策 10 修订五）。三态取**内置图标**
 *  checked / semi-checked / unchecked（x-icon 经图标域落全局注册表兜底，同名可被用户覆盖）；
 *  节点图标取 `$icon` 派生态（ADR-0090 决策 10：icon 选项开关本元素，`$icon` 恒注入）；
 *  外层 x-tree-ico 只做槽位定宽居中，图形由内层图标宿主承载（与箭头的两层分工同构） */
function defaultNodeTemplate(nameField: string, withCheck: boolean, withIcon: boolean): HTMLElement {
    const check = withCheck
        ? `<span class="x-tree-ico" data-x-tree-check><i x-icon="node.checked ? 'checked' : ($indeterminate ? 'semi-checked' : 'unchecked')"></i></span>`
        : "";
    const icon = withIcon ? `<span class="x-tree-ico x-tree-type-ico"><i x-icon="$icon"></i></span>` : "";
    // 不打 data-x-tree-toggle：默认模板恒整行点击展开/折叠（启用选中时点行 = 选中 + 展开，
    // antd 心智；收窄到标记是自定义模板 + selectedField 的语义，修订七）
    const frag = parseHtmlFragment(`
<li class="x-tree-node" data-x-tree-row>
  <div class="x-tree-row">
    <span class="x-tree-ico"><i class="x-tree-arrow" :class="{'x-tree-arrow--open':$expanded,'x-tree-arrow--leaf':$leaf}"></i></span>
    ${icon}
    ${check}
    <span class="x-tree-label" x-text="node.${nameField}"></span>
  </div>
  <ul class="x-tree-children" data-x-tree-children></ul>
</li>`);
    return (frag?.firstElementChild as HTMLElement) ?? document.createElement("li");
}

/**
 * x-tree：树形渲染（ADR-0040）——嵌套子容器递归渲染，DOM 即树。
 *
 * ```html
 * <ul x-tree="node of nodes" x-tree-options="{ defaultExpandLevel: 2, animate: 'slide' }">
 *   <li x-tree-node>
 *     <span x-tree-toggle x-text="$expanded ? '▾' : '▸'"></span>
 *     <span x-text="node.title"></span>
 *     <ul x-tree-children></ul>
 *   </li>
 *   <li x-empty>暂无数据</li>
 * </ul>
 * ```
 *
 * - **结构（决策 1）**：嵌套式子容器——`x-tree-children` 标记子节点渲染点，引擎对展开
 *   路径递归套用同一节点模板；缩进由 DOM 嵌套天然承担。容器直接子元素只认 `x-tree-node`
 *   （无值标记，值 warn 忽略）与 `x-empty`，其余 warn 丢弃（数据脚本静默跳过，同 x-for）。
 * - **节点模板三级优先（决策 3）**：原地 `x-tree-node` > `tree-node` 组件（scope 链就近 +
 *   全局兜底，getComponentDeclaration 惯例）> 内置默认模板（缩进 + 箭头 + nameField 字段）。
 * - **模板属性改写**：`x-tree-children` / `x-tree-toggle` 在收集期改写为 `data-x-tree-*`
 *   保留属性（编译会剥除全部 `x-*` 指令属性，运行时 click 委托 / 子容器定位需可寻址），
 *   行根打 `data-x-tree-row`（click 委托 closest 定位行）。
 * - **数据归一化（决策 5）**：单根对象归一为根数组；id 重复 / 循环引用 warn。key 唯一来源
 *   `idField`（`:key` warn 忽略），无 id 回退层级路径。只接受嵌套（childrenField）格式——
 *   平铺建树已移除（实现期修订三，ADR-0040 决策 5：建树是数据转换职责，归数据层处理）。
 * - **展开回退 + 惰性写回（决策 7）**：有效展开态 = `expandField 有值 ? !!值 :
 *   level + 1 < defaultExpandLevel`（default=1 即根层可见、根不展开）；**回退永不落盘**，
 *   仅用户 toggle 时刻写 `node[expandField] = !有效值`（数据先行，watcher 驱动显隐切换）。
 * - **折叠两态（决策 8）**：默认 eager（折叠 leave 动画播完后销毁子层——DOM inert 语义，
 *   ADR-0039 决策 9）；`.keepalive` 折叠仅 `display:none` 保活。display 翻转不走 x-if 的
 *   detach/锚点机制（子容器位置固定，且留文档流才可播 CSS 过渡）。
 * - **动画（决策 9，修订）**：子容器**整体** enter/leave（组动画非逐行），接入 ADR-0039
 *   Animator，`animate` 选项三形态照常；默认 `expand`（高度过渡——展开/折叠推动后续节点
 *   平滑跟进而非瞬跳，类名型 transform/opacity 动画不参与布局做不到）；首渲静默、连点抢占、
 *   eager 离场 inert 全部继承。
 * - **交互（决策 10 + P2/P3 交付）**：click 委托三路分流——① `x-tree-check` 标记元素 →
 *   复选（checkedField 写回 + cascade 级联：向下子孙全勾/全消、向上祖先重算；`$indeterminate`
 *   半选派生不落盘）；② `x-tree-toggle` 标记元素 → 展开/折叠（自定义模板收窄触点）；
 *   ③ 启用选中（配置 `selectedField`）后整行 → 选中（单选 toggle + 清全树 / `multiSelect`）。
 *   内置默认模板恒整行点击展开/折叠（修订七：启用选中时点行 = 选中 + 展开，antd 心智——
 *   收窄到标记是自定义模板的语义）。复选启用双通道（修订五）：自定义模板声明 `x-tree-check`
 *   标记（标记即交互）或零模板场景 `checkedField` 显式声明（选项即标记，默认模板自动带三态
 *   触点——与 selectedField 对称）。拖拽（`draggable: true`）：行根 draggable + HTML5 DnD
 *   委托，三态定位（上/下 1/4 边缘线、中段收纳）+ 环检测（拖入自身子孙拒绝），数据 splice
 *   写回驱动重渲染。
 * - **事件（决策 11 + ADR-0090 修订）**：`tree:expand` / `tree:collapse` / `tree:select`
 *   （detail `{id, node, level}`）、`tree:check`（另带 `checked`）、`tree:load`（懒加载请求，
 *   另带 `fail(err)` 失败回调）、`tree:loaded`（懒加载完成，另带 `children` 到达快照）、
 *   `tree:drop`（detail `{source, target, position}` 三段式），均冒泡，命名对齐 action 广播惯例。
 * - **空态（决策 12）**：`x-empty` 只认真空数组 `[]`（undefined 不认领——留给未来 loading）。
 * - **响应式颗粒度**：逐层细粒度（每层三个 watcher：childrenPath / .\* / .\*.expandField，
 *   expand 变化只切显隐不 diff 行；行内字段级更新由项内 watcher 细粒度 patch，同 x-for）；
 *   数据源为表达式（非纯路径）时仅结构变化可响应（表达式 watch 收集不到 expandField
 *   依赖——warn 提示用纯路径）。
 */
export class TreeDirective extends AutoSparkDirectiveBase {
    static override readonly priority = 100;
    static override readonly singleton = true;
    /** x-tree 永远占有子树：容器子元素是节点模板 / 空态模板，由本指令收集克隆，通用 walk 不得递归 */
    static override ownsChildren(_info: AutoDirectiveInfo): boolean {
        return true;
    }

    /** 注入默认树样式（幂等；多 engine 实例共享 document） */
    static override initialize(_engine: AutoSpark): void {
        if (typeof document === "undefined" || !document.head) return;
        if (document.getElementById(TREE_STYLES_ID)) return;
        const style = document.createElement("style");
        style.id = TREE_STYLES_ID;
        style.textContent = `
.x-tree-node{margin:0}
.x-tree-row{display:flex;align-items:center;gap:4px;padding:2px 4px;border-radius:4px;cursor:pointer;user-select:none}
.x-tree-row:hover{background:#f0f0f0}
.x-tree-ico{display:inline-flex;justify-content:center;align-items:center;width:1.2em;flex:none}
.x-tree-arrow{display:inline-block;width:0;height:0;border-left:5px solid currentColor;border-top:4px solid transparent;border-bottom:4px solid transparent;transition:transform .2s;opacity:.6}
.x-tree-arrow--open{transform:rotate(90deg)}
.x-tree-arrow--leaf{visibility:hidden}
.x-tree-label{flex:1}
ul.x-tree-children{list-style:none;margin:0;padding-left:20px}
/* 拖拽三态指示（P3）：before/after 上下边缘线、inside 收纳高亮 */
li[data-x-tree-row].x-tree-drop-before{box-shadow:inset 0 2px 0 #3273dc}
li[data-x-tree-row].x-tree-drop-after{box-shadow:inset 0 -2px 0 #3273dc}
li[data-x-tree-row].x-tree-drop-inside{background:#eef3fc;outline:1px dashed #3273dc;outline-offset:-1px}
/* 懒加载错误态（ADR-0090 修订）：行挂 data-x-tree-error → 默认模板节点图标变红
   （自定义模板可用同属性自行选样式；错误消息经行 data-tooltip 提示） */
li[data-x-tree-row][data-x-tree-error] .x-tree-type-ico{color:#e5484d}
`;
        document.head.appendChild(style);
    }

    // ── 语法解析结果 ──
    private itemName = "node";
    private indexName = "index";
    private nodesPath = "";

    // ── 配置（created 一次性解析） ──
    idField = "id";
    childrenField = "children";
    expandField = "expand";
    /** 选中字段（配置存在才启用选中交互——它改变整行点击语义，决策 10） */
    private selectedField: string | null = null;
    /** 多选模式（单选默认：写本行 + 清全树其他选中） */
    private multiSelect = false;
    /** 复选字段（默认 "checked"；显式声明（或模板 x-tree-check 标记）启用复选交互） */
    checkedField = "checked";
    /** checkedField 是否经选项显式声明（零模板场景的启用信号——默认模板据此带触点） */
    private checkDeclared = false;
    /** 复选级联（父→子孙全勾/全消、子→祖先重算；false 各节点独立） */
    private cascade = true;
    /** 拖拽启用（行根 draggable + DnD 委托 + 三态定位，决策 10/P3） */
    private draggable = false;
    /** 加载指示字段（懒加载判据，默认 "loaded"；值严格 false 即未加载，ADR-0090 决策 1） */
    loadedField = "loaded";
    /** 节点图标覆盖字段（默认模板 $icon 的覆盖来源，默认 "icon"；单名或 "close,open" 对，ADR-0090） */
    iconField = "icon";
    /** 默认模板是否渲染节点图标（icon 选项，默认 true；false = 回到无图标布局，ADR-0090 决策 10） */
    showIcon = true;
    private nameField = "name";
    private defaultExpandLevel = 1;
    keepalive = false;
    /** animate 选项解析结果（enter/leave 各相；未配置时默认 expand 高度过渡，见 resolveConfig） */
    anim: ResolvedAnimate = { enter: null, leave: null };

    // ── 模板与运行时 ──
    /** 节点模板快照（已属性改写：data-x-tree-* + 行根标记；克隆自三级优先胜出者） */
    private nodeTemplate: HTMLElement | null = null;
    /** x-empty 空态模板快照（文档序） */
    private emptyTemplates: HTMLElement[] = [];
    private emptyNodes: HTMLElement[] = [];
    private emptyScopes: AutoSparkScope[] = [];
    /** 行根 → entry 运行时映射（click 委托定位） */
    private rowMap = new WeakMap<HTMLElement, TreeNodeEntry>();
    /** 根层渲染器 */
    private rootLayer: TreeLayerRenderer | null = null;
    /** 首渲静默标志（microtask 首渲期间为 true，此后显隐变化才动画） */
    private firstCompile = true;
    /** 复选交互启用（模板声明 data-x-tree-check 触点，resolveNodeTemplate 判定） */
    private checkEnabled = false;
    /** 节点模板是否递归（含 x-tree-children）——懒加载触发门（ADR-0090 决策 5：非递归
     *  模板无子容器可填充，不发 tree:load） */
    private recurses = false;
    /** 三级兜底用了内置默认模板（整行 toggle 语义恒定——启用选中时点行 = 选中 + 展开） */
    private usedDefaultTemplate = false;
    /** 拖拽源行（dragstart 记录、drop/dragend 清除；null = 非拖拽中） */
    private dragEntry: TreeNodeEntry | null = null;
    /** 当前挂三态指示的行（dragover 切换、结束清除） */
    private dropMarkRow: HTMLElement | null = null;
    /** 容器级 click 委托（arrow function 绑定 this，destroy 移除） */
    private onClick = (e: Event) => this.handleNodeClick(e);
    /** 容器级 DnD 委托（draggable 启用时挂载） */
    private onDragStart = (e: DragEvent) => this.handleDragStart(e);
    private onDragOver = (e: DragEvent) => this.handleDragOver(e);
    private onDragLeave = (e: DragEvent) => this.handleDragLeave(e);
    private onDrop = (e: DragEvent) => this.handleDrop(e);
    private onDragEnd = (e: DragEvent) => this.clearDropMark();

    override created() {
        if (!this.parse()) return;
        this.resolveConfig();
        this.resolveNodeTemplate();
        // 容器级 click 委托：check > toggle > select 三路分流（决策 10）
        this.el.addEventListener("click", this.onClick);
        // 容器级 DnD 委托（P3 拖拽）：行根 draggable 由 createEntry 逐行打标
        if (this.draggable) {
            this.el.addEventListener("dragstart", this.onDragStart);
            this.el.addEventListener("dragover", this.onDragOver);
            this.el.addEventListener("dragleave", this.onDragLeave);
            this.el.addEventListener("drop", this.onDrop);
            this.el.addEventListener("dragend", this.onDragEnd);
        }
        // 数据源订阅：纯路径走根层渲染器的 watchPath 系列；表达式走 watch（依赖收集，
        // 收集不到 expandField → 展开写回不触发，warn 提示）。首渲 defer 到 microtask
        //（同 x-for：created 在 compileElement 内同步跑，容器尚未挂载）。
        if (this.isSimplePath(this.nodesPath)) {
            this.rootLayer = this.makeRootLayer();
        } else {
            this.warn(`数据源 "${this.nodesPath}" 是表达式：仅结构变化可响应，展开/折叠建议改用纯状态路径`);
            this.binding.watch(this.nodesPath, () => this.rootRender());
        }
        this.engine.scheduler.schedule(() => {
            this.rootRender();
            this.firstCompile = false;
        });
    }

    override destroy() {
        this.el?.removeEventListener("click", this.onClick);
        if (this.draggable) {
            this.el.removeEventListener("dragstart", this.onDragStart);
            this.el.removeEventListener("dragover", this.onDragOver);
            this.el.removeEventListener("dragleave", this.onDragLeave);
            this.el.removeEventListener("drop", this.onDrop);
            this.el.removeEventListener("dragend", this.onDragEnd);
        }
        this.rootLayer?.destroy();
        this.rootLayer = null;
        this.destroyEmpty();
    }

    // ── 语法 / 配置 / 模板解析 ───────────────────────────────────────

    /** 解析 "node of nodes"（of 必写，对齐 x-for；node,index 自定义序号名可选）+ 冲突防呆 */
    private parse(): boolean {
        const raw = String(this.value ?? "").trim();
        const m = raw.match(/^([\w$]+)(?:\s*,\s*([\w$]+))?\s+of\s+(.+)$/);
        if (!m) {
            this.error(`x-tree: 无效表达式 "${raw}"（应为 "node of nodes" 形态，ADR-0040）`);
            return false;
        }
        this.itemName = m[1]!;
        if (m[2]) this.indexName = m[2]!;
        this.nodesPath = m[3]!.trim();
        const tpl = this.template;
        if (!tpl) return false;
        // 同元素 x-for：两者皆 ownsChildren → compiler _resolveOwnership 编译期先行抛错
        //（既有机制，同 x-for + eager x-if），无需本指令处理（决策 12 修订）
        // :key 与 idField 职责重复 → warn 忽略（决策 6）
        if (tpl.hasAttribute(":key") || tpl.hasAttribute("x-bind:key")) {
            this.warn(":key 被忽略——节点 key 唯一来源是 idField（无 id 回退层级路径），ADR-0040");
        }
        return true;
    }

    /** 指令选项一次性解析（回退链 getOption，ADR-0007）+ 非法值防呆 */
    private resolveConfig() {
        const fields = ["idField", "childrenField", "expandField", "nameField", "checkedField"] as const;
        for (const f of fields) {
            const v = this.getOption(f);
            if (typeof v === "string" && v.trim() !== "") (this as any)[f] = v.trim();
        }
        // 选中：selectedField 显式声明才启用（值即字段名）；多选开关独立。
        // 复选：checkedField 显式声明即启用（零模板场景由默认模板带触点；自定义模板以
        //  x-tree-check 标记为准，声明但模板无触点 → warn）——与 selectedField 声明哲学对称
        const sel = this.getOption("selectedField");
        if (typeof sel === "string" && sel.trim() !== "") this.selectedField = sel.trim();
        const chk = this.getOption("checkedField");
        if (typeof chk === "string" && chk.trim() !== "") {
            this.checkedField = chk.trim();
            this.checkDeclared = true;
        }
        this.multiSelect = this.getOption("multiSelect") === true;
        this.cascade = this.getOption("cascade") !== false;
        this.draggable = this.getOption("draggable") === true;
        // 懒加载字段名（ADR-0090 决策 1）+ 节点图标（决策 10：icon 开关默认开、iconField 可配）
        const lf = this.getOption("loadedField");
        if (typeof lf === "string" && lf.trim() !== "") this.loadedField = lf.trim();
        const ifl = this.getOption("iconField");
        if (typeof ifl === "string" && ifl.trim() !== "") this.iconField = ifl.trim();
        this.showIcon = this.getOption("icon") !== false;
        const level = Number(this.getOption("defaultExpandLevel") ?? 1);
        if (!Number.isFinite(level) || level < 1) {
            this.warn(`defaultExpandLevel "${String(this.getOption("defaultExpandLevel"))}" 无效（合法值 ≥1），按 1 处理`);
            this.defaultExpandLevel = 1;
        } else {
            this.defaultExpandLevel = Math.floor(level);
        }
        this.keepalive = this.getOption("keepalive") === true;
        // 树的展开/折叠是布局变化：默认 expand（高度过渡——后续节点平滑跟随，不跳位，
        // ADR-0040 决策 9 修订）；显式配置任意动画名 / false 照常尊重（类名型视觉动画亦可）
        const animOption = this.getOption("animate");
        this.anim = resolveAnimate(animOption === undefined ? "expand" : animOption);
    }

    /** 节点模板三级优先：原地 x-tree-node > tree-node 组件 > 内置默认（决策 3） */
    private resolveNodeTemplate() {
        const tpl = this.template!;
        let snapshot: HTMLElement | null = null;
        let count = 0;
        // 容器直接子元素三分：x-tree-node 模板（首个生效）/ x-empty 空态 / 其余 warn 丢弃
        for (const child of Array.from(tpl.children)) {
            if (!(child instanceof HTMLElement) || isDataScript(child)) continue;
            if (child.hasAttribute("x-tree-node")) {
                count++;
                if (!snapshot) {
                    if ((child.getAttribute("x-tree-node") ?? "").trim() !== "") {
                        this.warn("x-tree-node 的值被忽略（无值标记，不做节点特化匹配，ADR-0040 决策 2）");
                    }
                    snapshot = child.cloneNode(true) as HTMLElement;
                }
                continue;
            }
            if (child.hasAttribute("x-empty")) {
                this.emptyTemplates.push(child.cloneNode(true) as HTMLElement);
                continue;
            }
            this.warn("容器直接子元素既非 x-tree-node 也非 x-empty，被丢弃（仅此两者生效，ADR-0040）");
        }
        if (count > 1) this.warn(`检测到 ${count} 个 x-tree-node，首个生效`);
        // 二级：tree-node 组件（scope 链就近 + 全局兜底，getComponentDeclaration 惯例）
        if (!snapshot) {
            const custom = this.engine.getComponentDeclaration(this.el, "tree-node");
            if (custom) snapshot = custom.cloneNode(true) as HTMLElement;
        }
        // 三级：内置默认（nameField 生成；checkedField 显式声明 → 附带三态复选触点；
        // icon 选项开关节点图标列）
        if (!snapshot) {
            snapshot = defaultNodeTemplate(this.nameField, this.checkDeclared, this.showIcon);
            this.usedDefaultTemplate = true;
        }
        this.nodeTemplate = this.rewriteMarks(snapshot);
        // 子容器校验：缺 x-tree-children → 不递归（仅渲染一层）；递归性同时是懒加载触发门
        this.recurses = this.nodeTemplate.querySelector("[data-x-tree-children]") != null;
        if (!this.recurses) {
            this.warn("节点模板缺少 x-tree-children 子容器，仅渲染一层（子节点不递归，ADR-0040 决策 2）");
        }
        // 复选启用判定：模板声明 data-x-tree-check 触点（自定义模板的启用通道）——
        // 零模板场景默认模板已按 checkedField 声明附带触点，同一判定覆盖
        this.checkEnabled = this.nodeTemplate.querySelector("[data-x-tree-check]") != null;
        // checkedField 已声明但模板无触点（自定义模板漏写标记）→ 复选不可用，warn 防呆
        if (this.checkDeclared && !this.checkEnabled) {
            this.warn("checkedField 已声明，但节点模板缺少 x-tree-check 触点——复选不可用");
        }
        // 启用选中后展开收窄到 x-tree-toggle：自定义模板无标记将无法展开（决策 10）——warn 提示。
        // 内置默认模板不 warn（修订七：恒整行点击 = 选中 + 展开，无需标记）
        if (this.selectedField && !this.usedDefaultTemplate && !this.nodeTemplate.querySelector("[data-x-tree-toggle]")) {
            this.warn("启用选中（selectedField）后整行点击 = 选中，展开收窄到 x-tree-toggle 标记——模板未声明将无法展开");
        }
    }

    /**
     * 模板快照属性改写：`x-tree-children` / `x-tree-toggle` / `x-tree-check` → `data-x-tree-*`
     * （编译剥除全部 x-* 指令属性，运行时 click 委托 / 子容器定位需保留可寻址标记），
     * 行根打 data-x-tree-row。
     */
    private rewriteMarks(snapshot: HTMLElement): HTMLElement {
        snapshot.setAttribute("data-x-tree-row", "");
        for (const el of Array.from(snapshot.querySelectorAll("[x-tree-children]"))) {
            el.removeAttribute("x-tree-children");
            el.setAttribute("data-x-tree-children", "");
        }
        for (const el of Array.from(snapshot.querySelectorAll("[x-tree-toggle]"))) {
            el.removeAttribute("x-tree-toggle");
            el.setAttribute("data-x-tree-toggle", "");
        }
        for (const el of Array.from(snapshot.querySelectorAll("[x-tree-check]"))) {
            el.removeAttribute("x-tree-check");
            el.setAttribute("data-x-tree-check", "");
        }
        return snapshot;
    }

    // ── 数据访问 ────────────────────────────────────────────────────

    /** 数据源是否纯状态路径（决定订阅通道；含索引数字段仍是合法路径） */
    isSimplePath(path: string): boolean {
        // 复用 scope 的双轨判定：标识符/数字/点 组合即纯路径
        return /^[\w$]+(\.[\w$]+)*$/.test(path.replace(/\s+/g, ""));
    }

    /** 根层数据：归一化（单根→数组）。undefined/null 返回 null（不认领空态）。
     *  单根时根数组是**归一化包装**（state 里是对象、无数字键）——子层路径不可经
     *  `nodes.0` 索引段（不存在），经 nextChildrenPath 的 singleRoot 分支直接下钻 */
    private normalizeRoots(): any[] | null {
        const raw = this.binding.read(this.nodesPath);
        if (raw == null) return null;
        if (Array.isArray(raw)) {
            this.singleRoot = false;
            return raw;
        }
        this.singleRoot = true;
        return [raw];
    }

    /** 数据源为单根对象（normalizeRoots 检测更新）——子层路径拼接与根层显隐订阅的特判依据 */
    singleRoot = false;

    /** 某节点的子数据（读 childrenField；根层 parent=null 时返回归一化根数组） */
    childrenOf(parentNode: any): any[] {
        if (parentNode == null) {
            return this.normalizeRoots() ?? [];
        }
        const children = parentNode[this.childrenField];
        return Array.isArray(children) ? children : [];
    }

    /** 子层的 children 数组 state 路径（逐层拼接含 index——index 变的复用分支已销毁重建，
     *  路径恒有效；单根数据的根层子路径直接下钻 childrenField——归一化包装数组在 state
     *  中无对应（nodes.0 不存在），不可经索引段；表达式数据源的深层无纯路径可订阅，
     *  返回 null 仅结构变化可响应） */
    nextChildrenPath(parentPath: string | null, index: number): string | null {
        if (parentPath == null || !this.isSimplePath(parentPath)) return null;
        if (parentPath === this.nodesPath && this.singleRoot) {
            return `${parentPath}.${this.childrenField}`;
        }
        return `${parentPath}.${index}.${this.childrenField}`;
    }

    /** 节点复用 key：idField 值；缺省回退层级路径（父 key + 序号） */
    evalKey(node: any, parentKey: unknown, index: number): unknown {
        const id = node[this.idField];
        if (id != null && id !== "") return id;
        return `${String(parentKey ?? "root")}-${index}`;
    }

    /** 有效展开态（决策 7）：expandField 有值用值（undefined 视为无值），否则按层级回退
     *  （defaultExpandLevel=N 即前 N 层可见：level ≤ N-2 的节点回退展开） */
    effectiveExpanded(node: any, level: number): boolean {
        const v = node[this.expandField];
        if (v !== undefined) return !!v;
        return level + 1 < this.defaultExpandLevel;
    }

    /** 懒加载未就绪判据（ADR-0090 决策 1）：值严格 false——字段不存在（undefined）天然
     *  非懒加载节点，无需单独存在性检查；true / 其他值均视为已加载或不适用 */
    isUnloaded(node: any): boolean {
        return node?.[this.loadedField] === false;
    }

    /** 节点局部数据：自定义变量名 + 循环变量（$ 前缀，对齐 x-for 派生变量惯例；
     *  $indeterminate 半选 / $loading 在途 / $error 错误 / $icon 图标均为派生值不落盘，
     *  ADR-0040 决策 13、ADR-0090 决策 6/10 及修订）。$leaf 对未加载节点恒假（决策 1：未加载 ≠ 叶子） */
    buildLocalData(node: any, index: number, length: number, level: number, parent: any, loading = false, error: Error | null = null): Record<string, any> {
        const children = this.childrenOf(node);
        const expanded = this.effectiveExpanded(node, level);
        const leaf = children.length === 0 && !this.isUnloaded(node);
        return {
            [this.itemName]: node,
            [this.indexName]: index,
            $index: index,
            $level: level,
            $children: children,
            $expanded: expanded,
            $leaf: leaf,
            $first: index === 0,
            $last: index === length - 1,
            $parent: parent,
            $indeterminate: this.computeIndeterminate(node),
            $loading: loading,
            $error: error,
            $icon: this.computeIcon(node, expanded, leaf, loading, error),
        };
    }

    /** 节点图标状态机（$icon 派生，不落盘，ADR-0090 决策 11 + 修订）：
     *  loading > 错误 file-error > 未加载 unknown > node[iconField] 覆盖 > 有子 folder/folder-open > 叶子 file。
     *  覆盖值 "close,open" 逗号对按 $expanded 取项（单名两态同图；叶子静默取首项）。 */
    computeIcon(node: any, expanded: boolean, leaf: boolean, loading: boolean, error: Error | null = null): string {
        if (loading) return "loading";
        if (error) return "file-error";
        if (this.isUnloaded(node)) return "unknown";
        const raw = node[this.iconField];
        if (typeof raw === "string" && raw.trim() !== "") {
            const v = raw.trim();
            const i = v.indexOf(",");
            if (i < 0) return v;
            const close = v.slice(0, i).trim();
            const open = v.slice(i + 1).trim();
            return (expanded ? open : close) || close; // 空项回退收起项
        }
        if (leaf) return "file";
        return expanded ? "folder-open" : "folder";
    }

    /** 派生图标重算（$icon 依赖 localData 中 $expanded/$leaf/$loading 与 entry.error 当前值）：
     *  展开态 / 在途态 / 错误态变化处调用，随后由调用方 scope.refresh（ADR-0090） */
    syncIcon(entry: TreeNodeEntry) {
        entry.localData.$icon = this.computeIcon(
            entry.node,
            entry.localData.$expanded === true,
            entry.localData.$leaf === true,
            entry.localData.$loading === true,
            entry.error,
        );
    }

    /** 错误态同步（ADR-0090 修订）：localData `$error` 派生量 + 行 `data-x-tree-error` 样式钩子
     *  （默认模板经注入 CSS 变红，自定义模板可自行选样式）+ `data-tooltip = 错误消息`
     *  （接管前保存宿主原值，清除时还原）。tooltip 走全局委托系统（ADR-0061），运行时属性
     *  即生效；调用方随后须 scope.refresh（或经 refreshRow 重算） */
    syncError(entry: TreeNodeEntry) {
        entry.localData.$error = entry.error;
        const row = entry.row;
        if (entry.error) {
            if (entry.prevTooltip === undefined) {
                entry.prevTooltip = row.hasAttribute("data-tooltip") ? row.getAttribute("data-tooltip") : null;
            }
            row.setAttribute("data-tooltip", entry.error.message);
            row.setAttribute("data-x-tree-error", "");
        } else {
            if (entry.prevTooltip !== undefined) {
                if (entry.prevTooltip === null) row.removeAttribute("data-tooltip");
                else row.setAttribute("data-tooltip", entry.prevTooltip);
                entry.prevTooltip = undefined;
            }
            row.removeAttribute("data-x-tree-error");
        }
    }

    /** 懒加载请求（ADR-0090 决策 5/6）：门 = 未加载 && 有效展开 && 模板递归，在途去重。
     *  幂等入口（show 展开过渡 / createEntry 初定位 / 失效重载均经此）——重发即清错误态。 */
    requestLoad(entry: TreeNodeEntry) {
        if (entry.loading || !entry.childrenEl) return;
        if (!this.isUnloaded(entry.node)) return;
        const level = entry.localData.$level as number;
        if (!this.effectiveExpanded(entry.node, level)) return;
        if (entry.error) {
            entry.error = null; // 重发即清（ADR-0090 修订：错误态清除路径之一）
            this.syncError(entry);
        }
        entry.loading = true;
        entry.localData.$loading = true;
        this.syncIcon(entry);
        entry.scope.refresh();
        this.emitLoad(entry);
    }

    /** 广播懒加载请求（detail 另带 fail 回调——宿主取数失败时调用挂错误态，ADR-0090 修订决策 6） */
    private emitLoad(entry: TreeNodeEntry) {
        this.emitTreeEvent("tree:load", entry, {
            fail: (err: unknown) => this.markError(entry, err),
        });
    }

    /** 宿主失败回调（tree:load detail.fail）：错误挂行——在途结算、行挂红图标（file-error）
     *  与 data-tooltip。行已销毁或无在途请求（迟到回调）→ 忽略 */
    private markError(entry: TreeNodeEntry, err: unknown) {
        if (this.rowMap.get(entry.row) !== entry) return;
        if (!entry.loading) return;
        entry.loading = false;
        entry.localData.$loading = false;
        entry.error = err instanceof Error ? err : new Error(String(err));
        this.syncError(entry);
        this.syncIcon(entry);
        entry.scope.refresh();
    }

    /** 加载完成自动翻转（ADR-0090 修订决策 4）：children 到达即置 loaded=true——宿主只写
     *  children，零字段管理。只读数据等写入失败边界按节点去重 warn（防重试循环） */
    private flipWarned = new WeakSet<object>();
    markLoaded(node: any) {
        try {
            node[this.loadedField] = true;
        } catch {
            if (typeof node === "object" && node && !this.flipWarned.has(node)) {
                this.flipWarned.add(node);
                this.warn(
                    `节点 ${String(node[this.idField])} 的 ${this.childrenField} 已到达，但 ${this.loadedField} 写入失败（数据只读？）——请宿主手动写回 true（ADR-0090 决策 4 修订）`,
                );
            }
        }
    }

    /** 半选派生（不落盘）：未全勾 && 子树存在勾选痕迹（子勾选或子半选），决策 13 */
    computeIndeterminate(node: any): boolean {
        if (node[this.checkedField]) return false;
        const children = this.childrenOf(node);
        return children.some((c: any) => c[this.checkedField] || this.computeIndeterminate(c));
    }

    // ── 行创建 / 销毁（LayerRenderer 回调） ─────────────────────────

    /**
     * 新建一行：克隆模板 → compileChild（建 scope/订阅）→ 定位子容器 → 显隐初定位。
     * 初定位**不播动画**（新增已展开行的子容器直接呈现；重展开路径走 LayerRenderer.show 才动画）。
     * @param layerChildrenPath 所在层的 children 数组路径（子层 watch 路径拼接基准）
     */
    createEntry(
        node: any,
        key: unknown,
        index: number,
        length: number,
        level: number,
        layerChildrenPath: string | null,
        ancestors: any[],
        parentEntry: TreeNodeEntry | null,
        ownerScope: AutoSparkScope,
    ): TreeNodeEntry {
        const expanded0 = this.effectiveExpanded(node, level);
        // 初始即在途（ADR-0090 决策 5 初始展开路径）：未加载 && 已展开 && 模板递归
        const loading = expanded0 && this.recurses && this.isUnloaded(node);
        const localData = this.buildLocalData(node, index, length, level, parentEntry?.node ?? null, loading);
        const { el: row, scope } = this.engine.compiler.compileChild(
            this.nodeTemplate!,
            ownerScope,
            localData,
        );
        // 定位行内子容器（模板校验已保证存在性；null = 不递归模板）
        const childrenEl = row.querySelector<HTMLElement>("[data-x-tree-children]");
        if (childrenEl) childrenEl.replaceChildren(); // 清模板残留（子容器内容归引擎管理）
        // hasToggle / hasCheck 须在子层渲染前缓存（子容器此刻为空，查询不会误命中孙行的标记）
        const hasToggle = !!row.querySelector("[data-x-tree-toggle]");
        const hasCheck = !!row.querySelector("[data-x-tree-check]");
        if (this.draggable) row.setAttribute("draggable", "true"); // 行根可拖（P3）
        const entry: TreeNodeEntry = {
            key,
            node,
            index,
            row,
            scope,
            localData,
            childrenEl,
            hasToggle,
            hasCheck,
            sub: null,
            shown: false,
            loading,
            error: null,
            prevTooltip: undefined,
        };
        this.rowMap.set(row, entry);
        if (loading) {
            // 初始展开即请求（决策 5）。首渲在 compile() 的 flushAll 内**同步**发生（含级联回调），
            // 宿主监听器挂载在其后——绕开 scheduler 用裸微任务延一拍广播（行已销毁则跳过）
            queueMicrotask(() => {
                if (this.rowMap.get(entry.row) === entry) this.emitLoad(entry);
            });
        }
        if (expanded0 && childrenEl) {
            entry.sub = this.mountSubLayer(entry, layerChildrenPath, ancestors);
            entry.shown = true;
        } else if (childrenEl) {
            childrenEl.style.display = "none";
        }
        return entry;
    }

    /** 建立并首渲某行的子层渲染器（createEntry 初定位与 show 重展开共用） */
    mountSubLayer(entry: TreeNodeEntry, layerChildrenPath: string | null, ancestors: any[]): TreeLayerRenderer {
        const sub = new TreeLayerRenderer(
            this,
            entry.childrenEl!,
            entry.scope,
            this.nextChildrenPath(layerChildrenPath, entry.index),
            entry.localData.$level + 1,
            [...ancestors, entry.node],
            entry,
        );
        sub.render();
        return sub;
    }

    /** 行销毁后的映射清理（WeakMap 无需显式删，保留方法做防御性清引用） */
    forgetRow(row: HTMLElement) {
        this.rowMap.delete(row);
    }

    /** 根层渲染器工厂（根容器 = 宿主；watcher 挂指令 binding，指令 destroy 级联） */
    private makeRootLayer(): TreeLayerRenderer {
        return new TreeLayerRenderer(this, this.el, this.binding, this.nodesPath, 0, [], null);
    }

    // ── 根渲染 / 空态 / 交互 / 事件 ─────────────────────────────────

    /** 根渲染入口：undefined 清场（不认领）、真空挂 empty、正常走根层 diff。
     *  根层一旦建立常驻（clearRows 只清行不退订——空态退订本体 watcher 会让
     *  后续数据到达失聪），destroy 到指令销毁时才发生。 */
    rootRender() {
        const roots = this.normalizeRoots();
        // 数据就绪（含空数组——后续 push 也要响应）→ 建根层 + 补订通配
        //（异步数据场景：undefined 期通配订阅会炸，见 ensureWildcards 注释）
        if (!this.rootLayer) this.rootLayer = this.makeRootLayer();
        if (roots === null) {
            this.rootLayer.clearRows();
            this.destroyEmpty();
            return;
        }
        this.rootLayer.ensureWildcards();
        if (roots.length === 0) {
            this.rootLayer.clearRows();
            this.mountEmpty();
            return;
        }
        this.destroyEmpty();
        // 根层渲染器惰性建立（表达式数据源无 watcher 也要能渲染）
        if (!this.rootLayer) this.rootLayer = this.makeRootLayer();
        this.rootLayer.render();
    }

    /** 挂载空态（对齐 x-for mountSpecial：克隆编译 + 文档序 append；空对象 localData → 绑定回退父作用域） */
    private mountEmpty() {
        if (this.emptyNodes.length > 0 || this.emptyTemplates.length === 0) return;
        for (const tpl of this.emptyTemplates) {
            const { el, scope } = this.engine.compiler.compileChild(tpl, this.binding, {});
            this.el.appendChild(el);
            this.emptyNodes.push(el);
            this.emptyScopes.push(scope);
        }
    }

    private destroyEmpty() {
        for (const s of this.emptyScopes) s.destroy();
        for (const n of this.emptyNodes) n.remove();
        this.emptyScopes = [];
        this.emptyNodes = [];
    }

    /** 容器级 click 委托：closest 定位最近行（孙行点击天然命中孙行）→ 三路分流（决策 10）：
     *  ① check 触点（模板声明 data-x-tree-check，仅标记元素）→ 复选；
     *  ② toggle：启用选中后收窄到 data-x-tree-toggle 标记（点箭头只展开）；未启用保持
     *     整行 toggle（hit 必属本行——target 最近行是本行，孙行标记不会出现在祖先链上）；
     *  ③ select：启用选中后整行（非 check / 非 toggle 标记区）→ 选中。 */
    private handleNodeClick(e: Event) {
        const target = e.target;
        if (!(target instanceof Element)) return;
        const row = target.closest<HTMLElement>("[data-x-tree-row]");
        if (!row || !this.el.contains(row)) return;
        const entry = this.rowMap.get(row);
        if (!entry) return;
        // ① 复选触点：本行模板声明了 data-x-tree-check → 仅标记元素触发
        if (entry.hasCheck) {
            const hit = target.closest<HTMLElement>("[data-x-tree-check]");
            if (hit && row.contains(hit)) {
                this.toggleCheck(entry);
                return;
            }
        }
        // ② 展开触点：启用选中（或有标记）→ 收窄到 data-x-tree-toggle；否则整行触发
        const narrowToggle = this.selectedField != null || entry.hasToggle;
        if (narrowToggle) {
            const hit = target.closest<HTMLElement>("[data-x-tree-toggle]");
            if (hit && row.contains(hit)) {
                this.toggleExpand(entry);
                return;
            }
            if (this.selectedField == null) return; // 未启用选中：标记外的行区不触发
        }
        // ③ 选中：启用后整行（自定义模板：点标记只展开不选中，VSCode 文件树心智；
        //    默认模板恒整行 toggle——点行 = 选中 + 展开/折叠，antd 心智，修订七）
        if (this.selectedField != null) {
            this.selectNode(entry);
            if (this.usedDefaultTemplate) this.toggleExpand(entry);
            return;
        }
        this.toggleExpand(entry); // 未启用选中且无标记：整行 toggle（P1 行为）
    }

    /** 展开切换（决策 7 惰性写回 + 决策 11 事件广播）：写数据先行，显隐由 watcher 驱动 */
    private toggleExpand(entry: TreeNodeEntry) {
        const level = entry.localData.$level as number;
        const eff = this.effectiveExpanded(entry.node, level);
        try {
            entry.node[this.expandField] = !eff; // 响应式代理写入 → childrenPath.*.{expandField} watcher
            this.emitTreeEvent(eff ? "tree:collapse" : "tree:expand", entry);
        } catch (err) {
            this.warn(`toggle 写入失败：${String(err)}`);
        }
    }

    /** 节点选中（P2，决策 10）：单选 toggle 本行 + 清全树其他选中（数据层递归——折叠行
     *  重展开时状态已对）；多选只 toggle 本行。写数据先行，受影响行显式 refresh（字段初始
     *  undefined 时表达式依赖收集不到新增属性——autostore 边界，同 expandField 走通配的因） */
    private selectNode(entry: TreeNodeEntry) {
        const field = this.selectedField!;
        const node = entry.node;
        const next = !node[field];
        try {
            const cleared = next && !this.multiSelect
                ? this.clearAllSelected(this.normalizeRoots() ?? [], field)
                : [];
            node[field] = next;
            this.refreshRowsOf([node, ...cleared]);
            this.emitTreeEvent("tree:select", entry);
        } catch (err) {
            this.warn(`选中写入失败：${String(err)}`);
        }
    }

    /** 递归清空全树选中（单选语义：选新必清旧；折叠子树一并清——数据层操作），返回被清节点 */
    private clearAllSelected(nodes: any[], field: string): any[] {
        const cleared: any[] = [];
        for (const n of nodes) {
            if (n[field]) {
                n[field] = false;
                cleared.push(n);
            }
            cleared.push(...this.clearAllSelected(this.childrenOf(n), field));
        }
        return cleared;
    }

    /** 刷新数据引用对应的已渲染行（未渲染跳过——重展开时 buildLocalData 重算） */
    private refreshRowsOf(nodes: any[]) {
        for (const n of nodes) {
            const row = this.findRenderedRow(n);
            if (row) row.scope.refresh();
        }
    }

    /**
     * 复选切换（P2，决策 10）：写本行 + 级联（cascade，默认开）——
     * 向下：子孙全勾 / 全消（数据层递归，折叠子树同样生效）；
     * 向上：沿 $parent 链重算各祖先 checked（全部子勾选才勾）+ 刷新已渲染行的 $indeterminate
     * （半选是派生值不落盘，须随级联手动同步 localData——对齐 syncVisibility 更新 $expanded
     * 的模式）；cascade:false 时只写本行。
     */
    private toggleCheck(entry: TreeNodeEntry) {
        const field = this.checkedField;
        const next = !entry.node[field];
        try {
            entry.node[field] = next;
            if (this.cascade) {
                const cascaded = this.cascadeDown(this.childrenOf(entry.node), next);
                this.refreshAncestors(entry);
                this.refreshRowsOf(cascaded); // 新增属性不通知行内绑定，显式刷级联子行
            } else {
                this.refreshRowsOf([entry.node]);
            }
            this.emitTreeEvent("tree:check", entry, { checked: next });
        } catch (err) {
            this.warn(`复选写入失败：${String(err)}`);
        }
    }

    /** 向下级联：子孙全勾 / 全消（数据层递归写），返回被写节点 */
    private cascadeDown(nodes: any[], checked: boolean): any[] {
        const written: any[] = [];
        for (const n of nodes) {
            if (n[this.checkedField] !== checked) {
                n[this.checkedField] = checked;
                written.push(n);
            }
            written.push(...this.cascadeDown(this.childrenOf(n), checked));
        }
        return written;
    }

    /** 向上级联：沿祖先链重算 checked（全部子勾选）+ 刷新已渲染行 $indeterminate。
     *  祖先行必然存活（嵌套结构：子行渲染的前提是父行展开存在），数据引用 → 行经
     *  findRenderedRow；行销毁等异常边界直接截断（重展开时 buildLocalData 重算）。 */
    private refreshAncestors(entry: TreeNodeEntry) {
        let parent = entry.localData.$parent as any;
        while (parent) {
            const siblings = this.childrenOf(parent);
            parent[this.checkedField] = siblings.length > 0 && siblings.every((c: any) => c[this.checkedField]);
            const parentRow = this.findRenderedRow(parent);
            if (!parentRow) break;
            parentRow.localData.$indeterminate = this.computeIndeterminate(parent);
            parentRow.scope.refresh();
            parent = parentRow.localData.$parent as any;
        }
        // 级联可能改变自身行的半选态（勾选后必为非半选，直接刷新）
        entry.localData.$indeterminate = this.computeIndeterminate(entry.node);
        entry.scope.refresh();
    }

    /** 数据引用 → 已渲染行（未渲染返回 null：折叠 / 已销毁，重展开时 buildLocalData 重算） */
    private findRenderedRow(node: any): TreeNodeEntry | null {
        for (const entry of this.iterLayer(this.rootLayer)) {
            if (entry.node === node) return entry;
        }
        return null;
    }

    /** 迭代全部存活行（根层 → 递归各子层；行数有限，遍历成本可接受） */
    private *iterLayer(layer: TreeLayerRenderer | null): Generator<TreeNodeEntry> {
        if (!layer) return;
        for (const entry of layer.entries.values()) {
            yield entry;
            yield* this.iterLayer(entry.sub);
        }
    }

    // ── 拖拽（P3，决策 10：HTML5 DnD + 三态定位 + 环检测） ───────────

    /** 拖起：记源行（容器委托；draggable 行根才发） */
    private handleDragStart(e: DragEvent) {
        const entry = this.entryFromEvent(e);
        if (!entry) return;
        this.dragEntry = entry;
        // Firefox 等要求 dataTransfer 有数据才认拖拽；effectAllowed 声明移动语义
        try {
            e.dataTransfer?.setData("text/plain", String(entry.key));
            if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
        } catch {
            // happy-dom 等无 DataTransfer 环境：忽略
        }
    }

    /** 拖过行：三态定位（上 1/4 before / 下 1/4 after / 中段 inside）+ 环检测 + 指示 */
    private handleDragOver(e: DragEvent) {
        if (!this.dragEntry) return;
        const entry = this.entryFromEvent(e);
        if (!entry) {
            this.clearDropMark();
            return;
        }
        // 环检测：目标即源、或目标在源的子树内 → 拒绝（不 preventDefault = 不允许落点）
        if (entry === this.dragEntry || this.isDescendantOf(entry.node, this.dragEntry.node)) {
            this.clearDropMark();
            return;
        }
        const position = this.dropPosition(entry.row, e);
        // 单根数据的根行无兄弟序可言：before / after 拒绝（仅允许 inside 收纳）
        const raw = this.binding.read(this.nodesPath);
        if (!Array.isArray(raw) && entry.localData.$level === 0 && position !== "inside") {
            this.clearDropMark();
            return;
        }
        e.preventDefault(); // 允许 drop
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
        this.markDrop(entry.row, position);
    }

    /** 三态定位：鼠标 Y 相对**行线**高度的分段（上 25% before / 下 25% after / 中段 inside）。
     *  行线 = 行根顶至子容器顶：行根（li）的 rect 含已展开子树——按 li 全高分段会把
     *  inside / after 区挤进子树区域（孙及更深后代占高时，悬停自身行线只落 before，
     *  节点无法接受拖入）。子树区域归子行各自三段，互不抢占 */
    private dropPosition(row: HTMLElement, e: DragEvent): "before" | "after" | "inside" {
        const rect = row.getBoundingClientRect();
        let height = rect.height;
        for (const child of Array.from(row.children)) {
            const el = child as HTMLElement;
            if (el.hasAttribute?.("data-x-tree-children")) {
                const cRect = el.getBoundingClientRect();
                if (cRect.height > 0) height = cRect.top - rect.top; // 子树可见 → 截到行线
                break;
            }
        }
        const ratio = (e.clientY - rect.top) / Math.max(height, 1);
        if (ratio < 0.25) return "before";
        if (ratio > 0.75) return "after";
        return "inside";
    }

    /** 三态指示（互斥单行）：清旧标 + 新行挂类 */
    private markDrop(row: HTMLElement, position: "before" | "after" | "inside") {
        this.clearDropMark();
        row.classList.add(`x-tree-drop-${position}`);
        this.dropMarkRow = row;
    }

    private clearDropMark() {
        if (!this.dropMarkRow) return;
        this.dropMarkRow.classList.remove("x-tree-drop-before", "x-tree-drop-after", "x-tree-drop-inside");
        this.dropMarkRow = null;
    }

    /** dragleave：离开行边界清指示（dragover 会随即重标，低成本幂等） */
    private handleDragLeave(e: DragEvent) {
        const row = (e.target as Element)?.closest?.("[data-x-tree-row]");
        if (row === this.dropMarkRow) this.clearDropMark();
    }

    /** 落点：数据写回移动（先移除后插入，同父索引偏移修正）→ watcher 驱动 diff 重渲染 */
    private handleDrop(e: DragEvent) {
        e.preventDefault(); // 与 dragover 的允许配对
        const source = this.dragEntry;
        const target = this.entryFromEvent(e);
        this.clearDropMark();
        this.dragEntry = null;
        if (!source || !target || target === source) return;
        const position = this.dropPosition(target.row, e);
        if (this.isDescendantOf(target.node, source.node)) return; // 环检测（幂等防御）
        try {
            this.moveNode(source, target, position);
            this.el.dispatchEvent(
                new CustomEvent("tree:drop", {
                    detail: {
                        source: { id: source.node[this.idField], node: source.node, level: source.localData.$level },
                        target: { id: target.node[this.idField], node: target.node, level: target.localData.$level },
                        position,
                    },
                    bubbles: true,
                }),
            );
        } catch (err) {
            this.warn(`拖拽写回失败：${String(err)}`);
        }
    }

    /** 数据移动：源 splice 出原位 → 按 before / after / inside 插入目标位（inside 收纳 + 展开目标） */
    private moveNode(source: TreeNodeEntry, target: TreeNodeEntry, position: "before" | "after" | "inside") {
        const sourceParent = source.localData.$parent as any;
        const sourceArr: any[] = sourceParent ? this.childrenOf(sourceParent) : this.normalizeRoots() ?? [];
        const sourceIdx = sourceArr.indexOf(source.node);
        if (sourceIdx < 0) return; // 数据已被外部改动：放弃
        sourceArr.splice(sourceIdx, 1);
        if (position === "inside") {
            // 目标原是叶子（无 childrenField 数组）时先建容器——childrenOf 对缺字段返回临时
            // 空数组，直接 push 会丢数据（不进 state）
            if (!Array.isArray(target.node[this.childrenField])) {
                target.node[this.childrenField] = [];
            }
            this.childrenOf(target.node).push(source.node);
            target.node[this.expandField] = true; // 收纳后展开目标（可见落点反馈）
            return;
        }
        const targetParent = target.localData.$parent as any;
        // 同父且源在目标前：移除后目标索引左移一位
        const sameParent = sourceParent === targetParent;
        const targetArr: any[] = targetParent ? this.childrenOf(targetParent) : this.normalizeRoots() ?? [];
        let targetIdx = targetArr.indexOf(target.node);
        if (targetIdx < 0) {
            // 目标行数据同时被移走等边界：还原源位置放弃
            sourceArr.splice(sourceIdx, 0, source.node);
            return;
        }
        if (sameParent && sourceIdx < targetIdx) targetIdx--;
        targetArr.splice(position === "before" ? targetIdx : targetIdx + 1, 0, source.node);
    }

    /** target 是否在 ancestor 的子树内（环检测：拖入自身子孙会成环） */
    private isDescendantOf(target: any, ancestor: any): boolean {
        if (target === ancestor) return true;
        return this.childrenOf(ancestor).some((c: any) => c === target || this.isDescendantOf(target, c));
    }

    /** DnD 事件 → 行 entry（closest 定位；未命中 / 容器外返回 null） */
    private entryFromEvent(e: DragEvent): TreeNodeEntry | null {
        const target = e.target;
        if (!(target instanceof Element)) return null;
        const row = target.closest<HTMLElement>("[data-x-tree-row]");
        if (!row || !this.el.contains(row)) return null;
        return this.rowMap.get(row) ?? null;
    }

    /** 树事件广播（决策 11）：tree:expand / tree:collapse / tree:select / tree:check /
     *  tree:load / tree:loaded（ADR-0090），detail {id, node, level}（check 另带 checked、
     *  load 另带 fail 回调、loaded 另带 children），冒泡；tree:drop 的三段式 detail 见 handleDrop。
     *  非 private：层渲染器的懒加载结算路径也经此广播 */
    emitTreeEvent(type: string, entry: TreeNodeEntry, extra?: Record<string, any>) {
        this.el.dispatchEvent(
            new CustomEvent(type, {
                detail: {
                    id: entry.node[this.idField],
                    node: entry.node,
                    level: entry.localData.$level,
                    ...extra,
                },
                bubbles: true,
            }),
        );
    }

    /** warn 统一出口（带指令前缀，覆盖基类 warn；消息已自带 ADR 编号时不重复挂 ADR-0040） */
    override warn(message: string) {
        const adr = message.includes("ADR-") ? "" : "（ADR-0040）";
        super.warn(`x-tree: ${message}${adr}`);
    }
}
