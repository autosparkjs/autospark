# ADR-0020: 输入框 input 与表单域骨架 Field

- 状态：已接受（Accepted，2026-11-12；2026-11-14 修订——决策 2/3/7 增补 `prefix`/`suffix` 具名装饰出口与主题令牌对齐口径、决策 2/后果改投影为公开文档组件，备选方案「三命名出口」条目同步消歧；**同日更名 `autospark.base-field` → `autospark.field`**——「BaseField」名不副实（它不是「基础字段」而是表单域的壳），本体名 `field` 与 CSS 类 `.asc-field-*` / 覆盖变量 `--asc-field-*` 天然对齐（视觉契约零改动），与 engine `x-field` 指令的消歧经 CONTEXT 词条承载；本 ADR 文件名保留旧称（编号稳定）；**2026-11-17 修订（ADR-0032）**——多行能力拆出独立 `autospark.textarea`，决策 4「textarea 是 type 变体」与备选方案「textarea 独立组件：否决」废止，input 不再内置 textarea 形态）
- 日期：2026-11-12（修订 2026-11-14；修订 2026-11-16——**装饰上提**：子组件 props 前后置装饰（input 的 `prefix`/`suffix` 文本|图标）经 template 覆盖段上提 field 的 prefix/suffix 出口（继承覆盖链中间层：消费方投影 > 子覆盖段 > field 空载体），覆盖段须重声明 `class="asc-field-*"` 注入类（ADR-0137 决策三-b 整段替换、不与父合并）；**功能动作件（清除/眼睛/计数）刻意留 body 默认段**——不进可被消费方投影顶掉的出口 fallback 位。轻/重装饰分层语义相应修订：两者同轨出口位、按覆盖链叠层（消费方重装饰接管时 props 装饰让位——显式接管语义），呈现序 `[slot:prefix] [控件] [动作件] [slot:suffix]`。首例 input，家族组件按需跟进；修订 2026-11-16（二）——**融合动作 actions**：props 驱动渲染段（非插槽出口），详见决策 3 表；修订 2026-11-18（三）——**移除 `showPassword` / `showCount`**（API 删减，破坏性）：input 不再支持密码可见切换与计数器——props / 眼睛钮与计数渲染段 / `onTogglePassword` / `passwordVisible`·`countText` 内部态 / `data-over` 超限染色通道 / 决策 8 的 `input-eye`·`input-eye-off` 图标注册**整链移除**；`maxlength` 保留（原生截断语义，不再兼计数分母）。textarea 拆分见 ADR-0032；移除的明文可见能力由独立组件 `autospark.password` 承接，见 ADR-0034）
- 关联：ADR-0018（组件库路线图——form 批与决策 7 表单基座策略的上位依据）、ADR-0017（八分类骨架——base 不投影）、ADR-0012（button 范式——样式基线）、ADR-0014（button-group 组值桥——值桥先例）、ADR-0016（state-button——表单桥分叉先例）、ADR-0034/0081（组件继承机制）、ADR-0134（autospark.base 抽象基组件与 abstract 根约束）、ADR-0129（主题三级回退链）

## 背景

P0 基础批的 form 首件（ADR-0018 决策 5）：input 是 form 域的范式定调件——它的取舍（原生 or 自绘、值通道、与 x-field 的边界）将被 checkbox / radio / switch（P0-F）与 select / input-number（P1）整族沿袭；同时启用 `base/` 基类目录（ADR-0018 决策 7：form 前瞻唯一例外，Field 随 input 首件即抽）。

需要钉死五件事：①与 engine x-field 指令的分工边界；②Field 的继承形态与 API 面；③原生增强路线的具体落法；④值通道协议（x-model 兼容）；⑤表单提交行为。

## 决策

### 决策 1：与 x-field 分工——指令建域、组件染色，不双轨

ADR-0018 决策 7 的落地边界：

