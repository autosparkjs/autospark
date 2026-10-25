/* 文档站 theme demo 共享控制面板：<theme-controls> 自定义元素（对应 packages/theme/examples/theme-controls.ts 的原生 JS 版）
 *
 * 用法：demo 页面放 <theme-controls></theme-controls>，引入 autospark.theme.js 后引入本文件：
 *   <aside class="demo-panel"><theme-controls></theme-controls></aside>
 *   <script src="/autospark/autospark.theme.js"></script>
 *   <script src="/autospark/theme-controls.js"></script>
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
    ":host { display:block; width:100%; padding:0.6rem 0.75rem; font-size:0.8rem; color:var(--auto-color,#333); background:var(--auto-bgcolor,#fff); border:var(--auto-border,1px solid #e9e9e9); border-radius:var(--auto-border-radius,4px); box-sizing:border-box; }",
    ":host input { box-sizing:border-box; }",
    "h3 { margin:0 0 0.5rem; font-size:0.88rem; color:var(--auto-secondary-color,#666); }",
    ".group { margin-bottom:0.75rem; }",
    ".group-title { margin-bottom:0.3rem; color:var(--auto-third-color,#999); font-size:0.72rem; }",
    ".swatches { display:flex; flex-wrap:wrap; gap:0.3rem; }",
    ".swatch { width:1.1rem; height:1.1rem; border-radius:var(--auto-border-radius,4px); cursor:pointer; border:1px solid var(--auto-border-color,#e9e9e9); }",
    ".swatch.active { outline:2px solid var(--auto-theme-color,#1677ff); outline-offset:1px; }",
    ".color-row { display:flex; align-items:center; gap:0.45rem; margin-top:0.4rem; }",
    "input[type=color] { width:1.9rem; height:1.4rem; padding:0; border:1px solid var(--auto-border-color,#e9e9e9); border-radius:var(--auto-border-radius,4px); background:none; cursor:pointer; }",
    ".switch-row { display:flex; align-items:center; justify-content:space-between; padding:0.2rem 0; cursor:pointer; }",
    "/* 暗色 / 多彩两个开关同一行等宽排布（不显示「模式」标题） */",
    ".mode-switches { display:flex; gap:0.6rem; }",
    ".mode-switches .switch-row { flex:1 1 0; min-width:0; gap:0.3rem; padding:0; white-space:nowrap; }",
    ".mode-switches .switch-row > span:first-child { overflow:hidden; text-overflow:ellipsis; }",
    ".switch { width:2.1rem; height:1.05rem; border-radius:9999px; background:var(--auto-border-color,#d9d9d9); position:relative; transition:background 0.2s; }",
    ".switch::after { content:''; position:absolute; top:0.1rem; left:0.1rem; width:0.82rem; height:0.82rem; border-radius:50%; background:#fff; transition:left 0.2s; box-shadow:0 1px 2px rgba(0,0,0,0.2); }",
    ".switch.on { background:var(--auto-theme-color,#1677ff); }",
    ".switch.on::after { left:1.1rem; }",
    ".size-group { margin-bottom:0.4rem; }",
    ".size-label { font-size:0.7rem; color:var(--auto-third-color,#999); margin-bottom:0.15rem; }",
    "input[type=range] { width:100%; margin:0; accent-color:var(--auto-theme-color,#1677ff); cursor:pointer; }",
    "/* 两列布局：列1=主题色+模式，列2=尺寸 range；align-items:stretch 保证两列等高 */",
    ".cols { display:flex; align-items:stretch; gap:0.9rem; }",
    ".col { flex:1 1 0; min-width:0; display:flex; flex-direction:column; }",
    "/* 两列内的分组不再需要纵向外边距，间距交给列内 gap/分布规则 */",
    ".cols .group { margin-bottom:0; }",
    "/* 列1：主题色组置顶、模式组沉底，stretch 等高时填满列的头尾 */",
    ".col-mode { justify-content:space-between; gap:0.5rem; }",
    "/* 列2：标题独占一行，各尺寸 range 横向等宽排开（窄空间自动折行） */",
    ".group-size { flex:1 1 auto; display:flex; flex-wrap:wrap; align-content:flex-start; gap:0.3rem 0.8rem; }",
    ".group-size > .group-title { flex:0 0 100%; margin:0; }",
    ".group-size .size-group { flex:1 1 7.5rem; min-width:0; margin:0; display:flex; flex-direction:column; justify-content:flex-end; }",
    ".hint { font-size:0.68rem; color:var(--auto-third-color,#999); line-height:1.45; word-break:break-word; margin-top:0.45rem; }",
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
      if (pendingColor !== null)
        global.AutoSparkThemeManager.themeColor = pendingColor;
    });
  }

  /** 当前主题色的 hex 表示（预设名经预设表解析，用于色盘回填） */
  function currentHex(TP) {
    var value = TP.themeColor;
    return TP.presets[value] ? TP.presets[value].color : value;
  }

  function ThemeControls() {
    return Reflect.construct(HTMLElement, [], ThemeControls);
  }
  ThemeControls.prototype = Object.create(HTMLElement.prototype);
  ThemeControls.prototype.constructor = ThemeControls;
  Object.setPrototypeOf(ThemeControls, HTMLElement);

  /**
   * 分组白名单。当前策略：始终显示全部控制项——即使宿主传了 groups 属性也不再隐藏
   * （属性仍被接受，避免旧用法报错；需要收窄面板时可在此恢复过滤逻辑）。
   */
  ThemeControls.prototype._groups = function () {
    return GROUPS;
  };

  ThemeControls.prototype._state = function () {
    var TP = global.AutoSparkThemeManager;
    return (this.__tc = this.__tc || {
      dark: !!TP.dark,
      colorized: !!TP.colorized,
      currentColor: currentHex(TP),
      sizeValues: {
        size: TP.size || "medium",
        radius: TP.radius || "medium",
        spacing: TP.spacing || "medium",
        shadow: TP.shadow || "medium",
      },
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

  /** 事件委托：色块/开关/滑块一次绑定，重绘不需要重新挂监听 */
  ThemeControls.prototype._bind = function () {
    var self = this;
    if (this.__bound) return;
    this.__bound = true;
    this.shadowRoot.addEventListener("click", function (e) {
      var target = e.target;
      if (target.classList && target.classList.contains("swatch")) {
        applyThemeColor(target.getAttribute("data-color"), self._state());
        self.render();
        return;
      }
      var sw = target.closest && target.closest("[data-switch]");
      if (!sw) return;
      var state = self._state();
      var key = sw.getAttribute("data-switch");
      state[key] = !state[key];
      global.AutoSparkThemeManager[key] = state[key];
      self.render(); // 重绘以同步开关态
    });
    this.shadowRoot.addEventListener("input", function (e) {
      var target = e.target;
      var state = self._state();
      if (target.type === "color") {
        applyThemeColor(target.value, state);
      } else if (target.hasAttribute && target.hasAttribute("data-size-key")) {
        var key = target.getAttribute("data-size-key");
        var def = SIZE_ATTRS.filter(function (d) {
          return d.key === key;
        })[0];
        var value = def.sizes[Number(target.value)];
        state.sizeValues[key] = value;
        global.AutoSparkThemeManager[key] = value; // 尺寸走属性通道（写 DOM 属性 + 持久化）
        self.render();
      }
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

    var html = "<style>" + STYLE + "</style><h3>主题控制</h3>";

    /* 列1：主题色 + 模式；列2：尺寸 range。两列均有内容时并排等高，
           否则退化为单列（groups 白名单可能只放行其中一侧）。 */
    var modeCol = "";
    if (on("color")) {
      var swatches = Object.keys(TP.presets)
        .map(function (name) {
          var theme = TP.presets[name];
          var active =
            state.currentColor === name || state.currentColor === theme.color;
          return (
            '<span class="swatch' +
            (active ? " active" : "") +
            '" title="' +
            theme.title +
            " (" +
            name +
            ')" data-color="' +
            name +
            '" style="background-color:' +
            theme.color +
            ';"></span>'
          );
        })
        .join("");
      modeCol +=
        '<div class="group"><div class="group-title">主题色</div><div class="swatches">' +
        swatches +
        '</div><div class="color-row"><input type="color" title="自定义主题色" value="' +
        currentHex(TP) +
        '" /><span>自定义颜色</span></div></div>';
    }

    if (on("mode")) {
      modeCol +=
        '<div class="group mode-group"><div class="mode-switches">' +
        '<div class="switch-row" data-switch="dark"><span>暗色模式</span><span class="switch' +
        (state.dark ? " on" : "") +
        '"></span></div>' +
        '<div class="switch-row" data-switch="colorized"><span>多彩模式</span><span class="switch' +
        (state.colorized ? " on" : "") +
        '"></span></div></div></div>';
    }

    var sizeAttrs = SIZE_ATTRS.filter(function (d) {
      return on(d.key);
    });
    var sizeCol = "";
    if (sizeAttrs.length) {
      sizeCol =
        '<div class="group group-size"><div class="group-title">尺寸参数（ThemeSize）</div>' +
        sizeAttrs
          .map(function (item) {
            var value = state.sizeValues[item.key];
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
              '" /></div>'
            );
          })
          .join("") +
        "</div>";
    }

    if (modeCol && sizeCol) {
      html +=
        '<div class="cols"><div class="col col-mode">' +
        modeCol +
        '</div><div class="col col-size">' +
        sizeCol +
        "</div></div>";
    } else {
      html += modeCol + sizeCol;
    }

    html +=
      '<div class="hint">面板经 <code>AutoSparkThemeManager</code> 作用于整页：主题色 / 模式写入 :root，' +
      "尺寸参数写 <code>data-*</code> 属性（medium 即移除属性）。</div>";

    this.shadowRoot.innerHTML = html;
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
