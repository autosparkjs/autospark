# ADR-0006: 自举基建上移 @autospark/utils 与闭包外壳立即执行模式

- 状态：已接受（Accepted）
- 日期：2026-10-25
- 关联：包内 ADR-0004（修订决策 2 外壳契约）、ADR-0003（包身份转型）；utils ADR-0001（包章程）；theme ADR-0007（库型插件首个实例）；engine ADR-0114（预加载队列）

## 背景

双路径自举基建 `installPlugin` 在包内收敛后，家族仍存在多份实现：router 包内联一份自实现队列逻辑（router ADR-0011 时代），theme 插件化（theme ADR-0007）将成为第三份——第三消费者入场是收敛时机。同时 theme 插件化揭示标准闭包外壳的整包排队语义与「库型插件」的引入即生效语义直接冲突，外壳契约需要第二个变体。

## 决策

### 决策 1：自举基建上移 @autospark/utils

- `installPlugin` + `PluginProbe` 类型迁至 `packages/utils/src/installPlugin/index.ts`（包导出总索引为 `packages/utils/src/index.ts`）；对 autospark 仅允许 type-only 依赖（`PluginBootstrap` 等，编译期剥除，产物零痕迹——家族零静态依赖纪律同构）；
- 包内 `runtime/bootstrap.ts` 退役，改引 `@autospark/utils`；router 内联副本同步替换，与 utils 版的行为差异（冻结守卫等）一次抹平对齐；
- `captureNamespace` / 运行时桥（bridge.ts）**不上移**：仅 plugins 家族消费（x-spark / notifications / button 的命名空间成员解析），theme 插件不读命名空间成员。

### 决策 2：installAutosparkPlugin 增外壳模式选项

- **缺省（不变）**：标准排队外壳——ADR-0004 决策 1/2 契约原样（`var run` 延迟分支 + 队列回放 + 冻结守卫）；
- **`shell: "immediate"`**：立即执行闭包——无整包排队，打包体加载即执行；双路径自举下沉到插件体源码级 `installPlugin`（其队列语义本就只入队 register 回调）；
- **适用边界**：包体对引擎零运行时引用 + 模块加载期副作用需「引入即生效」（库型插件）。不满足即用缺省外壳——外壳变体不是逃生舱，是身份声明；
- 漂移锁测试覆盖两种外壳形态（头尾字节契约、无 export/import 残留）；ADR-0004 决策 2 增修订标注。

## 备选方案

- **theme 直接 import 包内 runtime 基建**：否决——语义倒置（主题包依赖插件集合包），且 IIFE 自包含契约下跨包构建耦合脆弱。
- **外壳选项做成独立工厂函数（`installLibraryPlugin()` 等）**：否决——同一产物的外壳形态是构建配置而非工具分叉，工厂增殖徒增词汇；选项参数与 ADR-0004 决策 3「不引入第二套抽象」一致。
- **utils 基建放 engine 包**：否决——预加载路径引擎未加载，自举基建必须引擎无关；engine 包也不会为插件提供运行时依赖（家族纪律）。
- **router 副本后续单独迁移**：否决——共享包建立后旧副本即成漂移温床，趁第三个消费者入场一次收敛最便宜。

## 后果

- packages/utils 成为家族第四包，plugins / router / theme 三包对它新增 workspace 依赖（IIFE 产物构建时内联，产物仍自包含）。
- router 内联副本替换触及 router 包回归面；其 `plugin.bootstrap.test.ts` 行为断言应对齐后无感。
- 漂移锁测试扩展：`vite-closure.test.ts` 增 immediate 外壳形态用例（head/tail 字节、整包无延迟分支、加载即执行语义）。
