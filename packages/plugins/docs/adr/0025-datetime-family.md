# ADR-0025: 时间族三件——date-picker / time-picker / time-select（P3 合批）

- 状态：已接受（Accepted，2026-11-13）
- 日期：2026-11-13
- 关联：ADR-0018（组件库路线图——P3 重件深水区与决策 4 排除域「完整日历组件不做，日历仅作 date-picker 内部面板」）、ADR-0022（select——弹层面板范式直系先例：x-popover 机制复用 / 连字符面板注册名 / 键盘导航 / 值桥 / 哨兵键通信，本族全量沿袭）、ADR-0020（BaseField 骨架与值桥协议）、ADR-0021/0024（P1/P2 轻件合批——引擎边界规避清单继承）、ADR-0129（主题三级回退链）、ADR-0134（base 继承与 data-* 主题通道）

## 背景

P3 批时间族三件（date-picker / time-picker / time-select）是弹层自绘 form 控件的三兄弟：触发器同构（BaseField 盒饰 + 图标 + 值展示 + clearable）、面板机制同构（x-popover 呈现 + scope 链哨兵通信 + open 态回写）、值桥同构（"YYYY-MM-DD" / "HH:mm" 字符串语域 + hidden 载体 + input/change 双派发）——机制一体故合族一个 ADR（ADR-0018 决策 8：重件每件一 ADR 的粒度裁定在此放宽为族批，族内差异以逐件小节声明）。

## 决策

### 决策 1：date-picker——内部日历面板自绘（月视图 grid）

- **注册名** `autospark.date-picker`（触发器）+ `autospark-date-picker-panel`（面板内部组件，连字符注册名免疫 x-popover attr 参数点号切分，ADR-0022 决策 1 同款成因）；产物 `autospark.date-picker.js`（内嵌 base-field 注册，跨插件依赖 `autospark.overlay.js`——x-popover 指令宿主）。
- **日历面板结构**：头部（上月钮 + 年月标题 + 下月钮，钮用内置 `arrow` 图标旋转 180° 复用）+ 星期表头（7 列）+ 日格 **6×7=42 格单层 x-for**（不嵌套 x-for——内层渲染晚一跳的引擎边界规避，扁平数组 + CSS `grid-template-columns: repeat(7, 1fr)` 自然分行）+ 底部今天快捷钮。日格状态走 data-* 属性选择器：`data-out`（邻月淡化）/ `data-today` / `data-selected` / `data-active`（键盘高亮）；克隆体内零 x-if/x-show（共享快照多实例串台规避——check 图标式的条件呈现改纯 CSS 父选择器驱动）。
- **props**：`value`（"YYYY-MM-DD" 字符串语域起步；自定义 format P4 按需另立 ADR）、`placeholder`（i18n `date-picker.placeholder` 回退「请选择日期」）、`clearable`、status·disabled·readonly（base-field 骨架通道）。值即展示（缺省格式下 value 字符串直出，无 label 解析层）。
- **月份切换**：面板前后钮沿链写哨兵键 `monthTick/monthDelta`（自增 tick 免疫同值去重，ADR-0022 决策 2 协议），触发器侧 shiftMonth 做年 rollover（12 月→次年 1 月）。
- **键盘（按简实现）**：触发器焦点上 Left/Right/Up/Down = 日间漫游（±1/±7 天，Date 滚动自然跨月——越月时视图跟随切换）、PageUp/PageDown = 切月、Enter = 确认当前高亮日（未开先开）、ESC/Tab 归 popover 打开栈与原生移焦（机制继承不拦截）。打开时高亮落当前值（无值落今天），视图月归位到值所在月。
- **i18n 键设计（查 modules/i18n 词典能力后裁定）**：词典值域是 `string | string[]` 且**数组值 = 复数模式**（translate.ts 决策），数组不能承载星期名列表——键设计为**单键逗号分隔串**：`date-picker.weekdays`（"日,一,二,三,四,五,六"）经 split 消费；`date-picker.month-format`（"{y}年{m}月"，t 命名参数插值——pagination.total 同款通道）；`date-picker.today`（"今天"）；`date-picker.placeholder`（「请选择日期」）。语言切换的响应式刷新以「下次开面板生效」为界（mounted/syncOpen 重算，不做 `$.language` 订阅——`$` 保留键注入须运行时代理写的引擎边界规避）。

