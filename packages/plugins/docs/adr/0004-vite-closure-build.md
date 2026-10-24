# ADR-0004: 构建载体 tsup → vite 插件闭包，产物纯闭包化与构建工具公开化

- 状态：已接受（Accepted）
- 日期：2026-10-24
- 关联：包内 ADR-0003（包身份转型，决策 4 已标注修订）、ADR-0001（通知插件化，PERSIST 暴露点修订）；engine ADR-0111（全局命名空间，类静态跳过 `default` 键）、ADR-0114（预加载队列双路径自举）

## 背景

ADR-0003 定谳产物 IIFE-only（脚本即契约）后，构建链仍由 tsup 承担：IIFE 产物经 `globalName` 挂全局名（`AutoSparkPlugins` / `AutoSparkNotifications` / `AutoSparkRipple` / `AutoSparkButton`），`NOTIFICATION_PERSIST` 等运行时常量依赖全局名取用（`AutoSparkNotifications.NOTIFICATION_PERSIST`）。该形态存在三层不一致：

1. **exports 双面残留**：入口源码仍保有具名导出（服务包内 TS 测试消费），产物侧靠 tsup IIFE 转换丢弃——「脚本即契约」与「模块即契约」两套语义并存于同一入口；
2. **全局名无消费语义**：全局名仅是取用常量的通道，插件挂载本身零消费（ADR-0111 机制下注册能力全部经命名空间落定）——为常量保留四个全局名是本末倒置；
3. **双路径自举未产物化**：ADR-0114 预加载队列的入队逻辑由各插件源码内联（`installPlugin`），第三方插件作者用裸 IIFE 手写时须自行复刻——双路径自举应是**产物外壳的固有职责**，不是插件体代码。

同时官方插件源码已确立「零静态值导入」纪律（运行时桥），但源码写法被迫用全局变量或运行时桥样板——`import { AutoSpark } from "autospark"` 这类与 ESM 生态同构的源码形态无法存在，创作体验与产物契约之间缺一层构建期翻译。

## 决策

### 决策 1：产物形态定谳——纯闭包插件闭包，全局名退役

产物为一段**插件闭包**（Plugin Closure）：

```js
(function (AutoSpark) {
    "use strict";
    var run = function (AutoSpark) { /* 打包体：源码 static import 已剥除，引用经闭包参数落定 */ };
    if (AutoSpark === undefined) {
        /* 插件先于引擎加载（ADR-0114）：入预加载队列，engine 构造 drain 时以命名空间回放 */
    } else {
        run(AutoSpark);
    }
})(globalThis.AutoSpark);
```

- **四个全局名（`AutoSparkPlugins` / `AutoSparkNotifications` / `AutoSparkRipple` / `AutoSparkButton`）全部退役**：闭包参数即命名空间（jQuery `$` 同构），无 `globalName` 挂载、无 exports 面；`var run` 内层函数是外壳判空的技术形态（实参 `globalThis.AutoSpark` 在未加载时为 `undefined`，判空须在外壳层而非打包体内）。
- **运行时常量改经引擎实例 API**：`NOTIFICATION_PERSIST` 迁移为 `NotificationManager` 实例字段，经 `$.ready` 挂载时序随 `engine.notifications` 一并可达——`engine.notifications.PERSIST.SESSION`；IIFE 全局名取用通道（`AutoSparkNotifications.NOTIFICATION_PERSIST`）随之退役。
- 产物命名 `autospark.<plugin>.js` 惯例不变（消费契约稳定）。

### 决策 2：双路径自举产物化——外壳自身承载 ADR-0114

队列分支为外壳固有职责，插件体零自举代码：

- **直路径**：引擎已加载（`AutoSpark !== undefined`）→ `run(AutoSpark)` 即刻执行；
- **队列路径**：`AutoSpark === undefined`（插件先于 `autospark.js` 加载）→ 插件体推入 `globalThis.__AUTOSPARK_PLUGINS__` 预加载队列（`??= []` 惰性建队），engine 构造 drain 时以 `(engine, autospark)` 回放——`run(ns)` 经第二参命名空间落定；
- **冻结队列守卫**：队列已消费（`Object.isFrozen`）且全局不可达是集成错误，`console.error` 响而不哑（与包内 `installPlugin` 纪律对齐），不静默丢弃。

包内官方插件的 `installPlugin` 双路径自举保留（probe 检查等包内基建仍需要），外壳队列分支服务**一切经本工具构建的插件**（含第三方）。

### 决策 3：源码创作糖——构建工具公开化为 `installAutosparkPlugin()`

vite 插件随包分发，子路径导出 `@autospark/plugins/vite`（`exports` map 中**唯一**的运行时模块面——与「产物 IIFE-only」不冲突，它是构建期工具不是运行时产物）。工厂函数命名 `installAutosparkPlugin()`（与 ADR-0111 机制词汇「插件安装」同构，不引入 `definePlugin` 等第二套插件抽象——ADR-0003 决策 5 沿用）。

三项职责：

