# Autocomplete 自动补全

## 概述

Autocomplete 是 AutoSpark 的官方自动补全输入组件（组件库 P3 下拉族 form 件，ADR-0027），属**真原生输入 + 输入驱动建议面板**形态：触发器是真实原生 input（复制 input 组件结构而非嵌套消费——input-number 同款先例，ADR-0020 家族纪律），盒饰与 input 同款（`autospark.field` 骨架继承，原生键盘 / IME / 自动填充全保留）；建议面板**不自建弹层**——复用 [x-popover 指令](/zh/guide/directives/x-popover.md)机制呈现（select 同款协议，ADR-0022），点击外部 / ESC 关闭机制继承，面板宽度随触发器盒饰对齐。

建议源双通道：`suggestions` 本地（`string[]` 或 `{ value, label? }[]` 状态引用 + 包含过滤）与 `fetch` 异步（**action 名通道**——状态树函数值「见函数即求值」使 props 函数引用不可达，ADR-0027 决策 3 实证），`debounce` 默认 300ms 防抖 + 在途次序守卫（过期回包丢弃）+ IME 组合态守卫（拼音中间态不触发请求）。值通道是**文本语域**（x-model 兼容协议，input 范式）：输入路径原生事件自然冒泡（零手动派发），选中路径派发 `input` + `change`（`detail = { value }`）+ `select`（`detail = { value }`，仅在选中建议时触发）。

组件继承 `autospark.field` 表单域骨架（内部基类无文档页），视觉全走 `--auto-*` 语义变量三级回退链（ADR-0129）；**不设自有尺寸属性**——高度 / 内距消费 `--auto-input-height` / `--auto-input-padding`，经主题通道 `data-size` 挂任意祖先容器全档位跟随；暗色态整页经主题暗色模式跟随（弹层在 body 容器渲染，**局部** `data-dark` 容器不覆盖弹层）。内置文案仅占位与空态两条，走 i18n 词典（`autocomplete.placeholder` / `autocomplete.empty`，回退硬编码中文）。

引入方式：引擎之后加载 `<script src="/autospark/autospark.autocomplete.js"></script>`（自举注册，产物已内嵌 field 注册）；**建议面板呈现依赖 x-popover 指令，须同时引入 `autospark.overlay.js`**（聚合产物 `autospark.plugins.js` 无此问题）。

## 快速入门

引擎与 overlay 之后加载组件脚本即注册完成。推荐**元素名形态**（precompile 变换折叠属性为 props）：静态属性直写、绑定走 `:属性`、布尔开关写裸属性；值通道直接在宿主上写 `x-model`：

```html
<script src="autospark.js"></script>
<script src="autospark.overlay.js"></script>
<script src="autospark.autocomplete.js"></script>

<x-autocomplete x-model="form.city" :suggestions="cities" clearable></x-autocomplete>
```

```js
new AutoSpark(el, {
  form: { city: "" },
  cities: ["北京", "上海", "广州", "深圳"], // string[] 或 { value, label? }[]（状态引用注入）
});
```

`x-component:autospark.autocomplete="{ ... }"` 值对象形态同样可用（两形态 props 面等价）；建议数组**经状态引用注入**（引擎值对象内的字面量数组 props 存在无限更新缺陷，修复在途）。

<demo html="components/form/autocomplete/basic.html"/>

## 指南

### suggestions 建议源（本地）

**类型**: `Array<string | { value, label?, disabled? }>`
**默认**: `[]`

本地建议源，**经 x-data / 构造器状态引用注入**（`:suggestions="list"`）。`string` 元素自动升格为 `{ value: s, label: s }`；`label` 是面板呈现文案，`value` 是选中落值（文本语域，落盘为 `String(value)`）；`disabled` 项淡化不可选（键盘导航自动跳过）。本地过滤 = 输入词对 label·value **不区分大小写包含匹配**（输入为空显示全量）；支持运行时整体替换（建议列表热更新）。

> **字面量数组陷阱**：`:suggestions="[{ ... }]"` 字面量写法会触发引擎值对象 props 的无限更新缺陷（修复在途）——一律经状态引用注入。

### fetch 异步建议（action 名通道）

**类型**: `string`（action 名）
**默认**: `null`（走 suggestions 本地过滤）

