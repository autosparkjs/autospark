# ADR-0020: 输入框 input 与表单域骨架 BaseField

- 状态：已接受（Accepted，2026-11-12）
- 日期：2026-11-12
- 关联：ADR-0018（组件库路线图——form 批与决策 7 表单基座策略的上位依据）、ADR-0017（八分类骨架——base 不投影）、ADR-0012（button 范式——样式基线）、ADR-0014（button-group 组值桥——值桥先例）、ADR-0016（state-button——表单桥分叉先例）、ADR-0034/0081（组件继承机制）、ADR-0134（autospark.base 抽象基组件与 abstract 根约束）、ADR-0129（主题三级回退链）

## 背景

P0 基础批的 form 首件（ADR-0018 决策 5）：input 是 form 域的范式定调件——它的取舍（原生 or 自绘、值通道、与 x-field 的边界）将被 checkbox / radio / switch（P0-F）与 select / input-number（P1）整族沿袭；同时启用 `base/` 基类目录（ADR-0018 决策 7：form 前瞻唯一例外，BaseField 随 input 首件即抽）。

需要钉死五件事：①与 engine x-field 指令的分工边界；②BaseField 的继承形态与 API 面；③原生增强路线的具体落法；④值通道协议（x-model 兼容）；⑤表单提交行为。

## 决策

### 决策 1：与 x-field 分工——指令建域、组件染色，不双轨

ADR-0018 决策 7 的落地边界：

- **x-form / x-field 指令承担**：字段声明（路径注册）、label / help 元数据、校验执行与错误文案、域布局、reset / dirty / getState；
- **组件承担**：控件本体（原生 input / textarea + 包裹）、前后置装饰、清除 / 密码切换 / 计数、状态色**呈现**；
- **桥接面 = `status` 属性**：x-field 容器形态的后代绑定 `status: $field.error ? "error" : ""` 把校验结果染进组件（值对象是绑定求值、指令注入的 `$field` 对其后代可见）；组件**不感知** x-field（不查询、不依赖），无 x-field 场景零成本可用；
- **排除项**：组件不做 label 渲染、不做校验、不渲染错误文案（防与指令双轨维护，ADR-0018 备选已否决双轨）。

### 决策 2：BaseField 是非抽象的真实模板骨架（继承链三层）

**`autospark.base-field` 注册为普通（非 abstract）组件**，模板 = 宿主级包裹层（`.asc-field` 布局基座）+ 单默认出口（`.asc-field-body`，`display: contents`）。继承链：

```
input / checkbox / radio / switch / select / input-number
        └─ x-define:inherit → autospark.base-field（骨架：状态色/焦点/禁用同步/盒饰选配）
                  └─ x-define:inherit → autospark.base（ADR-0134：主题档位六键物化）
```

**为什么不是 abstract 基类**（对照 autospark.base 的抽象形态）：engine 的 abstract 根约束（ADR-0134：声明 abstract 又声明 inherit 自相矛盾、拒绝注册）——abstract 的 BaseField 不能再继承 autospark.base，主题档位六键物化就在 form 族断链；而骨架恰好有真实 DOM 贡献（包裹层 + 出口），非抽象是机制与需求的自然交点。**产物内嵌**：input 等子组件产物以副作用导入内嵌 base-field 注册（`import "../../base/base-field/index"`）——按需加载场景一个 `autospark.input.js` 即自包含，无须单独引入基类产物（base-field 仍保留独立产物资格供未来需要，本批不登记）。

**子组件消费形态**：子模板的全部控件结构作为**默认段**替换骨架出口 fallback（ADR-0081 继承覆盖），子根属性并入骨架根（class 拼接：宿主恒得 `.asc-field` + 子自有类）；setup 按 [父, 子] 合并（子同名键胜）、hooks 父先子后串接、styles 父子拼接——三通道全自然生效。骨架自身不消费出口 fallback（空），直接实例化仅得空壳（内部基类，非用户直接消费，不进侧边栏/文档投影，ADR-0017 决策 4）。

### 决策 3：BaseField API 面（面向 P0-F / P1 稳定，宁薄勿胖）

