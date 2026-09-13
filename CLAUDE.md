# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 语言约定

代码注释、文档、ADR、测试描述均为**中文**；新增代码的注释与周边保持一致（中文）。engine 源码使用 4 空格缩进。

## 仓库结构

Bun monorepo（`bun@1.4.0`），两个工作区：

- `packages/engine`（包名 `autospark`）— **AutoSpark Engine**：声明式模板渲染引擎，通过宿主元素上的 `x-*` / `@*` / `:*` 指令属性把 [AutoStore](https://github.com/zhangfisher/autostore) 响应式状态绑定到 DOM（Alpine.js 风格，最小声明 + 细粒度响应式 patch）。
- `docs/` — VitePress 中文文档站；`docs/demos/` 下是纯 HTML 可运行示例，依赖 engine 构建产物 `docs/public/autospark.js`（IIFE，全局变量 `AutoSparkSpaces`）。

⚠️ 依赖与发行形态（ADR-0030）：`autostore`、`really-relaxed-json` 为 devDependencies（registry 安装），构建时经 `noExternal` **打包进三格式产物**；入口 `export * from "autostore"` **全量转导出**——消费者 `import { AutoSpark, AutoStore } from "autospark"` 单包即用。类型解析依赖 `fastevent`/`flex-tools`/`type-fest` 三个小包（dependencies，随包自动安装）。

## 常用命令

```bash
# 安装依赖（根目录）
bun install

# engine 测试（在 packages/engine 下）
cd packages/engine
bun test                                # 全部测试
bun test src/__tests__/x-text.test.ts   # 单个文件
bun test -t "用例名称"                   # 按名称过滤

# engine 构建（tsup，esm/cjs/iife 三格式；成功后自动复制 IIFE 到 docs/public/autospark.js）
cd packages/engine && bun run build

# 文档站
bun run dev                             # 根目录启动（等价 cd docs && bun run dev）
                                        # 开发期 /autospark/autospark.js 由 esbuild watch 从 engine 源码现场构建，
                                        # 改 packages/engine 代码保存后自动整页刷新生效，无需手动刷新/构建（ADR-0030）
cd docs && bun run build                # 构建（生产用 tsup 产物 docs/public/autospark.js）

# Lint / 格式化（oxc 工具链；VS Code 保存时自动 formatOnSave，见 .vscode/settings.json）
oxlint
oxfmt
```

测试环境：`packages/engine/bunfig.toml` preload `src/__tests__/setup.ts`，注册 happy-dom 全局 DOM（bun test 无浏览器 DOM），并注入自定义 matcher `toEqualHTML`（两侧格式化为缩进层次后做结构等价比较）。

## 架构（packages/engine）

核心数据流：外部传入的 AutoStore（或裸状态自建 store）→ 编译期把模板树重建为运行树（剥除指令属性）→ 各指令在编译期用 `scope.watch` 订阅自己的状态路径 → 状态变更经 `UpdateScheduler` 微任务合并去重 → 各指令的 updateFn 重新求值并**只 patch 受影响节点**（不重建子树，保留焦点/滚动等运行态）。

### 运行时主干

- `src/engine.ts` — `AutoSpark` 门面类。构造入参 `(el, store | 裸状态, options)`：AutoStore 实例为借用（destroy 不销毁），裸状态为自建并拥有（ADR-0009）。生命周期 `compile → stop/start → destroy`。`engine.patch(selector, updater)` 支持运行时局部模板替换（ADR-0002），updater 返回值四态决定重建语义。
- `src/compile/compiler.ts` — 深度优先重建模板树：浅克隆元素、剥指令属性、建 scope、跑指令编译期生命周期；`{{}}` 文本/属性插值 desugar 为绑定（`compile/mustache.ts`，ADR-0004）。
- `src/scope.ts` — `AutoSparkScope`：单元素上多指令的生命周期/订阅容器。`watch` 双轨：纯标识符路径走精准订阅，含运算符/函数调用的表达式走 with 求值（`isSimpleStatePath` 分流）。
- `src/scheduler.ts` — `UpdateScheduler`：watcher 回调只 `schedule`（稳定闭包引用，Set 天然去重），microtask flush 时 updateFn **重新求值**取累积结果。
- `src/actions/` — `ActionManager`（`manager.ts`）：action 管理单元——全局表注册/Proxy 包装 + `<script type="autospark/actions">` 模板提取；`buildAction.ts` 双通道广播包装（ADR-0031 script type 命名空间化）。
- `src/directives/manager.ts` — `DirectiveManager`：指令名 → 指令类注册表；`presetDirectives`（`presets/index.ts`）为**显式映射**（勿依赖类名/`Function.name`）。

### 指令体系（src/directives/）

- 基类 `AutoSparkDirectiveBase` 的**静态**字段决定行为：`kind`（`Compile`/`Runtime`/`Hybrid`，ADR-0001）、`priority`（x-for=100 → x-if=80 → bind/on=50 → text/html=0）、`singleton`（同名去重）、`ownsChildren(info)`（结构指令接管子树编译，如 x-for / eager x-if / x-slot）。
- **双执行通道**：scope 通道（Compile/Hybrid：编译期 created/compile/destroy，binding 支持相对表达式）与 observer 通道（Runtime/Hybrid：编译器致盲、属性保留在结果 DOM，由共享 `RuntimeObserverDispatcher` 的单一 MutationObserver 触发 mounted/unmounted/attrChanged，仅绝对路径）。Hybrid 双通道职责正交。
- 类级 `static initialize(engine)` / `static dispose(engine)`：engine 就绪/销毁时对每个注册类调用一次（建 observer、注入全局样式等）。
- 配置体系（ADR-0007）：修饰符（`.xxx`）在解析期并入**指令选项**（`x-{name}-options`，relaxed-json）；读取走「指令选项 → 宿主选项（`x-options`）」**回退**，缺失才回退、不做合并。
- 新增指令：继承基类 → 在 `presets/index.ts` 的 `presetDirectives` 注册。

### 关键域约定（改动前必读对应 ADR）

- `store.state._scopes` 是**框架保留键**（x-data 私有响应式域容器）；x-data 只 `Object.assign` 进 `_scopes[id]`，**永不整体替换容器**（ADR-0029 mount 三形态）。
- action 三入口（构造 `options.actions`、`engine.actions` Proxy 赋值、`<script type="autospark/actions">`）统一经 `src/actions/`（ActionManager）包装，自动广播 `actions/<name>/*` 生命周期信号（x-loading 消费）；script type 已命名空间化（ADR-0031，旧写法 warn 剪枝）。
- 组件（ADR-0022）：`x-component` 编译期剪枝、冻结快照挂最近祖先 `scope.components`；`x-use` 实例化；`getComponent` 沿 scope 链就近查找 + `options.components` 全局兜底。
- 冲突防护：`engine.patch` 拒绝落入动态区域（x-for / eager x-if / x-slot 祖先链内）。

## 决策文档（改机制前先读）

- `packages/engine/docs/adr/` — ADR 0001~0036，源码注释大量以「ADR-XXXX 决策 N」形式回链。
- `packages/engine/CONTEXT.md` — 领域语言表（含每个术语的 Avoid 列表与已废弃词条，如 x-block → x-component、`.keep` → `.keepalive`）。
- `packages/engine/docs/specs/` — 关键机制规格（engine-patch / 插值 / x-html / x-on action）。
- `packages/engine/CLAUDE.md` 为模块级简版导航，工程约定以本文件为准。