### 决策 2：time-picker——两列滚动列表面板（取舍声明）

- **注册名** `autospark.time-picker` + `autospark-time-picker-panel`；产物 `autospark.time-picker.js`（依赖 `autospark.overlay.js`）。
- **面板形态取舍**：**滚动列表两列（时 0-23 / 分 0-59）**而非刻度面板（antd 时分秒转盘）——转盘需 SVG 子树（指令属性不编译的引擎边界 + 自绘几何成本）且秒维度裁剪后语义弱；两列列表与 select 列表面板视觉同源（同 hover/选中 token），实现即滚动定位（打开时两列各 scrollIntoView 到当前值）。秒列裁剪（P3 按简，需要时 P4 增列）。
- **选择语义（与 select 的关键分叉）**：点击时/分格**部分提交**——更新 value 的时或分位、派发 change、**面板保持开**（两列需连续两次点选，选中即关会让「选时→选分」断裂）；面板关闭走 popover 机制通道（外点/ESC）或再点触发器。change 可能连发两次（先时后分）——诚实语义（值确实变了两次），文档披露。
- **键盘边界（按简声明）**：面板内不做两列间漫游（双列焦点模型复杂度高）；触发器 Enter/ArrowDown 开面板、再 Enter 收起。date-picker 的 grid 漫游不复制到本件。
- **props**：`value`（"HH:mm"）、`placeholder`（i18n `time-picker.placeholder` 回退「请选择时间」）、`clearable`、骨架三通道。空值状态点选时列 → "HH:00"（分位缺省 0）、点选分列 → "00:MM"（时位缺省 0）。

### 决策 3：time-select——离散时间点下拉（select 范式直系克隆）

- **注册名** `autospark.time-select` + `autospark-time-select-panel`；产物 `autospark.time-select.js`（依赖 `autospark.overlay.js`）。
- **定位**：比 time-picker 轻——离散选项即 options（无连续时分两列），**直接组合 select 范式的简单列表面板**（ADR-0022 面板的非 filter/virtual 子集）：选项列表 + 选中标记 + 键盘导航（上下高亮 / Enter 确认 / 选中即关面板）+ **fit 宽度匹配 + uid 配对 min-width**（select 两段合成全量克隆——面板与 select 下拉同款观感的硬性要求）。
- **props**：`start`（"00:00"）/ `end`（"23:00"）/ `step`（"00:30"）——起止含端、按步长生成离散时间点（非法步长 ≤0 分钟回退 30；列表长度防御上限 2000）；`value`（"HH:mm"，落在列表内才有选中标记）、`placeholder`（i18n `time-select.placeholder` 回退「请选择时间」）、`clearable`、骨架三通道；空态文案键 `time-select.empty`（回退「暂无数据」，start>end 之类的病态配置兜底）。
- 选项无 disabled 概念（生成物恒可用）；label = value 同串（"09:30"）。

### 决策 4：族共享机制（select 范式沿袭，复制而非跨产物依赖）

