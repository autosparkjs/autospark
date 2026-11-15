# ADR-0021: P1 轻件合批——表单/反馈/展示/导航十一件

- 状态：已接受（Accepted，2026-11-13）
- 日期：2026-11-13
- 关联：ADR-0018（组件库路线图——清单权威表与四条全局约定）、ADR-0019（P0 轻件合批先例与规避清单）、ADR-0020（BaseField 骨架与值桥协议）、ADR-0022（select——P1 唯一重件，独立 ADR 不入本合批）

## 背景

P1 批 12 件中 11 件为轻件/组合件（唯 select 弹层机制为重件独立 ADR-0022），按 ADR-0018 决策 8 合批一个 ADR。每件一节：归类声明、API 面、复用说明。全局约定（i18n / router 隔离 / 排除域 / button 范式）继承 ADR-0018 决策 6，不在本 ADR 重复。

## 决策

### 1. input-number 数字输入框（form，P1）

**归类声明**：`src/components/form/input-number/`，产物 `autospark.input-number.js`，注册名 `autospark.input-number`。ADR-0018 清单权威表 form 行「input-number（P1）」；原生增强路线（决策 7）。

**API 面**：value（number 非受控初值/单向同步，NaN 防御）/ min / max（null 无界，步进与 change 归位双点夹取）/ step（<=0 归 1）/ precision（<0 自适应；>=0 步进与显示修约）/ controls（步进钮组开关，false 纯输入形态）/ placeholder / status·disabled·readonly（base-field 骨架通道）；change（blur/Enter/步进）重派发 `detail={ value: number | null }`（capture 归位后阻断原生 change）；键盘 ArrowUp/ArrowDown 步进；值桥 = el.value 劫持数字语域（""=空），输入中间态自由（capture 监听先于 x-model 冒泡更新缓存）；表单提交 = 宿主 name 透传原生控件直提交。

**复用说明**：继承 autospark.base-field（产物内嵌注册，ADR-0020）；**复制 input 结构而非嵌套消费** `x-component:autospark.input`——①值桥语域分叉（input string 语域 vs 本件 number 语域，两层劫持嵌套破坏输入中间态）；②嵌套消费引入跨插件产物依赖破坏按需加载自包含；③共享面（盒饰/状态色/焦点/disabled）已由骨架继承覆盖。无 i18n、无元素名 precompile（checkbox/radio/switch 同批次惯例）。

### 2. slider 滑动条（form，P1）

**归类声明**：`src/components/form/slider/`，产物 `autospark.slider.js`，注册名 `autospark.slider`。原生增强路线（决策 7）——range 双滑块 P3 按需（边界声明）。

**API 面**：value / min / max（max<=min 按 min+1 防御）/ step（同步原生刻度 + JS 自持夹取）/ showInput（内嵌 autospark.input-number 双向联动——拖动同步输入框、输入确认反向驱动）/ status·disabled·readonly（骨架通道；readonly 无原生语义经 pointer-events 阻断）；change（松手）重派发 `detail={ value: number }`；值桥 = el.value 劫持数字语域 + 原生 input 冒泡直通 x-model；视觉 = 轨道/填充段/滑块自绘，填充与滑块同源 CSS 变量 `--asc-slider-pos`；表单提交 = 宿主 name 透传 range 原生直提交（range 即真身，**hidden 载体分叉声明**——对照 switch 自绘代理，ADR-0020 决策 6 同款逻辑）。

**复用说明**：继承 base-field；showInput 为跨产物组合（模板字符串引用不构成构建依赖，按需加载须同引 autospark.input-number.js，聚合产物无此问题）；组件根占满父宽（块级滑动形态）。

### 3. rate 评分（form，P1）

**归类声明**：`src/components/form/rate/`，产物 `autospark.rate.js`，注册名 `autospark.rate`。**自绘路线**（决策 7 表单基座内的自绘例外形态）。

**API 面**：value（0-N）/ max（默认 5，运行时变化重建星组）/ allowHalf（悬停·点击·键盘均 0.5 粒度）/ clearable（再次点击同分清零）/ status·disabled·readonly；change 提交 `detail={ value: number }` + input 非冒泡（x-model 回写）；键盘 = role=slider 单焦点模型（Arrow 调分 + Home/End 归位 + aria-valuenow 随动）；表单提交 = hidden 载体（自绘无原生真身，switch 同款代理）；宿主 aria-label 透传（零内置文案的可访问性标注通道）。

**复用说明**：继承 base-field；星形用引擎内置 `star` 图标（x-for 容器形态渲染）；半星经 clip-path 百分比裁剪（on 覆盖层，不动布局）；hover 预览 JS 通道（data-hover 标记，载体恒随实际值）。

### 4. progress 进度条（feedback，P1）

**归类声明**：`src/components/feedback/progress/`，产物 `autospark.progress.js`，注册名 `autospark.progress`。ADR-0018 清单权威表 feedback 行「progress（P1）」。

