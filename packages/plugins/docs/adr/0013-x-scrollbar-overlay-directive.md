# ADR-0013: x-scrollbar 滚动条皮肤指令——原生滚动保留的 overlay 路线

- 状态：已接受（Accepted，2026-11-07）
- 日期：2026-11-07
- 关联：ADR-0002（值三态 / Runtime 通道 / 双路径自举——家族契约语义对齐）、ADR-0003（插件开发方式与 IIFE 产物契约）、ADR-0007（配置归一宽松策略与修饰符注入纪律）、ADR-0010（Runtime 指令生命周期先例——observer 三钩子挂靠控制器）；参考库 mdbootstrap/perfect-scrollbar（视觉与交互参照，内核路线被本 ADR 决策 1 否决）

## 背景

诉求：在 `@autospark/plugins` 新增 `x-scrollbar` 指令——为宿主元素提供**好看的自定义滚动条**替换默认滚动条，**仅在鼠标进入宿主时渐显**。参考库 perfect-scrollbar（MDBootstrap 维护，MIT）。经 grilling 十三问两轮收敛（机制 / 交互 / 显隐 / 方向 / 响应式边界 / 控制器形态 / 键面 / DOM 结构 / 几何刷新 / 测试 / 文档链路 / 边界裁剪）。

源码级考察参考库后的关键发现：perfect-scrollbar 的内核是宿主 `overflow:hidden !important` + **手写全部滚动交互**（wheel/touch/keyboard 五 handler，`wheelSpeed`/`wheelPropagation`/`swipeEasing` 等参数全是为补偿原生滚动被夺走而存在）——这是 2016 年浏览器无法隐藏原生滚动条时代的产物。其值得取的是视觉与显隐交互层：rail(15px)/thumb(6px, hover 11px) 形态、`opacity` 渐显渐隐、`minScrollbarLength`、双向按需激活（`ps--active-x/y`）。

## 决策

### 决策 1：原生滚动保留的 overlay 路线（内核与参考库分道）

宿主保留原生 `overflow:auto`，经 `scrollbar-width:none`（标准）+ `::-webkit-scrollbar{display:none}`（Chromium/Safari）隐藏原生滚动条，注入 rail/thumb overlay 层；`scroll` 事件 + ResizeObserver 同步位置。滚轮惯性、触摸、键盘滚动、无障碍**全部免费**，零滚动物理补偿参数。「参考 perfect-scrollbar」界定为取其视觉与显隐交互，不取其 `overflow:hidden` 内核。

### 决策 2：交互默认启用、无开关

thumb 拖拽（Pointer Events + `setPointerCapture` 反写 `scrollTop/scrollLeft`）+ 轨道点击跳页（点击点在滑块上侧向上翻 / 下侧向下翻，一容器高；点滑块冒泡不触发）默认启用，不设配置开关——两者是「好用滚动条」的基本预期。键盘走原生能力免费获得，不写 handler（决策 1 的红利）。

### 决策 3：显隐语义——严格 enter/leave

`mouseenter` 渐显（`fadeDuration` 过渡）/ `mouseleave` 延迟 `delay` ms 后渐隐（默认 300，防快速掠过闪灭）。补充边界：拖拽期间 leave 被守卫（拖起时指针在轨道上是预期内噪声），拖拽收口时按指针坐标补判定（在宿主内维持显示、在外补渐隐）；**键盘滚动不触发显示**（忠实「仅 mouse 进入宿主时呈现」语义）；触摸设备无 mouseenter → 滚动条永不显示，原生滚动照常（overlay 路线免费降级）。

### 决策 4：方向双向自动按需

哪个方向溢出（scroll 尺寸 > client 尺寸）才激活哪个方向的轨道（display 由宿主激活类控制），都不溢出则轨道不渲染；`.x`/`.y` 修饰符（≡ options 布尔开关键）可限定单向，均未声明双向按需。

### 决策 5：几何刷新三件套，不上 MutationObserver

`ResizeObserver`(宿主) + `mouseenter` 强制全量重算（显示前保证所见即所得——内容撑高但鼠标未进入时错几何不可见）+ `scroll` 事件同步 thumb 位置。鼠标悬停期间内容大幅变化导致 thumb 尺寸滞后的局限在文档注明——MutationObserver 观察子树对 x-for 高频变化太贵。

### 决策 6：独立控制器，复用家族契约语义不共享实现

值三态（无值恒开 / 表达式 truthiness / 字面 `"false"` 恒关）/ Runtime 通道（observer 三钩子 + WeakMap 挂靠控制器）/ 双路径自举 / attrChanged 仅重绑值订阅——语义对齐装饰动效家族契约（ADR-0002），复用 `decorate.ts` 的导出面（`bootstrapDecoratePlugin` / `normalizeNumber`）；但滚动条是**持续交互控件**（拖拽状态机 / scroll 同步 / ResizeObserver / 显隐定时器），与 `DecorateStrategy` 的装饰动效生命周期不同构，控制器独立内聚本模块，decorate.ts 零改动。值转假走 setup/teardown 对称挂摘——转假摘轨道与宿主类（**原生滚动条回归**），转真重挂。

### 决策 7：约定式 + 纯视觉

指令不碰宿主 `overflow` 与尺寸（约定宿主自身是滚动容器，不满足静默不激活）；不写 store、不暴露滚动位置、不发信号——滚动位置读写用原生 API。

### 决策 8：rail 直挂宿主内部，不 reparent

