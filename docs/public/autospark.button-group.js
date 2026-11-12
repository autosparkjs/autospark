(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){return e.replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function n(e){return/^[A-Za-z_$][\w$]*$/.test(e)?e:JSON.stringify(e)}function r(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}var i=`autospark.button-group`,a=[`variant`,`type`,`disabled`],o=new Set([`vertical`,`block`]);function s(e){e.components[i]=`<!--\r
    化身路径约束（x-component T4=B）：组件快照根的属性是静态并入宿主，根上的动态\r
    绑定不会求值——布局变体绑定全部落在编译子树内层 body 上（:data-vertical /\r
    :data-block / :data-fused / :style gap），宿主级 block 布局经 :has() 驱动。\r
\r
    事件出口（组件默认封闭，事件经冒泡到外层消费）：\r
    - change：选中模式（x-model 在场）点击子钮切换后冒泡，detail = { value: 新组值 }——\r
      表单同步惯用法：外层包裹元素 @change="v = $event.detail.value"\r
-->\r
<!-- 元素名快速写法 <x-button-group> 由 index.ts 的 precompile DOM 变换承载：组变换\r
     须先于 button 变换执行（聚合入口 import 顺序 + 脚本加载顺序契约），承担子钮\r
     缺省下发（variant/type/disabled）与 data-value stamp（选中模式子钮身份） -->\r
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：自动获得主题档位 props\r
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized\r
     六键，名即通道）——宿主化身根物化为同名 data-* 属性，级联整组子钮形成局部主题\r
     （正好承担「一组统一档位」通道）。组件 data() 不得声明这六键；组无自有视觉盒\r
     （布局容器），无暗色兜底字面值需求——视觉全由子钮承担 -->\r
<div\r
  class="asc-button-group"\r
  x-define="autospark.button-group"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            gap: 0,            // 子钮间隔（number 按 px / 字符串原样作 CSS gap 值）；0（缺省）即融合\r
            vertical: false,   // 垂直组合（融合轴自动换上下边线/上下圆角）\r
            block: false,      // 容器占满父宽（不强制子钮等分——等分需求使用者自行 CSS）\r
            value: "",         // 受控选中值（选中模式的当前子钮 data-value；props 单向驱动视觉）\r
            modelBound: false, // x-model 在场标记（precompile 检测 x-model 属性塞入——内部键非公开 API；\r
                               // true 时激活选中协调：单选排他 + 组值桥 + 隐藏 input）\r
        }),\r
        mounted() {\r
            // 选中协调激活（ADR-0014 决策 4/6——ADR-0012 决策 3 checkable 半双工家族范式移植）：\r
            // x-model 在场（modelBound）**或**显式受控 value（props 单向 + 点击翻转 + change\r
            // 冒泡）——两者皆无 = 纯布局组（工具栏用法），本块整体不激活：无选中态、无点击协调。\r
            // el.value 劫持桥与隐藏 input 仅 modelBound 场景（组值回写 state 与表单提交载体）。\r
            const bound = !!this.data.modelBound || (this.data.value != null && this.data.value !== "");\r
            if (!bound) return;\r
\r
            // 子钮查询（data-value stamp 通道，index.ts precompile 落的属性）\r
            const buttons = () => Array.from(this.el.querySelectorAll(".asc-button"));\r
\r
            // 当前选中值（字符串语域——组值是子钮 data-value 字符串，区别于 button checkable\r
            // 桥的布尔语域）\r
            let current = "";\r
\r
            // 隐藏 input（仅 modelBound）：表单提交载体（name 有则透传、value = 选中值、display:none）\r
            let real = null;\r
\r
            // 选中标记迁移：组自有 class（不碰子钮 checkable 的 asc-checked 通道，两机制零冲突）；\r
            // 选中视觉 = tone 实底反白（CSS 内消费子钮作用域已算好的 --asc-tone）\r
            const applySel = (v) => {\r
                if (real) real.value = v;\r
                for (const b of buttons()) b.classList.toggle("asc-group-checked", b.getAttribute("data-value") === v);\r
            };\r
\r
            if (this.data.modelBound) {\r
                real = document.createElement("input");\r
                real.type = "hidden";\r
                real.style.display = "none";\r
                const nameAttr = this.el.getAttribute("name");\r
                if (nameAttr != null) real.name = nameAttr;\r
                this.el.appendChild(real);\r
                // el.value 劫持：div 无原生 value，劫持前快照 expando（x-model 编译期可能已写入初值）\r
                const prior = this.el.value;\r
                if (typeof prior === "string" && prior !== "") current = prior;\r
                Object.defineProperty(this.el, "value", {\r
                    get: () => current,\r
                    set: (v) => { current = String(v ?? ""); applySel(current); },\r
                    configurable: true,\r
                });\r
            }\r
\r
            // 一跳首对齐（mounted 时化身子树与 props 均可能未就位，button 家族惯例）：\r
            // current 为空（无 x-model 初值）时重读 props value（晚注入场景），再迁移选中标记\r
            setTimeout(() => {\r
                const dv = this.data.value;\r
                if (current === "" && dv != null && dv !== "") current = String(dv);\r
                applySel(current);\r
            }, 0);\r
\r
            // props value 受控通道（无 x-model 时亦生效）：单向驱动视觉——同值短路防循环；\r
            // 空值跳过（x-model 场景未声明 value prop，data.value 缺省 "" 不得清空选中）\r
            // （回调收 { value } 信封对象须解构——裸值写法恒真，家族惯用法）\r
            this.watch("value", ({ value: v }) => {\r
                if (v == null || v === "") return;\r
                const s = String(v);\r
                if (s !== current) { current = s; applySel(s); }\r
            });\r
\r
            // 点击选中（组根委托）：命中子钮读 data-value；无值钮不参与；已选不反选（radio 语义）；\r
            // 翻转后 modelBound 场景派发 input（x-model 回写，监听在宿主自身），恒派发 change\r
            // （冒泡 detail={value}，外层 @change="v = $event.detail.value" 一行回写）\r
            this.el.addEventListener("click", (e) => {\r
                const btn = e.target instanceof Element ? e.target.closest(".asc-button") : null;\r
                if (!btn || !this.el.contains(btn) || btn.disabled) return;\r
                const v = btn.getAttribute("data-value");\r
                if (v == null || v === current) return;\r
                current = v;\r
                applySel(v);\r
                if (this.data.modelBound) this.el.dispatchEvent(new Event("input", { bubbles: false }));\r
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { value: v } }));\r
            });\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-button-group">\r
    /* 组为纯布局容器无自有视觉盒：无背景/边框/字色字面值，暗色由子钮各自承担——\r
       组级无暗色兜底变体（无字面值即无暗色差异） */\r
    .asc-button-group {\r
      display: inline-flex;\r
      vertical-align: middle; /* inline-flex 行内基线对齐修正（子钮行内元素惯例） */\r
      max-width: 100%;\r
    }\r
    /* 布局容器：body 是编译子树内层（绑定可求值），子钮经 items 的 display:contents\r
         直接成为 body 的 flex 项（x-for 克隆载体同款技巧——出口盒不产生布局盒；\r
         x-slot 出口元素保留为真实包裹层不剥标签，ADR-0056——无此规则则子钮嵌在\r
         出口 span 内：融合相邻选择器不命中、gap/等高拉伸全部失效） */\r
    .asc-button-group-body {\r
      display: flex;\r
      align-items: stretch; /* 水平融合等高 / 垂直融合等宽 */\r
      width: 100%;\r
      min-width: 0;\r
    }\r
    /* 默认插槽出口盒不产生布局盒：子钮穿透为 body 的直接 flex 项 */\r
    .asc-button-group-items {\r
      display: contents;\r
    }\r
    /* 垂直组合：换轴（融合轴随 data-vertical 自动切换，见下方融合规则） */\r
    .asc-button-group-body[data-vertical="true"] {\r
      flex-direction: column;\r
    }\r
    /* block：容器占满父宽（子钮不强制等分——等分需求使用者自行 CSS） */\r
    .asc-button-group:has(> .asc-button-group-body[data-block="true"]) {\r
      display: flex;\r
      width: 100%;\r
    }\r
    /* 间隔：gap 经 :style 内联承载（number 按 px / 字符串原样，indent 同款惯例），\r
         data-fused 仅在 gap 假值（缺省 0）时在场（绑定假值移除） */\r
\r
    /* ---------- 融合（gap=0，ADR-0014 决策 2）：相邻子钮侧圆角清除 + 负 margin 边线复用 ---------- */\r
    /* 水平：有后邻的钮清尾侧（右）圆角；有前邻的钮清首侧（左）圆角并压叠 1px（后钮边线\r
         绘制在上——异色分界取后钮色；后钮透明边线时前钮边线透出，分界恒在） */\r
    .asc-button-group-body[data-fused="true"] .asc-button:has(+ .asc-button) {\r
      border-start-end-radius: 0;\r
      border-end-end-radius: 0;\r
    }\r
    .asc-button-group-body[data-fused="true"] .asc-button + .asc-button {\r
      border-start-start-radius: 0;\r
      border-end-start-radius: 0;\r
      margin-inline-start: calc(\r
        -1 * var(--auto-border-size, var(--asc-button-border-size, 1px))\r
      );\r
    }\r
    /* 垂直：融合轴换上下（有后邻清下侧、有前邻清上侧并压叠） */\r
    .asc-button-group-body[data-fused="true"][data-vertical="true"]\r
      .asc-button:has(+ .asc-button) {\r
      border-end-start-radius: 0;\r
      border-end-end-radius: 0;\r
    }\r
    .asc-button-group-body[data-fused="true"][data-vertical="true"]\r
      .asc-button\r
      + .asc-button {\r
      border-start-start-radius: 0;\r
      border-start-end-radius: 0;\r
      margin-inline-start: 0;\r
      margin-block-start: calc(\r
        -1 * var(--auto-border-size, var(--asc-button-border-size, 1px))\r
      );\r
    }\r
    /* 交互/选中钮浮于压叠之上：负 margin 重叠 1px 会令后钮背景盖前钮边缘（选中实底\r
         钮右缘被切、hover 边缘错位）——交互中的钮抬层级保边缘干净 */\r
    .asc-button-group-body[data-fused="true"] .asc-button:hover,\r
    .asc-button-group-body[data-fused="true"] .asc-button.asc-group-checked {\r
      position: relative;\r
      z-index: 1;\r
    }\r
\r
    /* ---------- 选中视觉（选中模式，ADR-0014 决策 7）：tone 实底反白（solid 语义） ---------- */\r
    /* 组自有 class 驱动（区别于子钮 checkable 的 asc-checked）；--asc-tone 在子钮作用域\r
         由其 data-type 决定（组级 type 下发后语义色正确），暗色经变量链自适应无需兜底 */\r
    .asc-button-group .asc-button.asc-group-checked {\r
      --asc-bg: var(--asc-tone) !important;\r
      --asc-ink: #fff !important;\r
      --asc-line: transparent !important;\r
    }\r
  </style>\r
  <!-- 布局变体绑定全在本层（根上动态绑定不求值，T4=B）；gap 双形态经 :style 内联\r
         （number 按 px / 字符串原样）；data-fused 绑定假值（gap=0 时 !gap 为 true） -->\r
  <span\r
    class="asc-button-group-body"\r
    :data-vertical="vertical"\r
    :data-block="block"\r
    :data-fused="!gap"\r
    :style="gap ? { gap: (typeof gap === 'number' ? gap + 'px' : gap) } : undefined"\r
  >\r
    <!-- 默认插槽出口：子钮（x-button 变换后的 button 元素）投影于此；display:contents\r
             使子钮直接成为 body 的 flex 项（融合/间隔/stretch 作用于子钮本身） -->\r
    <span class="asc-button-group-items" x-slot></span>\r
  </span>\r
</div>\r
`,e.precompile?.(e=>{for(let s of Array.from(e.el.querySelectorAll(`x-button-group`))){let e=Array.from(s.querySelectorAll(`x-button`)).filter(e=>e.closest(`x-button-group`)===s),c=new Map;for(let e of a)s.hasAttribute(e)&&c.set(e,s.getAttribute(e)),s.hasAttribute(`:${e}`)&&c.set(`:${e}`,s.getAttribute(`:${e}`));for(let t of e){let e=t.getAttribute(`value`);e!=null&&t.setAttribute(`data-value`,e);for(let[e,n]of c)t.hasAttribute(e)||t.hasAttribute(`:${e.slice(1)}`)||t.setAttribute(e,e.startsWith(`:`)?n:e===`disabled`?`true`:n)}let l=document.createElement(`div`),u=[];for(let e of Array.from(s.attributes)){if(e.name.startsWith(`:`)){u.push(`${n(t(e.name.slice(1)))}: (${e.value})`);continue}if(e.name===`class`||e.name===`style`||e.name===`id`||e.name===`name`||e.name===`title`||e.name.startsWith(`data-`)||e.name.startsWith(`x-`)||e.name.startsWith(`@`)){l.setAttribute(e.name,e.value);continue}let i=t(e.name),a=e.value===``&&o.has(i)?!0:r(e.value);u.push(`${n(i)}: ${JSON.stringify(a)}`)}for(s.hasAttribute(`x-model`)&&u.push(`modelBound: true`),l.setAttribute(`x-component:${i}`,`{ ${u.join(`, `)} }`);s.firstChild;)l.appendChild(s.firstChild);s.replaceWith(l)}})}c();function c(){e(e=>{s(e)})}};
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

//# sourceMappingURL=autospark.button-group.js.map
