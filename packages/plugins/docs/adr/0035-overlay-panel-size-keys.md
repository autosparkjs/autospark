# ADR-0035: overlay 家族面板尺寸四键（width / height / maxWidth / maxHeight；drawer 除外）

- 状态：已接受（Accepted，2026-11-28）
- 日期：2026-11-28
- 关联：ADR-0052（覆盖物体系修订版——config 合并链与「其余自由键原样保留」的开放面）、ADR-0060（popover 悬浮形态——`fit` 键与本文的轴级互斥来源）、ADR-0062（shell 机制——写入点在面板 shell 根）、ADR-0063（drawer——`size` 短轴键的校验先例与本决策的排除对象）、ADR-0064（resize 会话记忆——重开语义的对照分野）、ADR-0124（overlay 骨架——body 区 `overflow:auto` 既有事实）、ADR-0128（overlay 家族外移 plugins——本文落档位置）

## 背景

overlay 家族面板此前**没有任何尺寸声明通道**：dialog / popover 面板 shrink-wrap 内容（`.autospark-overlay` flex column，高度由内容撑），drawer 有 `size` 但那是**方向中立的短轴**键（左右抽屉的宽 / 上下抽屉的高），由贴边定位器语义决定，不是通用尺寸键。用户要「弹出面板宽高可控」（popover 场景发起），审视后裁决为**家族级配置面**而非 popover 专有——同一写入点、同一校验，dialog 与命令式两形态（dialog / popover shell）免费获得，成本几乎为零。

三个必须显式裁决的张力：

1. **fit 冲突**：popover 的 `fit: true` 在 floating-ui 定位回调里**持续**按最终 placement 主向写一轴 inline 并**清空另一轴**——同声明 `width` + `fit` 时声明值会被首次定位静默冲掉；
2. **drawer 语义不合**：drawer 的尺寸由贴边定位器全管（长轴 = 锚边长 / 全屏展开、短轴 = `size`），width/height 两键对其无意义且会与 inset 对拉打架；
3. **dialog resize 语义**：dialog 支持四角拖拽，拖出尺寸与声明值的**重开优先级**须定（家族内 drawer 有「记忆优先」先例，ADR-0064 决策八）。

## 决策

### 1. API 面（OverlayConfig 新增四键）

| 键 | 值域 | 缺省 | 说明 |
|---|---|---|---|
| `width` / `height` | `number`（px，须 > 0）或 CSS 长度串（`'40%'` / `'20rem'`，纯数字串按 px） | 不写 inline（保持 auto / shrink-wrap） | 面板固定尺寸 |
| `maxWidth` / `maxHeight` | 同上 | 同上 | 内容少时 shrink-wrap、多时封顶 |

- **通道**：声明式 `x-{dialog|popover}-options` 四成员（静态整包 relaxed-json + 成员属性表达式，ADR-0007 惯例）；命令式 `getOverlay` options / `open()` options 经既有合并链（`内置默认 < getOverlay < open`）天然获得。**宿主裸属性形态否决**——overlay 宿主是触发器/声明点非组件化身，宿主属性不进面板；
- **校验**：非法值（非正数 / 空串归缺省除外）warn + 忽略——对齐 drawer `size` 的 warn 哲学（失效可发现）；
- **max-\* 与固定值并存**：直接透传浏览器，CSS 天然裁决（`max-height` < `height` 时 max 赢），引擎不自作聪明合并。

### 2. 家族范围：drawer 除外

- 生效面：**dialog / popover / 命令式两形态**（`shell: true`→dialog、`false`→popover）；
- **drawer 除外**：`DrawerDirective._resolveConfig` 剥离四键 + warn（「drawer 尺寸走 size 选项」）。理由：贴边定位下长轴恒铺满（锚边长/视口）、短轴自有 `size` 通道，width/height 无落点；drawer 形态与宿主环境宽高匹配，固定面板尺寸与其语义相反。命令式通道**无 drawer 形态**（`resolveCommandShell` 只分派两形态），声明式拦截即全覆盖。

### 3. 写入点与应用时机