- **触发器五件套同构**（逐件复制实现，input-number「复制而非嵌套消费」同款取舍——嵌套消费引入跨产物依赖破坏按需加载自包含）：BaseField 盒饰 + 内层触发器 span（popover 宿主 / combobox 语义 / tabindex JS 通道）+ 值展示/占位（x-if 两态）+ 清除钮（动作件，stopPropagation 防误开面板）+ 图标（注册名空间化：`date-calendar` / `time-clock`，同名静默覆盖可定制）。
- **面板 ↔ 触发器通信**：scope 链聚合视图沿链读写（open + dataContext:host 实例化契约），哨兵键自增 tick 回传交互（pickTick/pickValue、monthTick/monthDelta、hTick/hVal、mTick/mVal、keyTick/keyDir），事件表达式恒逗号运算符单表达式形态。
- **程序化开合**：openPanel/closePanel 派发触发器点击走 popover toggle 通道（声明式面板不入 overlay 实例注册表，ADR-0022 同款绕行 + open 守卫）。
- **值桥**：宿主 el.value 劫持（字符串语域，""=空）+ hidden 载体（name 透传，元素名写法下 name 折叠为 props——mounted 同时查 `data.name` 与宿主属性双通道）+ input（非冒泡）/ change（冒泡 detail={value}）双派发；清除路径 detail={value:""}（字符串空语域，select 的 null 语域分叉声明）。
- **布尔 props 的元素名写法归一**：元素名形态裸属性（`clearable`）折叠为空串（infersStaticPropValue "" 分支）—— falsy 会让裸写法失效；三件 mounted 统一归一 `"" → true`（HTML presence 语义），`="true"/"false"` 与 `:绑定` 形态不受影响。
- **视觉对齐（用户硬性要求）**：触发器与 select/input 同款盒饰（.asc-field-box / --asc-field-tone 状态色通道）；time-select 面板与 select 下拉同款（fit + min-width + 同 hover/选中 token）；date-picker 日历格与 time-picker 格位的 hover/选中语义色经 `--asc-tone` 中转（alert/tag 定型结构：选中实底 tone + 白字、hover/active 走 color-mix 10% 派生）；面板字号随 data-size 档位（em 基准）；三级回退链全量 + 暗色兜底成对（弹层暗色边界同 select：局部 data-dark 不覆盖 body 容器弹层）。

## 备选方案

- **完整日历组件独立成件**：否决——ADR-0018 决策 4 排除域裁定（日历仅作 date-picker 内部面板）。
- **time-picker 刻度/转盘面板**：否决——SVG 子树指令不编译 + 秒维度裁剪后语义弱；两列列表与族内 select 面板视觉同源（见决策 2）。
- **time-picker 选中即关面板（select 同款）**：否决——两列连续选择断裂；部分提交 + 保持开是两列形态的自然语义。
- **i18n 星期名走数组值键**（`date-picker.weekdays: ["日",...]`）：否决——词典数组值是复数模式（translate.ts），数组键会被复数选条逻辑消费；单键逗号串 + split 是词典能力下的正确形态。
- **三件共享触发器为一份模板/代码**（date-picker 内共享模块 + 另两件导入）：否决——触发器逻辑住在 HTML 模板的 `<script setup>` 内联 JSON（引擎求值于页面上下文，不能 import TS 模块）；TS 侧可共享面（图标 SVG/键名常量）体量小于引入跨件源依赖的成本，按 input-number「复制而非嵌套消费」先例逐件自包含（产物各自闭包，按需加载互不牵连）。
- **date-picker 年份/年份区间视图**（antd 头部多年导航）：裁剪——P3 按简（月切换 + 今天快捷已覆盖高频；多年漫游 P4 按需）。
- **date-picker 日期范围选择（daterange）**：裁剪——值语域分叉大（双值数组 + 两面板联动），P4 按需另立声明。

## 后果

- 三产物交付：`autospark.date-picker.js` / `autospark.time-picker.js` / `autospark.time-select.js`（均内嵌 base-field，跨插件依赖 `autospark.overlay.js`；聚合产物无此问题）；测试 `src/__tests__/components/form/{date-picker,time-picker,time-select}-plugin.test.ts`（须 import overlay 家族自举）。
- 族协议（哨兵键 + open 回写 + toggle 通道程序化开合 + 值桥字符串语域）可被后续弹层型组件（cascader / tree-select / color-picker）沿袭——ADR-0022 决策 2 的预测在本族第二次兑现。
- i18n 键六条入册：`date-picker.placeholder/weekdays/month-format/today`、`time-picker.placeholder`、`time-select.placeholder`（+ 空态 `time-select.empty`）——逗号串键形态是词典数组值语义约束下的定型，后续列表类文案键照此。
- 时间族语言切换的刷新边界（下次开面板生效）与 time-picker 键盘漫游裁剪、date-picker 多年视图/范围选择裁剪均声明为 P3 边界，P4 按需增补。
- 元素名写法裸布尔属性折叠为空串是引擎 infersStaticPropValue 的字面行为——本族组件侧 `"" → true` 归一是显式适配而非引擎修复；引擎若后续把裸属性推断为 true，归一层自然幂等。
