# 组件样板解剖（template-anatomy）

小型组件的完整样板 + 模板结构逐段职责 + 大型组件组织模式。样板以通用形态给出（`<div>` 根）；根元素可按组件语义替换（如 button 组件用 `<button>`，化身后宿主即组件根），结构参照现役 `src/components/button/`。

## 目录

- [index.ts 完整样板](#indexts-完整样板)
- [<name>.html 模板解剖](#namehtml-模板解剖)
- [化身路径约束（T4=B）详解](#化身路径约束t4b详解)
- [大型组件组织模式](#大型组件组织模式)
- [常见陷阱](#常见陷阱)

## index.ts 完整样板

```ts
/**
 * autospark.<name> 组件插件（@autospark/plugins ADR-0003 组件形态官方样板）：
 * 经插件全局组件表注册（ADR-0111 决策 5，`AutoSpark.components[name] = 模板字符串`），
 * 跨 engine 真全局——晚注册立即生效，同名后注册覆盖先注册。
 *
 * 查找链语义（engine `_resolveGlobalComponent`）：`scope 局部 → options.components →
 * 本表 → builtinComponents`——业务侧 `options.components` 同名声明优先级高于本表。
 *
 * 模板自包含：`<script setup>`（状态与 mounted 同步）+ `<style global>`（CSS 变量
 * 主题化）随模板整体注册，无独立样式交付通道。
 *
 * IIFE 产物全局名 `AutoSpark<Name>`（autospark.<name>.js）；双加载时序由
 * installPlugin 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import template from "./<name>.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094） */
export const <NAME>_NAME = "autospark.<name>";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 */
function mount<Name>Plugin(autospark: typeof AutoSpark): void {
    autospark.components[<NAME>_NAME] = template;
}

bootstrap<Name>Plugin();

/**
 * 双路径注册（模块加载期执行一次，经 installPlugin 单点）。
 */
function bootstrap<Name>Plugin(): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（零符号消费时亦预留统一通道）
        mount<Name>Plugin(autospark);
    });
}

export { bootstrap<Name>Plugin };
```

要点：

- `import type { AutoSpark }` 是**类型导入**（编译期剥除，产物零痕迹）——本包运行时零静态依赖 engine 是铁律（ADR-0003）
- `?raw` 让模板以字符串形态内联进产物
- 入口尾部立即调用 bootstrap（模块加载即自举），构建时 `@autospark/utils/vite` 的 `buildAutoSparkPlugin` 会包 IIFE 闭包外壳

## `<name>.html` 模板解剖

```html
<!--
    化身路径约束（x-component T4=B）：组件快照根的属性是静态并入宿主（class 拼接 /
    style 合并 / 其他属性复制），根上的动态绑定不会求值——变体绑定须落在编译子树的
    内层元素（插槽出口 span）上，经 :has() 选择器驱动宿主外观；原生 disabled 语义
    在 mounted 钩子同步到宿主（this.el 即化身后的组件根）。
-->
<div class="asc-<name>" x-define="autospark.<name>">
  <script setup>
    {
        data: () => ({
            // props 声明：实例化时经 x-component:autospark.<name>="{ ... }" 注入
            type: "default",
            size: "md",
            label: "默认文案",
            disabled: false
        }),
        mounted() {
            // 原生属性语义同步到宿主（化身后 this.el 即组件根）；
            // 后续 props 变化经 watch 保持同步（回调收 { value } 信封对象，解构取值——
            // 裸值写法 v 实为信封对象，!!v 恒真，静默失效）
            this.el.disabled = !!this.data.disabled;
            this.watch("disabled", ({ value }) => { this.el.disabled = !!value; });
        },
    }
  </script>
  <!-- style 段默认 global（注册期注入 + id 幂等）；scoped 仅在需实例隔离或 bind() 响应式样式时用 -->
  <style global id="autospark-components-<name>">
    /* 主题化（ADR-0129）：三级样式回退链 var(--auto-X, var(--asc-<name>-X, 校准兜底值)) */
    .asc-<name> {
      /* 结构性样式 + 回退链消费语义变量，见 references/theme-vars.md */
    }
    /* 暗色兜底变体：[dark] .asc-<name>, [data-dark] .asc-<name> { ... } */
  </style>
  <!-- 默认插槽出口：未提供内容时显示 {{ label }}（组件自身状态求值）；
         变体数据属性随出口元素承载（见文件头注释） -->
  <span class="asc-<name>-label" :data-type="type" :data-size="size" x-slot>{{ label }}</span>
</div>
```

各段职责：

| 段 | 职责 | 约束 |
|---|---|---|
| 根元素 | 组件结构根，化身后与宿主合并 | `class` 静态拼接；**动态绑定禁上根** |
| `x-define` | 组件名声明，编译期剪枝 | 值 = 注册名 `autospark.<name>` |
| `<script setup>` | 组件 data / 生命周期 / watch | JSON 对象字面量形态（relaxed-json） |
| `<style global>` | 全局样式注入，随模板注册 | `id="autospark-components-<name>"` 幂等键 |
| `x-slot` 出口 | 默认插槽 + 变体数据载体 | 变体绑定（`:data-*`）落这里 |

`<script setup>` 内可用钩子：`data()`（props 默认值）、`mounted()`、`unmounted()`、`this.watch(path, cb)`、`this.el`（化身后宿主）、`this.data`、`this.host`。

## 化身路径约束（T4=B）详解

x-component 实例化时组件快照**根元素**的属性静态并入宿主，根上的绑定表达式**原样泄漏为字面文本、不求值**。正确做法：

```html
<!-- ❌ 错误：根上绑定不求值，data-type 泄漏为字面字符串 "{ type }" -->
<div class="asc-<name>" :data-type="type">...</div>

<!-- ✅ 正确：绑定落内层，:has() 反向驱动宿主外观 -->
<div class="asc-<name>">
  <span class="asc-<name>-inner" :data-type="type" x-slot>{{ label }}</span>
</div>
```

```css
/* 宿主外观经 :has() 读取内层数据属性 */
.asc-<name>:has(> .asc-<name>-inner[data-type="primary"]) {
    background: var(--auto-primary-color, ...);
}
```

需要把状态写到宿主**原生属性**（disabled / value 等）时，用 `mounted()` + `this.watch()` 同步（`this.el.disabled = !!this.data.disabled`）——CSS 驱动走 `:has()`，DOM 属性驱动走 JS 同步，两通道勿混。

## 大型组件组织模式

代码量太大、单文件装不下需要拆分多文件时（判定标准见 SKILL.md 第二步——是代码量而非功能复杂度；浮层等功能信号只触发工具选型，不触发拆分），目录按 notifications / resource 的先例拆分：

```
src/components/<name>/
├── index.ts          # 入口：installPlugin 自举（结构不变，注册体变厚）
├── <name>.html       # 主组件模板（可拆多个 .html：子组件各自注册）
├── bootstrap.ts      # 自举逻辑拆出（注册多个组件/actions/初始化）
├── types.ts          # 类型定义
└── actions/          # 需要注册全局 action 时
```

拆分原则：

- **入口 `index.ts` 保持薄**——installPlugin + 调 bootstrap，注册面互不冲突
- 跨组件复用的纯函数**住 `src/utils/`**（一函数一文件，ADR-0009），勿复制进组件目录
- engine 公开成员（如 `getOverlayContainer`）经 `nsMember("...")` 运行时解析，勿静态 import
- 多模板文件各自 `?raw` 导入，`bootstrap.ts` 内逐个注册到 `autospark.components`
- 需要注册 action 时：`autospark.actions["<name>/xxx"] = fn`（在 register 体内，命名空间化防冲突）

工具选型见 `references/utils-catalog.md`。

## 常见陷阱

1. **根绑定失效**（T4=B）：见上节，最常见缺陷，症状是模板里出现字面 `{ type }` 文本或变体恒不生效。
2. **组件名大小写**：DOM 属性参数被小写化，`autospark.MyWidget` 会变成 `autospark.mywidget` MISS → 永久 loading 占位。恒小写/kebab-case。
3. **`<script setup>` 非严格 JSON**：是 relaxed-json（支持尾逗号、注释），但属性名勿用引号包裹。
4. **style id 冲突**：`id="autospark-components-<name>"` 是幂等键，多实例只注入一次；id 撞名会互相覆盖。
5. **slot 出口误删**：`x-slot` 出口是默认插槽，删掉后使用者传入的子内容无处安放（静默丢弃）。
6. **watch 回调信封**：`this.watch(path, cb)` 的 cb 收 `{ value }` 信封对象（家族惯用法解构 `({ value })`，见 overlay/foldable.ts）——裸值参数写法 `cb(v)` 里 v 是信封对象，`!!v` 恒真、`v.x` 恒 undefined，静默失效难排查。现役 button.html 的 watch 即有此潜伏缺陷，勿照抄。