1. **autospark 导入剥除**（`transform`，`enforce: "pre"`，TS 类型剥除前执行故须处理 `import type` 与行内 type 修饰符）：

   | 源码写法 | 产物落定 |
   | --- | --- |
   | `import { AutoSpark } from "autospark"` | 闭包参数直接绑定，零发射 |
   | `import { markRaw } from "autospark"`（其他具名） | `const { markRaw } = AutoSpark`（命名空间成员，与运行时桥同构） |
   | `import * as NS from "autospark"` / `import Default from "autospark"` | `const NS = AutoSpark` / `const Default = AutoSpark`（default 经类静态不挂载——engine IIFE 重排跳过 `default` 键，统一映射闭包参数） |
   | `import type { ... } from "autospark"` | 原样保留（TS 编译期剥除，产物零痕迹） |

   替换语句按原行数补齐空行（transform 返回 null map = 位置恒等映射），后续语句的 sourcemap 行坐标不漂移。

2. **exports 面剥除**（`generateBundle`，minify 之后执行）：`export {...}` 语句整体移除；残留其他 export 形态即构建期报错（闭包体内 export 是语法错误，静默放行会把故障推迟到浏览器控制台）；产物残留 autospark 导入同构建期拦截。

3. **闭包外壳包裹**（`generateBundle`）：按决策 1/2 定谳模板包裹；sourcemap 注释先行剥除再回接产物末行，包裹注入的前置行数（3 行）经 VLQ mappings 前置 `;` 修正行偏移（同 engine 产物后处理先例）。

### 决策 4：构建编排 tsup 退役——vite.config.ts 清单驱动编排

`vite.config.ts` 程序化编排替代 tsup 多配置数组。**（ADR-0004 后续修订，同日：编排自 `scripts/build.ts` 独立脚本收敛进 `vite.config.ts`——构建配置的惯例落点是配置文件本身；`bun run build` = `vite build` 一次完成。产物清单内联配置文件，插件入口统一 `src/plugins/<name>/index.ts`。）**序列：

1. 主构建 = 清单首项聚合产物（`autospark.plugins.js`，emptyOutDir 清 dist 防陈旧形态残留）；
2. closeBundle 编排：闭包工具本体 lib ESM 构建（`dist/vite/index.js` + `index.d.ts`，minify:false）→ 其余产物循环（每产物一次嵌套 vite build，注入 `installAutosparkPlugin()`）→ publishIife 收口（gzip 统计日志 + 复制 docs/public）。

**多入口边界**：rollup/rolldown 多入口会提取共享 chunk（notifications/ripple/button 共用 runtime 基建），破坏「一产物一自包含闭包」契约——**清单驱动、一产物一次构建是硬约束**，不是风格选择。demo 消费现场走独立态（`vite build --mode demo`：页面多入口 + 发布产物装配 dist-demo；dev 走即时闭包化中间件）。

`tsup.config.ts`、`scripts/esbuild-raw-assets.ts`、tsup devDependency 整体退役。dist 布局扁平化：`dist/autospark.<plugin>.js` + `dist/vite/`（工具本体）。旧 tsup 时代「模板资源经 esbuild raw 注入」通道随 vite 原生 `?raw` 导入自然消解。

## 备选方案

- **保留全局名（向后兼容取用常量）**：否决——闭包无 exports 面后全局名无挂载语义，为单一常量保留四个全局名是双语义并存；实例字段随 ready 挂载时序天然可达。
- **外壳不含队列分支（双路径留给插件体自举代码）**：否决——双路径自举是产物契约的重点（定谳原话），留插件体则每个手写 IIFE 的作者须复刻 ADR-0114 时序，第三方插件注册面漂移。
- **tsup 保留 + banner/footer 注入外壳**：否决——banner/footer 是纯文本拼接，导入剥除、exports 剥除报错、sourcemap 行偏移修正均无处安放；且 tsup 多配置对「一产物一闭包」的编排表达力不足。
- **`pluginClosure()` 命名**：否决（定谳）——`installAutosparkPlugin` 与引擎插件安装词汇同构。
- **`definePlugin` 统一插件抽象**：ADR-0003 决策 5 已否决，本工具只是构建期翻译器，不改变运行时注册词汇。

## 后果

- 四产物 gzip 尺寸与 tsup 时代持平（聚合 18.71 / notifications 15.14 / ripple 3.22 / button 1.86 kB），外壳增量可忽略；全局名赋值移除与队列分支注入相抵。
- `NOTIFICATION_PERSIST` 运行时暴露点迁移：docs 三处消费点（installation / notifications index / lifecycle demo）改写为 `engine.notifications.PERSIST.*`；源码级常量名不变（包内 TS 消费与测试不受影响）。
- `package.json` `exports` map 仅存 `./vite` 子路径；`module` 字段维持退役（ADR-0003 决策 4 修订标注：运行时产物无 exports 面，构建工具子路径除外）。
- 漂移锁测试 7 例（`vite-closure.test.ts`）：fixture 端到端 vite build 断言外壳头尾字节形态、无全局赋值回潮、无 export/import 残留、发射语句形态；运行时沙箱双路径冒烟（直注册 / 队列回放 / 冻结队列守卫）。rolldown 会将 `const` 降级 `var`、纯别名常量内联折叠——fixture 构建须 `treeshake: false`，断言正则放宽 const|var|let。
- 包内测试 68 例全绿（61 存量 + 7 新增）；构建产物 `dist/` 扁平布局，陈旧 ESM/CJS 产物随 rmSync 清除。
- 文档面：plugin 指南新增「插件闭包与构建工具」节（外壳契约 / 工具用法 / 剥除规则表 / 双加载时序）；ADR-0003 决策 4 添加修订标注。
