# 静态主题包维度烘焙与 themes.json 清单

ADR-0004 的静态主题包只承诺「颜色契约」：指纹 9 个颜色字段命中即跳过注入。但主题还有 6 个纯运行时维度——`dark` / `colorized`（模式）与 `size` / `spacing` / `shadow` / `radius`（规模）——它们经属性通道生效（setter 写属性 → 属性选择器块覆盖基块），**不改变 `toStyles()` 输出的任何字节**（原名 `generate()`，ADR-0006 归并更名，下同）。因此给生成器加 `--dark`、`--size` 等标志若只做「参数透传」是零效果操作：同主题色不同维度参数的逐字节产物完全相同。本决策让这些标志获得意义：**维度烘焙（bake defaults）**——把维度值以守卫块形式纯追加在 `toStyles()` 输出之后，使零 JS 首帧即呈现该形态，同时不破坏 ADR-0004 的同源性与匹配契约。

## 守卫块机制

```
:host:not([data-size]),:root:not([data-size]){ --x-font-size-large: ...; /* sizeVars.large 原样 */ }
```

- **选择器即语义**：`:not([data-X])` 只在属性缺席时命中——正是「零 JS、首帧、用户未表达任何选择」的窗口；特异性 (0,2,0)（模式守卫双向排除链达 (0,4,0)）压过基块 (0,1,0)，烘焙值成为默认外观。
- **纯追加、零侵入**：守卫块追加在 `toStyles()` 输出之后，既有生成逻辑一行不改；未指定任何维度的产物与 ADR-0004 时代逐字节一致（守卫块整体缺省）。
- **幂等接管**：运行时首访采纳指纹维度后把属性物化到 `<html>`（见下），守卫的 `:not()` 立即失效，标准档位/模式覆盖块以同值接管——守卫块与覆盖块声明同一组变量同一组值，交接无闪烁、无双真值源。
- **变量表逐字节复用** `vars/*`（`!important` 原样保留——守卫靠 `:not()` 失效而非被压过，important 无害且免去二次加工）。模式守卫排除正/反双向属性（dark 守卫 `:not([dark]):not([data-dark]):not([data-light])`），为运行时显式切回亮/灰留出口；dark+colorized 组合守卫复用 `darkColorizedColorVars`（对应运行时 `_comboSelector` 块）。
- **唯一加工：dark 守卫剔除 `darkShadowVars` 的自举键 `--auto-shadow`**。它与 size 守卫交叠（`sizeVars` 按档驱动 `--auto-shadow`），同窗口内 dark 守卫特异性 (0,4,0) > size 守卫 (0,2,0)，会把烘焙档位钉回 medium。剔除后引用链在根上自洽（`--x-shadow-*` 由本守卫覆盖为暗配方，`--auto-shadow` 由基块/size 守卫按档声明）；原自举键服务的非根 `data-dark` 元素由标准 `[dark]` 块负责，与守卫无关。

## 指纹 v2：15 字段

```
v2|<hex>|<gap>|<cap>|<primary>|<success>|<warning>|<danger>|<info>|<dark0/1>|<colorized0/1>|<size>|<spacing>|<shadow>|<radius>
```

- **前 9 个颜色字段仍是全部匹配契约**（全有或全无）；后 6 个维度字段是「首访默认值声明」，**不参与失配判定**——水合态与包声明维度不一致是常态（用户选择 > 包默认），若纳入匹配，回访用户每次访问都会触发告警与回退注入，告警通道沦为噪音。
- **首访采纳**：root scope 指纹命中且无任何 localStorage 水合参数时（`!hydrated`），`parseStaticDimensions` 解析出维度默认，`Object.assign` 进生效 options（仅与库默认有差异时），经 `connect()` 尾部既有 `_persistParams` 自然落盘——此后访问即是普通水合态，维度经 `options` 全链路（含持久化 key）一致。
- **显式化配套**：烘焙维度下「无属性」的语义已从库默认变为烘焙值（如烘焙 `size: large` 时无 `data-size` 即 large），故「回退 medium / 切亮 / 退灰」必须显式写属性。setter 与 `_syncPersistedAttrs` 经三个辅助（`_applySizeAttr` / `_applyDarkAttr` / `_applyColorizedAttr`）感知烘焙态：烘焙 `dark` 的包上 `dark = false` 写 `data-light` 而非移除 `dark`；烘焙非 medium 档上设回 medium 写 `data-size="medium"` 而非移除属性；`data-uncolored` 同理。属性物化后守卫失效、标准块接管，机制闭环。
- `STATIC_SCHEMA` 1 → 2（字段数变化即输出变更，遵守 ADR-0004 的 bump 纪律）；旧 v1 静态包字段数非法 → 安全失配回退动态注入，功能正确仅性能退化。