异步建议走 **action 通道**：`fetch` 值为 action 名字符串，组件内经 `scope.getAction` 延迟解析（支持晚注册）调用其 handle，约定签名 `(query) => Promise<string[] | { value, label? }[]>`：

```html
<x-autocomplete x-model="lang" fetch="searchLang" debounce="200"></x-autocomplete>
```

```js
new AutoSpark(el, { lang: "" }, {
  actions: {
    async searchLang(query) {
      const res = await fetch(`/api/langs?q=${encodeURIComponent(query)}`);
      return res.json(); // string[] 或 { value, label? }[]
    },
  },
});
```

action 三入口（构造 `options.actions` / `engine.actions` Proxy 赋值 / `<script type="autospark/actions">`）任一注册均可。**为什么不走 props 函数引用**：autostore 对状态树函数值「见函数即求值」（computed 语义）——`{ fetch: searchFn }` 的 props 求值当场把函数当 computed 执行（实参收整棵 state），函数引用通道不可达（ADR-0027 决策 3 实证）；action 是引擎既有的函数外置通道。fetch 在场**全权接管**建议产出（不做本地过滤叠加），且**空词不发请求**（挂载期 / 聚焦期不触发，输入驱动）。

<demo html="components/form/autocomplete/fetch.html"/>

### debounce 输入防抖

**类型**: `number`
**默认**: `300`

输入到建议解析的防抖毫秒数（`0` 即时）；fetch 与本地过滤共用。fetch 通道配套**次序守卫**：在途回包以自增序号标记，期间又有新输入（或选中）时旧回包静默丢弃——慢网速下不会出现旧结果覆盖新输入。

### placeholder 占位文案

**类型**: `string`
**默认**: `""`（走词典）

空值占位文案：props 显式值优先；缺省走 i18n 词典 `autocomplete.placeholder` 键（可经 x-locales / 顶层 locales script / `options.i18n.messages` 覆译），未装 i18n 插件或词典无此键时回退「请输入」。空建议面板空态文案同机制（`autocomplete.empty` 键，回退「暂无建议」）。

### 值通道（x-model 桥）

**受控真相走宿主 `x-model`**：组件把宿主 `el.value` 劫持桥接到内层原生控件——输入路径原生 input 事件**自然冒泡**过宿主（x-model 直接命中回写 state，零手动派发）；`value` 属性是**非受控初值 / 单向同步值**（快照序：x-model 初值 > props.value，input 同款边界）。值域恒 string（文本语域）。

```html
<!-- 双向绑定（推荐） -->
<x-autocomplete x-model="form.city" :suggestions="cities"></x-autocomplete>
<!-- 单向同步（无回写） -->
<x-autocomplete :suggestions="cities" :value="form.city"></x-autocomplete>
```

> **绑定 x-data 局部域路径的已知边界**：x-model 写入按全局路径解析，绑 x-data 局部键时会写到 store 根层（孤儿键）——建模请用构造器全局状态（引擎修复在途，见 ADR-0022 遗留）。

### 键盘导航

输入控件聚焦后（role=combobox）：

| 键 | 行为 |
| --- | --- |
| `ArrowUp` / `ArrowDown` | 未开先开建议面板；已开移动高亮（跳过禁用项，首尾环绕），高亮项滚动跟随可见 |
| `Enter` | 开态：确认当前高亮项（写值 + 三派发 + 关面板）；无高亮时关面板并 `preventDefault`（防误触发表单提交）；关态原生放行（提交语义归使用者） |
| `Escape` | 关闭面板（popover 打开栈机制继承，不拦截） |
| `Tab` | 自然移焦 |

面板内鼠标悬停同样驱动高亮（与键盘漫游同通道）。

### 开合模型

- **聚焦确保开**：Tab 聚焦也展开建议（建议在场时）——点击路径由 popover click 机制自理（真实点击与程序化开合的竞态由内部 latch 防护）；
- **输入确保开**：面板已关时再次输入即重开；
- **建议空自动关**：过滤 / 回包为空组时收起面板（重开可见「暂无建议」空态）；
- 点击已开面板的输入区会经 popover toggle 关闭（再输入即重开）——toggle 语义的自然结果。

### clearable 可清除

**类型**: `boolean`
**默认**: `false`

