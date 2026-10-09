# AutoSpark（packages/engine）— 模块指南

> 简版导航。工程约定以[根 CLAUDE.md](../../CLAUDE.md) 为准，本文件与其冲突时以根为准。

## 概述

AutoSpark（原 AutoTemplate Engine，更名决策见 [ADR-0030](docs/adr/0030-rename-to-autospark.md)）是为 [AutoStore](https://github.com/zhangfisher/autostore) 量身打造的声明式模板渲染引擎：在宿主元素上书写 `x-*` / `@*` / `:*` 指令属性，把响应式状态绑定到 DOM（Alpine.js 风格，最小声明 + 细粒度响应式 patch）。

**核心价值**：最小声明，最大响应——用最少的 HTML 属性声明，实现完整的响应式 UI 更新。

autostore 已打包进产物并经入口全量转导出（ADR-0030）：`import { AutoSpark, AutoStore } from "autospark"` 单入口即用；IIFE 产物挂全局变量 `AutoSparkSpaces`。

## 常用命令

```bash
cd packages/engine
bun test                                # 全部测试
bun test src/__tests__/directives/x-text.test.ts   # 单个文件（__tests__ 按 engine/features/directives/utils 一层分组）
bun test -t "用例名称"                   # 按名称过滤
bun run build                           # tsup 三格式 + d.ts；成功后自动复制 IIFE 到 docs/public/autospark.js
```

## 测试纪律

**断言面禁止重型对象**（2026-10-09 messages.test.ts OOM 事故定约——该测试文件已随 ADR-0096 notifications 更名退役，教训普适保留）：禁止把 engine 实例、
manager、scope、happy-dom 元素等含循环引用的对象放进 `toBe` / `toEqual` 的比较面或作为
received——用例一旦失败，bun 生成 diff 时会深度序列化对象图，happy-dom 元素的
`parentNode` / `ownerDocument` 循环引用导致无限展开，内存指数膨胀直至 16GB 分配失败进程
崩溃（`memory allocation of 17179869184 bytes failed`），且失败信息随缓冲丢失、无从排查。
一律改用安全断言形态：

- 元素存在性 → `toBeTruthy()` / `toBeNull()`（失败面是标量）；
- 元素身份 → 比对 `data-*` 标记、class 或 id 字符串，而非元素引用；
- 实例/记录 → 只断言标量字段（`instance.data.xxx`、record 键），不比较实例本身；
- 事件/回调参数 → 断言 payload 的标量投影，不整体 `toEqual`。

排查此类崩溃时先看断言失败是否本应发生：OOM 几乎总是「断言失败 → diff 序列化爆炸」的
放大结果，先修失败断言，OOM 即消失。

## 文档索引

- [CONTEXT.md](CONTEXT.md) — 领域语言表（术语 + Avoid 列表 + 已废弃词条）
- [docs/adr/](docs/adr/) — ADR 0001~0096（0001~0029 正文保留更名前旧称，作为决策当时的记录）
- [docs/specs/](docs/specs/) — 关键机制规格（engine.patch / 插值 / x-html / x-on action 等）
