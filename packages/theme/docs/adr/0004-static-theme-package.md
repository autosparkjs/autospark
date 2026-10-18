# 构建期静态主题包与运行时指纹识别

> 维度扩展（dark/colorized/size/spacing/shadow/radius 烘焙、指纹 v2 15 字段、`--all` 改读 themes.json）见 ADR-0005；本文的指纹契约与产物形态描述以 v1 为基准，v2 仅尾部追加 6 个不参与匹配的维度字段。运行时 `download()` 同源导出（root 产物即本契约的合规静态包）、`generate()` 归并更名为 `toStyles()` 见 ADR-0006。

重开 ADR-0003 评估并否决过的「构建期预生成静态主题层」。驱动变化是诉求不同：ADR-0003 解决的是**回访用户**的 FOUC（localStorage 快照已覆盖）；本决策解决的是**零 JS 也能正确首帧**——SSR/弱网/CDN 托管 CSS、或 JS 尚未下载执行时，首帧即拿到完整主题变量（基量 + 主题标尺亮/暗块 + 语义色），而非消灭「插入 style 标签」的 DOM 开销（那本身是微秒级）。两者覆盖不同访问场景，**共存而非替代**：静态包管首访 + 编译期已知品牌色，快照管回访 + 运行时任意换色。

机制：`scripts/generate-theme.ts`（bun 直跑，与 check-dark-contrast 同惯例）构造一个不 connect 的 root `ThemeScope`，直接取 `toStyles()`（base → colors → semantics，顺序与运行时注入一致；原名 `generate()`，ADR-0006 归并更名）前置一条指纹规则块落盘。产物 `dist/<theme>.css` 随包发布，经既有 `"./themes/*.css" → "./dist/*.css"` 导出消费。运行时 root scope 在 `connect()` 水合生效参数后，读取 `:host,:root` 上的 `--x-theme-static` 指纹：完全一致则三块运行时注入全跳过、静态 `<link>` 即永久样式来源、并清掉可能画错首帧的旧样式快照；指纹存在但不一致（静态文件过期、标尺算法随包升级变更、水合出的用户选择异色）→ `console.warn` 一次并回退全量动态注入，后注入胜出盖住静态文件，正确性优先于性能。

## 指纹契约

```
:host,:root{--x-theme-static:v1|#1677ff|1.7|1.25|var(--auto-theme-color)|#22c55e|#f59e0b|#ef4444|#71717a;}
```

9 个 `|` 分隔字段：`schema版本 | 生效hex | seedLightnessGap | chromaBoostCap | primary | success | warning | danger | info`。

- **schema 版本是源码手动常量 `STATIC_SCHEMA`，不是包版本号**——文档/patch 发布不应让全部静态包失配；变量生成输出（vars/*、标尺算法、指纹字段）变更时必须手动 +1。blue golden 快照测试（`__snapshots__/static-theme-blue.css`）在输出漂移时先红，兜底遗忘 bump。
- 两端各自归一：预设名解析为小写 hex、颜色字面量经 `toRGBString` 归一、非字面量（如 primary 默认 `var(--auto-theme-color)`）在**生成端**原样写入。
- **浏览器实测约束（易错点）**：getComputedStyle 读回自定义属性时，其值中的 `var()` 已在计算值期被**替换**为解析值（文件里写 `var(--auto-theme-color)`，读回 `#009AFF`），且被引用变量的作者大小写被保留（标尺 hex 是大写）。故运行时端比对前必须：① 在指纹同一载体元素上把期望选项的 var() 种子做同阶段解析（`resolveFingerprintOptions`，查不到则保留原文 → 安全失配）；② hex 字段大小写不敏感比对。仅支持单引用 `var(--name)` 形态；带 fallback 等复杂表达式解析不到时按失配处理（回退注入，正确性无损）。
- 比对是**全有或全无**：不做逐块部分匹配，半定制状态直接回退全量注入。
- 指纹读取只有一行薄 DOM 封装（`readStaticFingerprint`），匹配逻辑是纯函数（`matchStaticFingerprint`），无 DOM 测试基建即可完整覆盖。

## Considered Options

- **维持 ADR-0003 现状，不做静态包**：首访与「JS 不可用/被推迟」场景首帧必然无主题变量，本决策的核心诉求无法满足。
- **裸约定无指纹**（页面声明 `data-x-theme="blue"` 即跳过注入）：静态文件过期或包升级改变标尺输出后静默失配，且快照机制的「启动无条件重写自愈」对静态外链文件不成立——不可接受。
- **指纹带内容 hash**：任一端空格/注释差异都会失配，生成器与运行时必须共享序列化器，脆弱性高于收益；schema 版本 + 参数指纹已覆盖「输出变了」与「参数变了」两类失配。
- **拆成公共 base.css + 每色标尺文件（两个 link）**：实测单份全量产物约 28 KiB（未压缩），多色各自重复一份基量在多包共存时才有边际成本，而宿主几乎只引一个色；v1 不值得多一个请求与一层接入心智。
- **静态化局部作用域**：scope id 动态、选择器自定义，需每作用域一个文件且选择器编译期固化，复杂度跳一个量级。静态包只服务 root（`:host,:root`），局部作用域永远运行时注入。
- **运行时换色后逆向卸载动态块以「回归」静态路径**：动态块刷新后自然消失、首帧路径自然回归纯静态，会话内逆向卸载零收益且引入状态机复杂度，v1 不做。
- **发布消费者 bin 支持任意自定义色**：v1 仓库内脚本 + 构建期批量预生成 12 预设已接通导出；自定义品牌色场景用同一脚本（`bun scripts/generate-theme.ts <hex> -o ... --gap/--cap/语义色`）在宿主仓库自行产出。随包 bin 留待 v2。

## Consequences

- **head 书写顺序成为接入契约**：静态 `<link>` 必须在恢复片段**之前**。用户运行时切换出的异色由恢复片段首帧还原（同特异性后定义胜出），manager 水合后指纹失配 → 动态注入接管；只有水合参数恰好等于静态包时才真跳过注入。
- 指纹命中时删除 `{storageKey}-styles` 样式快照（不删 scope 参数——其值本就与静态配置一致），避免下次访问恢复片段画出旧快照色；运行时随后换色仍会正常重写快照，自愈链路不变。
- `ThemeScope.isConnected()` 把静态满足标记纳入判据（命中时页面没有任何本 scope 的 `<style>` 标签，旧的按 id 查询会漏判）；`disconnect()` 复位标记，重连重新校验。
- 构建顺序约束：`build:themes` 必须在 tsup 之后（tsup `clean: true` 会清空 dist）。产物落 dist 根目录，`files: ["dist"]` 与 exports 均无需变更。
- `STATIC_SCHEMA` bump 是破坏性发布动作：旧静态包将全部告警并回退动态注入（功能正确，仅性能退化到运行时现状），须在发版说明提示宿主重新生成。
- 历史静态标尺文件（`src/themes/*.less` → `dist/themes/`，方向不统一、变量名为旧 `--x-color-primary-*` 体系）与本决策无关，v1 不删不动，后续单独清理；文档中称其为「历史静态标尺文件」以免与「静态主题包」混淆。
- v1 产物不压缩（可读性优先，28 KiB 未压缩，传输层 gzip/brotli 由宿主 CDN 承担）；测试不引入 jsdom/happy-dom，DOM 行为由纯函数测试 + examples 手动验证覆盖。