| 面 | 内容 | 消费方 |
|---|---|---|
| props `status` | `"" \| error \| success \| warning` → 宿主 `data-status` 属性 → `--asc-field-tone` 中转变量派生（error=danger 等），焦点环/边框统一消费；error 态同步控件 `aria-invalid` | 全 form 族 |
| props `disabled` / `readonly` | 同步到 `[data-autospark-control]` 标记控件（`disabled` / `readOnly`）+ 宿主 `data-disabled` / `data-readonly` 反射（CSS 淡化/光标） | 全 form 族 |
| 焦点态追踪 | `focusin`/`focusout`（内部移动焦点不闪）→ 宿主 `data-focus` 属性 | 全 form 族 |
| 点击转发焦点 | 点击盒饰空白区/装饰（非控件非动作件）→ 控件 `focus()` | 盒饰类（input/select/input-number） |
| `.asc-field-box` 选配类 | input 类控件 chrome（边框/底色/高度/焦点环），消费 `--auto-input-*` 变量族 | 盒饰类；checkbox/radio/switch **不加**（裸态控件） |
| data-* 标记协议 | `data-autospark-control`（控件标记：同步目标/焦点受让者）、`data-autospark-action`（动作件标记：点击不转发焦点） | 子组件在控件/动作件上挂 |
| 尺寸档位 | 经继承链消费主题 `data-size` 通道（`--auto-input-height` / `--auto-input-padding` 档位联动），骨架不设尺寸属性 | 全 form 族 |

**P0-F 消费指引（checkbox / radio / switch）**：`x-define:inherit="autospark.base-field"`；根 class 写 `asc-<name>`（**不加** `asc-field-box`——裸态无盒饰，状态色仍经 `--asc-field-tone` 消费可加自有细边框）；控件结构作默认段，原生控件挂 `data-autospark-control`（勾选态同步/禁用/焦点追踪全由骨架接管），自绘部分（如 switch 轨道）按 `data-autospark-action` 标记交互件。骨架 API 面**只增不改**：后续加 props/标记先在本 ADR 修订。

### 决策 4：原生增强路线——真实控件 + 包裹，不自绘

- 内层是**真实的** `<input>` / `<textarea>`（挂 `data-autospark-control`），外观裸化由骨架盒饰承载；不自绘输入面——键盘、IME、自动填充、移动端兼容、原生约束校验全保留；
- 宿主为包裹层元素（span）——组件根 span 化身后与宿主合并，原生语义在内层真身上（与 button/link 的「宿主替换为真身」变换动机不同：此处宿主无须原生语义）；
- 元素名快速写法 `<x-input>` / `<x-textarea>` 经 precompile DOM 变换折叠（静态属性→props 字面量含类型推断、`:key` 响应式项原样拼入、布尔裸属性归一 true、name/class/x-/@ 保留给宿主），ADR-0117 时序缺口同款止血；
- **textarea 是 type 变体**（`type: "textarea"`），不独立成件：值桥 / 计数 / 清除 / 前后置全形态共用一套逻辑，仅内层元素切换（`x-if` 分叉）+ 盒饰高度放开（宿主 `data-form="textarea"` 属性通道）。独立模板形态（antd Input.TextArea 分件）被否决——机制重复度高、注册面翻倍，props 一键切换的迁移成本更低。

### 决策 5：值桥协议（x-model 兼容）

**宿主 `el.value` 劫持 ↔ 内层原生控件**（button-group 组值桥先例的更薄版——原生控件自带 value 语义）：

- **劫持安装**：mounted 期 `Object.defineProperty(this.el, "value", ...)`，getter 读内层控件、setter 写内层控件并同步计数；劫持前快照 expando（x-model 编译期可能已写初值）；
- **DOM→state**：内层原生 `input` 事件**自然冒泡**经过宿主，x-model 的宿主监听直接命中、读劫持 `el.value` 回写——**无须手动派发**（这是与 button-group 的关键差异：组值无原生事件须手动派发，input 自带）；
- **state→DOM**：x-model 读回调写 `el.value` → 劫持 setter → 内层控件；
- **修饰符**：`.trim` / `.number` / `.boolean` 与 x-model 全部语义照常可用（x-model 读的是劫持后的字符串值）；
- **`value` props 边界**：非受控初值 / 单向同步值（无 x-model 时外部状态变化经 watch 写控件，等值防回环）；**受控/非受控边界**：x-model 在场即为受控真相，value props 仅作初值——两者并写时 x-model 的初值优先（劫持快照序：expando > props.value）。

### 决策 6：表单提交——原生直提交

宿主 `name` 透传到内层原生控件（mounted 同步），原生表单提交 / `FormData` / Enter 提交语义直接生效。**与 state-button 的 hidden input 桥分叉**（ADR-0016）：state-button 宿主是 button（非表单控件），须代理载体；input 的控件即真身，代理是多余的。P0-F 的 checkbox/radio 同理预期走原生直提交（内层真 input[type=checkbox]）。

### 决策 7：样式基线（ADR-0018 决策 6 继承）