## --all 改为 themes.json 清单驱动

`--all` 不再遍历预设表，而是读 `src/themes.json`（此前无人引用的 manifest，`presetThemes` 是其手工 TS 镜像）的纯函数：**key 即产物名**（`dist/<key>.css`），条目 schema 为 `{ color, title?, dark?, colorized?, size?, spacing?, shadow?, radius?, seedLightnessGap?, chromaBoostCap?, primary?, success?, warning?, danger?, info? }`（`color` 映射 `themeColor`，可引用预设名）。条目字段白名单校验——未知字段、非法档位、类型错误一律报错（清单笔误不应静默产出错误包）。`--all` 与单包标志同现时**静默忽略**单包标志：批量产物必须是清单的纯函数，同一清单任何时候产出同样产物。构建链维持 `build:themes` 在 tsup 之后跑 `--all`（tsup `clean: true` 会清 dist）。

## Considered Options

- **基块替换**（烘焙 dark 即把基块换成暗色变量、亮块换宿主）：实现上成立，但要在生成侧对变量表做方向性改写（去 `!important`、亮/暗块宿主互换），与运行时生成逻辑分叉——同源性是 ADR-0004 的根基，分叉即否决。守卫块方案（用户提出）纯追加、零改动既有逻辑，同源性最强，采纳。
- **维度字段纳入指纹匹配**：见上——回访用户维度选择几乎必然与包默认不同，每次访问告警 + 全量回退注入，告警失去意义；且维度不一致时静态包的颜色三块仍然完全可用，回退是纯浪费。
- **指纹维持 v1 + 维度默认另存第二个自定义属性**：两条声明两次解析，且「颜色契约 / 维度声明」本是一份元数据的两半，拆开只增加不同步风险；指纹本就是私有格式，扩字段 + schema bump 是既有纪律内的演化。
- **烘焙后不允许回退库默认**（烘焙 large 的页面无法回到 medium）：区域尺寸语义（局部元素 `data-size`）本就需要「显式 medium 档」存在（medium 在变量表中就是完整一档），显式化配套补齐的只是根域写法，成本一次性的心智约定（「无属性 = 烘焙值」），换来零 JS 首帧形态正确，值得。
- **`--all` 时单包标志报错而非忽略**：构建链固定命令 `build:themes` 与本地手动 `--all` 共用同一路径，严格报错会把「顺手加了个标志看效果」变成构建失败；清单纯函数约束已由「忽略」满足，报错不增加正确性只增加摩擦。
- **守卫块服务局部作用域**：与 ADR-0004 同一边界——静态包只服务 root，局部作用域永远运行时注入。

## Consequences

- **接入心智变化**：烘焙维度的页面上，「不写任何属性」等于烘焙值；要回退库默认必须显式写 `data-light` / `data-uncolored` / `data-size="medium"` 等。这必须在 readme 与主题维度文档中明示。
- 烘焙包的零 JS 首帧暗色含 `color-scheme: dark`，原生控件（滚动条/表单）首帧即暗——这是目标效果而非副作用。
- 指纹命中 + 首访采纳后，属性物化与参数落盘在同一 connect 内完成；`disconnect()` 复位 `_staticDims`，重连重新校验。
- themes.json 现文件条目不变（仅 `{color, title}`）即全部产物维度缺省、与 ADR-0004 产物逐字节等价（仅指纹 v1→v2）；宿主后续在清单添加变体条目（如 `blue-dark: { color: "blue", dark: true }`）即得新包，key 必须同时是合法文件名。
- golden 快照与同源断言（产物 = 指纹块 + `toStyles()` + 守卫块）继续兜底输出漂移；守卫块追加位置固定在尾部并带 `/* baked defaults (ADR-0005) */` 注释锚点。
- 维度字段不做枚举校验（`parseStaticDimensions` 原样透传档位串）：非法档位经 setter 属性通道落不到任何档位块，视觉退化为 medium，与「正确性优先」一致。