**API 面**：

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| percent | `number \| string` | `0` | 进度百分比（0-100 钳制；>=100 且 status 缺省自动升 success——antd 同款；aria-valuenow/min/max 经 mounted JS 通道同步） |
| variant | `line \| circle` | `line` | line 轨道条（填充 width 百分比过渡）/ circle SVG 圆环（stroke-dashoffset 过渡，直径 `--asc-progress-size` 缺省 7.5rem） |
| status | `success \| error \| warning \| ""` | `""` | 状态语义色（error 档取 danger 语义色）；文本位自动换语义图标（success/error/warn 经内置 x-icon） |
| showText | `boolean` | `true` | 百分比文本（line 条右 / circle 环心） |
| strokeWidth | `number \| string` | `6` | 线宽（经 `--asc-progress-sw` 变量 :style 内联下发） |

无事件无插槽（纯展示）。

**样式基线继承**：`--asc-tone` 中转 + body `data-status` 经 `:has()` 反驱宿主（alert 同款定型结构）+ theme 档位全跟随 + 三级回退链 + 暗色兜底；过渡动效 prefers-reduced-motion 停播。

**复用说明与引擎边界**：零机制依赖；**SVG 子树编译边界**——compiler transformer 只认 HTMLElement，SVGElement 内指令属性不被编译，circle 几何走 mounted JS 通道（同一元素 setAttribute 保 CSS 过渡）、形态互斥走 data-variant 纯 CSS 分支——该边界为后续含 SVG 组件的可复制规避。

### 5. skeleton 骨架屏（feedback，P1）

**归类声明**：`src/components/feedback/skeleton/`，产物 `autospark.skeleton.js`，注册名 `autospark.skeleton`。

**API 面**：

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| variant | `text \| circle \| rect` | `text` | text 行块（多行）/ circle 正圆 2.5em / rect 大块 5em |
| rows | `number` | `1` | text 行数（钳正整数；末行 60% 半宽收尾） |
| loading | `boolean` | `true` | true 骨架 / false 渲染默认插槽真实内容（**插槽切换骨架/真容——核心用法**；投影编译期完成、x-show 只切显隐，真容运行态保留） |
| animated | `boolean` | `true` | 闪烁开关（渐变扫过 1.4s；prefers-reduced-motion 恒停播） |

**与 x-loading 指令的边界消歧**：x-loading 是 action 通道的就近消费（行为指令）；skeleton 是静态结构占位（数据未到的骨架结构，loading props 手动驱动）。动作级反馈用 x-loading，数据级占位用 skeleton，两者正交可同用。

### 6. message-box 确认询问对话（feedback，P1）

**归类声明**：`src/components/feedback/message-box/`，产物 `autospark.message-box.js`，注册名 `autospark.message-box` + overlay 消费别名 `message-box`（同模板双键注册）。ADR-0018 决策 3：message/notification 已覆盖通知语义，message-box 入清单因其是 confirm 询问语义、非通知。

**API 面**：type（`info|success|warning|danger` 图标映射+语义色，alert 同款）、title、content（默认插槽优先）、confirmText/cancelText（空走 i18n 词典 `message-box.confirm/cancel` 回退「确定/取消」）、confirmType（空 = 按 type 联动）、showCancel。visible 无 props——走消费处 `x-dialog:message-box="状态"` 值通道；props 经 `x-dialog-options.props` 注入。事件：`confirm` / `cancel`（detail 空，先广播后关闭，document 级监听）；关闭经 `action:close` 走请求关闭链（visible 自动回写 false）。

**与 x-dialog 的边界声明**：x-dialog 是通用弹层指令；message-box 是确认语义开箱件——弹层机制全组合消费 x-dialog（勿自建弹层），双钮组合消费 autospark.button（按需加载须同页引 button 产物）。

**引擎边界披露**：overlay 指令属性参数句点被切为修饰符且无点号候选回溯（ADR-0088 修复只覆盖 x-component）——`x-dialog:autospark.message-box` 全名截断 miss，消费用无点别名 `message-box`（双名注册）；overlay 侧补候选回溯后可直用全名。

### 7. avatar 头像（display，P1）

**归类声明**：`src/components/display/avatar/`，产物 `autospark.avatar.js`，注册名 `autospark.avatar`。

**API 面**：src（`@error` 自动回退，变化重置重试）、icon（x-icon 值通道回退，优先于 label）、label（首字符回退源，`Array.from` 取码点 emoji 安全）、shape（circle 缺省/square——圆角走 `--auto-border-radius`）。三源皆空渲染内置 `default` 图标兜底。无事件无插槽。

**复用说明**：**角标不内建**——x-badge 指令外挂组合（文档配方，ADR-0018 决策 3 边界）；回退层显隐用 x-show（规避共享快照多实例 x-if 串台缺陷）。

### 8. image 图片（display，P1）

**归类声明**：`src/components/display/image/`，产物 `autospark.image.js`，注册名 `autospark.image`。

