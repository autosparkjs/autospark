/* 文档站 theme demo 共享控制面板：<theme-controls> 自定义元素（packages/theme/examples/theme-controls.ts 的原生 JS 版，
 * 布局改为「紧凑单行工具条 + 箭头下拉完整面板」）
 *
 * 用法：demo 页面放 <theme-controls></theme-controls>，引入 autospark.theme.js 后引入本文件：
 *   <aside class="demo-panel"><theme-controls></theme-controls></aside>
 *   <script src="/autospark/autospark.theme.js"></script>
 *   <script src="/autospark/theme-controls.js"></script>
 *
 * 结构（单行操作条 + 下拉面板）：
 *   ┌─────────────────────────────────────────────────────────┐
 *   │ 主题色 [色块…]                     暗色[开关] 多彩[开关] [⌄] │
 *   ├─────────────────────────────────────────────────────────┤
 *   │ （下拉展开）自定义颜色 · 尺寸参数 · 说明                    │
 *   └─────────────────────────────────────────────────────────┘
 * 左：主题色预设快速选择；右：暗色 / 多彩开关；最右箭头按钮展开完整面板。
 *
 * 分组过滤：groups 属性为逗号分隔白名单，可取 color / mode / size / radius / spacing / shadow，
 * 缺省全开——聚焦某一主题要素的 demo 可用 <theme-controls groups="color,mode"></theme-controls> 收窄面板。
 *
 * 兼容入口：ThemeControls.mount("#controls") 在容器内创建一个 <theme-controls>（旧写法仍可用）。
 *
 * 面板自身样式经 Shadow DOM 自包含，配色消费从 :host 继承穿透的 --auto-* 变量，主题切换时面板随动；
 * 全局主题状态经 AutoSparkThemeManager（themeManager 单例）作用于整篇 demo 页面。
 */
