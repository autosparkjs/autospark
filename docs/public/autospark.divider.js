(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){e.components[`autospark.divider`]=`<!--
    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态
    绑定不会求值——方向/虚线/对齐变体绑定落在编译子树的内层 body 上，宿主的
    块级/行内切换经 :has() 驱动；spacing（宿主 margin）在 mounted 钩子经 JS 通道
    同步（vertical 切换会换 margin 轴，故 vertical 变化时一并重同步）。

    布局结构：body 为 flex 线容器，两段线由 body 的 ::before / ::after 伪元素
    承担（flex:1 满铺）；文字（默认插槽）居中嵌入，空插槽时出口隐藏、两段线
    自然连成整线，无文字态与带文字态共用同一结构。垂直态不带文字（文字被忽略
    不渲染——对齐 antd 5 边界，垂直分割线场景为纯分隔）。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark /
     data-colorized 六键）自动获得；divider 不在 data() 声明主题六键——间距走
     自有 spacing prop（JS 通道写 margin，不占用 data-spacing 主题通道名） -->
<div
  class="asc-divider"
  x-define="autospark.divider"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            vertical: false,   // 垂直分割线（缺省水平）；垂直态文字不渲染（纯分隔场景）
            dashed: false,     // 虚线（缺省实线）
            align: "center",   // 文字位置（水平态带文字时生效）：left | center | right
            spacing: "",       // 与相邻内容的间距：number px 或任意 CSS 值；水平态 = 上下 margin、垂直态 = 左右 margin（缺省无边距）
        }),
        mounted() {
            // 间距同步（化身路径约束：宿主级样式走 JS 通道）：number 归一为 px 字符串，
            // 按方向写宿主 margin 对应轴；vertical 切换换轴重写（watch 回调收 { value }
            // 信封对象，此处读整组状态无需解构）
            const syncSpacing = () => {
                const el = this.el;
                el.style.removeProperty("margin-top");
                el.style.removeProperty("margin-bottom");
                el.style.removeProperty("margin-left");
                el.style.removeProperty("margin-right");
                const s = this.data.spacing;
                if (s === "" || s == null) return;
                const v = typeof s === "number" ? s + "px" : s;
                if (this.data.vertical) {
                    el.style.marginLeft = v;
                    el.style.marginRight = v;
                } else {
                    el.style.marginTop = v;
                    el.style.marginBottom = v;
                }
            };
            syncSpacing();
            this.watch("spacing", () => { syncSpacing(); });
            this.watch("vertical", () => { syncSpacing(); });
        },
    }
  <\/script>
  <style global id="autospark-components-divider">
    /* 线色基准（--auto-* 语义变量三级回退链，ADR-0129；兜底值对齐 button 边框校准值） */
    .asc-divider {
      --asc-line: var(--auto-border-color, var(--asc-divider-color, #d9d9d9));
      border: 0;
      margin: 0;
      font-size: var(--auto-font-size, var(--asc-divider-font-size, 0.875rem));
    }
    /* 水平态（缺省）：块级满宽，body 承载 flex 线容器 */
    .asc-divider {
      display: block;
      width: 100%;
    }
    .asc-divider-body {
      display: flex;
      align-items: center;
      width: 100%;
    }
    /* 两段线：伪元素 border-top 承担（dashed 切 border-style），flex:1 满铺 */
    .asc-divider-body::before,
    .asc-divider-body::after {
      content: "";
      flex: 1;
      border-top: var(--auto-border-size, var(--asc-divider-border-size, 1px)) solid var(--asc-line);
    }
    .asc-divider-body[data-dashed="true"]::before,
    .asc-divider-body[data-dashed="true"]::after {
      border-top-style: dashed;
    }

    /* ---------- 文字位置（align，带文字时生效）：短线侧 flex 收窄 ---------- */
    /* left：文字靠左（首段短线 0.5em，尾段满铺） */
    .asc-divider-body[data-align="left"]::before {
      flex: 0 0 0.5em;
    }
    .asc-divider-body[data-align="right"]::after {
      flex: 0 0 0.5em;
    }

    /* 文字出口：插槽内容；空插槽隐藏（两段线连成整线，无 gap 占位） */
    .asc-divider-text {
      margin: 0 1em;
      color: var(--auto-color, var(--asc-divider-text-color, #606060));
      white-space: nowrap;
    }
    .asc-divider-text:empty {
      display: none;
    }

    /* ---------- 垂直态（vertical）：宿主行内化、body 纵排、线段换 border-left；
         高度默认 0.9em（--asc-divider-length 可覆盖；flex 容器内由使用者以
         class/样式控制满高）---------- */
    .asc-divider:has(> .asc-divider-body[data-vertical="true"]) {
      display: inline-block;
      width: auto;
      height: var(--asc-divider-length, 0.9em);
      vertical-align: middle;
    }
    .asc-divider-body[data-vertical="true"] {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      width: auto;
      height: 100%;
    }
    .asc-divider-body[data-vertical="true"]::before,
    .asc-divider-body[data-vertical="true"]::after {
      flex: 1;
      width: 0;
      border-top: 0;
      border-left: var(--auto-border-size, var(--asc-divider-border-size, 1px)) solid var(--asc-line);
    }
    .asc-divider-body[data-vertical="true"][data-dashed="true"]::before,
    .asc-divider-body[data-vertical="true"][data-dashed="true"]::after {
      border-left-style: dashed;
    }
    /* 垂直态文字不渲染（对齐 antd 5 边界：垂直分割线为纯分隔） */
    .asc-divider-body[data-vertical="true"] .asc-divider-text {
      display: none;
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
    [dark] .asc-divider,
    [data-dark] .asc-divider {
      --asc-line: var(--auto-border-color, var(--asc-divider-color, #4d4d4d));
    }
    [dark] .asc-divider-text,
    [data-dark] .asc-divider-text {
      color: var(--auto-color, var(--asc-divider-text-color, #fafafa));
    }
  </style>
  <!-- 变体数据属性承载在 body（编译子树内层元素）；spacing 经 mounted JS 通道写宿主 margin -->
  <span
    class="asc-divider-body"
    :data-vertical="vertical"
    :data-dashed="dashed"
    :data-align="align"
  >
    <span class="asc-divider-text" x-slot></span>
  </span>
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

//# sourceMappingURL=autospark.divider.js.map