**API 面**：src（变化重置三态重试）、alt、lazy（原生 `loading=lazy`，按简）、fit（object-fit 五档，data-fit 变体属性）、width/height 透传、fallback（失败占位双形态：图标名/图片 URL）。三态生命周期：加载态（内置 loading 图标 SMIL 自转）→ `@load` 摘圈 / `@error` 切 fallback。

**边界**：**点击预览不做**——P2 image-viewer 承接；URL 判定正则禁斜杠（指令值清洗破坏 `\/` 转义，改「无斜杠协议正则 + startsWith 链」规避）。

### 9. list 列表（display，P1）

**归类声明**：`src/components/display/list/`，产物 `autospark.list.js`，注册名 `autospark.list`。

**API 面**：items（状态引用注入；变更整体替换驱动——原地 push 跨域不发信号，文档披露）、virtual（须同页引入 autospark.virtual.js，缺位 warn 退化全量；行定高 36px）、loading（绑定通道组合引擎 x-loading）、bordered（缺省 true）、split（缺省 true）。Slots：`row`（作用域插槽 `{ item, $index }`，缺省行四键探测 + 标量直出）、`empty`（缺省组合 autospark.empty）。

**与 x-for 指令边界消歧**：x-for 是引擎渲染指令（项模板/:key/派生变量全暴露），list 是带空态/加载态/虚拟滚动/边框分隔的开箱容器（内部装配、对外收敛）。virtual 分叉经 x-if 结构接线 + 显式 itemHeight:36（autoDetect 首渲染自败）；双分叉出口统一走动态名对象形态 `{ name, params }`（ADR-0107）绕开同名出口静态去重（ADR-0056）。

### 10. breadcrumb 面包屑（navigation，P1）

**归类声明**：`src/components/navigation/breadcrumb/`，产物 `autospark.breadcrumb.js`。宿主经 precompile 变换替换为真 nav 元素（link 止血路线 ADR-0133，nav 地标语义保真）。

**API 面**：**两形态收敛到同一 items 数据面**——① items 状态引用注入（死环规避，恒走引用）；② 子元素声明 `<x-breadcrumb-item label href icon>` 由 precompile 变换折叠为 items JSON 落宿主 `data-items` 字符串属性（标量通道绕开值对象死环）。末项恒为当前页：`aria-current="page"` 按位绑定；有 href 项渲染真 a（primary 色）。分隔符 separator：`"arrow"` = x-icon 内置箭头，其他任意字符串原样文本（缺省 `"/"`）。

**router 隔离（ADR-0018 决策 6 约定 2）**：纯状态驱动不 import router；激活态/点击拦截以**配方文档**交付（外层 `click.capture` 判 `a[href]` preventDefault 交 router.push）。

### 11. tabs 页签（navigation，P1）

**归类声明**：`src/components/navigation/tabs/`，产物 `autospark.tabs.js`。**segmented 分段控制器并入本件作 `variant` 取值**（ADR-0018 决策 3 裁定），variant 三态 `line | card | segmented`。

**API 面**：受控值通道（button-group 选中模式同构）——props `value` 单向驱动 + 点击/键盘激活写组件 data + 双派发（`input` 非冒泡回写 x-model、`change` 冒泡 `detail={value}`）；`el.value` 劫持桥恒在场；初值落定序 x-model expando > props value > 首个可用项（tablist 恒有一项激活——页签语义下空激活非法）。items 页签头与 `<x-tab key label icon disabled>` 子元素声明（data-items 通道，同 breadcrumb）双形态。

**面板形态裁定：不做 `x-slot:面板key` 动态命名出口**——插槽出口名编译期静态收集，动态面板 key 无静态出口可投；面板恒走**默认插槽 + 调用方状态 x-show / x-if.keepalive / x-if**（引擎原生最短路径），组件不代理面板生命周期。键盘（WAI-ARIA tabs 模式）：左右环形移焦 + 自动激活、Home/End 直达、禁用跳过；页签为真 button。

## 后果

- 本 ADR 定稿即 P1 轻件十一件全量入册（与 ADR-0019 同为批次合批载体，P2+ 轻件另立合批 ADR）。
- 本批固化/实证的引擎边界与规避（后续组件照此执行，根治归 engine 侧）：
  1. **SVG 子树指令属性不编译**（transformer 只认 HTMLElement）——SVG 内一律 JS 通道 + 纯 CSS 分支（progress 先例）；
  2. **overlay 家族点号组件名候选回溯缺口**（ADR-0088 只修 x-component 侧）——overlay 消费的点号名组件以无点别名双注册过渡（message-box 先例）；
  3. **x-for 克隆体内禁 x-if**（共享快照多实例 + 晚注入 scope 串台实证复现）——克隆体一律 x-show；
  4. **指令值内正则 `\/` 转义被清洗破坏**——正则禁斜杠或改 startsWith 链；
  5. **props 引用共享的原地变更不发信号**——items 类数组数据须整体替换；
  6. **virtual itemHeight 自动检测首渲染自败**——virtual 行显式定高；
  7. **x-model × x-component 宿主组合真浏览器 state 不回写**（happy-dom 绿；疑与 engine 在途改动相关，待 engine dist 重建后复核）。
