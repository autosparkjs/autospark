(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){e.components[`autospark.image`]=`<!--\r
    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定\r
    不会求值——状态绑定（loaded/failed/fit/lazy/width/height）全部落在编译子树的\r
    内层 inner / img 元素上（card 同款范式，宿主为透明块壳）。\r
\r
    生命周期三态：src 在场未完成 → 加载态（内置 loading 图标 SMIL 自转，零 CSS 动画）；\r
    @load → loaded 置位摘转圈；@error → failed 置位切 fallback 占位（图标名或图片 URL\r
    双形态，URL 形态以协议/根斜杠/相对段开头判定）。src 变化时重置 loaded/failed\r
    重试新地址。lazy 走原生 loading=lazy（按简——IntersectionObserver 自实现不引入）；\r
    width/height 经绑定通道透传 img 原生属性（假值属性移除家族约定）。\r
\r
    三态层显隐一律用 x-show（display 切换，勿用 x-if）：共享快照多实例场景下\r
    x-if 的延迟编译（假→真切换时才编译子树）会挂错 scope 链致跨实例 props 串台\r
    （engine 已知缺陷，记忆 templateScopeMap 串台），x-show 无编译期回避之。\r
\r
    点击预览不做（P2 image-viewer 承接，ADR-0018 清单表边界）：点击原生冒泡，\r
    使用者自行挂 @click 接入预览层。\r
-->\r
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props\r
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized\r
     六键）自动获得——加载态/占位字号随 data-size 档位缩放；image 不在 data() 声明\r
     主题六键，内部变体属性亦禁用六个通道名 -->\r
<div\r
  class="asc-image"\r
  x-define="autospark.image"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            src: "",             // 图片地址\r
            alt: "",             // 替代文本（兼 fallback 占位提示行）\r
            lazy: false,         // 懒加载（原生 loading=lazy）\r
            fit: "",             // object-fit：fill | contain | cover | none | scale-down（空=浏览器缺省）\r
            width: "",           // 宽透传（img 原生属性；空不写）\r
            height: "",          // 高透传（img 原生属性；空不写）\r
            fallback: "file-error", // 加载失败占位：内置图标名或图片 URL 双形态（URL 以 http(s)://、data:、//、/、./ 开头判定）\r
            loaded: false,       // 内部状态：@load 置位（摘加载态；非 props）\r
            failed: false,       // 内部状态：@error 置位（切 fallback；非 props）\r
            errorArmed: false,   // 内部状态：@error 武装位（一跳后置 true，见 mounted——非 props）\r
        }),\r
        methods: {\r
            // 图片加载成功：摘加载态（failed 同步复位防陈旧标记）\r
            onImgLoad() {\r
                this.data.loaded = true;\r
                this.data.failed = false;\r
            },\r
            // 图片加载失败：切 fallback 占位（x-if 通道重建，主图移除）。\r
            // 武装位守卫（avatar 同款）：构造窗口内（scope.refresh 等机制重跑 :src 绑定 →\r
            // 同值 setAttribute('src') → happy-dom **同步**派发 error）的伪 error 不接——\r
            // 真实浏览器网络失败恒在构造同步块之后，一跳后武装不丢真失败\r
            onImgError() {\r
                if (!this.data.errorArmed) return;\r
                this.data.loaded = false;\r
                this.data.failed = true;\r
            },\r
        },\r
        mounted() {\r
            // @error 一跳后武装：挂起一个宏任务置位（mounted 时化身子树可能未挂载，\r
            // 家族同款一跳；期间到达的 error 均为构造窗口伪 error）\r
            setTimeout(() => { this.data.errorArmed = true; }, 0);\r
            // src 变化：解除武装 + 重置 loaded/failed 重试新地址（回调收 { value } 信封\r
            // 对象——解构取值），一跳后对新地址重新武装——新值写入引发的伪 error 无论\r
            // 落在本回调前后净效果一致（avatar 同款两序分析）。\r
            // 已见值比对幂等防御：scope.refresh 类无变化重跑（i18n ready 换血等）同值\r
            // 跳过，不解除武装、不误重置已置位的三态\r
            const rearm = () => setTimeout(() => { this.data.errorArmed = true; }, 0);\r
            let lastSrc = String(this.data.src ?? "");\r
            this.watch("src", ({ value }) => {\r
                const v = String(value ?? "");\r
                if (v === lastSrc) return;\r
                lastSrc = v;\r
                this.data.errorArmed = false;\r
                this.data.loaded = false;\r
                this.data.failed = false;\r
                rearm();\r
            });\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-image">\r
    /* 宿主：块级满宽透明壳，字号基线经 data-size 档位跟随（加载态/占位以 em 标定缩放） */\r
    .asc-image {\r
      display: block;\r
      width: 100%;\r
      font-size: var(--auto-font-size, var(--asc-image-font-size, 0.875rem));\r
    }\r
\r
    /* ---------- inner：图片盒子（状态数据属性直接命中，编译子树内层） ---------- */\r
    .asc-image-inner {\r
      position: relative;\r
      display: block;\r
      width: 100%;\r
      overflow: hidden;\r
      border-radius: var(--auto-border-radius, var(--asc-image-radius, 0.375rem));\r
      background: var(--auto-third-bgcolor, var(--asc-image-bg, rgba(0, 0, 0, 0.04)));\r
      /* 无宽高声明时给最小占位防塌陷（宽高透传时 img 原生属性决定盒子尺寸） */\r
      min-height: 1em;\r
    }\r
    /* 主图：铺满盒子 */\r
    .asc-image-img {\r
      display: block;\r
      width: 100%;\r
      height: 100%;\r
    }\r
    /* fit 五档：data-fit 属性选择器（空值属性移除即浏览器缺省 fill） */\r
    .asc-image-img[data-fit="fill"] { object-fit: fill; }\r
    .asc-image-img[data-fit="contain"] { object-fit: contain; }\r
    .asc-image-img[data-fit="cover"] { object-fit: cover; }\r
    .asc-image-img[data-fit="none"] { object-fit: none; }\r
    .asc-image-img[data-fit="scale-down"] { object-fit: scale-down; }\r
\r
    /* 加载态：居中转圈（内置 loading 图标 SMIL 自转，容器居中；随字号档位缩放） */\r
    .asc-image-spinner {\r
      display: flex;\r
      position: absolute;\r
      inset: 0;\r
      display: flex;\r
      align-items: center;\r
      justify-content: center;\r
      font-size: 1.6em;\r
      color: var(--auto-third-color, var(--asc-image-spinner-color, rgba(0, 0, 0, 0.35)));\r
      pointer-events: none;\r
    }\r
    /* fallback 占位：纵列居中（占位图/图标 + alt 提示行） */\r
    .asc-image-fallback {\r
      display: flex;\r
      flex-direction: column;\r
      align-items: center;\r
      justify-content: center;\r
      gap: 0.5em;\r
      min-height: 4em;\r
      padding: 1em;\r
      color: var(--auto-third-color, var(--asc-image-fallback-color, rgba(0, 0, 0, 0.35)));\r
    }\r
    .asc-image-fallback-img {\r
      display: block;\r
      max-width: 100%;\r
      max-height: 100%;\r
      object-fit: contain;\r
    }\r
    .asc-image-fallback-icon {\r
      font-size: 2.2em;\r
      line-height: 1;\r
    }\r
    /* alt 提示行：次要文字色（空 alt 不占位——:empty 家族纪律） */\r
    .asc-image-fallback-text {\r
      font-size: 0.875em;\r
      color: var(--auto-secondary-color, var(--asc-image-fallback-hint-color, rgba(0, 0, 0, 0.55)));\r
    }\r
    .asc-image-fallback-text:empty {\r
      display: none;\r
    }\r
\r
    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */\r
    [dark] .asc-image-inner,\r
    [data-dark] .asc-image-inner {\r
      background: var(--auto-third-bgcolor, var(--asc-image-bg, rgba(255, 255, 255, 0.1)));\r
    }\r
    [dark] .asc-image-spinner,\r
    [data-dark] .asc-image-spinner {\r
      color: var(--auto-third-color, var(--asc-image-spinner-color, rgba(255, 255, 255, 0.45)));\r
    }\r
    [dark] .asc-image-fallback,\r
    [data-dark] .asc-image-fallback {\r
      color: var(--auto-third-color, var(--asc-image-fallback-color, rgba(255, 255, 255, 0.45)));\r
    }\r
    [dark] .asc-image-fallback-text,\r
    [data-dark] .asc-image-fallback-text {\r
      color: var(--auto-secondary-color, var(--asc-image-fallback-hint-color, rgba(255, 255, 255, 0.65)));\r
    }\r
  </style>\r
  <!-- 状态数据属性承载在 inner（编译子树内层元素）；width/height/loading 经绑定通道透传 img -->\r
  <div class="asc-image-inner">\r
    <!-- 主图：src 在场即渲染（failed 经 @error 置位移除；真加载态由浏览器事件驱动） -->\r
    <img\r
      class="asc-image-img"\r
      x-show="src && !failed"\r
      :src="src"\r
      :alt="alt"\r
      :loading="lazy ? 'lazy' : 'eager'"\r
      :width="width"\r
      :height="height"\r
      :data-fit="fit"\r
      @load="onImgLoad()"\r
      @error="onImgError()"\r
    />\r
    <!-- 加载态：src 在场未完成未失败（loaded 经 @load 置位移除；图标 SMIL 自转零 CSS 动画） -->\r
    <i\r
      class="asc-image-spinner"\r
      x-show="src && !loaded && !failed"\r
      x-icon="'loading'"\r
    ></i>\r
    <!-- fallback 占位：src 缺席（结构占位）或加载失败时渲染；URL 形态判定 = 根斜杠 /\r
             ./ ../ 相对段 / 通用协议前缀（正则内禁斜杠——指令值清洗会破坏 \\/ 转义，\r
             协议段 [a-z][a-z0-9+.-]*: 无斜杠安全） -->\r
    <div\r
      class="asc-image-fallback"\r
      x-show="!src || failed"\r
    >\r
      <img\r
        class="asc-image-fallback-img"\r
        x-show="typeof fallback === 'string' && (fallback.charAt(0) === '/' || fallback.startsWith('./') || fallback.startsWith('../') || /^[a-z][a-z0-9+.-]*:/i.test(fallback))"\r
        :src="(typeof fallback === 'string' && (fallback.charAt(0) === '/' || fallback.startsWith('./') || fallback.startsWith('../') || /^[a-z][a-z0-9+.-]*:/i.test(fallback))) ? fallback : ''"\r
        :alt="alt"\r
      />\r
      <i\r
        class="asc-image-fallback-icon"\r
        x-show="!(typeof fallback === 'string' && (fallback.charAt(0) === '/' || fallback.startsWith('./') || fallback.startsWith('../') || /^[a-z][a-z0-9+.-]*:/i.test(fallback)))"\r
        x-icon="fallback"\r
      ></i>\r
      <!-- alt 提示行（紧凑书写——:empty 判定纪律） -->\r
      <span class="asc-image-fallback-text" x-text="alt"></span>\r
    </div>\r
  </div>\r
</div>\r
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

//# sourceMappingURL=autospark.image.js.map
