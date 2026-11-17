(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){e.components[`autospark.table`]=`<!--
    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定
    不会求值——变体绑定（bordered/striped/selectable/virtual）与 loading 组合全部落在
    编译子树的内层 inner 元素上（list 同款范式，宿主为透明块壳）。

    内部装配（ADR-0018 决策 2「内部装配、对外开箱」，接线细节见 ADR-0023）：
    - 双 x-for：行循环（viewRows——rows × 排序态的 JS 通道派生视图）× 列循环（columns，
      template 形态挂行内——项经 template.parentElement 落位行元素，静态选择列与循环列
      共存同一行；嵌套 x-for 沿 scope 链解析组件域 columns，克隆体内组件实例/值通道
      均已实证可用）；
    - 普通分叉走 **CSS display:table 全 div 结构**（.asc-table-tablebox 表盒 + table-row/
      table-cell 系）：语义 <table> 在 happy-dom 下 <template> 子节点 content 丢失
      （table 语境模板解析边界），div 结构免疫且列宽随内容自动分配（table-layout:auto），
      语义经 ARIA role（table/row/columnheader/cell）承载；
    - 虚拟分叉走 **CSS grid 网格**：tbody 无法独立滚动而 virtual 策略要求 x-for 容器即
      滚动宿主——网格行（--asc-table-cols 自定义属性经 inner 继承贯通表头/数据行，JS
      通道 setProperty 同步——Chromium 自定义属性赋值须走 setProperty）+ 定高滚动容器
      （行定高 40px 显式声明，与字号档位解耦）；表头恒渲染不虚拟化（滚动容器外置 +
      scrollLeft JS 跟随）；
    - 单元格自定义：col-<key> 动态名出口（x-slot="{ name, params }" 对象形态，ADR-0107
      ——动态列键无静态出口可投 + 双分叉同名出口绕开静态去重 ADR-0056；形参
      { row, column, rowIndex, colIndex }），缺省单元格做 null 收敛 + 标量直出 + 对象
      JSON 序列化兜底；
    - 排序：表头点击三态轮转（无 → 升 → 降 → 无），本地排序经 viewRows 整体重排
      （remoteSort=true 只发 sort-change 事件不动数据，交调用方远端取数）；
    - 行选择：checkbox 列组合消费 autospark.checkbox（props 值通道携带 checked/
      indeterminate 布尔），全选/半选经表头 checkbox；选中集内部自持 selectedKeys
      （整体替换驱动全行重求值），selection props 单向内同步 + selection-change 事件外发；
    - loading（x-loading 经绑定通道写三态字面量）/ empty（autospark.empty 组合 + empty
      插槽重载；经 x-show 兄弟段驱动而非 x-empty special——分叉结构与虚拟策略互持更简）。

    出口声明形态：virtual/普通双分叉各持一份 col-<key>/empty 出口，统一走动态名对象
    形态（不入静态清单、不参与同名去重，运行期仅活跃分叉实例化投影——list 先例）。

    items 类数据变更通道：columns/rows/selection 均为调用方状态**引用**注入——整体替换
    驱动；原地增删不发信号（跨域边界，文档披露）。克隆体内一律 x-show（共享快照 x-if
    串台缺陷规避，ADR-0021 后果 3）。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized
     六键）自动获得——字号/行距随 data-size 档位缩放（em 基准）；table 不在 data()
     声明主题六键，内部变体属性亦禁用六个通道名 -->
<div
  class="asc-table"
  x-define="autospark.table"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            columns: [],        // 列定义 [{ key, title?, width?, align?, sortable? }]（状态引用注入——字面量数组死环规避）
            rows: [],           // 数据数组（状态引用注入；变更整体替换驱动重渲）
            rowKey: "id",       // 行键字段名（选择集键定位；缺失回退行索引——排序后跟随位置，文档披露）
            selectable: false,  // 行选择开关（前置 checkbox 列，组合消费 autospark.checkbox）
            selection: [],      // 受控选中集（行键数组，状态引用注入；单向内同步）
            remoteSort: false,  // 远端排序（true 时表头点击只发 sort-change 事件，不本地重排）
            loading: false,     // 加载态（引擎 x-loading 覆盖层组合，铺满表格）
            bordered: true,     // 外框开关（false 转透明色，占位稳定不跳变）
            striped: false,     // 斑马纹（偶数行浅底，:data-alt="$even" 数据通道——虚拟垫片不破奇偶）
            virtual: false,     // 虚拟滚动（网格分叉 + x-for.virtual；须同页引入 autospark.virtual.js，缺位退化全量）
            // —— 内部状态（JS 通道维护——绑定通道对 props 晚注入不重算，家族纪律）——
            viewRows: [],       // 排序视图（rows × 排序态派生；行 x-for 数据源）
            sortKey: "",        // 当前排序列 key（空 = 无排序）
            sortOrder: "",      // 排序方向 asc | desc | ""
            selectedKeys: [],   // 内部选中行键集（整体替换驱动全行 checkbox 重求值）
            allChecked: false,  // 全选态（表头 checkbox checked）
            halfChecked: false, // 半选态（表头 checkbox indeterminate）
        }),
        methods: {
            // 行键提取（rowKey 字段缺失回退行索引——选择集跟随位置而非数据，限制披露）
            keyOf(row, index) {
                const k = row == null ? undefined : row[this.data.rowKey];
                return k === undefined || k === null ? index : k;
            },
            // 排序比较器：数值差分 / 字符串 localeCompare（null 视空，确定性优先；数字字符串不隐式数值化，文档披露）
            cmpCells(x, y) {
                const a = x == null ? "" : x;
                const b = y == null ? "" : y;
                if (typeof a === "number" && typeof b === "number") return a - b;
                return String(a).localeCompare(String(b));
            },
            // 重建排序视图（rows / 排序态变化收口；整体替换驱动 x-for 重渲）
            rebuildView() {
                const list = Array.isArray(this.data.rows) ? this.data.rows : [];
                const key = this.data.sortKey;
                const order = this.data.sortOrder;
                if (!key || !order || this.data.remoteSort) {
                    this.data.viewRows = [...list];
                    return;
                }
                const sorted = [...list];
                sorted.sort((a, b) => this.cmpCells(a?.[key], b?.[key]) * (order === "asc" ? 1 : -1));
                this.data.viewRows = sorted;
            },
            // 选中集派生态同步（全选 / 半选——表头 checkbox 值通道）
            syncSelection() {
                const rows = Array.isArray(this.data.viewRows) ? this.data.viewRows : [];
                const keys = this.data.selectedKeys ?? [];
                let count = 0;
                for (let i = 0; i < rows.length; i++) {
                    if (keys.includes(this.keyOf(rows[i], i))) count++;
                }
                this.data.allChecked = rows.length > 0 && count === rows.length;
                this.data.halfChecked = count > 0 && count < rows.length;
            },
            // 表头点击排序：三态轮转 无 → 升 → 降 → 无（remoteSort 只发事件不动数据）
            onSortClick(column) {
                if (!column || !column.sortable) return;
                const key = column.key;
                if (this.data.sortKey === key && this.data.sortOrder) {
                    this.data.sortOrder = this.data.sortOrder === "asc" ? "desc" : "";
                    if (!this.data.sortOrder) this.data.sortKey = "";
                } else {
                    this.data.sortKey = key;
                    this.data.sortOrder = "asc";
                }
                this.rebuildView();
                this.el.dispatchEvent(
                    new CustomEvent("sort-change", {
                        bubbles: true,
                        detail: { key: this.data.sortKey, order: this.data.sortOrder },
                    }),
                );
            },
            // 行勾选切换（事件通道；整体替换 selectedKeys 驱动全行 checkbox 重求值）
            onRowCheck(row, index) {
                const key = this.keyOf(row, index);
                const keys = this.data.selectedKeys ?? [];
                this.data.selectedKeys = keys.includes(key)
                    ? keys.filter((k) => k !== key)
                    : [...keys, key];
                this.syncSelection();
                this.emitSelection();
            },
            // 表头全选切换（半选态点击 → 全选，原生行为对齐）
            onToggleAll() {
                const rows = Array.isArray(this.data.viewRows) ? this.data.viewRows : [];
                if (this.data.allChecked) {
                    this.data.selectedKeys = [];
                } else {
                    this.data.selectedKeys = rows.map((r, i) => this.keyOf(r, i));
                }
                this.syncSelection();
                this.emitSelection();
            },
            // 选中集变更出口（detail 标量投影——键数组）
            emitSelection() {
                this.el.dispatchEvent(
                    new CustomEvent("selection-change", {
                        bubbles: true,
                        detail: { keys: [...(this.data.selectedKeys ?? [])] },
                    }),
                );
            },
            // 虚拟网格列模板同步：--asc-table-cols 自定义属性落 inner（继承贯通 vhead/vrow，
            // 一处 setProperty 全表收口；列宽 number→px / 缺省 minmax 均分）
            syncGridCols() {
                const cols = Array.isArray(this.data.columns) ? this.data.columns : [];
                const parts = cols.map((c) => {
                    if (c && c.width) return typeof c.width === "number" ? c.width + "px" : String(c.width);
                    return "minmax(6em, 1fr)";
                });
                if (this.data.selectable) parts.unshift("3em");
                this.el.style.setProperty("--asc-table-cols", parts.join(" "));
            },
            // 虚拟表头横向滚动跟随（vhead 在滚动容器外，vbody scroll → scrollLeft JS 同步；
            // 处理器引用挂元素 expando，重绑/卸载经同键回收）
            bindVHeadSync() {
                this.unbindVHeadSync();
                const vbody = this.el.querySelector(".asc-table-vbody");
                const vhead = this.el.querySelector(".asc-table-vhead");
                if (!vbody || !vhead) return;
                const fn = () => { vhead.scrollLeft = vbody.scrollLeft; };
                vbody.__ascTableHeadSync = fn;
                vbody.addEventListener("scroll", fn, { passive: true });
            },
            unbindVHeadSync() {
                const vbody = this.el?.querySelector(".asc-table-vbody");
                const fn = vbody?.__ascTableHeadSync;
                if (fn) {
                    vbody.removeEventListener("scroll", fn);
                    vbody.__ascTableHeadSync = null;
                }
            },
        },
        mounted() {
            // —— 一跳后初始化（化身子树挂载与 props 注入落定，家族惯用法）——
            setTimeout(() => {
                // 受控选中集初值内同步（props 注入可晚于 watch 注册——初值在此收口统一读取；
                //     空数组跳过，不打回内部态）
                const init = Array.isArray(this.data.selection) ? [...this.data.selection] : [];
                if (init.length > 0) this.data.selectedKeys = init;
                this.rebuildView();
                this.syncSelection();
                this.syncGridCols();
                this.bindVHeadSync();
            }, 0);

            // —— props / 内部状态跟随（回调收 { value } 信封对象，家族惯用法；
            //     同值重跑幂等——i18n ready 等换血场景防打回，ADR-0021 后果 9）——
            this.watch("rows", () => { this.rebuildView(); this.syncSelection(); });
            this.watch("columns", () => {
                // 排序列消失时复位排序态（防悬挂 key 空转）
                if (this.data.sortKey && !(this.data.columns ?? []).some((c) => c && c.key === this.data.sortKey)) {
                    this.data.sortKey = "";
                    this.data.sortOrder = "";
                    this.rebuildView();
                }
                this.syncGridCols();
            });
            this.watch("selectable", () => { this.syncGridCols(); });
            // 受控选中集单向内同步：外部整体替换生效；同值跳过（内发事件不回环）
            this.watch("selection", ({ value }) => {
                const next = Array.isArray(value) ? [...value] : [];
                const cur = this.data.selectedKeys ?? [];
                if (next.length === cur.length && next.every((k) => cur.includes(k))) return;
                this.data.selectedKeys = next;
                this.syncSelection();
            });
            this.watch("virtual", () => {
                setTimeout(() => { this.syncGridCols(); this.bindVHeadSync(); }, 0);
            });
        },
        unmounted() {
            this.unbindVHeadSync();
        },
    }
  <\/script>
  <style global id="autospark-components-table">
    /* 宿主：块级满宽透明壳，字号基线经 data-size 档位全跟随（行内距/行高以 em 标定缩放） */
    .asc-table {
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-table-font-size, 0.875rem));
    }

    /* ---------- 盒子：变体数据属性直接命中 inner（编译子树内层） ---------- */
    .asc-table-inner {
      --asc-line: var(--auto-border-color, var(--asc-table-border-color, #d9d9d9));
      /* 语义选中色中转（alert 定型 --asc-tone 组织）：选中行 color-mix 派生唯一源 */
      --asc-tone: var(--auto-primary-color, var(--asc-table-primary, #009aff));
      /* 内距基准：消费 --auto-padding（--auto-spacing 速写族）——容器 data-spacing 档位全局调节生效（card 同款） */
      --asc-pad: var(--auto-padding, var(--asc-table-padding, 0.8rem));
      position: relative; /* x-loading 覆盖层定位基准 */
      display: block;
      background: var(--auto-bgcolor, var(--asc-table-bg, #ffffff));
      border: var(--auto-border-size, var(--asc-table-border-size, 1px)) solid
        var(--asc-line);
      border-radius: var(--auto-border-radius, var(--asc-table-radius, 0.5rem));
      overflow: hidden; /* 圆角裁切内部滚动内容 */
    }
    .asc-table-inner[data-borderless="true"] {
      --asc-line: transparent;
    }

    /* ══════════ 普通分叉：CSS display:table 全 div 结构（table-layout:auto 列宽随内容，
       ARIA role 承载语义——happy-dom 语义 <table> 内 <template> content 丢失边界规避）══════════ */
    .asc-table-scroll {
      overflow: auto;
      overscroll-behavior: contain;
    }
    .asc-table-tablebox {
      display: table;
      width: 100%;
      border-collapse: collapse;
    }
    .asc-table-hrow,
    .asc-table-row {
      display: table-row;
    }
    .asc-table-body {
      display: table-row-group;
    }
    /* 表头单元格：面板头底色 + 底部分隔线（内距 --asc-pad calc 派生，card 同款） */
    .asc-table-th {
      display: table-cell;
      padding: calc(var(--asc-pad, 0.8rem) * 0.7) calc(var(--asc-pad, 0.8rem) * 1.1);
      font-weight: var(--x-font-weight-medium, var(--asc-table-th-weight, 500));
      text-align: left;
      white-space: nowrap;
      background: var(--auto-panel-header-bgcolor, var(--asc-table-head-bg, rgba(245, 245, 245, 0.75)));
      border-bottom: var(--auto-border-size, var(--asc-table-border-size, 1px)) solid
        var(--asc-line);
    }
    .asc-table-th[data-sortable] {
      cursor: pointer;
      user-select: none;
    }
    .asc-table-th[data-sortable]:hover {
      background: var(--auto-hover-bgcolor, var(--asc-table-head-hover-bg, rgba(0, 0, 0, 0.045)));
    }
    /* 数据单元格：相邻行分隔线（内距 --asc-pad calc 派生） */
    .asc-table-td {
      display: table-cell;
      padding: calc(var(--asc-pad, 0.8rem) * 0.65) calc(var(--asc-pad, 0.8rem) * 1.1);
      border-top: var(--auto-border-size, var(--asc-table-border-size, 1px)) solid
        color-mix(in srgb, var(--asc-line, #d9d9d9) 60%, transparent);
    }
    /* 对齐变体（th/td/vh/vtd 同名通道；普通分叉 text-align，虚拟分叉 justify-content） */
    .asc-table-th[data-align="center"],
    .asc-table-td[data-align="center"] {
      text-align: center;
    }
    .asc-table-th[data-align="right"],
    .asc-table-td[data-align="right"] {
      text-align: right;
    }
    /* 排序指示：纯 CSS 三角（SVG 子树指令不编译边界规避，progress 先例）——
       无态淡化提示可排、asc 实心朝上、desc 旋转朝下 */
    .asc-table-sort {
      display: inline-block;
      width: 0;
      height: 0;
      margin-left: 0.35em;
      vertical-align: middle;
      border-left: 0.26em solid transparent;
      border-right: 0.26em solid transparent;
      border-bottom: 0.32em solid
        var(--auto-third-color, var(--asc-table-sort-color, rgba(0, 0, 0, 0.35)));
      opacity: 0.3;
      transition: opacity 0.15s ease, transform 0.15s ease;
    }
    .asc-table-th[data-sortable] .asc-table-sort {
      opacity: 0.35;
    }
    .asc-table-th[data-sort="asc"] .asc-table-sort,
    .asc-table-vh[data-sort="asc"] .asc-table-sort {
      opacity: 1;
      border-bottom-color: var(--auto-primary-color, var(--asc-table-sort-active, #009aff));
    }
    .asc-table-th[data-sort="desc"] .asc-table-sort,
    .asc-table-vh[data-sort="desc"] .asc-table-sort {
      opacity: 1;
      transform: rotate(180deg);
      border-bottom-color: var(--auto-primary-color, var(--asc-table-sort-active, #009aff));
    }
    /* 选中行高亮：--asc-tone 中转 + color-mix 派生（alert 定型语义色组织，:has() 探内层勾选态） */
    .asc-table-inner[data-selectable="true"] .asc-table-row:has(.asc-table-td-sel .asc-checkbox-input:checked),
    .asc-table-inner[data-selectable="true"] .asc-table-vrow:has(.asc-table-vtd-sel .asc-checkbox-input:checked) {
      background: color-mix(in srgb, var(--asc-tone) 8%, transparent);
    }
    /* 数据行：斑马纹（:data-alt="$even" 数据通道——虚拟垫片不破奇偶）+ 语义色悬停（末位声明悬停胜出） */
    .asc-table-inner[data-striped="true"] .asc-table-row[data-alt],
    .asc-table-inner[data-striped="true"] .asc-table-vrow[data-alt] {
      background: var(--auto-secondary-bgcolor, var(--asc-table-stripe-bg, rgba(245, 245, 245, 0.45)));
    }
    .asc-table-row:hover,
    .asc-table-vrow:hover {
      background: var(--auto-hover-bgcolor, var(--asc-table-row-hover-bg, rgba(0, 0, 0, 0.045)));
    }
    /* 默认单元格文本：单行省略（自定义列插槽不受此约束） */
    .asc-table-td-text {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--auto-color, var(--asc-table-color, #606060));
    }
    .asc-table-vtd .asc-table-td-text {
      width: 100%;
    }
    /* 选择列：居中窄列（普通分叉经 width 提示；虚拟分叉经 --asc-table-cols 首段 3em） */
    .asc-table-th-sel,
    .asc-table-td-sel,
    .asc-table-vh-sel,
    .asc-table-vtd-sel {
      text-align: center;
      white-space: nowrap;
    }
    .asc-table-th-sel,
    .asc-table-td-sel {
      width: 3em;
    }

    /* ══════════ 虚拟分叉：CSS grid 网格（--asc-table-cols 经 inner 继承贯通；行定高
       40px 与 itemHeight 配套，字号档位解耦——select/list 同款约束）══════════ */
    .asc-table-vhead {
      display: grid;
      grid-template-columns: var(--asc-table-cols, none);
      grid-auto-flow: column;
      grid-auto-columns: minmax(6em, 1fr);
      overflow: hidden; /* 横向跟随 vbody（scrollLeft JS 同步） */
      background: var(--auto-panel-header-bgcolor, var(--asc-table-head-bg, rgba(245, 245, 245, 0.75)));
      border-bottom: var(--auto-border-size, var(--asc-table-border-size, 1px)) solid
        var(--asc-line);
    }
    .asc-table-vbody {
      height: var(--asc-table-virtual-height, 20em);
      overflow: auto;
      overscroll-behavior: contain;
    }
    .asc-table-vrow {
      display: grid;
      grid-template-columns: var(--asc-table-cols, none);
      grid-auto-flow: column;
      grid-auto-columns: minmax(6em, 1fr);
      height: 40px; /* 虚拟化定高：与 x-for-options itemHeight: 40 配套（覆盖须同改两处，文档披露） */
      box-sizing: border-box;
      align-items: center;
    }
    .asc-table-vrow + .asc-table-vrow {
      border-top: var(--auto-border-size, var(--asc-table-border-size, 1px)) solid
        color-mix(in srgb, var(--asc-line, #d9d9d9) 60%, transparent);
    }
    .asc-table-vh,
    .asc-table-vtd {
      display: flex;
      align-items: center;
      min-width: 0;
      padding: 0 calc(var(--asc-pad, 0.8rem) * 1.1);
      overflow: hidden;
    }
    .asc-table-vh {
      font-weight: var(--x-font-weight-medium, var(--asc-table-th-weight, 500));
      white-space: nowrap;
    }
    .asc-table-vh[data-sortable] {
      cursor: pointer;
      user-select: none;
    }
    .asc-table-vh[data-sortable]:hover {
      background: var(--auto-hover-bgcolor, var(--asc-table-head-hover-bg, rgba(0, 0, 0, 0.045)));
    }
    .asc-table-vh[data-align="center"],
    .asc-table-vtd[data-align="center"] {
      justify-content: center;
    }
    .asc-table-vh[data-align="right"],
    .asc-table-vtd[data-align="right"] {
      justify-content: flex-end;
    }

    /* ---------- 空态段（x-show 兄弟段；满宽铺展，非列内单元格） ---------- */
    .asc-table-empty {
      padding: calc(var(--asc-pad, 0.8rem) * 1.5) var(--asc-pad, 0.8rem);
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
    [dark] .asc-table-inner,
    [data-dark] .asc-table-inner {
      background: var(--auto-bgcolor, var(--asc-table-bg, #3a3a3a));
      --asc-line: var(--auto-border-color, var(--asc-table-border-color, #52525b));
    }
    [dark] .asc-table-th,
    [dark] .asc-table-vhead,
    [data-dark] .asc-table-th,
    [data-dark] .asc-table-vhead {
      background: var(--auto-panel-header-bgcolor, var(--asc-table-head-bg, rgba(80, 80, 80, 0.35)));
    }
    [dark] .asc-table-td-text,
    [data-dark] .asc-table-td-text {
      color: var(--auto-color, var(--asc-table-color, #fafafa));
    }
    [dark] .asc-table-inner[data-striped="true"] .asc-table-row[data-alt],
    [dark] .asc-table-inner[data-striped="true"] .asc-table-vrow[data-alt],
    [data-dark] .asc-table-inner[data-striped="true"] .asc-table-row[data-alt],
    [data-dark] .asc-table-inner[data-striped="true"] .asc-table-vrow[data-alt] {
      background: var(--auto-secondary-bgcolor, var(--asc-table-stripe-bg, rgba(129, 129, 129, 0.25)));
    }
    [dark] .asc-table-row:hover,
    [dark] .asc-table-vrow:hover,
    [data-dark] .asc-table-row:hover,
    [data-dark] .asc-table-vrow:hover {
      background: var(--auto-hover-bgcolor, var(--asc-table-row-hover-bg, rgba(255, 255, 255, 0.08)));
    }
    [dark] .asc-table-sort,
    [data-dark] .asc-table-sort {
      border-bottom-color: var(--auto-third-color, var(--asc-table-sort-color, rgba(255, 255, 255, 0.45)));
    }
  </style>
  <!-- 变体数据属性 + loading 组合承载在 inner（编译子树内层元素）；loading 三态字面量
         （list 同款：假态显式 "false" 走 attrChanged 通道） -->
  <div
    class="asc-table-inner"
    :data-borderless="!bordered"
    :data-striped="striped"
    :data-selectable="selectable"
    :data-virtual="virtual"
    :x-loading="loading ? 'true' : 'false'"
  >
    <!-- 普通分叉：CSS display:table（virtual=false 缺省）。列循环 template 形态挂行内——
             项落 template.parentElement（单元格直挂行元素），静态选择列与循环列共存同一行 -->
    <div class="asc-table-wrap" x-if="!virtual">
      <div class="asc-table-scroll">
        <div class="asc-table-tablebox" role="table">
          <div class="asc-table-hrow" role="row">
            <div class="asc-table-th asc-table-th-sel" role="columnheader" x-show="selectable">
              <span
                class="asc-table-check"
                x-component:autospark.checkbox="{ checked: allChecked, indeterminate: halfChecked }"
                @change="onToggleAll()"
              ></span>
            </div>
            <template x-for="column, colIndex of columns" :key="column.key">
              <div
                class="asc-table-th"
                role="columnheader"
                :data-sortable="column.sortable"
                :data-align="column.align"
                :data-sort="sortKey === column.key ? sortOrder : false"
                :style="column.width ? 'width:' + (typeof column.width === 'number' ? column.width + 'px' : column.width) : false"
                @click="onSortClick(column)"
              >
                <span class="asc-table-th-title">{{ column.title || column.key }}</span>
                <i class="asc-table-sort" x-show="column.sortable"></i>
              </div>
            </template>
          </div>
          <div class="asc-table-body" role="rowgroup" x-for="row, rowIndex of viewRows">
            <div class="asc-table-row" role="row" :data-alt="$even">
              <div class="asc-table-td asc-table-td-sel" role="cell" x-show="selectable">
                <span
                  class="asc-table-check"
                  x-component:autospark.checkbox="{ checked: selectedKeys.includes(row[rowKey] ?? rowIndex) }"
                  @change="onRowCheck(row, rowIndex)"
                ></span>
              </div>
              <template x-for="column, colIndex of columns" :key="column.key">
                <div
                  class="asc-table-td"
                  role="cell"
                  :data-align="column.align"
                  x-slot="{ name: 'col-' + column.key, params: { row, column, rowIndex, colIndex } }"
                >
                  <span
                    class="asc-table-td-text"
                    x-text="row[column.key] == null ? '' : (typeof row[column.key] === 'object' ? JSON.stringify(row[column.key]) : row[column.key])"
                  ></span>
                </div>
              </template>
            </div>
          </div>
        </div>
        <!-- 空态段（x-show 兄弟段——满宽铺展；empty 插槽可整体重载，缺省组合 autospark.empty） -->
        <div class="asc-table-empty" x-show="!(viewRows && viewRows.length > 0)">
          <div class="asc-table-empty-outlet" x-slot="{ name: 'empty' }">
            <x-empty></x-empty>
          </div>
        </div>
      </div>
    </div>
    <!-- 虚拟分叉：CSS grid 网格（virtual=true）。vbody 即 x-for.virtual 容器 = 滚动宿主
             （策略要求）；表头外置恒渲染（横向 scrollLeft JS 跟随）；网格列模板经
             --asc-table-cols 继承（inner 一处 setProperty）；行定高 40px 显式声明 -->
    <div class="asc-table-vwrap" x-if="virtual">
      <div class="asc-table-vhead" role="row">
        <div class="asc-table-vh asc-table-vh-sel" role="columnheader" x-show="selectable">
          <span
            class="asc-table-check"
            x-component:autospark.checkbox="{ checked: allChecked, indeterminate: halfChecked }"
            @change="onToggleAll()"
          ></span>
        </div>
        <template x-for="column, colIndex of columns" :key="column.key">
          <div
            class="asc-table-vh"
            role="columnheader"
            :data-sortable="column.sortable"
            :data-align="column.align"
            :data-sort="sortKey === column.key ? sortOrder : false"
            @click="onSortClick(column)"
          >
            <span class="asc-table-th-title">{{ column.title || column.key }}</span>
            <i class="asc-table-sort" x-show="column.sortable"></i>
          </div>
        </template>
      </div>
      <div
        class="asc-table-vbody"
        role="rowgroup"
        x-for="row, rowIndex of viewRows"
        x-for-options="{ virtual: true, itemHeight: 40 }"
      >
        <div class="asc-table-vrow" role="row" :data-alt="$even">
          <div class="asc-table-vtd asc-table-vtd-sel" role="cell" x-show="selectable">
            <span
              class="asc-table-check"
              x-component:autospark.checkbox="{ checked: selectedKeys.includes(row[rowKey] ?? rowIndex) }"
              @change="onRowCheck(row, rowIndex)"
            ></span>
          </div>
          <template x-for="column, colIndex of columns" :key="column.key">
            <div
              class="asc-table-vtd"
              role="cell"
              :data-align="column.align"
              x-slot="{ name: 'col-' + column.key, params: { row, column, rowIndex, colIndex } }"
            >
              <span
                class="asc-table-td-text"
                x-text="row[column.key] == null ? '' : (typeof row[column.key] === 'object' ? JSON.stringify(row[column.key]) : row[column.key])"
              ></span>
            </div>
          </template>
        </div>
      </div>
      <!-- 空态段（x-show 兄弟段，virtual 分叉共享 empty 插槽） -->
      <div class="asc-table-empty" x-show="!(viewRows && viewRows.length > 0)">
        <div class="asc-table-empty-outlet" x-slot="{ name: 'empty' }">
          <x-empty></x-empty>
        </div>
      </div>
    </div>
  </div>
</div>
`}n();function n(){e(e=>{t(e)})}};
    if (AutoSpark === undefined) {
        // 插件先于引擎加载（engine ADR-0114）：入预加载队列，engine 构造 drain 时以命名空间回放
        var queue = (globalThis.__AUTOSPARK_PLUGINS__ ??= []);
        if (Object.isFrozen(queue)) {
            console.error("插件闭包: 预加载队列已消费且全局 AutoSpark 不可达，插件未注册");
            return;
        }
        queue.push(function (engine, ns) { run(ns); });
    } else {
        run(AutoSpark);
    }
})(globalThis.AutoSpark);

//# sourceMappingURL=autospark.table.js.map