- **x-form / x-field 指令承担**：字段声明（路径注册）、label / help 元数据、校验执行与错误文案、域布局、reset / dirty / getState；
- **组件承担**：控件本体（原生 input / textarea + 包裹）、前后置装饰、清除 / 密码切换 / 计数、状态色**呈现**；
- **桥接面 = `status` 属性**：x-field 容器形态的后代绑定 `status: $field.error ? "error" : ""` 把校验结果染进组件（值对象是绑定求值、指令注入的 `$field` 对其后代可见）；组件**不感知** x-field（不查询、不依赖），无 x-field 场景零成本可用；
- **排除项**：组件不做 label 渲染、不做校验、不渲染错误文案（防与指令双轨维护，ADR-0018 备选已否决双轨）。

### 决策 2：Field 是非抽象的真实模板骨架（继承链三层）

**`autospark.field` 注册为普通（非 abstract）组件**，模板 = 宿主级包裹层（`.asc-field` 布局基座）+ 单默认出口（`.asc-field-body`，`display: contents`）+ 两个具名**装饰出口** `prefix` / `suffix`（2026-11-14 修订：body 兄弟位，`display: contents` + 空 fallback——无内容时零布局，裸态控件组件继承亦无害）。继承链：

```
input / textarea / checkbox / radio / switch / select / input-number
        └─ x-define:inherit → autospark.field（骨架：状态色/焦点/禁用同步/盒饰选配）
                  └─ x-define:inherit → autospark.base（ADR-0134：主题档位六键物化）
```

**为什么不是 abstract 基类**（对照 autospark.base 的抽象形态）：engine 的 abstract 根约束（ADR-0134：声明 abstract 又声明 inherit 自相矛盾、拒绝注册）——abstract 的 Field 不能再继承 autospark.base，主题档位六键物化就在 form 族断链；而骨架恰好有真实 DOM 贡献（包裹层 + 出口），非抽象是机制与需求的自然交点。**产物内嵌**：input 等子组件产物以副作用导入内嵌 field 注册（`import "../../base/field/index"`）——按需加载场景一个 `autospark.input.js` 即自包含，无须单独引入基类产物（field 仍保留独立产物资格供未来需要，本批不登记）。

**子组件消费形态**：子模板的全部控件结构作为**默认段**替换骨架出口 fallback（ADR-0081 继承覆盖），子根属性并入骨架根（class 拼接：宿主恒得 `.asc-field` + 子自有类）；setup 按 [父, 子] 合并（子同名键胜）、hooks 父先子后串接、styles 父子拼接——三通道全自然生效。骨架自身不消费出口 fallback（空）——**2026-11-14 修订：转公开文档组件**（侧边栏「表单」组首条 + demo + 文档页 + 独立产物 `autospark.field.js`，ADR-0017 决策 4 例外修订）：装饰出口让直接实例化有独立消费面（默认出口装任意控件内容即得骨架能力），不再纯属内部基类。

### 决策 3：Field API 面（面向 P0-F / P1 稳定，宁薄勿胖）

| 面 | 内容 | 消费方 |
|---|---|---|
| props `status` | `"" \| error \| success \| warning` → 宿主 `data-status` 属性 → `--asc-field-tone` 中转变量派生（error=danger 等），焦点环/边框统一消费；error 态同步控件 `aria-invalid` | 全 form 族 |
| props `disabled` / `readonly` | 同步到 `[data-autospark-control]` 标记控件（`disabled` / `readOnly`）+ 宿主 `data-disabled` / `data-readonly` 反射（CSS 淡化/光标） | 全 form 族 |
| 焦点态追踪 | `focusin`/`focusout`（内部移动焦点不闪）→ 宿主 `data-focus` 属性 | 全 form 族 |
| 点击转发焦点 | 点击盒饰空白区/装饰（非控件非动作件）→ 控件 `focus()` | 盒饰类（input/select/input-number） |
| `.asc-field-box` 选配类 | input 类控件 chrome（边框/底色/高度/焦点环），消费 `--auto-input-*` 变量族 | 盒饰类；checkbox/radio/switch **不加**（裸态控件） |
| data-* 标记协议 | `data-autospark-control`（控件标记：同步目标/焦点受让者）、`data-autospark-action`（动作件标记：点击不转发焦点） | 子组件在控件/动作件上挂 |
| 尺寸档位 | 经继承链消费主题 `data-size` 通道（`--auto-input-height` / `--auto-input-padding` 档位联动），骨架不设尺寸属性 | 全 form 族 |
| 具名装饰出口 `prefix` / `suffix`（2026-11-14 修订；2026-11-15 切 template 载体） | body 兄弟位（DOM 序 `[slot:prefix] [body] [slot:suffix]` 固定），template 载体（ADR-0137）——**无内容整出口静默消失、零多余 DOM**，载体 class 经属性活注入落投影内容首根（次要色 `--auto-secondary-color` + `0.4em` 尾/首距 + 防收缩 `flex:none` 随类落根，镜像 props 装饰惯例）；多根装饰仅首根得注入类——装饰出口建议单根，多根后续节点消费方自理；与子组件 props 轻装饰（input 的 `prefix`/`suffix` 文本\|图标）**共存不互斥，插槽恒在 props 装饰外侧**（重装饰/轻装饰分层）；插槽内容点击转发焦点到控件（消费方放交互件须自标 `data-autospark-action` 自理）；disabled/readonly 不对插槽内容做专门处理（与 props 装饰对齐）。**载体注记（已闭环）**：2026-11-14 曾因「真浏览器不展开」缺陷警示暂用 span 载体，2026-11-15 查明系陈旧产物误报（ADR-0137 修订条目），产物路径复证后切回 template | 全 form 族（继承即得，含裸态控件——空出口零残留） |

