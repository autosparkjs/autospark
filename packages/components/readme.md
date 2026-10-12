# @autospark/components

[AutoSpark](https://github.com/zhangfisher/autospark) 声明式组件资产包：**每个组件一个 `.html` 文件**（`x-define` 资产形态，含 `<script setup>` 数据与 `<style global>` 主题化样式）。

本包**运行时零依赖 `autospark`**——产物是自包含的组件模板字符串表，喂给任意 AutoSpark 引擎实例即可使用（engine 仅为 devDependencies，服务 demo 开发）。

## 使用

```ts
import { AutoSpark } from "autospark";
import { AUTOSPARK_COMPONENTS } from "@autospark/components";

new AutoSpark(el, state, { components: AUTOSPARK_COMPONENTS });
```

```html
<!-- 宿主标签即组件根标签（化身语义）——button 宿主得到语义化按钮 -->
<button x-component:autospark.button="{ label: '保存', type: 'primary' }"></button>
```

组件注册名统一 `autospark.` 点前缀：经 `options.components` 业务注册位注入（优先级高于内置 `builtinComponents`），**同名即覆盖内置组件**（如自定义 `autospark.dialog` 可全站换 shell）。

## 开发 demo

每个组件在 `demo/` 下对应一个演示页，vite 多页伺服：

```bash
cd packages/components
bun run dev      # http://localhost:5181/
```

## 新增组件（三步）

1. `src/components/<名>.html` —— 根元素 `x-define="autospark.<名>"`，可选 `<script setup>`（`data()` / `methods`）与 `<style global>`（CSS 变量主题化）；
2. `src/index.ts` —— `?raw` 导入并注册进 `AUTOSPARK_COMPONENTS` 种子表；
3. `demo/<名>.html` —— 复制现有演示页改内容，并在 `demo/index.html` 导航中加链接。

## 构建

```bash
bun run build    # tsup esm/cjs/iife 三格式；模板经 ?raw 内联进产物（scripts/esbuild-raw-assets.ts）
```
