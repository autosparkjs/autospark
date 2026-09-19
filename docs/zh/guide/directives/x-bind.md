# 属性绑定

## 概述

`x-bind:attr`（简写 `:attr`）把状态绑定到元素的任意属性。它会按属性名自动分派到合适的写入方式：普通属性、`class`、`style`、布尔属性等，一套语法覆盖所有场景。

```html
<a :href="link.url">链接</a>
<span :class="{ active: on }">标签</span>
<button :disabled="saving">保存</button>
```

`x-class` / `x-style` 是 `x-bind` 的特化别名——解析期归一化为 `bind` + `class` / `style` 参数，没有独立指令类。

不带属性参数的 `x-bind="obj"` 是**属性展开**形态：把整个对象摊开成一组属性，见[下文](#属性展开)。

## 快速入门

<demo html="bind/basic.html"/>

```html
<a :href="link.url" :title="link.tip">{{ link.text }}</a> <img :src="img.src" :alt="img.alt" />
```

`:attr="expr"` 的 `expr` 是表达式（路径、对象、三元等任皆可），随状态自动更新。

## 指南

### 绑定普通属性

`:title` / `:href` / `:src` / `:value` 等普通属性，值经 `String()` 转换后 `setAttribute`。

<demo html="bind/basic.html"/>

```html
<a :href="link.url" :title="link.tip">{{ link.text }}</a>
```

### 绑定 class

`:class` / `x-class` 支持三种写法，按 diff 增量更新（只改变化的 token）：

<demo html="bind/class.html"/>

```html
<!-- 对象：键为类名，值为真则启用 -->
<span :class="{ val: user.active, muted: !user.active }">状态</span>
<!-- 数组：合并多个类 -->
<span :class="['card', theme]">卡片</span>
<!-- 字符串 -->
<span :class="theme">主题</span>
```

### 绑定 style

`:style` / `x-style` 支持对象（key 用驼峰）或字符串：

<demo html="bind/style.html"/>

```html
<!-- 对象：驼峰 key，合并到 el.style -->
<p :style="{ color: msg.color, fontSize: msg.size + 'px' }">消息</p>
<!-- 字符串：整体 cssText 替换 -->
<p :style="msg.cssText">消息</p>
```

::: warning 对象 key 用驼峰
对象写法经 `Object.assign(el.style, value)` 合并，key 必须是 `CSSStyleDeclaration` 的属性名（驼峰，如 `fontSize`、`backgroundColor`），连字符（`font-size`）不生效。字符串写法用连字符没问题。
:::

`.transition` 修饰符可让样式变化自动过渡动画（注入默认 `transition:all 0.3s ease-in`，可用 `x-bind-options` 覆盖）。完整说明见 [x-style · 过渡动画 `.transition`](./x-style.md#过渡动画-transition)。

### 绑定布尔属性

`:disabled` / `:checked` / `:readonly` 等布尔属性，值为真则 `setAttribute`、为假则 `removeAttribute`：

<demo html="bind/boolean.html"/>

```html
<button :disabled="saving" @click="save">{{ saving ? "保存中…" : "保存" }}</button>
<input type="checkbox" :checked="agree" />
```

### 属性插值自动归一化

属性值里的插值会自动归一化为 `:attr` 绑定，复用上面同一套分派：

```html
<a href="/users/{{ user.id }}">主页</a> <span class="card {{ user.role }}">标签</span>
```

详见[状态 · 属性插值](../state.md#属性插值)。

### 属性展开

`x-bind="expr"` **不带属性参数**时进入属性展开（spread）形态：值须为对象（或**对象数组**，多对象合并展开），整个对象摊开成 N 个属性——有参 `:title` 绑一个属性，无参 `x-bind` 绑一整组（`v-bind="obj"` 心智）。

<demo html="bind/spread.html"/>

```html
<!-- 字面量：静态声明一组属性（字符串值须带引号——表达式求值，非宽松 JSON） -->
<div x-bind="{ title: tip, disabled: locked, 'data-id': id }"></div>
<!-- 状态路径：对象整体即属性组，随状态重展开 -->
<div x-bind="attrs"></div>
<!-- 数组：多对象合并展开（键冲突后者覆盖前者；falsy 项跳过，非对象项 warn + 剔除） -->
<div x-bind="[{ title: tip }, cond && { disabled: true }, { 'data-id': id }]"></div>
```

**值分派**（通用规则 + 四个特判键）：

| 值                             | 结果                                                                                      |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| `true`                         | 裸属性（presence 语义，任意键通用——`aria-*`、`data-*`、自定义属性不在布尔白名单也能生效） |
| `false` / `null` / `undefined` | 移除属性                                                                                  |
| `string` / `number`            | `String()` 后写入                                                                         |
| `object` / `array`             | warn + 剔除（无法表达为属性值）                                                           |

四个特判键 `class` / `style` / `value` / `checked` 复用单属性绑定的同一套分派：

```html
<!-- class 对象：与静态 class 合并（静态 token 永不被碰） -->
<span class="tag" x-bind="{ class: { 'is-primary': on }, title: tip }">标签</span>
<!-- style 对象：键级增删 diff；value/checked：property 写入（单向） -->
<div x-bind="{ style: { color: msg.color } }"></div>
<input x-bind="{ value: text, checked: picked }" />
```

**响应粒度**：

- 裸路径 `x-bind="attrs"` 以 `depth:2` 订阅——**子键修改 / 新增键 / 删除键 / 整体替换**全部触发重展开；
- 字面量 `x-bind="{ title: tip }"` 走键级响应（每个引用独立追踪，与 `:class="{ active: on }"` 同款通路）；
- 边界：x-for 项内写 `x-bind="item.props"` 时（局部上下文走表达式求值）只有 `item.props` **整体替换**触发，子键修改不触发——要键级响应请改用字面量形态 `x-bind="{ title: item.props.title }"`。

**覆盖顺序**（JS 展开心智）：书写在展开**之后**的同名静态属性由静态赢——`<div x-bind="attrs" b="2">` 中 `b` 恒为静态值；之前的同名静态属性被展开键覆盖。`class` 键例外——走合并语义。

**指令屏障**：展开出的键**永不作为指令编译**。`x-bind="{ 'x-text': 'msg' }"` 只会把 `x-text="msg"` 作为普通属性写上去（字面值、不执行），并给出 warn 提示。

### 求值结果取反

对求值结果**取反**（`!value`），语义化用于**反向词汇映射**——状态词汇与 DOM 属性词汇语义相反的场景。状态绑定与 `@` 配置绑定均生效：

```html
<!-- 状态绑定：editable（可编辑）→ disabled（禁用），词汇反向 -->
<button :disabled.invert="editable">提交</button>
<!-- state.editable=false → !false=true → 禁用；editable=true → 解除 -->

<!-- 配置绑定：schema.enable（true=可用）→ disabled，x-model 元数据注入即此形态 -->
<input :disabled.invert="order.price@enable" />
<!-- schema.enable=true → 不禁用；enable=false → 禁用 -->

<!-- 等价指令选项（ADR-0007：修饰符即指令选项） -->
<input :disabled="order.price@enable" x-bind-options="{invert:true}" />
```

**适用范围**：boolean 型属性（`disabled` / `readonly` / `hidden` / `selected` / `multiple`）。对非布尔属性无意义——任意值 `!` 后恒为布尔（字符串 `"x"` → `true` → `setAttribute(attr,"")`），引擎不禁止，但请遵守约定。

**典型来源**：schema 元数据的 `enable`（正向词汇，与 core/React 表单生态对齐）映射 DOM `disabled`（反向词汇）——[x-model 字段元数据注入](./x-model.md#字段元数据)的 `enable → disabled` 反向即自动合成 `:disabled.invert="path@enable"` 实现。

## 配置

`x-bind` 的指令值即要绑定的表达式。修饰符 `.invert`（值取反，见上文）；经 `x-bind-options` 声明的配置项：

| 配置项   | 类型 | 说明                              |
| -------- | ---- | --------------------------------- |
| `invert` | 布尔 | 同 `.invert` 修饰符：求值结果取反 |

::: info 关于指令配置体系
指令选项 / 修饰符 / 宿主选项 / 两层回退的通用机制见[指令配置](../config.md)。
:::

## 注意事项

- **同属性避免重复绑定**：同一元素不要同时对同一属性用 `:attr` 与属性插值（如 `:class` 与 class 里混排插值），编译期会报错。
- **class / style 是 diff 更新**：只增删变化的 token / 声明，不会清掉其他来源的类。但静态写在 `class=""` 里的 token 与 `:class` 绑定是两套，避免互相依赖。
- **对象 style 用驼峰**：见上文警告。
- **布尔属性的假值**：`false` / `null` / `undefined` 会移除属性，而非设为 `"false"`（规避 HTML 布尔属性坑）。
- **属性展开的空态与非法值**：无参 `x-bind="expr"` 求值为 `null` / `undefined` 时静默保留旧展开（异步数据未落地不闪断）；整值**数组**为多对象合并展开（falsy 项跳过、非对象项 warn + 剔除）；整值非对象（`true` / 数字 / 字符串）warn 后忽略；`.invert` 对展开无意义（warn + 忽略）。
