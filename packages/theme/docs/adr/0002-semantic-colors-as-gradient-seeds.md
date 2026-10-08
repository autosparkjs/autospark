# 语义色作为梯度种子，暗色提亮引用浅档

语义色（primary/success/warning/danger/info）此前是固定 hex，暗色下经 `color-mix(in srgb, ..., transparent 60%)` 混透明"变暗"——实测对面板底仅 1.6~~2.2:1（WCAG 图形线 3:1 都不达），方向本身错误：深底上语义色应**提亮**。现改为：语义色值作为梯度种子，经 `generateThemeColorVars` 生成 10 阶标尺 `--x-color-{name}-0..9`（0 浅 9 深，与 palette.less 色系同向）；light **直引种子原值**（与固定 hex 时代零行为差异），dark 提亮引用第 3 档（实测 4.67~~10.93:1）。

`var()` 引用等不可解析为颜色字面量的种子豁免梯度化、直接注入原值且无 dark 覆盖——primary 默认值 `var(--auto-theme-color)` 即此情形，其暗色适配由 theme 标尺提档（theme-5→theme-6）承担。

## Considered Options

- **保留固定 hex + 混透明变暗**（旧方案）：实现最省，但深底上不可读，且混透明对"变暗"的控制粗糙。
- **默认值改引 palette.less 同系浅档**（如 success→`green-3`）：仅对默认值生效，用户自定义 hex 时无同系可引，双轨心智。
- **`color-mix(white)` 提亮**：高饱和色混白偏粉、灰色发灰，色相漂移不可控。
- **light/dark 都引用梯度档位**：实测梯度第 5 档 ≠ 种子色（success `#22c55e`→`#00BA3E` 肉眼可辨），light 视觉会漂移，违背"light 行为不变"的范围承诺。

## Consequences

- light 默认值视觉零变化（直引种子）；dark 语义色全线达 AA。
- `--x-color-{name}-0..9` 标尺成为公共资产，消费者可引用同系深浅档做自定义层次。
- 语义色的含义从"一个颜色值"变为"一个梯度种子"——自定义语义色时应传品牌基准色而非已调浅的颜色。
- 种子有效性判定依赖 `toRGBString` 的解析能力（hex/rgb()/命名色），`var()` 引用永远走豁免通道。
