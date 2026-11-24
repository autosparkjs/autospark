(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){return e.replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function n(e){return/^[A-Za-z_$][\w$]*$/.test(e)?e:JSON.stringify(e)}function r(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}var i=`autospark.menu`;function a(e){e.components[i]=`<div
  class="asc-menu"
  x-define="autospark.menu"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            value: "",
            items: [],
            expandLevel: 1,
            popLevel: 0,
            openKeys: {},
            collapsed: false,
            trigger: "hover",
            mode: "vertical",
            slotDir: "vertical",
            width: 200,
            collapsedWidth: 48,
            tree: [],
            openView: {},
            activeKey: "",
            markedMap: {},
            wantFocusAt: 0,
            // 生效宽度（px 数值；0 = 自适应填充父容器 / 水平模式不适用）：仅正有限数生效，
            // 否则展开态回落自适应、折叠态回落 48（折叠态必须窄）
            effWidth: (s) => {
                if (s.mode === "horizontal") return 0;
                const fold = !!s.collapsed;
                const raw = fold ? s.collapsedWidth : s.width;
                return typeof raw === "number" && isFinite(raw) && raw > 0 ? raw : fold ? 48 : 0;
            },
            // 宽度 inline（0 = 不写，回落样式表 width:100%）——落内层 body：模板根动态绑定不求值
            boxStyle: (s) => (s.effWidth > 0 ? { width: s.effWidth + "px" } : null),
            // 激活项（影子树条目引用；数组勾选形态 / 未激活为 null）
            activeItem: (s) => {
                if (s.activeKey === "") return null;
                let found = null;
                const walk = (list) => {
                    for (const e of list) {
                        if (found) return;
                        if (e.kind === "item" && e.key === s.activeKey) {
                            found = e;
                            return;
                        }
                        if (e.kids && e.kids.length) walk(e.kids);
                    }
                };
                walk(s.tree || []);
                return found;
            },
            // 激活项祖先链（根 → 自身；未激活为空数组）
            activePath: (s) => {
                const path = [];
                if (s.activeKey === "") return path;
                const walk = (list) => {
                    for (const e of list) {
                        if (e.kind !== "item") continue;
                        path.push(e);
                        if (e.key === s.activeKey) return true;
                        if (e.kids && e.kids.length && walk(e.kids)) return true;
                        path.pop();
                    }
                    return false;
                };
                return walk(s.tree || []) ? path : [];
            },
            // 插槽形参（作用域插槽）：header / footer 出口全集，调用方按需解构（只读）
            slotParams: (s) => ({
                collapsed: !!s.collapsed,
                width: s.effWidth,
                activeKey: s.activeKey,
                activeItem: s.activeItem,
                activePath: s.activePath,
                mode: s.mode,
                value: s.value,
                items: s.items,
                openKeys: s.openKeys,
                expandLevel: s.expandLevel,
                popLevel: s.popLevel,
                trigger: s.trigger,
                slotDir: s.slotDir,
            }),
        }),
        methods: {
            normalize(list, parentDisabled) {
                const raw = Array.isArray(list) ? list.filter((x) => x != null) : [];
                const entries = [];
                for (const entry of raw) {
                    if (entry === "-" || (entry && entry.type === "separator")) {
                        entries.push({ kind: "sep" });
                        continue;
                    }
                    if (entry && entry.type === "group") {
                        entries.push({ kind: "group", title: String(entry.title ?? ""), icon: entry.icon ?? "" });
                        continue;
                    }
                    const it = entry && typeof entry === "object" ? entry : {};
                    const kidsRaw = Array.isArray(it.children)
                        ? it.children
                        : (it.children && Array.isArray(it.children.children) ? it.children.children : []);
                    const conf = Array.isArray(it.children) ? {} : (it.children ?? {});
                    const disabled = !!it.disabled || !!parentDisabled;
                    const key = it.key == null ? null : String(it.key);
                    if (key == null && (kidsRaw.length > 0 || it.checkable) && typeof console !== "undefined") {
                        console.warn("[autospark.menu] 无 key 的项不可被 value/openKeys 引用：", it.label ?? it);
                    }
                    entries.push({ ...it, kind: "item", key, disabled, kids: this.normalize(kidsRaw, disabled), conf });
                }
                const items = entries.filter((e) => e.kind === "item");
                const hasIcon = items.some((e) => !!e.icon);
                const hasCheck = items.some((e) => !!e.checkable);
                for (const e of entries) {
                    if (e.kind !== "item") continue;
                    e.iconPh = hasIcon && !e.icon;
                    e.checkPh = hasCheck;
                }
                while (entries.length && entries[0].kind === "sep") entries.shift();
                while (entries.length && entries[entries.length - 1].kind === "sep") entries.pop();
                return entries;
            },
            // 弹层起始层级：折叠态（垂直 = 子级全弹层）与水平模式（子级全弹层）恒为 1
            popFromNow() {
                if (this.data.collapsed || this.data.mode === "horizontal") return 1;
                const pl = Number(this.data.popLevel);
                return pl > 0 ? pl + 1 : Infinity;
            },
            recomputeView() {
                const open = this.data.openKeys ?? {};
                const popFrom = this.popFromNow();
                const view = {};
                const walk = (list, depth) => {
                    for (const e of list) {
                        if (e.kind !== "item") { e._fold = false; e._pop = false; e._leaf = false; continue; }
                        const hasKids = !!(e.kids && e.kids.length);
                        e._fold = hasKids && depth < popFrom;
                        e._pop = hasKids && depth >= popFrom;
                        e._leaf = !hasKids;
                        if (!hasKids || e.key == null) continue;
                        view[e.key] = e.key in open ? !!open[e.key] : depth <= Number(this.data.expandLevel ?? 1);
                        e._open = !!view[e.key];
                        walk(e.kids, depth + 1);
                    }
                };
                walk(this.data.tree || [], 1);
                this.data.openView = view;
            },
            recomputeMarks() {
                const v = this.data.value;
                const tree = this.data.tree || [];
                if (Array.isArray(v)) {
                    this.data.activeKey = "";
                    const m = {};
                    for (const k of v) m[String(k)] = true;
                    this.data.markedMap = m;
                    const walk = (list) => {
                        for (const e of list) {
                            if (e.kind !== "item") continue;
                            e._marked = !!m[e.key];
                            e._active = false;
                            if (e.kids && e.kids.length) walk(e.kids);
                        }
                    };
                    walk(tree);
                } else {
                    const active = v == null ? "" : String(v);
                    this.data.activeKey = active;
                    this.data.markedMap = {};
                    const walk = (list) => {
                        for (const e of list) {
                            if (e.kind !== "item") continue;
                            e._active = e.key != null && e.key === active && active !== "";
                            e._marked = false;
                            if (e.kids && e.kids.length) walk(e.kids);
                        }
                    };
                    walk(tree);
                }
            },
            findItem(key) {
                if (key == null) return null;
                const target = String(key);
                let found = null;
                const walk = (list) => {
                    for (const e of list) {
                        if (found) return;
                        if (e.kind === "item" && e.key === target) { found = e; return; }
                        if (e.kids && e.kids.length) walk(e.kids);
                    }
                };
                walk(this.data.tree || []);
                return found;
            },
            onRelay(event) {
                const d = event.detail || {};
                if (d.kind === "toggle") this.onToggle(d.key);
                else if (d.kind === "pick") this.onPick(d.key);
            },
            closeAllPanels() {
                document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            },
            onPick(key) {
                const item = this.findItem(key);
                if (!item || item.disabled) return;
                if (Array.isArray(this.data.value)) {
                    if (!item.checkable || item.key == null) return;
                    const arr = (this.data.value || []).map(String);
                    const next = arr.indexOf(item.key) >= 0 ? arr.filter((k) => k !== item.key) : arr.concat(item.key);
                    this.data.value = next;
                    this.recomputeMarks();
                    this.el.dispatchEvent(new Event("input", { bubbles: false }));
                    this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { value: next } }));
                    return;
                }
                if (item.kids.length || item.key == null || item.key === String(this.data.value ?? "")) return;
                this.data.value = item.key;
                this.recomputeMarks();
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { value: item.key } }));
                this.closeAllPanels();
            },
            onToggle(key) {
                if (key == null) return;
                const open = { ...(this.data.openKeys ?? {}) };
                // 目标态按当前**实际**展开态取反：openKeys 未覆盖的项其展开态来自 expandLevel
                // 默认、不在 openKeys 里——按原值取反会把「默认展开」误判成「要展开」（首次点击无效）
                const current = key in open ? !!open[key] : !!this.data.openView[key];
                const expanded = !current;
                // 显式三态：收起写 false（不 delete）——删键会落入 recomputeView 的 expandLevel
                // 回退分支，depth ≤ expandLevel 的父项收不起
                open[key] = expanded;
                this.data.openKeys = open;
                this.el.dispatchEvent(new CustomEvent("expand", { bubbles: true, detail: { key, expanded } }));
            },
            expandTo(key) {
                const target = String(key ?? "");
                if (target === "" || Array.isArray(this.data.value)) return;
                let chain = null;
                const walk = (list, parents) => {
                    for (const e of list) {
                        if (chain) return true;
                        if (e.kind !== "item") continue;
                        if (e.key === target && !e.kids.length) { chain = parents.slice(); return true; }
                        if (e.kids.length && walk(e.kids, parents.concat(e.key))) return true;
                    }
                    return false;
                };
                if (!walk(this.data.tree || [], [])) return;
                const open = { ...(this.data.openKeys ?? {}) };
                let dirty = false;
                for (const k of chain) {
                    if (!open[k]) { open[k] = true; dirty = true; }
                }
                if (dirty) this.data.openKeys = open;
            },
            onKeydown(event) {
                const k = event.key;
                if (k !== "ArrowDown" && k !== "ArrowUp" && k !== "ArrowRight" && k !== "ArrowLeft" && k !== "Home" && k !== "End") return;
                const btn = event.target && event.target.closest ? event.target.closest(".asc-menu-entry > .asc-button") : null;
                const currentEntry = btn ? btn.closest(".asc-menu-entry") : null;
                const focusables = (list) => Array.from(list.querySelectorAll(":scope > .asc-menu-entry > .asc-button:not([disabled])"));
                if (k === "ArrowDown" || k === "ArrowUp" || k === "Home" || k === "End") {
                    const list = currentEntry ? currentEntry.parentElement : this.el.querySelector(".asc-menu-list");
                    const arr = list ? focusables(list) : [];
                    if (!arr.length) return;
                    event.preventDefault();
                    let next = null;
                    if (k === "Home") next = arr[0];
                    else if (k === "End") next = arr[arr.length - 1];
                    else {
                        const i = arr.indexOf(btn);
                        const dir = k === "ArrowDown" ? 1 : -1;
                        next = i < 0 ? arr[0] : arr[(i + dir + arr.length) % arr.length];
                    }
                    if (next) next.focus();
                    return;
                }
                if (!btn || !currentEntry) return;
                if (k === "ArrowRight") {
                    const mode = currentEntry.getAttribute("data-mode");
                    if (mode === "fold") {
                        event.preventDefault();
                        const pkey = currentEntry.getAttribute("data-key");
                        if (pkey && !this.data.openView[pkey]) this.onToggle(pkey);
                        setTimeout(() => {
                            const first = currentEntry.querySelector(".asc-menu-sub .asc-menu-entry > .asc-button:not([disabled])");
                            if (first) first.focus();
                        }, 0);
                        return;
                    }
                    if (mode === "pop") {
                        event.preventDefault();
                        this.openPophost(currentEntry);
                        this.data.wantFocusAt = Date.now();
                    }
                    return;
                }
                const sub = currentEntry.closest(".asc-menu-sub");
                if (sub) {
                    event.preventDefault();
                    const parentEntry = sub.closest(".asc-menu-entry");
                    const pkey = parentEntry ? parentEntry.getAttribute("data-key") : null;
                    if (pkey && this.data.openView[pkey]) this.onToggle(pkey);
                    const pbtn = parentEntry ? parentEntry.querySelector(":scope > .asc-button") : null;
                    if (pbtn) pbtn.focus();
                }
            },
            openPophost(popEl) {
                if (String(this.data.trigger) === "click") {
                    popEl.dispatchEvent(new MouseEvent("click", { bubbles: true }));
                } else {
                    popEl.dispatchEvent(new MouseEvent("mouseenter", { bubbles: false }));
                }
            },
        },
        mounted() {

            const raw = this.el.getAttribute("data-items");
            if ((!this.data.items || !this.data.items.length) && raw) {
                try { this.data.items = JSON.parse(raw); } catch { /* 非法 JSON 静默忽略（容错缺省空组） */ }
                this.el.removeAttribute("data-items");
            }

            this.data.tree = this.normalize(this.data.items, false);
            this.recomputeMarks();
            this.recomputeView();

            const prior = this.el.value;
            Object.defineProperty(this.el, "value", {
                get: () => (Array.isArray(this.data.value) ? this.data.value.join(",") : String(this.data.value ?? "")),
                set: (v) => {
                    this.data.value = String(v ?? "");
                    this.recomputeMarks();
                    this.expandTo(v);
                },
                configurable: true,
            });

            setTimeout(() => {
                if ((this.data.value === "" || this.data.value == null) && typeof prior === "string" && prior !== "") {
                    this.data.value = prior;
                }
                this.recomputeMarks();
                this.expandTo(this.data.value);
            }, 0);

            this.watch("items", () => {
                this.data.tree = this.normalize(this.data.items, false);
                this.recomputeMarks();
                this.recomputeView();
            });
            this.watch("value", () => {
                this.recomputeMarks();
                this.expandTo(this.data.value);
            });
            this.watch("openKeys", () => { this.recomputeView(); });
            this.watch("expandLevel", () => { this.recomputeView(); });
            this.watch("popLevel", () => { this.recomputeView(); });
            this.watch("collapsed", () => { this.recomputeView(); });
            this.watch("mode", () => { this.recomputeView(); });
        },
    }
  <\/script>
  <style global id="autospark-components-menu">
    .asc-menu {
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-menu-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
    }
    .asc-menu-body {
      --asc-tone: var(--auto-primary-color, var(--asc-menu-primary, #009aff));
      display: flex;
      flex-direction: column;
      outline: none;
      min-width: 0;
      transition: width 0.2s ease;
    }
    .asc-menu-body:focus-visible {
      box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--asc-tone) 28%, transparent);
    }
    .asc-menu-header,
    .asc-menu-footer {
      padding: 0.4em 0.25em;
      color: var(--auto-third-color, var(--asc-menu-aux-color, rgba(0, 0, 0, 0.35)));
      min-width: 0;
    }
    /* 垂直折叠态：header/footer 保留（可经插槽形参切换内容）并裁剪溢出——只在分区上裁，
       根上裁会连带裁掉子树内定位的弹层 */
    .asc-menu-body[data-mode="vertical"][data-collapsed] .asc-menu-header,
    .asc-menu-body[data-mode="vertical"][data-collapsed] .asc-menu-footer {
      overflow: hidden;
    }
    .asc-menu-slot {
      display: block;
      min-width: 0;
    }
    .asc-menu-main {
      min-width: 0;
    }

    .asc-menu-list {
      list-style: none;
      margin: 0;
      padding: 0;
      min-width: 0;
    }
    .asc-menu-entry {
      position: relative;
      min-width: 0;
    }
    .asc-menu-sep {
      margin: 0.35em 0.75em;
      border-top: var(--auto-border-size, var(--asc-menu-border-size, 1px)) solid
        var(--auto-border-color, var(--asc-menu-border, #f0f0f0));
    }
    .asc-menu-group {
      display: flex;
      align-items: center;
      gap: 0.4em;
      padding: 0.6em 0.75em 0.25em;
      font-size: 0.85em;
      color: var(--auto-third-color, var(--asc-menu-aux-color, rgba(0, 0, 0, 0.35)));
      white-space: nowrap;
    }
    /* 折叠态：分组标题只留图标，无图标的整标题不渲染（文字在图标列里无处安放） */
    .asc-menu-body[data-collapsed] .asc-menu-group-title {
      display: none;
    }
    .asc-menu-body[data-collapsed] .asc-menu-group:not([data-icon]) {
      display: none;
    }
    .asc-menu-group-icon {
      display: inline-flex;
      flex: none;
    }
    .asc-menu-group-title {
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* button 化身载体是 div（content-box，异于 <button> 的 UA border-box）：block 的
       width:100% 须含 padding 与边框，否则每行撑出菜单宽度一个内边距的量 */
    .asc-menu-entry > .asc-button {
      box-sizing: border-box;
    }
    .asc-menu-entry[data-active] > .asc-button {
      color: var(--asc-tone);
      font-weight: var(--x-font-weight-large, 600);
      background: color-mix(in srgb, var(--asc-tone) 10%, transparent);
    }
    /* 勾选项（数组形态，checkMark 占位列的显影——button 自有 ✓ 规则需 asc-marked 类，
       menu 侧经 entry 标记命中，不经 class 通道） */
    .asc-menu-entry[data-marked] > .asc-button.asc-check-check > .asc-button-body::before {
      content: "✓";
    }
    /* 图标占位列：仅展开态隐藏（同级图标对齐）；折叠态只剩图标列，占位图标须可见 */
    .asc-menu-body:not([data-collapsed]) .asc-menu-entry[data-icon-ph] > .asc-button .asc-button-icon {
      visibility: hidden;
    }
    /* 折叠态：激活 / 勾选 = 图标染激活色（label 不在场，仅此一处可表达） */
    .asc-menu-body[data-collapsed] .asc-menu-entry[data-active] > .asc-button .asc-button-icon,
    .asc-menu-body[data-collapsed] .asc-menu-entry[data-marked] > .asc-button .asc-button-icon {
      color: var(--asc-tone);
      visibility: visible;
    }

    .asc-menu-subwrap {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 0.2s ease;
    }
    .asc-menu-subwrap[data-open] {
      grid-template-rows: 1fr;
    }
    .asc-menu-subwrap > .asc-menu-sub {
      overflow: hidden;
      min-height: 0;
      /* 子级缩进基准 = 父项内容起点：1.5em 使子项文字与父项图标列起点对齐，逐级累计 */
      padding-inline-start: var(--asc-menu-indent, 1.5em);
    }

    .asc-menu-body[data-mode="horizontal"] {
      flex-direction: column;
    }
    .asc-menu-body[data-mode="horizontal"] .asc-menu-list {
      display: flex;
      align-items: stretch;
      flex-wrap: wrap;
      row-gap: 0.125em;
      column-gap: 0.125em;
    }
    .asc-menu-body[data-mode="horizontal"] .asc-menu-entry + .asc-menu-entry {
      margin-left: 0.125em;
    }
    .asc-menu-body[data-mode="horizontal"] .asc-menu-sep {
      margin: 0.35em 0.25em;
      border-top: none;
      border-left: var(--auto-border-size, var(--asc-menu-border-size, 1px)) solid
        var(--auto-border-color, var(--asc-menu-border, #f0f0f0));
      align-self: stretch;
    }
    .asc-menu-body[data-mode="horizontal"] .asc-menu-group {
      align-items: center;
      padding: 0.6em 0.5em 0.25em;
    }

    .asc-menu-body[data-slot-dir="horizontal"] {
      flex-direction: row;
      align-items: stretch;
    }
    .asc-menu-body[data-slot-dir="horizontal"] > .asc-menu-header {
      order: 0;
      align-self: center;
      padding-inline: 0.5em;
    }
    .asc-menu-body[data-slot-dir="horizontal"] > .asc-menu-main {
      order: 1;
      flex: 1 1 auto;
      min-width: 0;
    }
    .asc-menu-body[data-slot-dir="horizontal"] > .asc-menu-footer {
      order: 2;
      align-self: center;
      padding-inline: 0.5em;
    }

    .asc-menu-panel {
      min-width: max-content;
      max-width: 18em;
      font-size: var(--auto-font-size, var(--asc-menu-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
      color: var(--auto-color, var(--asc-menu-color, #606060));
      --asc-tone: var(--auto-primary-color, var(--asc-menu-primary, #009aff));
      outline: none;
    }

    [dark] .asc-menu-body,
    [data-dark] .asc-menu-body {
      --asc-tone: var(--auto-primary-color, var(--asc-menu-primary, #56baff));
    }
    [dark] .asc-menu .asc-menu-entry > .asc-button,
    [data-dark] .asc-menu .asc-menu-entry > .asc-button {
      color: var(--auto-color, var(--asc-menu-color, #fafafa));
    }
    [dark] .asc-menu-sep,
    [data-dark] .asc-menu-sep {
      border-color: var(--auto-border-color, var(--asc-menu-border, #52525b));
    }
    [dark] .asc-menu-group,
    [dark] .asc-menu-header,
    [dark] .asc-menu-footer,
    [dark] .asc-menu-panel,
    [data-dark] .asc-menu-group,
    [data-dark] .asc-menu-header,
    [data-dark] .asc-menu-footer,
    [data-dark] .asc-menu-panel {
      color: var(--auto-color, var(--asc-menu-color, #fafafa));
    }
  </style>
  <div
    class="asc-menu-body"
    :data-mode="mode"
    :data-collapsed="!!collapsed ? '' : null"
    :data-slot-dir="!!collapsed && mode !== 'horizontal' ? 'vertical' : slotDir"
    :style="boxStyle"
    tabindex="0"
    @keydown="onKeydown($event)"
    @menu-relay="onRelay($event)"
  >
    <div class="asc-menu-header">
      <div class="asc-menu-slot" x-slot:header="slotParams"></div>
    </div>
    <div class="asc-menu-main">
      <div
        x-component:autospark-menu-node="{
            list: tree,
            depth: 1,
            mode: mode,
            trigger: trigger,
            collapsed: !!collapsed,
            effWidth: effWidth
        }"
      ></div>
    </div>
    <div class="asc-menu-footer">
      <div class="asc-menu-slot" x-slot:footer="slotParams"></div>
    </div>
  </div>
</div>
`,e.components[`autospark-menu-node`]=`<!--
    autospark.menu 级列表渲染节点（autospark-menu-node，ADR-0033 决策 7·2026-11-24 重写）：
    三分支（fold / pop / leaf，每项 3 个 button 化身）收敛为**单项单实例**结构——
    div.asc-menu-entry 四职合一：缩进 / 状态标记 / 点击中继 / 弹层宿主。

    - 弹层模式（item._pop）：entry 即 x-popover 宿主，options 经 spread 合并
      \`{ 基座, ...(item.conf || {}) }\`（item.conf 的 popover 键显式赢——chrome/at/trigger 逐级覆盖），
      props 注入 \`{ submenu: { children: item.kids, ...conf }, effWidth, collapsed, mode }\`
      （2026-11-24 实测：props 对象包数组完好、面板内 x-component 正常，链读废弃）；
    - 缩进模式（item._fold）：entry > subwrap > sub > 递归 node（grid 0fr/1fr 展开动画）；
    - 叶子：entry 单按钮。三态经 :data-mode 表达，popover 的 disabled 门禁
      （\`disabled: !item._pop\`）关闭缩进模式的弹层触发——弹层宿主恒挂、触发按态分派。

    点击经 onEntryClick 风格的中继表达式沿链写 relay 哨兵（落最近声明层 = 宿主 node data，
    node mounted watch → menu-relay 冒泡 → menu 本体）。克隆体求值域：绑定 / 事件 / 值对象
    只能读 x-for locals（item）与自身 props。
-->
<div class="asc-menu-node" x-define.open="autospark-menu-node">
  <script setup>
    {
        data: () => ({
            list: [],
            depth: 1,
            mode: "vertical",
            trigger: "hover",
            collapsed: false,
            effWidth: 0,
            relayTick: 0,
            relayKey: null,
            relayKind: "",
        }),
        methods: {
            /**
             * 单项点击中继（冒泡隔离）：仅响应**本 entry 自身按钮**的点击——后代 entry
             * 的点击（嵌套缩进 / 弹层项）会冒泡穿过本 entry，closest 判定不等即忽略，
             * 防祖先误 toggle。弹层模式（item._pop）的开关归 popover click toggle。
             */
            onEntryClick(item, e) {
                const btnEntry = e.target instanceof Element ? e.target.closest(".asc-menu-entry") : null;
                if (!btnEntry || btnEntry !== e.currentTarget) return;
                if (item._pop) return;
                this.data.relayKey = item.key;
                this.data.relayKind = item.kids && item.kids.length ? "toggle" : "pick";
                this.data.relayTick = this.data.relayTick + 1;
            },
        },
        mounted() {
            this.watch("relayTick", () => {
                this.el.dispatchEvent(new CustomEvent("menu-relay", {
                    bubbles: true,
                    detail: { key: this.data.relayKey, kind: this.data.relayKind },
                }));
            });
        },
    }
  <\/script>
  <div class="asc-menu-list" role="menu" x-for="item of list">
    <div class="asc-menu-sep" x-show="item.kind === 'sep'" role="separator"></div>
    <div class="asc-menu-group" x-show="item.kind === 'group'" :data-icon="item.icon ? '' : null" role="group">
      <i class="asc-menu-group-icon" x-show="item.icon" x-icon="item.icon"></i>
      <span class="asc-menu-group-title">{{ item.title }}</span>
    </div>
    <div
      class="asc-menu-entry"
      x-show="item.kind === 'item'"
      role="menuitem"
      :data-key="item.key != null ? String(item.key) : null"
      :data-mode="item._pop ? 'pop' : (item._fold ? 'fold' : 'leaf')"
      :data-active="item._active ? '' : null"
      :data-marked="item._marked ? '' : null"
      :data-disabled="item.disabled ? '' : null"
      :data-icon-ph="item.iconPh ? '' : null"
      :aria-expanded="item._fold ? (item._open ? 'true' : 'false') : null"
      :aria-disabled="item.disabled ? 'true' : null"
      :aria-haspopup="item._pop ? 'menu' : null"
      @click="onEntryClick(item, $event)"
      x-popover:autospark-menu-panel
      x-popover-options="{ padding: 0, trigger: trigger, at: { arrow: false, offset: 4, placement: (mode === 'horizontal' && depth === 1) ? 'bottom-start' : 'right-start' }, disabled: !item._pop, ...(item.conf || {}) }"
      x-popover-options.props="{ submenu: { ...(item.conf || {}), children: item.kids }, effWidth: effWidth, collapsed: !!collapsed, mode: mode }"
    >
      <div
        x-component:autospark.button="{
            block: true,
            menu: !collapsed,
            collapsed: !!collapsed,
            label: item.label,
            icon: item.iconPh ? 'default' : (item.icon || ''),
            disabled: item.disabled,
            caret: collapsed ? 'none' : (item._pop ? ((mode === 'horizontal' && depth === 1) ? 'bottom' : 'right') : (item._fold ? (item._open ? 'bottom' : 'right') : (item.caret || 'none'))),
            checkMark: collapsed ? false : item.checkPh,
            checkStyle: item.checkStyle || 'check',
            memo: item.memo,
            loading: item.loading,
            type: item.type,
            variant: item.variant,
            indent: collapsed ? 0 : item.indent,
            labelPos: collapsed ? 'none' : 'right',
            hideTags: !!collapsed,
            tags: item.tags
        }"
      ></div>
      <div class="asc-menu-subwrap" x-show="item._fold" :data-open="item._open ? '' : null">
        <div
          class="asc-menu-sub"
          :style="item.conf && item.conf.indent != null ? { paddingInlineStart: (typeof item.conf.indent === 'number' ? item.conf.indent + 'px' : item.conf.indent) } : null"
        >
          <div
            x-component:autospark-menu-node="{
                list: item.kids,
                depth: depth + 1,
                mode: mode,
                trigger: trigger,
                collapsed: collapsed,
                effWidth: effWidth
            }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</div>
`,e.components[`autospark-menu-panel`]=`<!--
    autospark-menu-panel 弹层面板（ADR-0033 决策 7·2026-11-24 重写）：**纯列表容器**——
    骨架 chrome（title / icon / actions / closeable / shell）全部下放 popover（经
    x-popover-options 的 item.conf 继承键配置，或 popover 的 slots 重载），menu 不再自绘
    head / title / foot，也不再有 slotDir 弹层内分区（slotDir 收缩为仅根菜单本体）。

    数据经 props 注入（2026-11-24 实测：props 对象包数组完好、面板内 x-component 正常，
    v2 的「沿宿主链读」废弃）：\`{ submenu: { children, ...popover 键 }, effWidth, collapsed, mode }\`。
    面板仍是纯桥：data 不接业务键，业务数据全部走 props 注入域。

    子项弹层递归：子项 entry 直接引用同一组件（x-popover:autospark-menu-panel），
    props 逐层下传 \`{ submenu: { children: child.kids, ...child.conf } }\`（克隆体内
    x-popover-options.props 求值——2026-11-24 两层递归实验通过）。子项点击沿宿主链
    写 relay 哨兵（落宿主 node data）。
-->
<div x-define="autospark-menu-panel">
  <script setup>
    {
        data: () => ({}),
        methods: {
            closeSelf() {
                if (typeof this.close === "function") { this.close(); return; }
                if (this._instClose) this._instClose();
            },
            focusFirst() {
                setTimeout(() => {
                    const first = this.el.querySelector(".asc-menu-entry > .asc-button:not([disabled])");
                    if (first) first.focus();
                }, 30);
            },
            openPophost(popEl) {
                if (String(trigger) === "click") {
                    popEl.dispatchEvent(new MouseEvent("click", { bubbles: true }));
                } else {
                    popEl.dispatchEvent(new MouseEvent("mouseenter", { bubbles: false }));
                }
            },
            onKeydown(event) {
                const k = event.key;
                if (k !== "ArrowDown" && k !== "ArrowUp" && k !== "ArrowRight" && k !== "ArrowLeft" && k !== "Home" && k !== "End") return;
                const btn = event.target && event.target.closest ? event.target.closest(".asc-menu-entry > .asc-button") : null;
                const currentEntry = btn ? btn.closest(".asc-menu-entry") : null;
                const focusables = (list) => Array.from(list.querySelectorAll(":scope > .asc-menu-entry > .asc-button:not([disabled])"));
                if (k === "ArrowDown" || k === "ArrowUp" || k === "Home" || k === "End") {
                    const list = currentEntry ? currentEntry.parentElement : this.el.querySelector(".asc-menu-list");
                    const arr = list ? focusables(list) : [];
                    if (!arr.length) return;
                    event.preventDefault();
                    let next = null;
                    if (k === "Home") next = arr[0];
                    else if (k === "End") next = arr[arr.length - 1];
                    else {
                        const i = arr.indexOf(btn);
                        const dir = k === "ArrowDown" ? 1 : -1;
                        next = i < 0 ? arr[0] : arr[(i + dir + arr.length) % arr.length];
                    }
                    if (next) next.focus();
                    return;
                }
                if (!btn || !currentEntry) return;
                if (k === "ArrowRight") {
                    if (currentEntry.getAttribute("data-mode") === "pop") {
                        event.preventDefault();
                        this.openPophost(currentEntry);
                    }
                    return;
                }
                event.preventDefault();
                this.closeSelf();
            },
        },
        mounted() {
            if (Date.now() - Number(this.data.wantFocusAt || 0) < 600) this.focusFirst();
            this.watch("wantFocusAt", () => { this.focusFirst(); });
            this.el.addEventListener("overlay:open", (e) => {
                const inst = e.detail && e.detail.instance;
                if (inst && typeof inst.close === "function") this._instClose = () => inst.close();
            });
        },
    }
  <\/script>
  <div
    class="asc-menu-panel"
    tabindex="0"
    :style="mode !== 'horizontal' && !collapsed && effWidth > 0 ? { width: effWidth + 'px', minWidth: effWidth + 'px', maxWidth: effWidth + 'px' } : null"
    @keydown="onKeydown($event)"
  >
    <div class="asc-menu-list" role="menu" x-for="child of submenu.children">
      <div class="asc-menu-sep" x-show="child.kind === 'sep'" role="separator"></div>
      <div class="asc-menu-group" x-show="child.kind === 'group'" :data-icon="child.icon ? '' : null" role="group">
        <i class="asc-menu-group-icon" x-show="child.icon" x-icon="child.icon"></i>
        <span class="asc-menu-group-title">{{ child.title }}</span>
      </div>
      <div
        class="asc-menu-entry"
        x-show="child.kind === 'item'"
        role="menuitem"
        :data-key="child.key != null ? String(child.key) : null"
        :data-mode="child.kids && child.kids.length ? 'pop' : 'leaf'"
        :data-active="child._active ? '' : null"
        :data-marked="child._marked ? '' : null"
        :data-disabled="child.disabled ? '' : null"
        :data-icon-ph="child.iconPh ? '' : null"
        :aria-haspopup="child.kids && child.kids.length ? 'menu' : null"
        :aria-disabled="child.disabled ? 'true' : null"
        @click="child.kids && child.kids.length ? 0 : (relayKey = child.key, relayKind = 'pick', relayTick = relayTick + 1)"
        x-popover:autospark-menu-panel
        x-popover-options="{ padding: 0, trigger: trigger, at: { arrow: false, offset: 4, placement: 'right-start' }, disabled: !(child.kids && child.kids.length), ...(child.conf || {}) }"
        x-popover-options.props="{ submenu: { ...(child.conf || {}), children: child.kids }, effWidth: effWidth, collapsed: !!collapsed, mode: mode }"
      >
        <div
          x-component:autospark.button="{
              block: true,
              menu: true,
              label: child.label,
              icon: child.iconPh ? 'default' : (child.icon || ''),
              disabled: child.disabled,
              caret: child.kids && child.kids.length ? 'right' : (child.caret || 'none'),
              checkMark: child.checkPh,
              checkStyle: child.checkStyle || 'check',
              memo: child.memo,
              loading: child.loading,
              type: child.type,
              variant: child.variant,
              indent: child.indent,
              labelPos: 'right',
              tags: child.tags
          }"
        ></div>
      </div>
    </div>
  </div>
</div>
`,e.precompile?.(e=>{for(let a of Array.from(e.el.querySelectorAll(`x-menu`))){let e=document.createElement(`div`);for(let e of Array.from(a.children))e.tagName.toLowerCase()===`x-menu-item`&&e.remove();for(let e of Array.from(a.children))if(e.tagName.toLowerCase()===`template`)for(let t of[`header`,`footer`]){if(!e.hasAttribute(t))continue;let n=e.getAttribute(t);e.removeAttribute(t),e.hasAttribute(`x-slot:${t}`)||e.setAttribute(`x-slot:${t}`,n??``)}let o=a.getAttribute(`items`),s=a.hasAttribute(`:items`);if(a.removeAttribute(`items`),o!=null&&o!==``&&!s)try{let t=JSON.parse(o);Array.isArray(t)&&e.setAttribute(`data-items`,JSON.stringify(t))}catch{}let c=[];for(let i of Array.from(a.attributes))i.name.startsWith(`:`)?c.push(`${n(t(i.name.slice(1)))}: (${i.value})`):i.name===`class`||i.name===`style`||i.name===`id`||i.name.startsWith(`data-`)||i.name.startsWith(`x-`)||i.name.startsWith(`@`)?e.setAttribute(i.name,i.value):i.value===``?c.push(`${n(t(i.name))}: true`):c.push(`${n(t(i.name))}: ${JSON.stringify(r(i.value))}`);for(e.setAttribute(`x-component:${i}`,`{ ${c.join(`, `)} }`);a.firstChild;)e.appendChild(a.firstChild);a.replaceWith(e)}})}o();function o(){e(e=>{a(e)})}};
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

//# sourceMappingURL=autospark.menu.js.map