值非空且可交互时显示清除钮（内部动作件，点击不转发焦点）：清空 + `input` 派发（x-model 清空回写）+ 收面板 + 焦点回控件。点击清除**不会**误开面板（阻断冒泡）。

### disabled / readonly / status

**类型**: `boolean` / `boolean` / `"" | "error" | "success" | "warning"`
**默认**: `false` / `false` / `""`

`disabled`：整体淡化 + 原生控件出交互 + CSS 拦截开面板；`readonly`：原生 readOnly + 不开建议面板；`status` 经 field 骨架染边框与焦点环（`error` 态同步 `aria-invalid`），校验结果来自 [x-field](/zh/guide/engine/form/)（组件不做校验）。

### 表单提交（原生直提交）

宿主 `name` 透传到内层原生 input——原生表单提交 / `FormData` 直接生效（控件即真身，ADR-0020 决策 6 input 同款）。

### 事件

| 事件 | 说明 |
| --- | --- |
| `select` | **选中建议时**冒泡派发（点击 / Enter 确认），`detail = { value }`——自由输入不触发，区别于 change |
| `change` | 选中建议时冒泡派发，`detail = { value }`；原生 blur 的无 detail change 仍自然冒泡（文本域原生语义保留） |
| `input` | 输入路径原生事件自然冒泡（x-model 回写通道）+ 选中 / 清除路径程序化派发 |

> 消费监听挂**内层包裹元素**（engine 根元素 `@事件` 绑定不生效）。

### 与 x-popover 的组合边界（ADR-0027）

建议面板的呈现 / 定位 / 关闭触点 / 层级 / 宽度对齐全部由 x-popover 机制承担（select 同款协议，ADR-0022）；组件侧自实现建议内容与交互（列表渲染 / 高亮 / 过滤 / fetch 管道 / 选中联动）。面板与触发器通信走 scope 链哨兵键（`pickTick` / `hoverTick` / `open`），零 DOM 事件配对。

### 主题化

尺寸档位：任意祖先容器挂 `data-size="x-small | small | medium | large | x-large"`（theme 手动通道）触发区生效——触发器高度 / 内距消费 `--auto-input-height` / `--auto-input-padding` 随档联动（建议面板在 body 容器渲染，跟随**页面级**主题档位——局部容器档位不覆盖弹层，与暗色边界同构）；暗色：整页经主题暗色模式自动跟随（弹层在 body 容器，**局部** `data-dark` 容器不覆盖弹层）。使用者覆盖通道 `--asc-autocomplete-*`（如 `--asc-autocomplete-placeholder`、`--asc-autocomplete-max-height`、`--asc-autocomplete-option-hover-bg`）与骨架通道 `--asc-field-*`。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| value | `string` | `""` | 非受控初值 / 单向同步值（受控真相走宿主 x-model） |
| suggestions | `Array<string \| { value, label?, disabled? }>` | `[]` | 本地建议源（**状态引用注入**，支持运行时整体替换） |
| fetch | `string` | `null` | 异步建议 action 名（`(query) => Promise` 签名；在场全权接管本地过滤，空词不发请求） |
| debounce | `number` | `300` | 输入防抖 ms（0 即时；fetch 与本地过滤共用） |
| placeholder | `string` | `""` | 占位文案（缺省走词典 autocomplete.placeholder，回退「请输入」） |
| clearable | `boolean` | `false` | 清除钮（非空显形，清空 + input 派发） |
| status | `"" \| error \| success \| warning` | `""` | 状态色通道（field 骨架；x-field 校验结果染色入口） |
| disabled | `boolean` | `false` | 禁用（淡化 + 不可开面板） |
| readonly | `boolean` | `false` | 只读（原生 readOnly + 不开建议面板） |

### 事件

| 事件 | 参数 | 说明 |
|---|---|---|
| select | `detail: { value }` | 选中建议时冒泡派发（点击 / Enter 确认） |
| change | `detail: { value }` | 选中建议时冒泡派发（原生 blur change 另自然冒泡） |
| input | 原生事件 | 输入自然冒泡（x-model 回写）+ 选中 / 清除程序化派发 |

### Slots

| 插槽 | 说明 |
|---|---|
| — | 不开插槽（继承形态嵌套插槽出口被忽略，ADR-0056——select 同款） |