| 融合动作 `actions`（2026-11-16 修订二） | props `actions`：**button props 数组**（项 = x-button-options 全集——**variant 缺省 `'secondary'`**（2026-11-17 补：渲染段 assign 打底，项显式 variant 胜——融合态默认弱化衬底与输入域主次分明）+ 自有键 `pos: "before" \| "after"`（缺省 after，前后分侧）、`name`（标识）、`value`（使用者数据原样透传，tags 同款））；**props 驱动渲染段非插槽出口**（数据→视图，非内容投影——不开出口、不可插槽覆盖，要自定义按钮就用 prefix/suffix 插槽自理）：`x-if` 空数组整段不渲染（零 DOM）+ 双 `x-for` 按 pos 过滤分侧，DOM 序 `[before actions][slot:prefix][body][slot:suffix][after actions]`（动作按钮最外层包壳）。**融合视觉复用 button-group 范式（ADR-0014 决策 2）**：同侧相邻按钮侧圆角清除 + 负 margin 边线复用（按钮与盒饰、按钮与按钮共享一条 `--asc-field-line` 边框线不叠双线）+ `align-items: stretch` 等高 + 首/尾钮外侧圆角匹配盒饰；接缝线染色联动——status 染整组含按钮线、hover/焦点环仅 box 段；按钮本体 variant/type 不约束（status 不染按钮本体）。**组合复用 autospark.button**（内嵌 `x-component:` 实例化，不自绘）——field 产物由此依赖 `autospark.button.js` 同页加载（聚合无碍；子组件产物连带）。**事件**：field 组包派发 `action-click`（冒泡，`detail = { index, name, value, item }`）+ 原生 click 照常冒泡（双通道）。**状态联动**：field `disabled` → 按钮同步禁用（项 disabled 合并）；readonly 不影响；按钮自动标 `data-autospark-action`（点击不转发焦点）。**实施约束**：数组 props 经**状态引用注入**（`:actions="myActions"`——引擎值对象字面量数组死环缺陷 HEAD 未修）；多行场景不支持（~~textarea 曾以上/下整行布局承载~~ 2026-11-17 取消：textarea 不支持 actions，渲染段 CSS 整段屏蔽 + 注入 warn——ADR-0032 修订） | 全 form 族（继承即得）；裸态控件不加 `.asc-field-box` 时融合线不生效（动作按钮是盒饰层的融合） |
**P0-F 消费指引（checkbox / radio / switch）**：`x-define:inherit="autospark.field"`；根 class 写 `asc-<name>`（**不加** `asc-field-box`——裸态无盒饰，状态色仍经 `--asc-field-tone` 消费可加自有细边框）；控件结构作默认段，原生控件挂 `data-autospark-control`（勾选态同步/禁用/焦点追踪全由骨架接管），自绘部分（如 switch 轨道）按 `data-autospark-action` 标记交互件。骨架 API 面**只增不改**：后续加 props/标记先在本 ADR 修订。

### 决策 4：原生增强路线——真实控件 + 包裹，不自绘

