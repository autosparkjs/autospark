# ADR-0009: src 按插件形态四区重组

- 状态：已接受（Accepted，2026-10-31）
- 日期：2026-10-31
- 关联：修订 ADR-0003 决策 3（目录契约——种类目录否决的边界澄清）；ADR-0008（外移迁移的目录落位与决策 2 utils 单源升级）；ADR-0004（vite 闭包构建——entry 路径随附，产物契约零变化）

## 背景

ADR-0008 将迁入七个产物（tree / layout / version / overlay / virtual / paging / tooltip），`src/plugins/` 平铺将达 12 个插件——纯指令、纯组件、能力扩展、复合模块混居一层，定位与评审都要在目录名里猜形态。经 grilling 六问收敛（用户终稿：utils/decorate.ts 单文件裁量），定下按**插件形态四区**的源码组织。

## 决策

### 决策 1：四区 + utils 的五区结构，一插件一文件夹不变

```
src/
├── directives/    # 指令型插件（x-ripple、x-spin；#5 迁入 tree/layout/version/overlay）
├── components/    # 组件型插件（button；#5 通道就绪）
├── features/      # 能力扩展型插件（#5 迁入 virtual/paging/tooltip）
├── modules/       # 复合型插件（notifications）
├── utils/         # 跨域复用纯函数（见决策 3）
├── runtime/       # 包级自举设施（bridge），原位不动
└── index.ts       # 聚合入口原位，import 路径随附
```

> **修订注记（2026-10-31 同日）**：`runtime/bridge.ts` 随用户裁量拆入 utils——
> `utils/namespace.ts`（captureNamespace / resolveNamespace / nsMember 三件套共享 captured
> 状态，强内聚单文件，decorate.ts 同款先例）+ `getOverlayContainer.ts` / `markRaw.ts` /
> `shallow.ts` / `scopesKey.ts`（nsMember 具名包装，一函数一文件）。`runtime/` 目录消失，
> 上述结构图中该行作废；双路径捕获与响而不哑纪律全部平移，零语义变化。

**一插件一文件夹自包含**（模板 + 逻辑 + 自举，一目录 = 一产物入口）原样继承 ADR-0003——四区只是顶层归置，插件边界仍是功能单元。

### 决策 2：对 ADR-0003 决策 3「种类目录否决」的边界澄清

ADR-0003 决策 3 曾否决 `src/components/` + `src/directives/` 种类目录，否决理由是「按种类切分破坏自包含交付」——**否决的是种类散装**（插件文件按种类拆散到不同目录）。本决策不推翻该否决：插件文件夹仍是自包含交付单元，种类只承载**顶层目录的归置**（区=分类抽屉，抽屉内的插件盒不可再拆）。混合形态 = 「形态归置 × 插件自包含」，与 0003 的功能单元原则兼容；0003 决策 3 原文加修订注记指向本册。

### 决策 3：utils 纪律与 decorate 先例（联动 ADR-0008 决策 2 升级）

- **收录判据**：跨插件（跨域）复用的**无状态纯函数**；插件内聚函数留插件文件夹；类型随函数同文件，跨函数共享类型允许 `types.ts`。
- **一函数一文件**；**例外先例**：强内聚家族模块可收敛单文件——`utils/decorate.ts`（原 `src/plugins/decorate/`，x-ripple/x-spin 的 DecorateStrategy 契约 + 归一函数族 + 几何函数，拆散即破坏家族聚合）。
- **ADR-0008 决策 2 随附升级**：待迁指令的 engine utils 复制品（sanitize / floating / injectStylesheet / relaxedToJson 等）由「跨产物源码各自复制」升级为「**包内 utils 源码单源共享、产物内联不变**」——源码不再多份漂移，产物自包含契约（ADR-0003）不动。

### 决策 4：测试镜像与发布面零变化

- `src/__tests__/` 镜像四区（`directives/` / `components/` / `features/` / `modules/`；`format.ts` / `helpers.ts` / `setup.ts` 测试辅助留 `__tests__` 根）——顺带消解原 `features/` 目录名与能力扩展区的撞名。
- **发布面零变化**：产物清单（`autospark.<域>.js` × N + 聚合 `autospark.plugins.js`）、命名、无 exports map、IIFE-only——一字不变；本次仅 vite entry 路径与源码 import 路径随附。`src/plugins/x-spark` 空残留目录清理。

## 备选方案

- **维持 src/plugins/ 平铺**：否决——12 插件混居无形态定位，评审与新人上手成本随迁移倍增。
- **纯种类散装**（0003 已否决形态）：否决——破坏插件自包含交付。
- **decorate 拆散进 utils 一函数一文件**：否决——策略族聚合性被破坏；亦否决 `directives/decorate/` 域内共享目录方案（用户裁量：utils 单文件承载，域共享层不设）。
- **__tests__ 保持 features/ 命名**：否决——与四区的 features/ 撞名易混。

## 后果

- vite.config.ts 五条 entry 路径与头注、`src/index.ts` 聚合 imports、x-ripple/x-spin 的 decorate 引用、`__tests__` 七个测试文件的 import 路径随附更新；
- 重组为纯移动（git rename 检测背书内容零修改），验证 = 测试全绿 + 构建产物清单一致；
- ADR-0003 决策 3 加修订注记、ADR-0008 目录表述与决策 2 随附修订；docs 插件指南页的 GitHub 深链同步；
- plugins CONTEXT.md 增「插件四分类」词条；任务 #5 七产物迁移直接按本结构落位。
