# ADR-0030: P4 轻件对——affix 固钉与 watermark 水印

- 状态：已接受（Accepted，2026-11-13）
- 关联：ADR-0018（组件库路线图——清单权威表 other 行与四条全局约定）、ADR-0019/0021/0024（P0/P1/P2 轻件合批先例与规避清单）、ADR-0029（P3 轻件对——anchor/float-button，滚动监听类纪律先例）、ADR-0133（元素名快速写法 precompile 变换）、ADR-0134（autospark.base 继承）
- 修订：2026-11-13 float-button 自 other/ 迁 general/（与本两件无关），other 分组现役成员以迁移后登记面为准

## 背景

P4 长尾批 4 件中 affix 与 watermark 为轻件（tour / countdown 另行），按 ADR-0018 决策 8 合批一个 ADR。两件均无 i18n；watermark 含 canvas 绘制管线（全库首个 canvas 消费面）。

全局约定（i18n / router 隔离 / 排除域 / button 范式）与视觉对齐基线（ADR-0024 后果节）继承 ADR-0018 决策 6，不在本 ADR 重复。

## 决策

### 1. affix 固钉（other，P4）

**归类声明**：`src/components/other/affix/`，产物 `autospark.affix.js`，注册名 `autospark.affix`。ADR-0018 清单权威表 other 行「affix（P4）」。

**API 面**：`offset`（触发偏移缺省 0——兼触发线与吸附位，antd 同款单值双义）；`position`（top 吸顶缺省 / bottom 吸底——纯 CSS 分支 data-position 通道）；`change` 冒泡 `detail = { fixed }`（同值短路防密集 scroll 重复派发）。默认插槽承载固钉内容。

**技术路线裁定**：
- **触发线语义 v1 简化**——统一单线 `scrollY >= offset`，position 只决定吸附边与偏移方向；antd 的 offsetTop/offsetBottom 双线独立判定（元素自然位置触发）不采（语义更少歧义、可测面更小）。
- **占位撑高走宿主 CSS 变量下发**——脱流边沿快照宿主 gBCR：宿主写 `height` 占位（防文档流断裂跳动）、`--asc-affix-left/width` 沿 DOM 继承给内容层 fixed 定位（无需引用子树，规避 mounted 时子树可达性问题）；fixed 态 resize 重校坐标。
- **纯定位件**——零色面零字号面（暗色兜底变体不适用——定位语义暗色不变）；吸附内容底色由内容自带；层级走 `--asc-affix-z` 覆盖通道（缺省 100）。

**与 float-button / anchor 的边界消歧（必写）**：float-button 是 fixed 悬浮动作钮（恒悬浮语义）、anchor 是滚动高亮导航——本件是**内容区固钉吸附**（常态随文档流、越线脱流吸附），三者正交。

**容器相对形态（target）v1 不做**：viewport 起步，按需增补（届时以本 ADR 修订或独立 ADR 承载）。

### 2. watermark 水印（other，P4）

**归类声明**：`src/components/other/watermark/`，产物 `autospark.watermark.js`，注册名 `autospark.watermark`。ADR-0018 清单权威表 other 行「watermark（P4）」。

**API 面**：`content`（string 单行 / string[] 多行——数组走状态引用或裸属性 JSON 字符串声明）、`font`（CSS font 速写完整覆盖）/ `fontSize`（缺省 16）/ `color`（空 = 主题次要色三级回退；显式值 JS 内联覆盖）/ `opacity`（层整体缺省 1）、`rotate`（缺省 -22°）、`gap`（number 等两轴 / [x,y]，缺省 [100,100]）、`zIndex`（缺省 9）、`fullPage`（层挂 body fixed 铺满；运行时切换即时迁移）；默认插槽承载被覆盖内容。纯展示无事件。

**技术路线裁定：canvas 离屏单元 → data URL 平铺**（非 repeating CSS）——旋转文字渲染 repeating CSS gradient 无能为力，canvas 绘制单元（旋转外接矩形尺寸公式）+ `background-image` 平铺是工程合理解。单元尺寸 = 文本块旋转对角外接 + 8px 余量；`background-size` = 单元 + gap。