- 内层是**真实的** `<input>`（挂 `data-autospark-control`），外观裸化由骨架盒饰承载；不自绘输入面——键盘、IME、自动填充、移动端兼容、原生约束校验全保留。多行输入由独立组件 `autospark.textarea` 承接（ADR-0032，同一原生增强路线）；
- 宿主为包裹层元素（span）——组件根 span 化身后与宿主合并，原生语义在内层真身上（与 button/link 的「宿主替换为真身」变换动机不同：此处宿主无须原生语义）；
- 元素名快速写法 `<x-input>` 经 precompile DOM 变换折叠（静态属性→props 字面量含类型推断、`:key` 响应式项原样拼入、布尔裸属性归一 true、name/class/x-/@ 保留给宿主），ADR-0117 时序缺口同款止血；
- ~~**textarea 是 type 变体**（`type: "textarea"`），不独立成件……独立模板形态（antd Input.TextArea 分件）被否决——机制重复度高、注册面翻倍，props 一键切换的迁移成本更低。~~ **2026-11-17 修订（ADR-0032）：本段废止**——多行能力拆为独立组件 `autospark.textarea`（继承 field、值桥逻辑复制自持）。原判低估了「职责过载」与「运行时形态切换重建控件」的长期成本；`<x-input type="textarea">` 硬移除、静默降级为单行输入，`<x-textarea>` 归新组件独占。

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
- **主题令牌对齐口径**（2026-11-14 修订，逐属性对齐 `theme-token-baseline.md` 基准；**②已于 2026-11-17 修订见下**）：①padding 主键维持 `--auto-input-padding`（theme 侧规范消费键，`spacing.ts`/`size.ts` 与 `--auto-padding` 双双按档直引、同源同值，不作 `--auto-padding` 直接消费键）；②border 维持 `--auto-border-size` + `--auto-border-color` **拆分**消费（~~`--asc-field-line` 中转变量的状态重染色机制依赖拆分，组合令牌 `--auto-input-border` 无法只换色，不消费~~ **2026-11-17 修订：组合令牌打底 + border-color longhand 色通道**——`border: var(--auto-input-border, 拆分回退链)` 打底（theme input 域组合令牌，size+color 成对校准），随后 `border-color: var(--asc-field-line)` 以 longhand 覆盖 shorthand 色分量——hover/focus/status/disabled 只换色不动粗的状态重染色机制经 longhand 完整保留，theme 缺席回退拆分链观感不变）；③补 `font-family: var(--auto-font-family, inherit)`（字面级 `inherit`——无 theme 环境零扰动）；④三级回退链**末级字面值校准到基准表**（`#d9d9d9→#F0F0F0`、hover `#4098fc→#009AFF`、暗色边框 `#52525b→#606060` 等——theme 在场用户不受影响，无 theme 环境两套观感漂移归一）；⑤`status` 通道**不扩** `info`（YAGNI——status 是表单校验语义通道，`--auto-info-color` 无校验对应物不消费）；⑥装饰出口默认次要色经 `--auto-secondary-color`（暗色块同步校准值）。

### 决策 8：组件自有图标注册

~~`show-password` 的眼睛图标经全局图标表编程通道注册（`AutoSpark.icons.add`，ADR-0058）：名字空间化前缀 `input-eye` / `input-eye-off`（图标名不支持点号），同名静默覆盖（ADR-0058 决策 12）——使用者可后注册同名图标定制视觉；清除钮复用内置 `no`（X 造型）。注册随插件 mount（幂等），晚于引擎/早于引擎双路径均可。~~ **2026-11-18 修订三：随 `showPassword` 移除整条废弃**——`input-eye` / `input-eye-off` 注册与图标资产删除；清除钮仍复用内置 `no`。

## 备选方案