轨道两 span 直接 append 进宿主（宿主标记类 `:where()` position 兜底，特异性 0），互向让位不重叠（横向轨道让出纵向厚度）。absolute 定位不参与流式布局、不撑大 scroll 尺寸（perfect-scrollbar 同结构验证十年）；宿主内容 reparent（wrapper 方案）与 x-for 等结构指令的兼容风险不值（领域既有约束：窗格元素永不 reparent）。宿主子元素选择器（`> *` 类）可能误中 rail——文档注明。

**轨道滚动补偿（实施期补记，2026-11-07；2026-11-08 修订双向化）**：真浏览器 e2e 揭示滚动容器内 absolute 子元素**随滚动内容一起滚出可视区**（标准行为；happy-dom 无布局引擎，单测对此盲——三链验证的价值）。`updateThumb` 每次同步给轨道写**正向**补偿把轨道钉回可视区（perfect-scrollbar 单元素直挂结构同款思路，其 update-geometry 在 scroll 事件里重算轨道位置）。修订三点：① 补偿必须**双向** `translate(scrollLeft, scrollTop)`——纵向滚动同样会带走横轨（用户实测反馈）；② 补偿经 scroll 事件后置于合成线程滚动一帧，快速滚轮下轨道有先随内容微移再弹回的滞后抖动——`will-change: transform` 提升合成层减轻（残留局限属原生滚动路径的固有代价，文档注明）；③ 轨道让位改**条件化**（对向激活时才让出厚度，默认贴内缘全长——否则纵向 thumb 视觉滚不到底，用户实测反馈）。补偿平移整个轨道（含滑块）：轨道点击判定的视觉偏移（`clientY - rect.top`）与滑块 `offsetTop`（轨道内偏移）天然同系直接比较，无需补偿项换算。

### 决策 9：键面（`x-scrollbar-options`，静态求值一次；默认值 2026-11-08 用户实测调校）

`width`(12 轨道厚度) / `thumbWidth`(5 滑块粗细，hover 与拖拽增粗 +5px 样式内置) / `color`(缺省中性灰链 `var(--autospark-scrollbar-color, rgba(0,0,0,0.25))`——非主题主色系，暗色下可被外部覆盖变量调亮) / `delay`(300 渐隐延迟 ms) / `fadeDuration`(200 过渡 ms，`prefers-reduced-motion` 下停过渡) / `minSize`(20 thumb 最小长度，perfect-scrollbar `minScrollbarLength` 语义)。初始默认值（15/6/0.35）上线首日经用户实测反馈「更大更浓」修订为 12/5/0.25（更小更淡）。设计期参数经 CSS 变量（`--x-scrollbar-*`）写宿主内联；`minSize`/`delay` 是 JS 几何/定时器值不进 CSS。

## 备选方案

- **perfect-scrollbar 原教旨内核**（`overflow:hidden` + 手写五 handler）：否决——2016 年代产物；原生滚轮惯性/触摸/键盘/无障碍全要自己补，`wheelSpeed`/`wheelPropagation`/`swipeEasing` 一族补偿参数违反 KISS。
- **纯 CSS 美化原生滚动条**（`::-webkit-scrollbar` / `scrollbar-color`）：否决——Firefox 无法隐藏后渐显、视觉控制有限、无法做拖拽增强。
- **包裹层 wrapper**（OverlayScrollbars 式 viewport 包装）：否决——reparent 宿主内容，与 x-for / 窗格永不 reparent 约束冲突。
- **MutationObserver 观察宿主子树**（内容变化检测）：否决——x-for 高频子树变化代价太高；enter 强刷已覆盖可见性正确性。
- **`always` 常显选项 / `maxSize` / `suppressScrollX/Y` 反向键**：否决——YAGNI；`.x`/`.y` 正向修饰符已覆盖抑制语义。
- **键盘滚动时显示**（perfect-scrollbar `ps--focus` 语义）：否决——与「仅 mouse 进入宿主时呈现」的用户明示语义冲突。
- **RTL / 触摸特化 / 嵌套滚动特化 / theme 包联动**：否决（首版裁剪）——RTL 文档注明；触摸天然免费降级；嵌套滚轮冒泡浏览器原生处理；plugins 与 theme 独立（既有共识），颜色只走 CSS 变量覆盖链。
- **蹭 `DecorateStrategy` 共享控制器**：否决——装饰动效接口（normalize/applyVars/触发器/载体探测）与滚动条生命周期不同构，硬塞违反单一职责。
- **轨道 hover 背景色**（perfect-scrollbar rail:hover `#eee` 背景）：否决——中性色背景下额外引入色值决策，hover 增粗已是足够反馈。

## 后果

- 实现：`src/directives/x-scrollbar/index.ts`（单文件内聚：类型 + 样式注入 + 归一 + 控制器 + spec + 自举）；decorate.ts 零改动。
- 构建：`vite.config.ts` CLOSURE_ARTIFACTS 登记 `autospark.scrollbar.js` + 聚合入口 `src/index.ts` 登记。
- 测试：`src/__tests__/directives/x-scrollbar.test.ts`（happy-dom + 几何 mock：defineProperty 遮蔽只读尺寸属性——x-ripple mockGeom 同模式；scrollTop/scrollLeft 原生可写无需 mock）。
- 文档：`docs/zh/guide/directives/x-scrollbar.md` 五段骨架 + `docs/demos/scrollbar/` demo + 侧边栏「扩展指令」登记。
- CONTEXT.md：装饰动效层新增「滚动条皮肤」词条；虚拟列表层「默认滚动条样式」词条加同名消歧注记（彼为 x-for 内置薄样式，此为通用 overlay 指令）。
- engine 零改动；既有插件零影响（产物清单追加项）。