- **三级回退链**（ADR-0129）全量：`--auto-input-*` 变量族（bgcolor/border/placeholder/height/padding/radius）+ 状态色语义变量；骨架覆盖通道 `--asc-field-*`、组件覆盖通道 `--asc-input-*`；暗色兜底变体成对写 `[dark]` / `[data-dark]`；
- **尺寸档位 = 主题通道**：不设自有 `size` props（button/text 同范式）——`--auto-input-height` / `--auto-input-padding` 随 `data-size` 档位联动；
- **状态色正交**：`status` 染 `--asc-field-tone`（焦点环+边框），与盒饰 chrome（`asc-field-box`）正交——裸态控件只消费 tone 不吃 chrome；
- **无内置文案、不接 i18n**（ADR-0018 决策 1）：占位/计数/前后置全使用者传入。

### 决策 8：组件自有图标注册

`show-password` 的眼睛图标经全局图标表编程通道注册（`AutoSpark.icons.add`，ADR-0058）：名字空间化前缀 `input-eye` / `input-eye-off`（图标名不支持点号），同名静默覆盖（ADR-0058 决策 12）——使用者可后注册同名图标定制视觉；清除钮复用内置 `no`（X 造型）。注册随插件 mount（幂等），晚于引擎/早于引擎双路径均可。

## 备选方案

- **BaseField 为 abstract 基类（纯行为+CSS 约定，子组件全权持模板）**：否决——engine abstract 根约束（ADR-0134）下不能再继承 autospark.base，主题档位六键物化在 form 族断链；骨架亦有真实 DOM 贡献，非抽象是自然形态。
- **骨架出口开三个命名出口（prefix/control/suffix 固定序）**：否决——对 checkbox/switch 等裸态控件的结构挤压（顺序被钉死、label 归属尴尬）；单默认出口给子组件全权结构自由，共享面收敛到状态通道与 CSS 约定（宁薄勿胖）。
- **textarea 独立组件（autospark.textarea）**：否决——见决策 4；机制全形态共用，独立件是注册面翻倍无增量。
- **自绘输入面（contenteditable / 受控重渲）**：否决——可访问性与 IME 成本高（ADR-0018 决策 7 已定原生增强路线）。
- **值通道走 props 双向（value + @input 自定义协议）**：否决——绕开 x-model 生态（修饰符/schema/get-set 管道全失）；el.value 劫持让 x-model 原生语义直通。
- **表单提交走 hidden input 代理（state-button 同款）**：否决——控件即真身，代理多余（见决策 6）。
- **自有 size props（xs..xl 档位属性）**：否决——与主题 `data-size` 通道双轨（ADR-0134 六键已定档位归主题）；`--auto-input-height` 档位联动已覆盖。

## 后果

- `autospark.input` 交付：注册名 `autospark.input`，产物 `autospark.input.js`（内嵌 base-field 注册，自包含）；测试 `src/__tests__/components/form/input-plugin.test.ts`（26 用例，BaseField 通道经 input 实例化覆盖，无独立 base-field 测试文件）。
- `base/` 目录转入现役（首个产物 base-field）；文档侧不投影（无文档页/侧边栏条目，ADR-0017 决策 4）。
- P0-F（checkbox/radio/switch）按决策 3 消费指引继承骨架；骨架 API 面**只增不改**，变更须修订本 ADR。
- 对象 props（prefix/suffix 的 `{ icon }`）须状态引用注入（引擎值对象字面量缺陷修复在途，text 同款备注）。
- **已知边界**：①运行时切换 `type` 进出 textarea 形态会重建控件（值经 lastValue 缓存回填，焦点不保）；②原生约束校验（required/pattern）的 `:user-invalid` 自动染色未做（status 是唯一染色通道，需要时后续演进）；③append/prepend 组合槽（按钮内嵌）未做，P1 按需；④password 形态的浏览器原生「显示密码」控件的样式协调未处理。
- **theme 侧缺陷（本批发现的跨包问题，非本组件文件可修）**：`packages/theme/src/vars/size.ts` 的档位块引用 `--x-input-height-${size}` 标尺，但该标尺在全 theme 无定义（derived 层 `--auto-input-height` 实为 `var(--auto-line-height)`）——档位容器上 `--auto-input-height` 失效落组件兜底。本组件以**随字号自适应兜底**（`calc(var(--auto-font-size) * 2.57)`）防御，档位高度仍随字号缩放；theme 补标尺后 `--auto-input-height` 即恢复权威。
- 遗留：值对象内字面量对象/数组 props 的引擎死循环缺陷（`_propsEqual` 引用比较）修复后，本文档的「状态引用注入」提示可撤。