**主题对齐通道（全库首个 canvas 消费面范式）**：canvas 不能消费 CSS 变量——文案色取水印层 `getComputedStyle().color`（层上挂 `color: var(--auto-secondary-color, var(--asc-watermark-color, 兜底))` 三级回退链），canvas fillStyle 用解析后的实际值——主题在场自动换肤、暗色兜底提亮免费获得；字体族同款（`--auto-font-family`）。

**props 重绘纪律**：全键签名比对幂等（pagination 同款——同值不重绘防 watcher 抖动；签名含 fullPage——形态切换参与签名，容器迁移不被短路）。**数组面标量分流**：裸 `content` / `gap` 属性以 `[` 开头的 JSON 字符串分流 `data-content` / `data-gap` 通道（不进 props 值对象——字面量数组死环规避，breadcrumb/anchor 范式），mounted 解析写 data 响应重绘。

**边界声明（v1 按简不做）**：
- **内容保护不做**（antd 的 pointer-events 拦截层）——本件水印恒 `pointer-events: none`（视觉标记、不拦交互）；
- **MutationObserver 防删除不做**（水印被 DOM 移除后自动重建）；
- **fullPage 暗色边界**：层挂 body 子树，`[data-dark]` 局部容器域不覆盖 body 子树——全页水印暗色跟随全局 `[dark]` 通道；
- **无 canvas 2D 上下文环境静默降级**（层透明不炸——旧 happy-dom 实测 getContext 返回 null）。

### 3. 元素名写法规范继承（ADR-0029 决策 3）

两件均按 ADR-0029 首发的元素名写法规范执行：demo 与文档示例一律 `<x-affix>` / `<x-watermark>`（precompile 变换折叠 props + 裸属性布尔归一 true），`full-page` 裸属性糖经 kebab→camel 归一直出 `fullPage: true`（无需 float-button 式专门糖——目标键名即 camel 形态）。watermark 数组面（content/gap JSON）额外分流 data-* 标量通道。

## 后果

- 两件全量入册；other 分组自 float-button 首件后继续填充（float-button 同期迁 general/，分组归属以迁移后为准）。
- 登记面五处 + 惯例同步由并行收口任务执行（本 ADR 交付时组件/测试/demo/文档已就位，登记信息随任务回报）。
- **本批实证的引擎边界（规避清单追加，根治归 engine 侧）**：
  1. **`x-define:inherit` 组件 destroy 不触发 unmounted**（试挂域时序：编译期先建域（mounted 同步跑）→ 拆域（unmounted 跑）→ 继承就绪重建域（mounted 再跑）——重建域的 unmounted 在 engine.destroy 链上漏触发；对照实验：无 inherit 组件正常触发）。**规避**（float-button 先例模式成文）：全局监听/watch 注册移进 mounted 的 setTimeout 一跳（试挂域拆建错峰）+ 回调 `el.isConnected` 自卫（脱树自短路 + 自摘止损泄漏窗口）；
  2. **watch 回调在域销毁信号下仍晚触发一跳**（键删除信号 → 回调经调度在 destroy 后 flush）——isConnected 自卫使残留触发无害（watermark「机密文档」跨用例重绘实证）；
  3. **CSSOM backgroundImage 序列化带引号**（`url("data:...")`）——断言用 toContain 不锁引号形态。
- 真浏览器 e2e 重点面：affix 滚动吸附链路（happy-dom 无真实滚动，单测以 scrollY/gBCR 补丁注入确定性值覆盖判定逻辑）；watermark canvas 平铺目检（mock 上下文注入断言绘制管线参数，真渲染见 demo）。
- 规避清单继承（ADR-0019/0021/0024/0029）：字面量数组 props 死环（数组面恒引用/标量通道）、watch 回调信封、T4=B 根绑定禁、props 晚注入一跳、组件状态键避开 index、x-define-options tag:false 撞名通道（本对未触发同名指令撞名）。
