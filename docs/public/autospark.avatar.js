(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){e.components[`autospark.avatar`]=`<!--\r
    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定\r
    不会求值——变体绑定（shape/failed）落在编译子树的内层 inner 元素上，头像盒子\r
    样式直接命中 inner 的 data-* 属性选择器（card 同款范式，宿主为透明壳）。\r
\r
    回退链（三源优先级）：src 在场且未失败 → 图片；icon 在场 → x-icon 图标；\r
    label 在场 → 首字符（Array.from 取码点，emoji/扩展区安全）；三源皆空 → 内置\r
    default 图标兜底（视觉不空白）。图片加载失败（@error）置 failed 回退，\r
    src 变化时重置 failed 重试新地址。\r
\r
    角标不内建（ADR-0018 决策 3「指令即终态」）：x-badge 已覆盖角标能力，使用者\r
    外挂组合（文档配方示例），组件不建双轨。\r
\r
    回退层显隐一律用 x-show（display 切换，勿用 x-if）：共享快照多实例场景下\r
    x-if 的延迟编译（假→真切换时才编译子树）会挂错 scope 链致跨实例 props 串台\r
    （engine 已知缺陷，记忆 templateScopeMap 串台），x-show 无编译期回避之。\r
-->\r
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props\r
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized\r
     六键）自动获得——尺寸经主题通道 data-size 全跟随（头像以 em 标定，字号档变即\r
     整体缩放，无自有尺寸属性）；avatar 不在 data() 声明主题六键，内部变体属性亦\r
     禁用六个通道名 -->\r
<span\r
  class="asc-avatar"\r
  x-define="autospark.avatar"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            src: "",         // 图片地址（加载失败自动回退 icon/label 首字符）\r
            icon: "",        // 图标回退：内置图标名或 { name } 对象（x-icon 值通道；src 缺席或失败时生效）\r
            label: "",       // 字符回退源（首字符；兼职图片 alt）\r
            shape: "circle", // 形状：circle 圆（缺省）| square 方（圆角随 data-radius 档位）\r
            failed: false,   // 内部状态：图片加载失败标记（非 props；src 变化时重置重试）\r
            errorArmed: false, // 内部状态：@error 武装位（一跳后置 true，见 mounted——非 props）\r
        }),\r
        methods: {\r
            // 图片加载失败：置 failed 触发回退链切换（x-if 通道重建，img 移除）。\r
            // 武装位守卫：构造窗口内（scope.refresh 等机制重跑 :src 绑定 → 同值\r
            // setAttribute('src') → happy-dom **同步**派发 error）的伪 error 不接——\r
            // 真实浏览器网络失败恒在构造同步块之后（fetch 异步 + 任务队列），一跳后\r
            // 武装不丢真失败\r
            onImgError() {\r
                if (!this.data.errorArmed) return;\r
                this.data.failed = true;\r
            },\r
        },\r
        mounted() {\r
            // @error 一跳后武装：挂起一个宏任务置位（mounted 时化身子树可能未挂载，\r
            // 家族同款一跳；期间到达的 error 均为构造窗口伪 error——scope.refresh 等\r
            // 机制重跑 :src 绑定 → 同值 setAttribute('src') → happy-dom **同步**派发）\r
            setTimeout(() => { this.data.errorArmed = true; }, 0);\r
            // src 变化：解除武装 + 重置 failed 重试新地址（回调收 { value } 信封对象——\r
            // 解构取值），一跳后对新地址重新武装。真实新值写入引发的伪 error（happy-dom\r
            // 对任何 src 写都同步派发）无论落在本回调前后：落在前 → 先置 failed 再被\r
            // 本重置清掉；落在后 → 未武装直接忽略——两序净效果一致。\r
            // 已见值比对幂等防御：scope.refresh 类无变化重跑（i18n ready 换血等）同值\r
            // 跳过，不解除武装、不误重置 failed（真实浏览器网络失败恒晚于构造同步块）\r
            const rearm = () => setTimeout(() => { this.data.errorArmed = true; }, 0);\r
            let lastSrc = String(this.data.src ?? "");\r
            this.watch("src", ({ value }) => {\r
                const v = String(value ?? "");\r
                if (v === lastSrc) return;\r
                lastSrc = v;\r
                this.data.errorArmed = false;\r
                this.data.failed = false;\r
                rearm();\r
            });\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-avatar">\r
    /* 宿主：行内透明壳，字号基线经 data-size 档位全跟随（--auto-font-size，em 标定的缩放源） */\r
    .asc-avatar {\r
      display: inline-flex;\r
      font-size: var(--auto-font-size, var(--asc-avatar-font-size, 0.875rem));\r
      vertical-align: middle;\r
    }\r
\r
    /* ---------- 头像盒子：形状经 data-shape 命中 inner（编译子树内层） ---------- */\r
    .asc-avatar-inner {\r
      position: relative;\r
      display: inline-flex;\r
      align-items: center;\r
      justify-content: center;\r
      width: 2.6em;\r
      height: 2.6em;\r
      overflow: hidden;\r
      flex: none;\r
      background: var(--auto-third-bgcolor, var(--asc-avatar-bg, rgba(0, 0, 0, 0.06)));\r
      border-radius: 50%;\r
      color: var(--auto-secondary-color, var(--asc-avatar-color, rgba(0, 0, 0, 0.55)));\r
      user-select: none;\r
    }\r
    /* square：方角——圆角走 --auto-border-radius（data-radius 档位通道在场即跟随） */\r
    .asc-avatar-inner[data-shape="square"] {\r
      border-radius: var(--auto-border-radius, var(--asc-avatar-radius, 0.375rem));\r
    }\r
\r
    /* 图片层：铺满盒子（形状裁切由盒子 overflow:hidden 承担） */\r
    .asc-avatar-img {\r
      width: 100%;\r
      height: 100%;\r
      object-fit: cover;\r
    }\r
    /* 图标回退层：约 60% 盒面（1.5em 相对字号，随档位缩放） */\r
    .asc-avatar-icon {\r
      display: inline-flex;\r
      font-size: 1.5em;\r
      line-height: 1;\r
    }\r
    /* 首字符回退层：正文字号微放大，字重加粗（对齐主题标题字重标尺） */\r
    .asc-avatar-char {\r
      font-size: 1.1em;\r
      font-weight: var(--x-font-weight-large, 600);\r
      line-height: 1;\r
      white-space: nowrap;\r
    }\r
\r
    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */\r
    [dark] .asc-avatar-inner,\r
    [data-dark] .asc-avatar-inner {\r
      background: var(--auto-third-bgcolor, var(--asc-avatar-bg, rgba(255, 255, 255, 0.14)));\r
      color: var(--auto-secondary-color, var(--asc-avatar-color, rgba(255, 255, 255, 0.65)));\r
    }\r
  </style>\r
  <!-- 变体数据属性承载在 inner（编译子树内层元素）；回退链按三源优先级互斥渲染 -->\r
  <span class="asc-avatar-inner" :data-shape="shape">\r
    <!-- ① 图片：src 在场且未失败（失败经 @error 置 failed 切回退层） -->\r
    <img\r
      class="asc-avatar-img"\r
      x-show="src && !failed"\r
      :src="src"\r
      :alt="label"\r
      @error="onImgError()"\r
    />\r
    <!-- ② 图标回退：src 缺席或加载失败时生效（字符串图标名 / { name } 对象双形态，tag 同款） -->\r
    <i\r
      class="asc-avatar-icon"\r
      x-show="(!src || failed) && typeof icon === 'string' && icon"\r
      x-icon="icon"\r
    ></i>\r
    <i\r
      class="asc-avatar-icon"\r
      x-show="(!src || failed) && typeof icon === 'object' && icon && icon.name"\r
      x-icon="icon.name"\r
    ></i>\r
    <!-- ③ 首字符回退：label 取首个码点（Array.from 防代理对截半） -->\r
    <span\r
      class="asc-avatar-char"\r
      x-show="(!src || failed) && !icon && label"\r
      x-text="Array.from(String(label).trim())[0]"\r
    ></span>\r
    <!-- ④ 三源皆空：内置 default 图标兜底（字面量须带引号——裸 default 会命中 data.default） -->\r
    <i\r
      class="asc-avatar-icon"\r
      x-show="(!src || failed) && !icon && !label"\r
      x-icon="'default'"\r
    ></i>\r
  </span>\r
</span>\r
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

//# sourceMappingURL=autospark.avatar.js.map
