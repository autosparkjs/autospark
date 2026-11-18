(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){return e.replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function n(e){return/^[A-Za-z_$][\w$]*$/.test(e)?e:JSON.stringify(e)}function r(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}var i=`autospark.menu`;function a(e){e.components[i]=`<!--
    autospark.menu 导航菜单 v2（ADR-0033 数据驱动重设计，废弃 v1 x-menu-item 组合式）：
    items（MenuEntry[]——item 透传 button 全 props / group 分组标题 / separator（≡ '-'）/
    children 数组|SubmenuOptions 配置对象）驱动任意层嵌套；value 形态即语义（string 单选
    激活 / string[] checkable 勾选集合）；expandLevel 初始展开 + popLevel 缩进/弹层分界 +
    openKeys 全受控双绑；collapsed 三档；trigger 透传 popover（缩进域折叠组恒 click）；
    完整键盘导航（roving tabindex）。

    结构（ADR-0033 决策 7）：本组件 = shell（header/footer slot + 全局状态 + 键盘），
    级列表渲染在内部递归组件 autospark-menu-node（node.html），弹层内容在
    autospark-menu-panel（panel.html，经 x-popover:autospark-menu-panel 消费——须同引
    autospark.overlay.js + autospark.button.js，聚合产物无此问题）。

    items 经影子树归一（normalize）：children 对象拆平（kids + conf）、'-' 归一、disabled
    整支传播、同级 hasIcon/hasCheck 占位标注一次算好——外部受控数据不被变异，node 模板
    纯消费影子树。openView = openKeys 显式 ∪ expandLevel 默认（watch 重算，模板唯一
    读取面——expandLevel 运行时变更/外部 openKeys 替换/items 重建均收敛到 recomputeView）。

    跨组件通信（克隆体求值域铁律——x-for 重编译域只能读 locals 与自身 props）：
    node 点击经 menu-pick / menu-toggle 自定义事件冒泡到 body（DOM 冒泡穿化身）；
    弹层面板（overlay 家族恒 open+host 实例化，JS 通道沿链）经 closeTick 哨兵广播
    叶选关整链、wantFocusAt 时间戳驱动键盘开面板后焦点入首项。

    化身路径约束（T4=B）：形态绑定（:data-mode / :data-collapsed / :data-slot-dir）落在
    编译子树内层 body 上；克隆体内条件显隐一律 x-show（共享快照多实例串台规避，P0 清单
    第 4 条）。button 实例化的宿主 div 外包 btnwrap（普通 div）——事件/状态绑定挂
    btnwrap（x-component 宿主上的绑定不经化身编译，家族规避惯例）。

    router 隔离（ADR-0018 决策 6 约定 2）：纯状态驱动、不 import router——配方见组件文档。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized
     六键）自动获得——menu 不在 data() 声明主题六键，内部变体属性（mode / collapsed /
     slotDir）亦禁用六个通道名 -->
<div
  class="asc-menu"
  x-define="autospark.menu"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            value: "",          // 受控值：string 单选激活 key | string[] checkable 勾选集合（形态即语义，ADR-0033 决策 3）
            items: [],          // MenuEntry[]——状态引用注入；声明 JSON 经 data-items 通道兜底
            expandLevel: 1,     // 初始展开到第 N 级（缩进域默认策略；0 全折叠；层级从 1 起数）
            popLevel: 0,        // level > popLevel 的子菜单走 popover（0 全缩进折叠）
            openKeys: {},       // Record<key, boolean> 全受控展开态（显式 true/false 优先于 expandLevel 默认）
            collapsed: 0,       // 0 常规 | 1 图标条（宽度动画+tooltip，children 全弹层）| 2 单按钮+整菜单弹层
            trigger: "hover",   // 弹层触发：hover（缺省）| click——透传 popover；缩进域折叠组恒 click
            mode: "vertical",   // vertical（缺省）| horizontal（横排，子级全弹层——expandLevel/popLevel/openKeys/collapsed 静默不适用）
            slotDir: "vertical", // header/footer 分区方向：vertical 上下（缺省）| horizontal 左右（SubmenuOptions.slotDir 逐层覆盖弹层）
            // —— 内部状态（JS 通道维护，不对外）——
            tree: [],           // items 归一影子树（kind/kids/conf/iconPh/checkPh/disabled 整支传播）
            openView: {},       // 展开视图（openKeys 显式 ∪ expandLevel 默认，模板唯一读取面）
            activeKey: "",      // 激活 key 归一（单值形态；数组形态恒 ""）
            markedMap: {},      // 勾选 key 集合 map（数组形态；单值形态恒空）
            closeTick: 0,       // 弹层整链关闭广播（叶选关整链——各打开面板 watch 后自关）
            wantFocusAt: 0,     // 键盘开弹层的时间戳（面板 mounted 时判定覆盖 hover delayShow 时序，焦点入首项）
            // computed 简写：collapsed=2 整菜单弹层的伪子菜单根（依赖 tree 响应式）
            railRoot: (s) => ({ kids: s.tree, conf: {} }),
        }),
        methods: {
            // ══════════ 影子树归一（ADR-0033 决策 7）══════════
            // children 对象拆平（kids + conf）/ '-' 与 separator 归一 / disabled 整支传播 /
            // 同级 hasIcon/hasCheck 占位标注 / 首尾分隔线修剪；外部 items 不被变异
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
                // 同级占位标注（ADR-0033 决策 6）：iconPh = 级内有 icon 而自身无；checkPh = 级内有 checkable
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
            // 展开视图重算：openKeys 显式（含 false 折叠覆盖）优先，未覆盖组按 depth <= expandLevel 默认。
            // 同时物化进影子树（item._open）——克隆体模板绑定对 props 热更新不响应（指令值才响应），
            // 经 data 域（影子树代理字段）承载以获得响应性（v1 openKeys 同机制）
            // 当前生效 popFrom（collapsed=1 全弹层=2；popLevel=0 哨兵全缩进=Infinity）
            popFromNow() {
                if (Number(this.data.collapsed) === 1) return 1; // 图标条：顶级项 children 全弹层
                const pl = Number(this.data.popLevel);
                return pl > 0 ? pl + 1 : Infinity;
            },
            // 展开视图 + 分支意图物化：openKeys 显式优先、未覆盖组按 depth <= expandLevel 默认；
            // 三分支意图（_fold/_pop/_leaf）按当前 popFrom 物化进影子树——克隆体 x-show 读
            // data 域字段获得响应性（模板绑定不响应 props 热更新，collapsed 运行时切换依赖此物化）
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
            // 值域派生：activeKey / markedMap（值对象短判定面）+ 物化进影子树（_active/_marked，
            // 克隆体模板绑定消费——同 recomputeView 物化注记）
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
            // 影子树按键查项（哨兵消费入口）
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
            // 中继消费（node 实例 mounted watch 转发的 DOM 冒泡——两域克隆体统一入口）
            onRelay(event) {
                const d = event.detail || {};
                if (d.kind === "toggle") this.onToggle(d.key);
                else if (d.kind === "pick") this.onPick(d.key);
            },
            // 关闭全部打开面板（叶选关整链）：派生 body 点击走 popover 原生「外点关闭」链
            // （click 模型即刻全关；hover 模型无 click 监听零副作用——面板随指针离开自然收起，
            // 行为差异文档注明）
            closeAllPanels() {
                document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            },
            // ══════════ 事件消费 ══════════
            // 项点击（叶子/勾选分流）：单值激活同值短路 + 叶选关整链；数组勾选 toggle
            // 不关弹层（调参非导航，ADR-0033 决策 5）
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
                this.closeAllPanels(); // 叶选关整链（统一走面板实例 close，两触发模型通吃）
            },
            // 折叠组展开切换：openKeys 整体替换 + expand 事件（内部切换点派发，外部替换不广播防回环）
            onToggle(key) {
                if (key == null) return;
                const open = { ...(this.data.openKeys ?? {}) };
                const expanded = !open[key];
                if (expanded) open[key] = true; else delete open[key];
                this.data.openKeys = open;
                this.el.dispatchEvent(new CustomEvent("expand", { bubbles: true, detail: { key, expanded } }));
            },
            // 祖先链自动展开（单值形态，antd 同款）：目标叶子的父项链显式置开（幂等写防抖动）
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
            // ══════════ 键盘导航（roving tabindex，ADR-0033 决策 9）══════════
            // ↑↓ 同级环绕（跳禁用）/ Home/End 首末 / → 缩进域展开入子级·弹层域开面板 /
            // ← 收起回父项；Enter/Space 原生 button；Esc 归 popover 栈不拦截
            onKeydown(event) {
                const k = event.key;
                if (k !== "ArrowDown" && k !== "ArrowUp" && k !== "ArrowRight" && k !== "ArrowLeft" && k !== "Home" && k !== "End") return;
                const btn = event.target && event.target.closest ? event.target.closest(".asc-menu-entry .asc-menu-btnwrap > .asc-button") : null;
                const currentLi = btn ? btn.closest(".asc-menu-entry") : null;
                const focusables = (ul) => Array.from(ul.querySelectorAll(":scope > .asc-menu-entry > div > .asc-menu-btnwrap > .asc-button:not([disabled])"));
                if (k === "ArrowDown" || k === "ArrowUp" || k === "Home" || k === "End") {
                    // 同级集合：焦点项所在 list（li 的父即所属 ul）；容器态取首个顶级 list
                    const list = currentLi ? currentLi.parentElement : this.el.querySelector("ul.asc-menu-list");
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
                if (!btn || !currentLi) return;
                if (k === "ArrowRight") {
                    const fold = currentLi.querySelector(":scope > .asc-menu-fold");
                    if (fold && getComputedStyle(fold).display !== "none") {
                        // 缩进域：展开（未开先开）+ 焦点入子级首项（x-show 恒在 DOM，display 切换即聚焦）
                        event.preventDefault();
                        const pkey = currentLi.getAttribute("data-key");
                        if (pkey && !this.data.openView[pkey]) this.onToggle(pkey);
                        setTimeout(() => {
                            const first = currentLi.querySelector(".asc-menu-sub .asc-menu-btnwrap > .asc-button:not([disabled])");
                            if (first) first.focus();
                        }, 0);
                        return;
                    }
                    const pop = currentLi.querySelector(":scope > .asc-menu-pop");
                    if (pop && getComputedStyle(pop).display !== "none") {
                        // 弹层域：按触发模型分派宿主事件（dropdown 决策 7 同款）+ 焦点请求时间戳
                        event.preventDefault();
                        this.openPophost(pop);
                        this.data.wantFocusAt = Date.now();
                    }
                    return;
                }
                // ArrowLeft：子级收起回父项（顶级不动）
                const sub = currentLi.closest(".asc-menu-sub");
                if (sub) {
                    event.preventDefault();
                    const parentLi = sub.closest(".asc-menu-entry");
                    const pkey = parentLi ? parentLi.getAttribute("data-key") : null;
                    if (pkey && this.data.openView[pkey]) this.onToggle(pkey);
                    const pbtn = parentLi ? parentLi.querySelector(":scope > .asc-menu-fold > .asc-menu-btnwrap > .asc-button") : null;
                    if (pbtn) pbtn.focus();
                }
            },
            // 弹层宿主程序化打开：click 模型派宿主 click（toggle 通道）；hover 模型派
            // mouseenter（含 delayShow 悬浮延迟，原生打开链）
            openPophost(popEl) {
                if (String(this.data.trigger) === "click") {
                    popEl.dispatchEvent(new MouseEvent("click", { bubbles: true }));
                } else {
                    popEl.dispatchEvent(new MouseEvent("mouseenter", { bubbles: false }));
                }
            },
        },
        mounted() {

            // data-items 兜底（precompile 落盘 JSON 字符串）：items props 在场恒优先
            const raw = this.el.getAttribute("data-items");
            if ((!this.data.items || !this.data.items.length) && raw) {
                try { this.data.items = JSON.parse(raw); } catch { /* 非法 JSON 静默忽略（容错缺省空组） */ }
                this.el.removeAttribute("data-items");
            }

            // 影子树 + 派生首算
            this.data.tree = this.normalize(this.data.items, false);
            this.recomputeMarks();
            this.recomputeView();

            // el.value 劫持桥（单值语域：x-model / 程序读写皆经此；数组消费走 :value + @change 惯用法）
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

            // 一跳首对齐（props 注入落定家族惯例）：x-model expando > props value；落定后祖先链自动展开
            setTimeout(() => {
                if ((this.data.value === "" || this.data.value == null) && typeof prior === "string" && prior !== "") {
                    this.data.value = prior;
                }
                this.recomputeMarks();
                this.expandTo(this.data.value);
            }, 0);

            // —— 状态跟随（回调收 { value } 信封对象，此处只用作触发信号）——
            // items 替换：影子树重建 + 物化重算（openKeys 显式键天然保留——按 key 状态锚点，ADR-0033 决策 2）
            this.watch("items", () => {
                this.data.tree = this.normalize(this.data.items, false);
                this.recomputeMarks();
                this.recomputeView();
            });
            // value 受控变化：值域派生 + 祖先链展开（单值形态；数组不触发展开）
            this.watch("value", () => {
                this.recomputeMarks();
                this.expandTo(this.data.value);
            });
            // openKeys 全受控：外部替换即应用（recomputeView 收敛）
            this.watch("openKeys", () => { this.recomputeView(); });
            // expandLevel / popLevel / collapsed 运行时变更：默认集与分支意图重算（显式键保留）
            this.watch("expandLevel", () => { this.recomputeView(); });
            this.watch("popLevel", () => { this.recomputeView(); });
            this.watch("collapsed", () => { this.recomputeView(); });
        },
    }
  <\/script>
  <style global id="autospark-components-menu">
    .asc-menu {
      /* 排版基线：字号经主题档位通道（data-size → --auto-font-size 全跟随，button 同范式） */
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
    }
    /* 容器聚焦（roving tabindex 的停靠点） */
    .asc-menu-body:focus-visible {
      box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--asc-tone) 28%, transparent);
    }
    .asc-menu-header,
    .asc-menu-footer {
      padding: 0.4em 0.25em;
      color: var(--auto-third-color, var(--asc-menu-aux-color, rgba(0, 0, 0, 0.35)));
      min-width: 0;
    }
    /* 出口包裹层不产生布局层（x-slot 出口保留包裹层惯例，ADR-0056） */
    .asc-menu-slot {
      display: block;
      min-width: 0;
    }
    .asc-menu-main {
      min-width: 0;
      transition: width 0.2s ease;
    }

    /* ══════════ 级列表（node.html 渲染，类名同源本样式表）══════════ */
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
    /* 分隔线：'-' 与 {type:'separator'} 归一态 */
    .asc-menu-sep {
      margin: 0.35em 0.75em;
      border-top: var(--auto-border-size, var(--asc-menu-border-size, 1px)) solid
        var(--auto-border-color, var(--asc-menu-border, #f0f0f0));
    }
    /* 分组标题：纯视觉（不可点、不产生层级），小字淡色 */
    .asc-menu-group {
      display: flex;
      align-items: center;
      gap: 0.4em;
      padding: 0.6em 0.75em 0.25em;
      font-size: 0.85em;
      color: var(--auto-third-color, var(--asc-menu-aux-color, rgba(0, 0, 0, 0.35)));
      white-space: nowrap;
    }
    .asc-menu-group-icon {
      display: inline-flex;
      flex: none;
    }
    .asc-menu-group-title {
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* 项载体（button 外包裹层）：事件/状态绑定挂点（x-component 宿主绑定不经化身编译） */
    .asc-menu-btnwrap {
      display: block;
      min-width: 0;
    }
    /* 激活项（单值形态）：主色文字 + 主色浅底（10% tint 恒定视觉设计） */
    .asc-menu-btnwrap[data-active] > .asc-button {
      color: var(--asc-tone);
      font-weight: var(--x-font-weight-large, 600);
      background: color-mix(in srgb, var(--asc-tone) 10%, transparent);
    }
    /* 勾选项（数组形态，checkMark 占位列的显影——button 自有 ✓ 规则需 asc-marked 类，
       menu 侧经包裹层同款规则命中，不经 class 通道） */
    .asc-menu-btnwrap[data-marked] > .asc-button.asc-check-check > .asc-button-body::before {
      content: "✓";
    }
    /* icon 占位（级内有 icon 而自身无）：占位图标不可见但保宽（列对齐） */
    .asc-menu-entry[data-icon-ph] .asc-button-icon {
      visibility: hidden;
    }

    /* 缩进域折叠块：grid-rows 动画收张（v1 同款手法） */
    .asc-menu-fold {
      min-width: 0;
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
      /* 缩进量默认 0.4em（SubmenuOptions.indent 可逐级覆盖，node 模板 :style 内联） */
      padding-inline-start: var(--asc-menu-indent, 0.4em);
    }
    /* 弹层域宿主（popover 宿主=行包裹层，热区整行） */
    .asc-menu-pop {
      display: block;
      min-width: 0;
    }

    /* ══════════ collapsed 三档（ADR-0033 决策 4）══════════ */
    /* 档 1：图标条——宽度动画收窄、文字/备注/箭头隐藏、占位列隐藏（勾选与激活改图标染色） */
    .asc-menu-body[data-collapsed="1"] .asc-menu-main {
      width: 3.25em;
    }
    .asc-menu-body[data-collapsed="1"] .asc-menu-btnwrap > .asc-button {
      justify-content: center;
      padding-inline: 0;
    }
    .asc-menu-body[data-collapsed="1"] .asc-menu-btnwrap > .asc-button .asc-button-label,
    .asc-menu-body[data-collapsed="1"] .asc-menu-btnwrap > .asc-button .asc-button-memo,
    .asc-menu-body[data-collapsed="1"] .asc-menu-btnwrap > .asc-button .asc-button-caret,
    .asc-menu-body[data-collapsed="1"] .asc-menu-btnwrap > .asc-button .asc-button-main,
    .asc-menu-body[data-collapsed="1"] .asc-menu-btnwrap > .asc-button.asc-check-check > .asc-button-body::before {
      display: none;
    }
    /* 图标条下的激活/勾选视觉：图标染激活色（Q18：染色即反馈，tooltip 由 button labelPos=none 承载） */
    .asc-menu-body[data-collapsed="1"] .asc-menu-btnwrap[data-active] > .asc-button .asc-button-icon,
    .asc-menu-body[data-collapsed="1"] .asc-menu-btnwrap[data-marked] > .asc-button .asc-button-icon {
      color: var(--asc-tone);
    }
    /* 档 2：单按钮（整菜单弹层的指示钮） */
    .asc-menu-body[data-collapsed="2"] .asc-menu-main,
    .asc-menu-body[data-collapsed="2"] .asc-menu-header,
    .asc-menu-body[data-collapsed="2"] .asc-menu-footer {
      display: none;
    }
    .asc-menu-rail {
      display: block;
    }
    .asc-menu-railbtn {
      appearance: none;
      border: none;
      background: transparent;
      font: inherit;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.6em;
      height: 2.2em;
      border-radius: var(--auto-border-radius, var(--asc-menu-radius, 0.375em));
      color: var(--auto-color, var(--asc-menu-color, #606060));
      cursor: pointer;
      transition: background-color 0.15s ease;
    }
    .asc-menu-railbtn:hover {
      background: var(--auto-hover-bgcolor, var(--asc-menu-hover-bg, rgba(0, 0, 0, 0.05)));
    }
    .asc-menu-railbtn:focus-visible {
      outline: none;
      box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--asc-tone) 28%, transparent);
    }

    /* ══════════ horizontal（横排：子级全弹层，无缩进域）══════════ */
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

    /* ══════════ slotDir：本体 header/footer 分区方向（vertical 上下缺省 | horizontal 左右）══════════ */
    .asc-menu-body[data-slot-dir="horizontal"] {
      flex-direction: row;
      align-items: stretch;
    }
    .asc-menu-body[data-slot-dir="horizontal"] > .asc-menu-header {
      order: 0;
      align-self: center;
      padding-inline: 0.5em;
    }
    .asc-menu-body[data-slot-dir="horizontal"] > .asc-menu-main,
    .asc-menu-body[data-slot-dir="horizontal"] > .asc-menu-rail {
      order: 1;
      flex: 1 1 auto;
      min-width: 0;
    }
    .asc-menu-body[data-slot-dir="horizontal"] > .asc-menu-footer {
      order: 2;
      align-self: center;
      padding-inline: 0.5em;
    }

    /* ══════════ 弹层面板（panel.html 渲染，popover-shell 承载边框/阴影/定位）══════════ */
    .asc-menu-panel {
      display: flex;
      flex-direction: column;
      min-width: max-content;
      max-width: 18em;
      font-size: var(--auto-font-size, var(--asc-menu-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
      color: var(--auto-color, var(--asc-menu-color, #606060));
      --asc-tone: var(--auto-primary-color, var(--asc-menu-primary, #009aff));
      outline: none;
    }
    .asc-menu-panel-head,
    .asc-menu-panel-foot {
      padding: 0.4em 0.75em;
      color: var(--auto-third-color, var(--asc-menu-aux-color, rgba(0, 0, 0, 0.35)));
      min-width: 0;
    }
    .asc-menu-panel-title {
      padding: 0.4em 0.75em;
      font-size: 0.85em;
      color: var(--auto-third-color, var(--asc-menu-aux-color, rgba(0, 0, 0, 0.35)));
      border-bottom: var(--auto-border-size, var(--asc-menu-border-size, 1px)) solid
        var(--auto-border-color, var(--asc-menu-border, #f0f0f0));
    }
    .asc-menu-panel-body {
      padding: 0.25em;
      min-width: 0;
    }
    /* 面板 slotDir：vertical 上下缺省（flex 列已承载）| horizontal 左右（header 左 / footer 右） */
    .asc-menu-panel[data-slot-dir="horizontal"] {
      flex-direction: row;
      align-items: stretch;
    }
    .asc-menu-panel[data-slot-dir="horizontal"] > .asc-menu-panel-head {
      order: 0;
      align-self: center;
    }
    .asc-menu-panel[data-slot-dir="horizontal"] > .asc-menu-panel-body {
      order: 1;
      flex: 1 1 auto;
    }
    .asc-menu-panel[data-slot-dir="horizontal"] > .asc-menu-panel-foot {
      order: 2;
      align-self: center;
    }
    /* 面板内 header/footer 模板引用内容 */
    .asc-menu-panel-tpl {
      display: block;
      min-width: 0;
    }

    /* ══════════ 暗色兜底变体（ADR-0129）：兜底字面值切换（变量链不变）══════════ */
    [dark] .asc-menu-body,
    [data-dark] .asc-menu-body {
      --asc-tone: var(--auto-primary-color, var(--asc-menu-primary, #56baff));
    }
    /* 项化身色（button menu 形态无 dark 块——menu 侧兜底字色切换） */
    [dark] .asc-menu .asc-menu-btnwrap > .asc-button,
    [data-dark] .asc-menu .asc-menu-btnwrap > .asc-button {
      color: var(--auto-color, var(--asc-menu-color, #fafafa));
    }
    [dark] .asc-menu-sep,
    [data-dark] .asc-menu-sep,
    [dark] .asc-menu-panel-title,
    [data-dark] .asc-menu-panel-title {
      border-color: var(--auto-border-color, var(--asc-menu-border, #52525b));
    }
    [dark] .asc-menu-group,
    [dark] .asc-menu-header,
    [dark] .asc-menu-footer,
    [dark] .asc-menu-panel,
    [dark] .asc-menu-panel-head,
    [dark] .asc-menu-panel-foot,
    [dark] .asc-menu-panel-title,
    [data-dark] .asc-menu-group,
    [data-dark] .asc-menu-header,
    [data-dark] .asc-menu-footer,
    [data-dark] .asc-menu-panel,
    [data-dark] .asc-menu-panel-head,
    [data-dark] .asc-menu-panel-foot,
    [data-dark] .asc-menu-panel-title {
      color: var(--auto-color, var(--asc-menu-color, #fafafa));
    }
    [dark] .asc-menu-railbtn,
    [data-dark] .asc-menu-railbtn {
      color: var(--auto-color, var(--asc-menu-color, #fafafa));
    }
    [dark] .asc-menu-railbtn:hover,
    [data-dark] .asc-menu-railbtn:hover {
      background: var(--auto-hover-bgcolor, var(--asc-menu-hover-bg, rgba(255, 255, 255, 0.08)));
    }
  </style>
  <!-- 形态绑定落本层（T4=B：根上动态绑定不求值）；keydown 承接 roving tabindex 容器监听；
         menu-pick / menu-toggle 承接 node 克隆体冒泡的交互事件（DOM 冒泡穿化身直达） -->
  <div
    class="asc-menu-body"
    :data-mode="mode"
    :data-collapsed="Number(collapsed) === 1 ? '1' : Number(collapsed) === 2 ? '2' : null"
    :data-slot-dir="slotDir"
    tabindex="0"
    @keydown="onKeydown($event)"
    @menu-relay="onRelay($event)"
  >
    <!-- header 具名插槽出口（collapsed=2 隐藏；slotDir 左右形态经 CSS order 归位） -->
    <div class="asc-menu-header" x-show="Number(collapsed) !== 2">
      <div class="asc-menu-slot" x-slot:header></div>
    </div>
    <!-- 正常 / 图标条：主体列表（递归节点；collapsed=1 下 popFrom=2——children 全弹层；
         全 props 下传——克隆体求值域只能读 locals 与自身 props） -->
    <div class="asc-menu-main" x-show="Number(collapsed) !== 2">
      <div
        x-component:autospark-menu-node="{
            list: tree,
            depth: 1,
            expandMax: Number(expandLevel),
            popFrom: Number(collapsed) === 1 ? 2 : (Number(popLevel) > 0 ? Number(popLevel) + 1 : Infinity),
            mode: mode,
            trigger: trigger,
            collapsed: collapsed,
            expandLevel: Number(expandLevel),
            popLevel: Number(popLevel)
        }"
      ></div>
    </div>
    <!-- collapsed=2：单一指示按钮 + 整菜单弹层（不含 header/footer；层级以弹层首层为 1 重计） -->
    <div class="asc-menu-rail" x-show="Number(collapsed) === 2">
      <button
        type="button"
        class="asc-menu-railbtn"
        aria-haspopup="menu"
        x-popover:autospark-menu-panel
        x-popover-options="{ padding: 0, at: { arrow: false, offset: 4 } }"
        x-popover-options.trigger="trigger"
        x-popover-options.at="{ placement: 'bottom-start' }"
        x-popover-options.props="{
            submenu: railRoot,
            depth: 1,
            expandMax: Number(expandLevel),
            popFrom: Number(popLevel) > 0 ? Number(popLevel) + 1 : Infinity,
            mode: mode,
            trigger: trigger,
            collapsed: 0,
            expandLevel: Number(expandLevel),
            popLevel: Number(popLevel)
        }"
      >
        <i class="asc-menu-railicon" x-icon="'menu'"></i>
      </button>
    </div>
    <!-- footer 具名插槽出口 -->
    <div class="asc-menu-footer" x-show="Number(collapsed) !== 2">
      <div class="asc-menu-slot" x-slot:footer></div>
    </div>
  </div>
</div>
`,e.components[`autospark-menu-node`]=`<!--
    autospark-menu-node 递归节点（menu v2 内部组件，ADR-0033 决策 7——非用户直接消费）：
    渲染一级列表（x-for 容器宿主形态：ul 容器、li 克隆模板），逐项分流——
    - sep：'-' / {type:'separator'} 归一态（分隔线）；
    - group：纯视觉分组标题（不可点、不产生层级）；
    - item × 缩进域（depth < popFrom）：button 组件（caret 随 openView 转 bottom/right）
      + subwrap（grid-rows 收张动画）+ 递归自身渲染子级；
    - item × 弹层域（depth >= popFrom）：行包裹层即 x-popover 宿主（hover 域整行），
      弹层面板 autospark-menu-panel 经 props 收 submenu（归一化 item：kids+conf）——
      popLevel 触发的级联绝对延续；collapsed=1 的面板层级重计（depth=1 / expandLevel /
      popLevel 基准重换算，ADR-0033 决策 2）；
    - item × 叶子：button 组件，点击经 menu-pick 事件冒泡到根组件。

    求值域边界（克隆体铁律）：x-for ownsChildren 重编译的克隆体内，表达式（绑定 /
    事件 / x-component 值对象）**只能读 x-for locals（item）与自身 props**——沿链外层
    键（含 open 开放链）与组件 methods（绑定通道）均不可见。因此：
    - 根组件的全部状态（activeKey / markedMap / openView / collapsed / expandLevel /
      popLevel 原始值）经消费处值对象**全 props 下传**，逐层透传（递归实例化原样转传）；
    - 点击交互走**事件冒泡**：本组件 methods（事件通道可调）派发 menu-pick /
      menu-toggle 自定义事件（bubbles），根组件在 body 上监听（DOM 冒泡穿化身）；
    - button 实例化的宿主 div 外包 btnwrap（普通 div）承载事件/状态绑定（化身宿主上
      的绑定不经编译，家族规避惯例）。

    checkable 不透传 button（勾选走根 markedMap + checkMark 占位——避免与 button 行为
    桥双处理，ADR-0033 决策 6）；克隆体内条件显隐一律 x-show（共享快照多实例 x-if 串台
    规避，P0 清单第 4 条）——三分支（fold/pop/leaf）恒渲染由 display 切换互斥，弹层域
    popover 宿主 display:none 时不响应触发（hover/click 无事件）。
-->
<!-- x-define.open：开放数据边界（ADR-0053）——**仅供 JS 聚合链通道**：弹层面板（popover
     宿主为本组件克隆体内元素）沿链写哨兵时经本组件透视到 menu 根域（dropdown panel
     写触发器域同构——其哨兵键声明在宿主组件 data；本组件零自有状态故开放透视）。
     克隆体表达式不受 open 影响，仍只读 locals（item）与自身 props（铁律见下） -->
<div class="asc-menu-node" x-define.open="autospark-menu-node">
  <script setup>
    {
        data: () => ({
            list: [],           // 归一化级列表（影子树片段）
            depth: 1,           // 本级层级号（level 从 1 起数）
            expandMax: 1,       // 默认展开截止 depth（depth <= expandMax 的折叠组默认开）
            popFrom: 1,         // 弹层起始 depth（depth >= popFrom 的 children 走弹层）
            mode: "vertical",
            trigger: "hover",
            // —— 根组件结构参数下传（逐层透传不变值；激活/勾选/展开态经影子树
            //     item._active/_marked/_open 物化承载——克隆体模板绑定对 props 热更新不响应）——
            collapsed: 0,       // 折叠三档原始值
            expandLevel: 1,     // 重计基准原值（collapsed=1 面板内换算用）
            popLevel: 0,        // 重计基准原值（collapsed=1 面板内换算用）
            // —— 交互中继哨兵（本层声明——克隆体直写沿链落「最近声明层」：主体克隆体与
            //     弹层面板克隆体（经面板桥）都落此处；node 实例恒在 menu 树内，mounted
            //     watch 后经 DOM 冒泡转发到根——两域统一单通道，规避跨层写直达的边界）——
            relayTick: 0,
            relayKey: null,
            relayKind: "",   // "pick" | "toggle"
        }),
        mounted() {
            // 中继消费：克隆体直写（主体/面板两域）→ 本实例 data 中继键 → watch 转发为
            // DOM 冒泡事件（node 恒在 menu 树内，body 监听可达——K 系实证链）
            this.watch("relayTick", () => {
                this.el.dispatchEvent(new CustomEvent("menu-relay", {
                    bubbles: true,
                    detail: { key: this.data.relayKey, kind: this.data.relayKind },
                }));
            });
        },
    }
  <\/script>
  <ul class="asc-menu-list" role="menu" x-for="item of list">
    <li
      class="asc-menu-entry"
      :data-kind="item.kind"
      :data-key="item.key != null ? String(item.key) : null"
      :data-sub="item.kind === 'item' && item.kids && item.kids.length ? '' : null"
      :data-disabled="item.disabled ? '' : null"
      :data-icon-ph="item.iconPh ? '' : null"
    >
      <!-- 分隔线 -->
      <div class="asc-menu-sep" x-show="item.kind === 'sep'"></div>

      <!-- 分组标题（纯视觉） -->
      <div class="asc-menu-group" x-show="item.kind === 'group'">
        <i class="asc-menu-group-icon" x-show="item.icon" x-icon="item.icon"></i>
        <span class="asc-menu-group-title">{{ item.title }}</span>
      </div>

      <!-- ═══ item × 缩进域折叠组（depth < popFrom）：caret 随 openView 转、subwrap 收张、递归子级 ═══ -->
      <div class="asc-menu-fold" x-show="item._fold">
        <div
          class="asc-menu-btnwrap"
          :data-active="item._active ? '' : null"
          :data-marked="item._marked ? '' : null"
          @click="relayTick = relayTick + 1, relayKey = item.key, relayKind = 'toggle'"
        >
          <div
            x-component:autospark.button="{
                menu: true,
                label: item.label,
                icon: item.iconPh ? 'default' : (item.icon || ''),
                disabled: item.disabled,
                caret: item._open ? 'bottom' : 'right',
                checkMark: item.checkPh,
                checkStyle: item.checkStyle || 'check',
                memo: item.memo,
                loading: item.loading,
                type: item.type,
                variant: item.variant,
                indent: item.indent,
                labelPos: Number(collapsed) === 1 ? 'none' : 'right',
                tags: item.tags
            }"
          ></div>
        </div>
        <div class="asc-menu-subwrap" :data-open="item._open ? '' : null">
          <!-- 缩进量默认 0.4em；SubmenuOptions.indent 逐级覆盖（number 按 px / 字符串 CSS 值直写） -->
          <div
            class="asc-menu-sub"
            :style="item.conf && item.conf.indent != null ? { paddingInlineStart: (typeof item.conf.indent === 'number' ? item.conf.indent + 'px' : item.conf.indent) } : null"
          >
            <div
              x-component:autospark-menu-node="{
                  list: item.kids,
                  depth: depth + 1,
                  expandMax: expandMax,
                  popFrom: popFrom,
                  mode: mode,
                  trigger: trigger,
                  collapsed: collapsed,
                  expandLevel: expandLevel,
                  popLevel: popLevel
              }"
            ></div>
          </div>
        </div>
      </div>

      <!-- ═══ item × 弹层域（depth >= popFrom）：行包裹层即 popover 宿主 ═══
           级联绝对延续（depth+1 / 基准原值）；collapsed=1 的面板层级重计（ADR-0033 决策 2：
           弹层首层=1、expandLevel/popLevel 基准重换算）——表达式全读自身 props（克隆体铁律） -->
      <div
        class="asc-menu-pop"
        x-show="item._pop"
        x-popover:autospark-menu-panel
        x-popover-options="{ padding: 0, at: { arrow: false, offset: 4 } }"
        x-popover-options.trigger="trigger"
        x-popover-options.at="{ placement: (mode === 'horizontal' && depth === 1) ? 'bottom-start' : 'right-start' }"
        x-popover-options.padding="item.conf && item.conf.padding != null ? item.conf.padding : 0"
      >
        <div
          class="asc-menu-btnwrap"
          :data-active="item._active ? '' : null"
          :data-marked="item._marked ? '' : null"
        >
          <div
            x-component:autospark.button="{
                menu: true,
                label: item.label,
                icon: item.iconPh ? 'default' : (item.icon || ''),
                disabled: item.disabled,
                caret: (mode === 'horizontal' && depth === 1) ? 'bottom' : 'right',
                checkMark: item.checkPh,
                checkStyle: item.checkStyle || 'check',
                memo: item.memo,
                loading: item.loading,
                type: item.type,
                variant: item.variant,
                indent: item.indent,
                labelPos: Number(collapsed) === 1 ? 'none' : 'right',
                tags: item.tags
            }"
          ></div>
        </div>
      </div>

      <!-- ═══ item × 叶子：点击经 menu-pick 事件冒泡到根组件 ═══ -->
      <div
        class="asc-menu-btnwrap"
        x-show="item._leaf"
        :data-active="item._active ? '' : null"
        :data-marked="item._marked ? '' : null"
        @click="relayTick = relayTick + 1, relayKey = item.key, relayKind = 'pick'"
      >
        <div
          x-component:autospark.button="{
              menu: true,
              label: item.label,
              icon: item.iconPh ? 'default' : (item.icon || ''),
              disabled: item.disabled,
              caret: item.caret || 'none',
              checkMark: item.checkPh,
              checkStyle: item.checkStyle || 'check',
              memo: item.memo,
              loading: item.loading,
              type: item.type,
              variant: item.variant,
              indent: item.indent,
              labelPos: Number(collapsed) === 1 ? 'none' : 'right',
              tags: item.tags
          }"
        ></div>
      </div>
    </li>
  </ul>
</div>
`,e.components[`autospark-menu-panel`]=`<!--
    autospark-menu-panel 弹层面板（menu v2 内部组件，ADR-0033 决策 7——非用户直接消费）：
    经 x-popover:autospark-menu-panel 消费渲染进 body 覆盖物容器，面板外壳（边框/阴影/
    定位）由 popover-shell 承载，本组件贡献菜单列表内容。

    纯透传桥架构（dropdown panel 同构，实测边界归零）：**零 props、data() 空对象**——
    有键 data 的惰性面板直层指令值（x-component 值对象 / @ 事件）求值失效（实测），
    全部数据沿宿主链读（overlay 家族恒 open+dataContext:'host' 实例化，链 = 宿主
    node 实例域 + 其克隆体 x-for local item + 经 node 的 open 链直达 menu 根域）：
    - item：弹层父项（归一化 item——kids/conf 直读，数组不经 overlay props 传输——
      该通道丢数组字段，实测）；
    - depth / popFrom / mode / trigger / slotDir / closeTick / wantFocusAt：
      宿主 node props 或 menu 根域键；
    - conf（SubmenuOptions 归一态）：header / footer（字符串 | '#模板id' 引用，mounted
      静态注入）、title（弹层标题行）、slotDir（逐层覆盖根 slotDir）、padding（消费处
      经 x-popover-options.padding 透传）。

    面板内列表为 node.html 的同构内联（宿主链直读 item.kids 经 x-for 渲染）；面板内
    深层级弹层父项继续声明 x-popover:本面板名（面板里面板递归，新面板沿新宿主链读新
    item——多级级联天然成立）；面板内的缩进域折叠组（collapsed 重计下 popFrom > depth
    的层）以折叠组形态呈现，子级列表受桥面板表达式域限制不再深层递归（已知边界，常规
    popLevel 级联不受影响）。

    关闭通道（叶选关整链，ADR-0033 决策 5）：根 closeTick 哨兵 → watch 后自关——
    close() 优先（scope 注入请求关闭链），overlay:open 实例捕获兜底。键盘（面板内
    roving 收窄版）：↑↓→← Home/End / Enter 原生 / Esc 归 popover 栈。化身路径约束
    （T4=B）：分区方向绑定落内层载体。
-->
<div x-define="autospark-menu-panel">
  <script setup>
    {
        // 零 props（消费处不传 props——面板沿宿主链读）、零自有状态——data() 空对象
        // 占位建立链桥点（有键 data 会让惰性面板直层指令值求值失效，实测）
        data: () => ({}),
        methods: {
            // 自关（closeTick 广播 / 面板内 ← 键）：close() scope 注入优先，overlay 实例兜底
            closeSelf() {
                if (typeof this.close === "function") { this.close(); return; }
                if (this._instClose) this._instClose();
            },
            // conf.header/footer 的 '#模板id' 引用注入（mounted 一次，静态 innerHTML 承载）
            injectRefs() {
                const conf = (typeof item !== "undefined" && item && item.conf) || {};
                for (const side of ["header", "footer"]) {
                    const v = conf[side];
                    if (typeof v !== "string" || v.charAt(0) !== "#") continue;
                    const ref = document.querySelector(v);
                    const host = this.el.querySelector(side === "header" ? ".asc-menu-panel-head" : ".asc-menu-panel-foot");
                    if (!ref || !host) continue;
                    host.innerHTML = ref.innerHTML;
                }
            },
            // 焦点入首项（键盘打开路径；一跳后面板子树挂载稳定）
            focusFirst() {
                setTimeout(() => {
                    const first = this.el.querySelector(".asc-menu-btnwrap > .asc-button:not([disabled])");
                    if (first) first.focus();
                }, 30);
            },
            // 弹层宿主程序化打开（trigger 沿宿主链读；模型分派，menu 主体同款）
            openPophost(popEl) {
                if (String(trigger) === "click") {
                    popEl.dispatchEvent(new MouseEvent("click", { bubbles: true }));
                } else {
                    popEl.dispatchEvent(new MouseEvent("mouseenter", { bubbles: false }));
                }
            },
            // 面板内键盘导航（↑↓→← Home/End；Enter 原生 button；Esc 归 popover 栈）
            onKeydown(event) {
                const k = event.key;
                if (k !== "ArrowDown" && k !== "ArrowUp" && k !== "ArrowRight" && k !== "ArrowLeft" && k !== "Home" && k !== "End") return;
                const btn = event.target && event.target.closest ? event.target.closest(".asc-menu-entry .asc-menu-btnwrap > .asc-button") : null;
                const currentLi = btn ? btn.closest(".asc-menu-entry") : null;
                const focusables = (ul) => Array.from(ul.querySelectorAll(":scope > .asc-menu-entry > div > .asc-menu-btnwrap > .asc-button:not([disabled])"));
                if (k === "ArrowDown" || k === "ArrowUp" || k === "Home" || k === "End") {
                    const list = currentLi ? currentLi.parentElement : this.el.querySelector("ul.asc-menu-list");
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
                if (!btn || !currentLi) return;
                if (k === "ArrowRight") {
                    const pop = currentLi.querySelector(":scope > .asc-menu-pop");
                    if (pop && getComputedStyle(pop).display !== "none") {
                        event.preventDefault();
                        this.openPophost(pop);
                        this.data.wantFocusAt = Date.now(); // 沿链写根域：子面板 mounted 后焦点入首项
                    }
                    return;
                }
                // ArrowLeft：关自己（焦点回落主体容器 tabindex 停靠点）
                event.preventDefault();
                this.closeSelf();
            },
        },
        mounted() {
            // '#模板id' 引用注入（一跳后子树挂载稳定）
            setTimeout(() => this.injectRefs(), 0);
            // 键盘打开路径的焦点请求（wantFocusAt 时间戳：mounted 时判定覆盖 hover delayShow
            // 时序 + watch 承接面板存活期内的后续请求）
            if (Date.now() - Number(this.data.wantFocusAt || 0) < 600) this.focusFirst();
            this.watch("wantFocusAt", () => { this.focusFirst(); });
            // 叶选关整链广播：根 closeTick 哨兵 → 自关
            this.watch("closeTick", () => { this.closeSelf(); });
            // overlay 实例关闭兜底：实例根冒泡 overlay:open（payload.instance.close）——
            // 事件可能先于 mounted 发出（错过即放弃该通道，close() 主通道兜底）
            this.el.addEventListener("overlay:open", (e) => {
                const inst = e.detail && e.detail.instance;
                if (inst && typeof inst.close === "function") this._instClose = () => inst.close();
            });
        },
    }
  <\/script>
  <!-- 面板载体：分区方向绑定落本层（根上动态绑定不求值，T4=B）；tabindex 焦点停靠；
         列表 = 宿主链直读 item.kids 经 x-for 容器宿主形态渲染（dropdown panel 同款） -->
  <div
    class="asc-menu-panel"
    tabindex="0"
    :data-slot-dir="(item && item.conf && item.conf.slotDir) ? item.conf.slotDir : slotDir"
    @keydown="onKeydown($event)"
  >
    <!-- 弹层头部：字符串直渲染（'#' 引用由 mounted 注入覆盖） -->
    <div class="asc-menu-panel-head" x-show="item && item.conf && item.conf.header">
      <div class="asc-menu-panel-tpl" x-text="(item && item.conf && typeof item.conf.header === 'string' && item.conf.header.charAt(0) !== '#') ? item.conf.header : ''"></div>
    </div>
    <!-- 弹层标题行（仅弹层域显示；缩进域父项 label 已承担） -->
    <div class="asc-menu-panel-title" x-show="item && item.conf && item.conf.title">{{ item && item.conf ? item.conf.title : '' }}</div>
    <!-- 列表主体：宿主链直读 item.kids -->
    <div class="asc-menu-panel-body">
      <ul class="asc-menu-list" role="menu" x-for="child of (item && item.kids ? item.kids : (tree || []))">
        <li
          class="asc-menu-entry"
          :data-kind="child.kind"
          :data-key="child.key != null ? String(child.key) : null"
          :data-sub="child.kind === 'item' && child.kids && child.kids.length ? '' : null"
          :data-disabled="child.disabled ? '' : null"
          :data-icon-ph="child.iconPh ? '' : null"
        >
          <!-- 分隔线 / 分组标题（纯视觉） -->
          <div class="asc-menu-sep" x-show="child.kind === 'sep'"></div>
          <div class="asc-menu-group" x-show="child.kind === 'group'">
            <i class="asc-menu-group-icon" x-show="child.icon" x-icon="child.icon"></i>
            <span class="asc-menu-group-title">{{ child.title }}</span>
          </div>
          <!-- 子级弹层宿主（面板里面板递归：新面板沿新宿主链读新 item，级联天然成立） -->
          <div
            class="asc-menu-pop"
            x-show="child._pop"
            x-popover:autospark-menu-panel
            x-popover-options="{ padding: 0, at: { arrow: false, offset: 4 } }"
            x-popover-options.trigger="trigger"
            x-popover-options.at="{ placement: 'right-start' }"
            x-popover-options.padding="child.conf && child.conf.padding != null ? child.conf.padding : 0"
          >
            <div
              class="asc-menu-btnwrap"
              :data-active="child._active ? '' : null"
              :data-marked="child._marked ? '' : null"
            >
              <div
                x-component:autospark.button="{
                    menu: true,
                    label: child.label,
                    icon: child.iconPh ? 'default' : (child.icon || ''),
                    disabled: child.disabled,
                    caret: 'right',
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
          <!-- 叶子 / 面板内折叠组（重计域）：点击经 menu-pick / menu-toggle 冒泡 + mounted 原生监听转发 -->
          <div
            class="asc-menu-btnwrap"
            x-show="!child._pop"
            :data-active="child._active ? '' : null"
            :data-marked="child._marked ? '' : null"
            @click="child.kids && child.kids.length ? (relayTick = relayTick + 1, relayKey = child.key, relayKind = 'toggle') : (relayTick = relayTick + 1, relayKey = child.key, relayKind = 'pick')"
          >
            <div
              x-component:autospark.button="{
                  menu: true,
                  label: child.label,
                  icon: child.iconPh ? 'default' : (child.icon || ''),
                  disabled: child.disabled,
                  caret: child.kids && child.kids.length ? (child._open ? 'bottom' : 'right') : (child.caret || 'none'),
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
        </li>
      </ul>
    </div>
    <!-- 弹层尾部 -->
    <div class="asc-menu-panel-foot" x-show="item && item.conf && item.conf.footer">
      <div class="asc-menu-panel-tpl" x-text="(item && item.conf && typeof item.conf.footer === 'string' && item.conf.footer.charAt(0) !== '#') ? item.conf.footer : ''"></div>
    </div>
  </div>
</div>
`,e.precompile?.(e=>{for(let a of Array.from(e.el.querySelectorAll(`x-menu`))){let e=document.createElement(`div`);for(let e of Array.from(a.children))e.tagName.toLowerCase()===`x-menu-item`&&e.remove();let o=a.getAttribute(`items`),s=a.hasAttribute(`:items`);if(a.removeAttribute(`items`),o!=null&&o!==``&&!s)try{let t=JSON.parse(o);Array.isArray(t)&&e.setAttribute(`data-items`,JSON.stringify(t))}catch{}let c=[];for(let i of Array.from(a.attributes))i.name.startsWith(`:`)?c.push(`${n(t(i.name.slice(1)))}: (${i.value})`):i.name===`class`||i.name===`style`||i.name===`id`||i.name.startsWith(`data-`)||i.name.startsWith(`x-`)||i.name.startsWith(`@`)?e.setAttribute(i.name,i.value):i.value===``?c.push(`${n(t(i.name))}: true`):c.push(`${n(t(i.name))}: ${JSON.stringify(r(i.value))}`);for(e.setAttribute(`x-component:${i}`,`{ ${c.join(`, `)} }`);a.firstChild;)e.appendChild(a.firstChild);a.replaceWith(e)}})}o();function o(){e(e=>{a(e)})}};
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
