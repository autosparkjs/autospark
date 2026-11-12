# x-locales 字典声明

## 概述

`x-locales` 是 [i18n 插件](https://github.com/zhangfisher/autospark/blob/master/packages/plugins/src/modules/i18n/index.ts)（产物 `autospark.i18n.js`，按需加载，[ADR-0136](https://github.com/zhangfisher/autospark/blob/master/packages/engine/docs/adr/0136-i18n-plugin-fallback-t.md)）的元素级字典声明指令：以**默认语言原文为键**、语言码为子键声明翻译字典，挂自身作用域，供全局翻译函数 `t()` 就近查表。与 `<script type="autospark/locales">` 脚本声明同族——脚本适合大字典，`x-locales` 直接写在元素上、适合就近的补充覆盖。

未装载 i18n 插件时：`t(...)` 走引擎内置兜底（恒等 + 插值），模板不报错。

## 快速入门

<demo html="locales/basic.html"/>

装载插件后，`t()` 按当前语言查表输出；点击语言按钮直写 `$.language` 即全页切换，所有 `t` 绑定自动重渲染，无手动刷新。

## 指南

### 指令值

值为**编译期求值一次的任意表达式**（Compile 静态——字典是模板结构性数据而非动态 UI 状态，不订阅后续变化）：

#### 对象字面量

最常用形态，键为原文、子键为语言码：

```html
<div x-locales="{ '提交成功': { 'en': 'Saved' }, '共{}条': { 'en': '{} items' } }">
    <span x-text="t('提交成功')"></span>
</div>
```

#### 状态路径初值

编译期取一次状态对象的值作字典（之后状态变化不回读）：

```html
<div x-locales="myDict">...</div>
```

字典值的形态：译文串，或**复数数组**（按下标选取，见「配合 t() 与复数」）。

### 查表链：就近覆盖与语言外扩

字典有三条声明通道，查表沿作用域链**就近优先**：

| 通道 | 层级 | 适用 |
|---|---|---|
| `x-locales` | 自身作用域 | 就近补充覆盖（本指令） |
| `<script type="autospark/locales">` | 最近祖先作用域；顶层游离自动全局；`global` 属性显式全局 | 大字典声明 |
| `options.i18n.messages` | 全局层（最低） | 应用级字典 |

匹配规则分两步（**分层语言链**）：

- **key 就近**：同 key 同语言，近层胜（就近覆盖；同作用域内 `x-locales` > script）；
- **语言外扩**：近层字典没有当前语言（及 `fallback`）的译文时，继续向远层查——近层缺的语言由远层补。

不支持用 `null` 删除父层已声明的键。

### 为组件补充语言包

组件作者通常只维护部分语言的译文（如仅 `en` / `ja`）。基于分层语言链，**使用方可在消费容器上用 `x-locales` 注入组件字典未覆盖的语言**，组件内文案即按注入语言渲染，无需改动组件：

```html
<!-- 使用处：注入组件未内置的 zh-CN 译文 -->
<div x-locales='{ "保存": { "zh-CN": "保存更改" } }'>
    <!-- 组件内 t('保存') 在 zh-CN 下渲染使用处注入的译文 -->
    <div x-component:save-button></div>
</div>
```

规则：同 key 同语言**近层胜**（组件自己的译文优先于使用处注入）；近层缺的语言由远层补（`fallback` 链在每层内先行尝试）。

<demo html="locales/component-extend.html"/>

### 配合 t() 与复数

`t()` 在任意绑定表达式可用：<span v-pre>`{{ t('原文') }}`</span>、`:title="t('原文')"`、`@click="msg = t('原文')"`。复数：翻译值为**数组**即复数模式——

```html
<div x-locales="{ '我有{}辆车': { 'en': ['I have no car', 'I have one car', 'I have {} cars'] } }">
    <!-- n = 0 → "I have no car"；1 → "I have one car"；5 → "I have 5 cars"（末项） -->
    <span x-text="t('我有{}辆车', n)"></span>
    <!-- 命名通道：{$count} 变量兼作复数选择器与插值 -->
    <b x-text="t('{name}有{$count}辆车', { name: '张三', $count: 1 })"></b>
</div>
```

下标规则：第一个数字参数（或第一个 `$` 数字变量）选 `clamp(floor(n), 0, 长度-1)` 项；无数字取末项；数字/`$` 变量同时照常参与插值。

### 语言切换与 $.language

当前语言的唯一运行时真相是 `state.$.language`（`$` 元状态容器），**直写即切换**：

```html
<button @click="$.language = 'en'">English</button>
<p>{{ $.language }}</p> <!-- 当前语言本身也是响应式可绑定 -->
```

初始值取 `options.i18n.language ?? default`。装了 [router](https://github.com/zhangfisher/autospark/blob/master/packages/router) 时其 URL 驱动的解析结果会覆写该值（URL 优先）。

### 回退链

查不到译文时按序回退：当前语言全等 → 主子标签（`zh-TW` 命中 `zh-CN` 键）→ `fallback` 全等 → `fallback` 主子标签 → **返回原文键本身**（键也照常插值）。命中失败在开发环境告警一次（按 key 去重）。

## 注意事项

- **`autospark.i18n.js` 须先于 `new AutoSpark()` 加载**（选择性引入——参与首编译的注册晚到不被已编译树识别）。未装插件时：script 块被引擎告警并丢弃、`x-locales` 属性原样残留、`t(...)` 恒等 + 插值。
- 指令是 Compile 静态：字典不响应式，「运行时换字典」不支持——切换语言走 `$.language`，换字典重新挂载模板。
- 原文键**全等**匹配（不 trim，`" Hello"` 与 `"Hello"` 是两个键）；语言码键归一匹配（大小写与 `_`/`-` 等价）。
- 插值不支持嵌套路径（`{a.b}`）与数字本地化格式化；对象参数与位置参数混用不支持（复数统一走 `{$count}` 通道）。
- `options.i18n.languages` 是语言清单唯一源：router 未显式传 `languages` 时自动取它驱动 URL 多语言；两者都对引擎与插件零依赖互不感知。
