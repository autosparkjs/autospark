# 家族工具目录（utils-catalog）

组件的工具选型表——按**需求信号**选工具，与组件规模无关（小型、大型组件均可消费）。两层来源：**@autospark/utils**（跨包公共基建）与 **packages/plugins/src/utils/**（包内家族共享，一函数一文件，ADR-0009）。

## 目录

- [@autospark/utils（必用）](#autosparkutils必用)
- [运行时命名空间三件套](#运行时命名空间三件套)
- [包内家族工具决策表](#包内家族工具决策表)
- [使用纪律](#使用纪律)

## @autospark/utils（必用）

| 导出 | 用途 | 何时用 |
|---|---|---|
| `installPlugin(register)` | 插件双路径自举单点 | **每个组件入口必用**——引擎先加载直注册、后加载推 `__AUTOSPARK_PLUGINS__` 预加载队列（ADR-0114），注册通道关闭且全局不可达时 console.error 响而不哑 |
| `@autospark/utils/vite` 的 `buildAutoSparkPlugin` | IIFE 闭包构建工具 | 不直接调用——vite.config.ts 已注入；新组件只需登记 `CLOSURE_ARTIFACTS`（见 registration.md） |

`installPlugin` 的 register 体内第一件事调 `captureNamespace(autospark)`（见下节）。

## 运行时命名空间三件套

`src/utils/namespace.ts`——本包对 engine 的依赖**全部运行时解析**，编译期零 import（类型导入除外）：

| 函数 | 用途 |
|---|---|
| `captureNamespace(ns)` | register 体内调用一次，存档命名空间（无论引擎先后加载） |
| `resolveNamespace()` | 取命名空间：`globalThis.AutoSpark` 优先（最新全局态），否则捕获引用 |
| `nsMember(name)` | 取 engine 公开成员，**缺位即 throw**（响而不哑纪律）——读 `getOverlayContainer` 等引擎 API 的唯一正道 |

消费范式：`nsMember<(engine: unknown) => HTMLElement | null>("getOverlayContainer")(engine)`——成员名打错时立即 throw（开发期暴露，不静默 undefined）；现成具名包装见 `getOverlayContainer.ts`。

## 包内家族工具决策表

按「组件出现什么信号 → 用什么」组织：

| 信号 | 工具 | 说明 |
|---|---|---|
| 浮层定位（下拉/气泡/锚定弹出） | `utils/floating.ts` | floating-ui 装配：offset/flip/shift/arrow/autoPlacement 中间件 + autoUpdate；placement 默认 `'auto'`；箭头载体须调用方预先注入 panel；cleanup 经 registerCleanup 注册 |
| 运行时注入全局样式（非随模板注册） | `utils/injectStylesheet.ts` | 幂等注入：id 查重；mode = default/replace/patch/append；SSR 守卫；`css` 可传惰性工厂 |
| 容器尺寸响应（断点/折叠/吸附） | `utils/resizeSession.ts` | ResizeSession 机制核心（布局家族与 overlay resize 选项跨产物单源） |
| 需要挂 overlay 到引擎渲染根 | `utils/getOverlayContainer.ts` | `nsMember` 具名包装，engine 公开 API |
| 相对元素查询（`rel:` 选择器类语义） | `utils/queryRelElement.ts` | 基准元素 + 相对选择器查关联元素 |
| 插槽内容收集 | `utils/slot.ts` | x-slot 标记识别与内容收集（ADR-0056），overlay 基座 slot 上行转发消费 |
| 折叠把手视觉 | `utils/expandable-trigger.ts` | 圆形折叠把手的元素构建/滑轨/箭头矩阵唯一实现（x-expandable 与 x-drawer 共享） |
| 涟漪/旋转装饰动效 | `utils/decorate.ts` | 装饰动效家族内核（x-ripple / x-spin 共享）；新装饰指令才需要 |
| 指令选项/relaxed-json 解析 | `utils/relaxedToJson.ts` | 宽松 JSON → 标准 JSON（自研替代 214KB 依赖） |
| HTML 字符串 → Fragment | `utils/parseHtmlFragment.ts` | 空片段返回 null |
| 状态读写 | `utils/getVal.ts` / `setVal.ts` | 路径取值/赋值 |
| 响应式豁免 | `utils/markRaw.ts` / `utils/shallow.ts` | DOM 引用/大对象防深度响应式化 |
| scope 域键 | `utils/scopesKey.ts` | `$scopes` 框架保留键相关 |
| 视口断点 | `utils/resolveViewportBreakpoints.ts` / `viewportTiers.ts` | 响应式断点解析与档位 |

另有形态辅助：`directiveKind.ts`（指令 kind 判定）、`isSimpleStatePath.ts`（watch 双轨分流）、`isDataScript.ts`、`normalizeError.ts`、`createLoadingMask.ts`、`shellNames.ts`、`getVal/setVal`。做指令型/复合型插件时才会触及，组件型一般用不到。

## 使用纪律

1. **禁止静态 import engine 运行时符号**——`import type` 可以（编译期剥除），值导入一律经 `nsMember` / 具名包装，否则破坏「IIFE 产物运行时零依赖」契约
2. **先查后写（三层盘点）**——自实现任何逻辑前依次查：`src/components/` 既有组件（可经 `x-component:` 嵌套/继承复用）→ `src/directives/` 既有指令（可直接标注在新组件模板元素上）→ `src/utils/` 家族工具（import 复用）；复制粘贴 engine utils 属违规（ADR-0008 的教训：整文件复制是历史债务，新代码走引用）
3. **跨组件复用才上 `src/utils/`**——单组件私有逻辑留在组件目录内；`src/utils/` 的东西被多产物消费，API 稳定性要求更高
4. 外部依赖须已在 `packages/plugins/package.json`（现役：`@floating-ui/dom`、`flex-tools`、`@autospark/utils`）——新增依赖是架构决策，先与用户确认