- **写入点**：面板 shell 根（`[data-overlay]`）inline `style`——收敛在 `OverlayInstance` 打开构建期统一写入（声明式与命令式共享此路径，这是「家族通用」的结构前提；落在指令基座则命令式拿不到）；
- **时机**：打开时一次写入、重开生效（对齐 `padding` / `trigger`「现读、不热应用」惯例）；显式声明的轴**缺省不写 inline**——不引入 `--autospark-overlay-width` 专用变量（恒写 `var(--x, auto)` 的 inline 反而压掉用户样式表自定义，弊大于利；要变量通道的用户可传 `width: 'var(--my-w)'`）；
- **视口保护**：不做额外钳制——溢出保护归既有 shift / flip，用户可用百分比自适应（fixed 面板的 `%` 基准是视口）；
- **keepalive 已知边界**：挂起实例恢复（display 切换）不重估四键——面板 DOM inline 存活，与家族全部 config 的恢复语义一致（`at` / `title` 同样不重估）。

### 4. fit 轴级互斥、显式优先

声明了 `width` / `height` 的轴，`fit` **不写也不清**——fit 只接管未显式声明的轴。与 `at` 成员级覆盖「用户写出的生效」同哲学。实现上 fit 的写入分支（floating 定位回调 `fitToEl`）须感知显式声明轴。`max-*` 不与 fit 冲突（fit 只写/清 width/height），并存时 CSS 天然裁决。

### 5. dialog resize 交互：重开回声明值

- 拖拽会话中：`ResizeSession` 即时覆盖 inline（用户的手在上，自然优先）；
- **重开：回声明值**——新面板重写四键，声明是持久真相源。**与 drawer 的 ADR-0064 决策八（拖出尺寸会话记忆、重开沿用、优先于声明 `size`）显式分野**：那是 drawer 短轴的形态语义；dialog 现状 `_resizeMem` 只写不读（记忆恢复从未在 dialog 实现），本决策不为其补记忆——若未来记忆需求真实出现，以显式开关（如 `resize.remember`）单独立项，不做隐式默认压制声明值的隐晦行为。

### 6. 滚动语义：body 区既有 overflow 承接

显式 `height` / `maxHeight` 封顶生效时，内容超出由 **`.autospark-overlay-body` 滚动**（`flex:1 1 auto; min-height:0; overflow:auto` 为 ADR-0124 骨架既有事实）——header / footer 固定不滚。**两个内置 shell 均需补中间层高度传导**（实施修正：`autospark.dialog` / `autospark.popover` 结构同构——shell 根 → content 包裹层（`.autospark-dialog-content` / `.autospark-popover-content`，原无 height/flex 约束）→ overlay 化身根，传导链为 shell 根与包裹层补 `display:flex; flex-direction:column; flex:1 1 auto; min-height:0`、化身根补 `flex:1 1 auto`；无声明时容器高度 auto、flex 子项按内容撑开，与 block 等价）。溢出不能设在面板根——箭头载体是面板根的 absolute 子元素，`overflow` 会裁掉伸出面板的半段箭头（两 shell 均含箭头载体）。

### 7. loading 占位钳制

面板打开瞬间的 x-loading 骨架边界有 inline `min-width: 240px / min-height: 120px`（`--autospark-overlay-loading-min-*` 变量可调）。四键齐参与钳制：声明值小于占位下限时，占位 min 改写为 `min(var(--autospark-overlay-loading-min-width, 240px), 声明值)` 形态——防小尺寸声明在 loading 期被骨架溢出（视觉跳动）。

## 后果

- `OverlayConfig` 收窄两个自由键语义（原 `[key: string]: any` 开放面中 `width` / `height` 从「消费者自定义」变为家族语义键）——key 冲突面：外部本就以这两键作自定义配置的消费者会受影响，属可接受收窄；
- popover shell 的中间层 flex 化（决策 6）触碰默认布局行为——须以全量测试 + 真浏览器几何断言护航（margin 折叠消失等 flex 副作用）；
- drawer 的排除是**形态语义排除**而非能力缺失——未来若 drawer 需要显式短轴别名（如 `width` 对左右抽屉），须另立决策修订，勿在实现处静默放行。