(function (global) {
  "use strict";

  /** 视觉密度档（圆角/间距/阴影）：含 none（直角/零间距/无阴影） */
  var SIZES = ["none", "x-small", "small", "medium", "large", "x-large"];
  /** 字号档：字号无「归零」语义（sizeVars 未定义 none 档），不提供 none 选项 */
  var FONT_SIZES = ["x-small", "small", "medium", "large", "x-large"];

  /** 四档位参数：key 即 ThemeManager 上的属性名（也是 data-* 属性后缀） */
  var SIZE_ATTRS = [
    { key: "size", label: "尺寸", sizes: FONT_SIZES },
    { key: "radius", label: "圆角", sizes: SIZES },
    { key: "spacing", label: "间距", sizes: SIZES },
    { key: "shadow", label: "阴影", sizes: SIZES },
  ];

  /** 全部分组（groups 属性的白名单集合） */
  var GROUPS = ["color", "mode", "size", "radius", "spacing", "shadow"];

  var STYLE = [
    /* width:100% + border-box：组件始终撑满 .demo-panel 内容盒，绝不顶出横向滚动条；
           自带 --auto-border 描边卡片，随主题（亮/暗/主题色边框）联动 */
    ":host { display:block; width:100%; padding:0.5rem 0.65rem; font-size:0.8rem; color:var(--auto-color,#333); background:var(--auto-bgcolor,#fff); border:var(--auto-border,1px solid #e9e9e9); border-radius:var(--auto-border-radius,4px); box-sizing:border-box; }",
    ":host *, :host *::before, :host *::after { box-sizing:border-box; }",
    "/* 单行操作条：左「主题色快速选择」自适应收窄，右「开关 + 箭头」不压缩 */",
    ".bar { display:flex; align-items:center; gap:0.5rem; min-height:1.5rem; }",
    ".quick { position:relative; display:flex; align-items:center; gap:0.35rem; flex:1 1 auto; min-width:0; }",
    ".quick-label { flex:0 0 auto; font-size:0.72rem; color:var(--auto-third-color,#999); white-space:nowrap; }",
    "/* 色块条：窄屏横向滚动（隐藏滚动条）而不是折行，保证操作条永远是单行；右缘渐隐提示还有色块 */",
    ".swatches { display:flex; align-items:center; gap:0.3rem; min-width:0; overflow-x:auto; overflow-y:hidden; padding:0.1rem; scrollbar-width:none; }",
    ".quick::after { content:''; position:absolute; top:0; right:0; bottom:0; width:0.9rem; background:linear-gradient(to right, transparent, var(--auto-bgcolor,#fff) 80%); pointer-events:none; }",
    ".swatches::-webkit-scrollbar { display:none; }",
    ".swatch { flex:0 0 auto; width:1rem; height:1rem; padding:0; border:1px solid var(--auto-border-color,#e9e9e9); border-radius:var(--auto-border-radius,4px); cursor:pointer; transition:transform 0.15s; }",
    ".swatch:hover { transform:scale(1.12); }",
    ".swatch.active { outline:2px solid var(--auto-theme-color,#1677ff); outline-offset:1px; }",
    ".modes { display:flex; align-items:center; gap:0.55rem; flex:0 0 auto; margin-left:auto; }",
    "/* 开关行用原生 button：键盘可直接操作，这里只清掉按钮默认外观 */",
    ".switch-row { display:flex; align-items:center; gap:0.3rem; padding:0; border:0; background:none; font-family:inherit; font-size:0.74rem; color:var(--auto-secondary-color,#666); white-space:nowrap; cursor:pointer; }",
    ".switch-row:focus-visible, .expander:focus-visible, .swatch:focus-visible { outline:2px solid var(--auto-theme-color,#1677ff); outline-offset:1px; }",
    ".switch { width:1.7rem; height:0.9rem; border-radius:9999px; background:var(--auto-border-color,#d9d9d9); position:relative; flex:0 0 auto; transition:background 0.2s; }",
    ".switch::after { content:''; position:absolute; top:0.1rem; left:0.1rem; width:0.7rem; height:0.7rem; border-radius:50%; background:#fff; transition:left 0.2s; box-shadow:0 1px 2px rgba(0,0,0,0.2); }",
    ".switch.on { background:var(--auto-theme-color,#1677ff); }",
    ".switch.on::after { left:0.9rem; }",
    "/* 最右箭头：纯 CSS 折角箭头，展开时翻转 180° */",
    ".expander { display:flex; align-items:center; justify-content:center; width:1.5rem; height:1.5rem; padding:0; border:0; border-radius:var(--auto-border-radius,4px); background:none; color:var(--auto-third-color,#999); cursor:pointer; }",
    ".expander:hover { color:var(--auto-color,#333); background:var(--auto-secondary-bgcolor,#f5f5f5); }",
    ".arrow { width:0.4rem; height:0.4rem; border-right:1.5px solid currentColor; border-bottom:1.5px solid currentColor; transform:translateY(-0.12rem) rotate(45deg); transition:transform 0.2s; }",
    ".expander[aria-expanded='true'] .arrow { transform:translateY(0.12rem) rotate(225deg); }",
    "/* 下拉面板：grid 0fr → 1fr 平滑展开，收起时高度为 0 且不可聚焦（inert） */",
    ".panel { display:grid; grid-template-rows:0fr; transition:grid-template-rows 0.2s ease; }",
    ".panel.open { grid-template-rows:1fr; }",
    ".panel-inner { overflow:hidden; min-height:0; }",
    ".panel-body { margin-top:0.5rem; padding-top:0.55rem; border-top:1px dashed var(--auto-border-color,#e9e9e9); }",
    ".color-row { display:flex; align-items:center; flex-wrap:wrap; gap:0.45rem; font-size:0.74rem; color:var(--auto-third-color,#999); }",
    "input[type=color] { width:1.6rem; height:1.25rem; padding:0; border:1px solid var(--auto-border-color,#e9e9e9); border-radius:var(--auto-border-radius,4px); background:none; cursor:pointer; }",
    ".color-hex { color:var(--auto-secondary-color,#666); font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; font-size:0.7rem; }",
    ".group-title { margin:0.55rem 0 0.3rem; color:var(--auto-third-color,#999); font-size:0.72rem; }",
    "/* 尺寸档位：窄空间自动多列，四组滑块横向紧凑排布 */",
    ".size-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(7.2rem,1fr)); gap:0.35rem 0.9rem; }",
    ".size-group { min-width:0; }",
    ".size-label { font-size:0.7rem; color:var(--auto-third-color,#999); margin-bottom:0.1rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }",
    "input[type=range] { width:100%; margin:0; accent-color:var(--auto-theme-color,#1677ff); cursor:pointer; }",
    ".hint { margin-top:0.5rem; font-size:0.68rem; color:var(--auto-third-color,#999); line-height:1.45; word-break:break-word; }",
    "@media (prefers-reduced-motion: reduce) { .panel, .switch, .switch::after, .arrow, .swatch { transition:none; } }",
  ].join("\n");

  /** 待应用的主题色（rAF 合帧的挂起值）：@input 逐像素触发，每帧至多应用一次 */
  var pendingColor = null;
  var colorRaf = 0;

  function applyThemeColor(value, state) {
    state.currentColor = value; // 选中态即时反馈
    pendingColor = value;
    if (colorRaf) return;
    colorRaf = requestAnimationFrame(function () {
      colorRaf = 0;
      if (pendingColor !== null) {
        global.AutoSparkThemeManager.themeColor = pendingColor;
        pendingColor = null;
      }
    });
  }

  /** 主题色值 → hex：预设名经预设表解析，任意色值原样返回 */
  function resolveHex(TP, value) {
    var preset = TP.presets && TP.presets[value];
    return preset ? preset.color : value;
  }

  /** 按 key 找档位定义 */
  function sizeDef(key) {
    for (var i = 0; i < SIZE_ATTRS.length; i++)
      if (SIZE_ATTRS[i].key === key) return SIZE_ATTRS[i];
    return null;
  }

  function ThemeControls() {
    return Reflect.construct(HTMLElement, [], ThemeControls);
  }
  ThemeControls.prototype = Object.create(HTMLElement.prototype);
  ThemeControls.prototype.constructor = ThemeControls;
  Object.setPrototypeOf(ThemeControls, HTMLElement);
  ThemeControls.observedAttributes = ["groups"];

  /** 分组白名单：groups 缺省（或过滤后为空）时全部显示 */
  ThemeControls.prototype._groups = function () {
    var raw = this.getAttribute("groups");
    if (!raw) return GROUPS;
    var list = raw
      .split(",")
      .map(function (s) {
        return s.trim();
      })
      .filter(function (g) {
        return GROUPS.indexOf(g) >= 0;
      });
    return list.length ? list : GROUPS;
  };

  ThemeControls.prototype._state = function () {
    var TP = global.AutoSparkThemeManager;
    return (this.__tc = this.__tc || {
      dark: !!TP.dark,
      colorized: !!TP.colorized,
      currentColor: resolveHex(TP, TP.themeColor),
    });
  };

  ThemeControls.prototype.connectedCallback = function () {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this._bind();
    this.render();
  };

  ThemeControls.prototype.attributeChangedCallback = function (
    name,
    oldValue,
    newValue,
  ) {
    if (name === "groups" && oldValue !== newValue && this.isConnected)
      this.render();
  };

  /** 事件委托：色块/开关/箭头/滑块一次绑定，状态变化只做局部同步（不重绘） */
  ThemeControls.prototype._bind = function () {
    var self = this;
    if (this.__bound) return;
    this.__bound = true;
    this.shadowRoot.addEventListener("click", function (e) {
      var target = e.target;
      var swatch = target.closest && target.closest(".swatch");
      if (swatch) {
        applyThemeColor(swatch.getAttribute("data-color"), self._state());
        self._paint(); // 选中态即时反馈（不等主题应用那一帧）
        return;
      }
      var sw = target.closest && target.closest("[data-switch]");
      if (sw) {
        var TP = global.AutoSparkThemeManager;
        var key = sw.getAttribute("data-switch");
        TP[key] = !TP[key];
        self._state()[key] = !!TP[key];
        self._paint();
        return;
      }
      if (target.closest && target.closest(".expander"))
        self._toggle(!self.__open);
    });
    this.shadowRoot.addEventListener("input", function (e) {
      var target = e.target;
      if (target.type === "color") {
        applyThemeColor(target.value, self._state());
        self._paint();
      } else if (target.hasAttribute && target.hasAttribute("data-size-key")) {
        var key = target.getAttribute("data-size-key");
        var def = sizeDef(key);
        if (!def) return;
        var value = def.sizes[Number(target.value)];
        global.AutoSparkThemeManager[key] = value; // 尺寸走属性通道（写 DOM 属性 + 持久化）
        var label = target.parentNode && target.parentNode.querySelector(".size-label");
        if (label) label.textContent = def.label + "：" + value;
      }
    });
  };

  /** 展开 / 收起下拉面板 */
  ThemeControls.prototype._toggle = function (open) {
    this.__open = !!open;
    var root = this.shadowRoot;
    if (!root) return;
    var panel = root.querySelector(".panel");
    var btn = root.querySelector(".expander");
    if (panel) {
      panel.classList.toggle("open", this.__open);
      /* inert：收起时面板内的色盘/滑块不可 Tab 聚焦 */
      if (this.__open) panel.removeAttribute("inert");
      else panel.setAttribute("inert", "");
    }
    if (btn) btn.setAttribute("aria-expanded", this.__open ? "true" : "false");
    if (this.__open) this._paint();
  };

  /** 局部同步：色块选中态 / 开关态 / 色盘与 hex 文案 / 档位滑块（不重建 DOM） */
  ThemeControls.prototype._paint = function () {
    var TP = global.AutoSparkThemeManager;
    var root = this.shadowRoot;
    if (!TP || !root) return;
    var state = this._state();
    if (pendingColor === null) state.currentColor = resolveHex(TP, TP.themeColor);
    var current = state.currentColor;
    var hex = resolveHex(TP, current);

    root.querySelectorAll(".swatch").forEach(function (el) {
      var name = el.getAttribute("data-color");
      var preset = TP.presets && TP.presets[name];
      var active =
        name === current ||
        (preset &&
          String(preset.color).toLowerCase() === String(hex).toLowerCase());
      el.classList.toggle("active", !!active);
      el.setAttribute("aria-pressed", active ? "true" : "false");
    });

    var colorInput = root.querySelector("input[type=color]");
    /* 色盘展开逐像素回调时不要回写 value，否则会打断原生取色器 */
    if (colorInput && root.activeElement !== colorInput && /^#[0-9a-f]{6}$/i.test(hex))
      colorInput.value = hex;
    var hexText = root.querySelector(".color-hex");
    if (hexText) hexText.textContent = hex;

    root.querySelectorAll("[data-switch]").forEach(function (el) {
      var key = el.getAttribute("data-switch");
      var on = !!TP[key];
      var knob = el.querySelector(".switch");
      if (knob) knob.classList.toggle("on", on);
      el.setAttribute("aria-checked", on ? "true" : "false");
    });

    root.querySelectorAll("[data-size-key]").forEach(function (el) {
      var def = sizeDef(el.getAttribute("data-size-key"));
      if (!def) return;
      var value = TP[def.key] || "medium";
      var index = def.sizes.indexOf(value);
      if (index < 0) index = 0;
      if (root.activeElement !== el) el.value = String(index);
      var label = el.parentNode && el.parentNode.querySelector(".size-label");
      if (label) label.textContent = def.label + "：" + value;
    });
  };

  ThemeControls.prototype.render = function () {
    var TP = global.AutoSparkThemeManager;
    if (!TP)
      throw new Error(
        "AutoSparkThemeManager 未加载：请先引入 autospark.theme.js",
      );
    var groups = this._groups();
    var state = this._state();
    var on = function (g) {
      return groups.indexOf(g) >= 0;
    };

    /* ── 操作条 ── */
    var bar = '<div class="bar">';

    if (on("color")) {
      var swatches = Object.keys(TP.presets)
        .map(function (name) {
          var theme = TP.presets[name];
          var active =
            state.currentColor === name || state.currentColor === theme.color;
          return (
            '<button type="button" class="swatch' +
            (active ? " active" : "") +
            '" title="' +
            theme.title +
            " (" +
            name +
            ')" aria-label="' +
            theme.title +
            '" aria-pressed="' +
            (active ? "true" : "false") +
            '" data-color="' +
            name +
            '" style="background-color:' +
            theme.color +
            ';"></button>'
          );
        })
        .join("");
      bar +=
        '<div class="quick"><span class="quick-label">主题色</span>' +
        '<div class="swatches" role="group" aria-label="主题色快速选择">' +
        swatches +
        "</div></div>";
    }

    /* 下拉面板内容（尺寸档位决定是否有「尺寸参数」分区） */
    var sizeAttrs = SIZE_ATTRS.filter(function (d) {
      return on(d.key);
    });
    var hasPanel = on("color") || sizeAttrs.length > 0;

    bar += '<div class="modes">';
    if (on("mode")) {
      bar +=
        '<button type="button" class="switch-row" data-switch="dark" role="switch" aria-checked="' +
        (state.dark ? "true" : "false") +
        '" title="切换暗色模式"><span>暗色</span><span class="switch' +
        (state.dark ? " on" : "") +
        '"></span></button>' +
        '<button type="button" class="switch-row" data-switch="colorized" role="switch" aria-checked="' +
        (state.colorized ? "true" : "false") +
        '" title="切换多彩模式"><span>多彩</span><span class="switch' +
        (state.colorized ? " on" : "") +
        '"></span></button>';
    }
    if (hasPanel) {
      bar +=
        '<button type="button" class="expander" aria-expanded="false" aria-controls="tc-panel" title="展开 / 收起完整主题控制面板">' +
        '<span class="arrow"></span></button>';
    }
    bar += "</div></div>";

    /* ── 下拉面板（内容常驻 DOM，收起时零高度 + inert，不打断冒烟校验） ── */
    var panel = "";
    if (hasPanel) {
      var body = "";
      if (on("color")) {
        var hex = resolveHex(TP, state.currentColor);
        /* 色盘只接受 #rrggbb，任意色值（如 rgba）时留空交由浏览器兜底 */
        var hexAttr = /^#[0-9a-f]{6}$/i.test(hex) ? ' value="' + hex + '"' : "";
        body +=
          '<div class="color-row"><input type="color" title="自定义主题色"' +
          hexAttr +
          ' /><span>自定义颜色</span><code class="color-hex">' +
          hex +
          "</code></div>";
      }
      if (sizeAttrs.length) {
        body +=
          '<div class="group-title">尺寸参数（ThemeSize）</div><div class="size-grid">' +
          sizeAttrs
            .map(function (item) {
              var value = TP[item.key] || "medium";
              var index = item.sizes.indexOf(value);
              return (
                '<div class="size-group"><div class="size-label">' +
                item.label +
                "：" +
                value +
                '</div><input type="range" min="0" max="' +
                (item.sizes.length - 1) +
                '" step="1" value="' +
                (index < 0 ? 0 : index) +
                '" data-size-key="' +
                item.key +
                '" aria-label="' +
                item.label +
                '" /></div>'
              );
            })
            .join("") +
          "</div>";
      }
      body +=
        '<div class="hint">面板经 <code>AutoSparkThemeManager</code> 作用于整页：主题色 / 模式写入 :root，' +
        "尺寸参数写 <code>data-*</code> 属性（medium 即移除属性）。</div>";
      panel =
        '<div class="panel" id="tc-panel"><div class="panel-inner">' +
        '<div class="panel-body">' +
        body +
        "</div></div></div>";
    }

    this.shadowRoot.innerHTML = "<style>" + STYLE + "</style>" + bar + panel;
    this._toggle(!!this.__open); // 重绘后保持展开状态
  };

  customElements.define("theme-controls", ThemeControls);

  global.ThemeControls = {
    /** 面板元素名（自定义元素用法：<theme-controls></theme-controls>） */
    tag: "theme-controls",
    /** 把控制面板渲染进 sel（默认 #controls）；重复调用会替换内容 */
    mount: function (sel) {
      var host =
        typeof sel === "string"
          ? document.querySelector(sel)
          : sel || document.getElementById("controls");
      if (!host) return;
      if (!global.AutoSparkThemeManager)
        throw new Error(
          "AutoSparkThemeManager 未加载：请先引入 autospark.theme.js",
        );
      var el = document.createElement("theme-controls");
      host.replaceChildren(el);
    },
  };
})(window);