- **Field 为 abstract 基类（纯行为+CSS 约定，子组件全权持模板）**：否决——engine abstract 根约束（ADR-0134）下不能再继承 autospark.base，主题档位六键物化在 form 族断链；骨架亦有真实 DOM 贡献，非抽象是自然形态。
- **骨架出口开三个命名出口（prefix/control/suffix 固定序）**：否决——对 checkbox/switch 等裸态控件的结构挤压（**control 具名化**即顺序被钉死、label 归属尴尬）；单默认出口给子组件全权结构自由，共享面收敛到状态通道与 CSS 约定（宁薄勿胖）。**2026-11-14 消歧**：本条否决的仅是 control 具名化形态；修订后的 `prefix`/`suffix` 是**装饰出口**——默认出口仍是结构全权所有者，装饰出口空 fallback + `display: contents` 零布局，不挤压裸态控件结构，两案正交。
- ~~**textarea 独立组件（autospark.textarea）**：否决——见决策 4；机制全形态共用，独立件是注册面翻倍无增量。~~ **2026-11-17 修订（ADR-0032）：本条目废止**——改判独立成件，理由与取舍见 ADR-0032。
- **自绘输入面（contenteditable / 受控重渲）**：否决——可访问性与 IME 成本高（ADR-0018 决策 7 已定原生增强路线）。
- **值通道走 props 双向（value + @input 自定义协议）**：否决——绕开 x-model 生态（修饰符/schema/get-set 管道全失）；el.value 劫持让 x-model 原生语义直通。
- **表单提交走 hidden input 代理（state-button 同款）**：否决——控件即真身，代理多余（见决策 6）。
- **自有 size props（xs..xl 档位属性）**：否决——与主题 `data-size` 通道双轨（ADR-0134 六键已定档位归主题）；`--auto-input-height` 档位联动已覆盖。

## 后果

- `autospark.input` 交付：注册名 `autospark.input`，产物 `autospark.input.js`（内嵌 field 注册，自包含）；测试 `src/__tests__/components/form/input-plugin.test.ts`（Field 通道经 input 实例化覆盖，无独立 field 测试文件；多行能力测试归 `textarea-plugin.test.ts`，ADR-0032）。`autospark.textarea`（2026-11-17，ADR-0032）同构：产物 `autospark.textarea.js`（内嵌 field），测试 `textarea-plugin.test.ts`。
- `base/` 目录转入现役（首个产物 field）；~~文档侧不投影（无文档页/侧边栏条目，ADR-0017 决策 4）~~ **2026-11-14 修订：转公开投影**（侧边栏「表单」组 + `docs/zh/components/form/field.md` + demo 双页 `basic.html`/`slots.html` + 独立产物登记 + readme/demo 树惯例同步）。
- P0-F（checkbox/radio/switch）按决策 3 消费指引继承骨架；骨架 API 面**只增不改**，变更须修订本 ADR。
- 对象 props（prefix/suffix 的 `{ icon }`）须状态引用注入（引擎值对象字面量缺陷修复在途，text 同款备注）。
- **已知边界**：①~~运行时切换 `type` 进出 textarea 形态会重建控件（值经 lastValue 缓存回填，焦点不保）~~（2026-11-17 修订：多行能力拆件后本边界消失，ADR-0032；input 仅剩单行形态）；②原生约束校验（required/pattern）的 `:user-invalid` 自动染色未做（status 是唯一染色通道，需要时后续演进）；③~~append/prepend 组合槽（按钮内嵌）未做~~（2026-11-14 修订：`prefix`/`suffix` 装饰出口可承载任意内容含按钮，内嵌按钮场景即插槽用法，剩余差距仅 props 形态无组合语义）；④~~password 形态的浏览器原生「显示密码」控件的样式协调未处理~~（2026-11-18：由 ADR-0034 的 `autospark.password` 经 `::-ms-reveal` / `::-ms-clear` 抑制收口）。
- **theme 侧缺陷（本批发现的跨包问题，非本组件文件可修）**：`packages/theme/src/vars/size.ts` 的档位块引用 `--x-input-height-${size}` 标尺，但该标尺在全 theme 无定义（derived 层 `--auto-input-height` 实为 `var(--auto-line-height)`）——档位容器上 `--auto-input-height` 失效落组件兜底。本组件以**随字号自适应兜底**（`calc(var(--auto-font-size) * 2.57)`）防御，档位高度仍随字号缩放；theme 补标尺后 `--auto-input-height` 即恢复权威。
- 遗留：值对象内字面量对象/数组 props 的引擎死循环缺陷（`_propsEqual` 引用比较）修复后，本文档的「状态引用注入」提示可撤。
