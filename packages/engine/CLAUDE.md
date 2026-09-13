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
bun test src/__tests__/x-text.test.ts   # 单个文件
bun test -t "用例名称"                   # 按名称过滤
bun run build                           # tsup 三格式 + d.ts；成功后自动复制 IIFE 到 docs/public/autospark.js
```

## 文档索引

- [CONTEXT.md](CONTEXT.md) — 领域语言表（术语 + Avoid 列表 + 已废弃词条）
- [docs/adr/](docs/adr/) — ADR 0001~0036（0001~0029 正文保留更名前旧称，作为决策当时的记录）
- [docs/specs/](docs/specs/) — 关键机制规格（engine.patch / 插值 / x-html / x-on action 等）
