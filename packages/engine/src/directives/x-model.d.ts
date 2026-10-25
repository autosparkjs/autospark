import { AutoSparkDirectiveBase } from "../features/directive/base";
import { type AutoSparkScope } from "../engine/scope";
import type { AutoDirectiveInfo } from "../features/directive/types";
import type { AutoSpark } from "../engine/engine";
/**
 * 控件类别（ControlKind）：x-model 内部对表单控件的分型，决定读源/写目标/事件语义。
 *
 * - `text`：`<input>`（除 checkbox/radio 外所有 type）+ `<textarea>`，读写 `el.value`；
 * - `checkbox`：`<input type="checkbox">`，读写 `el.checked`（布尔），ADR-0023 决策 2；
 * - `radio`：`<input type="radio">`，读 `el.checked = (state === el.value)`，写 `state = el.value`；
 * - `select`：`<select>`，单选读写 `el.value`、多选读写 selectedOptions（`string[]`），
 *   默认事件 `change`（ADR-0026 决策 6），选项子树见 choices 三源（ADR-0026 决策 1）。
 */
export type ControlKind = "text" | "checkbox" | "radio" | "select";
/**
 * x-model：输入控件与状态的双向绑定（**Hybrid 指令**）。
 *
 * 双通道职责正交（ADR-0018）：
 * - **scope 通道**（`created`/`compile`）：`scope.watch` 订阅读方向（state→DOM），支持相对表达式
 *   （x-for item / x-data 局部变量），watcher 进 `scope._updates` 随 `scope.refresh` 重跑；
 * - **observer 通道**（`mounted`/`unmounted`）：挂/移 `input`(或 `change`)事件，承接写方向（DOM→state）。
 *
 * ## 控件范围
 * - text-like：`<input>`（除 checkbox/radio 外所有 type）+ `<textarea>`，统一读写 `el.value`。
 * - checkbox：`<input type="checkbox">`，读写 `el.checked`（布尔），ADR-0023 决策 2。
 * - radio：`<input type="radio">`，读 `el.checked = (state === el.value)`，写 `state = el.value`。
 * - select：`<select>`，单选 `string` / 多选（`.multiple`）`string[]`，默认事件 `change`；
 *   选项子树三级优先：静态 `<option>` > `x-model-options.choices` > schema.choices（响应式
 *   全量重建），`group` 选项按键分组到 `<optgroup>`。详见 ADR-0026。
 *
 * ## 读写方向（术语钉死）
 * - **getter（get）= state→DOM 变换**：把状态值加工成 DOM 显示值（如 `value.split('.')[0]`）。
 * - **setter（set）= DOM→state 变换**：把输入值拆解写回一个或多个状态字段（如 `user.first=$value`）。
 *
 * ## get/set 配置
 * 仅经 `x-model-options="{get:'...',set:'...'}"` 声明（**砍快捷属性** x-model-get/x-model-set，
 * 不扩展 getDirectives 的 `-options` 后缀白名单）。
 *
 * **值形态：字符串 only**。relaxed-json 不支持函数字面量——`{get:(v)=>...}` 会被解析成字符串且求值错乱、
 * 语句块箭头函数直接解析失败（详见 ADR-0018）。**箭头函数字面量禁用**，给两条正道：
 * - **表达式**：固定形参 `value`(get)/`$value`(set)，`new Function(...,"with(scope){...}")`，
 *   `scope = binding.getContext()`（localData+data+state 聚合视图）。
 * - **action 名**：`ACTION_RE` 分派（`splitIp(1)` 等）。**当前值自动作首参**，括号内为追加参数；
 *   `this` = `AutoSparkActionContext`（el/data/scope/store/globalState/engine/$options + value/$value）。
 *
 * ## 绑定值语义
 * - **简单路径**（`order.price`）：无 get/set 时读 `scope.watch(path)`、写 `binding.writeThrough` 透传（快路径，ADR-0075 读写对称——域字段落域、其余落根）。
 * - **表达式**（`user.first+','+user.last`）：读求值；写**必须**有 set。
 * - **计算属性**（`order.total`）：天然无 set → 只读降级。
 * - **无 setter 的表达式/computed**：`logger.warn`（一次）+ 只读（state→DOM 仍工作，DOM→state 静默），
 *   **不抛错、不魔法猜左值**。
 *
 * ## 事件与修饰符
 * 默认监听 `input`（select 为 `change`，ADR-0026 决策 6）；修饰符：
 * - `.change` → 改监听 `change`（失焦触发；select 上与默认同效，幂等）；
 * - `.trim` → 写前 `trim()`；
 * - `.number` → 写前 `Number()`，`NaN` 回退原字符串（不破坏）。
 * - `.boolean` → 写前严格集转换：`"true"→true`、`"false"→false`、`""→false`，其余保留原值
 *   （不破坏）。作用于读 `el.value` 的控件（text-like + radio）；checkbox 写方向恒布尔，冗余空转。
 * - `.multiple` → select 多选（等价 `multiple` 属性；显式声明优先于 schema.multiple，ADR-0026 决策 2）。
 * 写回管道顺序：`el.value` →(.trim)→ (.number)→(.boolean)→ `$value` → set/直写。
 * 多选（select multiple）数组**逐项**过管道（`["1","2"]`+.number → `[1,2]`，ADR-0026 决策 8）。
 * number/boolean 均为类型终态声明，**按书写序顺序执行**（`Object.keys(options)` 键序=书写序），
 * 同写两个的冲突后果开发者自担（`.boolean.number` 可能得 `1`），不短路、不 warn。
 *
 * ## schema 转换钩子（ADR-0050，x-field 专属注入）
 *
 * `toInputFn`/`toStateFn` 由 FieldDirective 控件形态组合注入（created 前赋值），来源是
 * configurable schema 的 `toInput`/`toState` 函数；模板侧不可达——relaxed-json 不支持
 * 函数字面量（ADR-0018），能力保持 x-field 专属。
 * - **读**：显式 `get` 优先（同存则 toInput 忽略，不叠加不 warn）；**toInput 声明即接管
 *   空值显示**——ADR-0027 default 回填与 select 首项兜底退出，空值恒喂给 toInput
 *   （空值处理权是「声明与否」的开关）；
 * - **写**：落点 = `_writeToState` 统一出口入口（用户输入 / select autoSelect 回写全过），
 *   数组（select multiple）逐项转换；
 * - **失败不破坏**：读方向回退该项原值、写方向放弃本次写入（并回滚 `_selfWriting` 防循环
 *   标志，不吞下一次外部变更的回写）；warn per-instance 去重一次。
 *
 * ## 防循环
 * 双向绑定的循环风险：onInput 写 state → read 回调写回 DOM。虽然程序设 `el.value` 不触发 input 事件
 * （故无同步栈溢出），但 read 回调若把值经 getter 写回，会**立即覆盖用户刚输入的内容**（UX 灾难），
 * 也是冗余写。故须识别「自己触发的 read 回调」并跳过。
 *
 * - 写入经 `store.update(fn,{flags:-this.seq})` 承载 flags（与 syncer 范式一致，供 syncer/未来指令识别）；
 * - 但 `scope.watch` 的 scheduler 合并模型不把 `operate` 透传给 listener（flush 时重新读当前值），
 *   read 回调拿不到 `operate.flags`——故防循环用**实例级 `_selfWriting` 标志**：
 *   onInput 置 `true` → read 回调检查命中则重置并 `return`（跳过自己触发的回写）。
 *   语义与 flags 等价（只跳过自己，其他 x-model 实例 / 外部写入正常更新显示）。
 * - `seq` = 类级静态自增（`++ModelDirective._seq`，仿 `AutoStoreSyncer.seq`），同 engine 内各实例唯一。
 *
 * ## 冲突（控件感知）
 * - text-like：`:value`/`x-bind:value` 与 `x-model` 同元素 → 编译期报错（竞写 `el.value`）；
 * - checkbox / radio：`:checked`/`x-bind:checked` 与 `x-model` 同元素 → 编译期报错（竞写 `el.checked`）；
 *   `:value` **放行**（设选项值，必需）。详见 ADR-0023 决策 4。
 *
 * ## 初始
 * mount 时 state→DOM 单向（state 作真相源）；state 路径不存在 → warn + 不动 DOM（不回填）。
 *
 * @example 基础双向
 * <input x-model="order.price"/>
 * // state.order.price=99 → input.value="99"；用户输入 "100" → state.order.price="100"
 *
 * @example 数字字段（.number 避免字符串污染计算属性）
 * <input type="number" x-model.number="order.count"/>
 * // 用户输入 "23" → state.order.count=23（数字，非字符串），order.total=price*count 正确
 *
 * @example 组合字段（表达式 + set 反向拆分）
 * <input x-model="user.first + ',' + user.last" x-model-options="{set:'user.first=$value.split(\',\')[0];user.last=$value.split(\',\')[1]'}"/>
 *
 * @example action 复用（set 外置到 <script type="autospark/actions">）
 * <input x-model="user.ip" x-model-options="{get:'splitIp(0)',set:'joinIp'}"/>
 */
export declare class ModelDirective extends AutoSparkDirectiveBase {
    /** Compile 通道：created/compile/destroy（挂 input 事件在 compile——el 已存在即可，无需 observer 通道） */
    /** 与 x-bind/x-on 同级（50），早于 x-text/x-html(0) */
    static readonly priority = 50;
    /** 同元素仅一个 x-model */
    static readonly singleton = true;
    /** 实例唯一 seq（类级自增）；写入 state 时作 flags 标识（-seq），仿 AutoStoreSyncer.seq */
    private static _seq;
    private readonly seq;
    /**
     * 通用注入白名单（所有 text-like input + textarea）。enable 经 `.invert` 注入 disabled。
     * 这是 text-like 的完整白名单；checkbox 使用裁剪版 CHECKBOX_INJECT_ATTRS。
     */
    private static readonly COMMON_INJECT_ATTRS;
    /**
     * checkbox / radio 注入白名单（ADR-0023 决策 5）：裁剪文本约束属性（placeholder/pattern/
     * minlength/maxlength/readonly 对选择类控件无意义），保留 title/required/enable。
     */
    private static readonly CHECKBOX_INJECT_ATTRS;
    /**
     * select 注入白名单（ADR-0026 决策 7）：title/required/enable + size
     * （AutoWidgetSelect 既有字段）。choices 不走属性注入，走选项子渲染（决策 1）；
     * **multiple 不在此**——它是初始化期语义收敛（值形态 string↔string[] 随之切换），
     * 由 `_initSelect` 唯一管理（决策 2），属性注入会与其双写竞争。
     */
    private static readonly SELECT_INJECT_ATTRS;
    /** 含 min/max/step 的 input type（number/range/date 类），扩展注入这三个数值约束属性。 */
    private static readonly NUMERIC_TYPES;
    /**
     * 元数据自动注入（ADR-0020）：为含 x-model 的元素从 configManager schema 合成隐式 `@` 绑定。
     *
     * 由 compiler 在 scope.compile() 后调用（与 `_compileAttrInterpolation` 并列）。合成实体是
     * 标准 BindDirective 实例（构造合成 AutoDirectiveInfo 喂给 createDirectives），复用 ADR-0019
     * 全部能力。合成知识内聚于此（compiler 只管调用时机）。
     *
     * - configManager 不存在 → 整体跳过（静默，决策 12）；
     * - 注入白名单 = 通用集 + type 扩展（决策 4）；仅注入 schema 有的属性（决策 5）；
     * - enable → disabled 反向映射（决策 7，ADR-0025 修订为合成 `:disabled.invert`）；name 特殊处理（决策 8）；
     * - 显式绑定优先抑制合成（决策 9）；无条件合成 + 三层降级兜底（决策 10）。
     */
    static synthesizeSchemaBindings(engine: AutoSpark, scope: AutoSparkScope, el: HTMLElement, modelInfo: AutoDirectiveInfo): void;
    /**
     * name 注入（ADR-0020 决策 8）：静态写，不走响应式绑定。
     *
     * - schema 有 name 元数据 → name = schema.name；
     * - schema 无 name + x-model 绑定值是简单路径 → name = 路径；
     * - x-model 绑定值是表达式 → 跳过（用户应显式写 name）。
     * - 元素已有显式 name 属性 → 跳过（显式优先）。
     */
    private static _injectName;
    /** 控件类别（created 时据 el.type 判定，决定读写语义） */
    private _controlKind;
    /** 防循环标志：onInput 触发的写入会让随之而来的 read 回调跳过回写（见类注释「防循环」） */
    private _selfWriting;
    /** 当前监听的事件类型（_attachEvent 时决定：text-like/checkbox/radio 默认 "input"、select "change"） */
    private _eventType?;
    /** created 时 read 的初始值（compile 首渲用；undefined 表示未读到/无值） */
    private _initialValue;
    /** 只读降级 warn 去重（表达式/computed 无 set 时仅 warn 一次） */
    private _readonlyWarned;
    /** radio 值不在 .boolean 严格集 warn 去重（仅 warn 一次，值保留原样写回） */
    private _radioBooleanWarned;
    /** select 类型不匹配 warn 去重（数组配单选/字符串配多选，仅 warn 一次后自然退化，ADR-0026 决策 3） */
    private _selectMismatchWarned;
    /** select choices 模式标志（_initSelect 判定；静态模式为 false，不做选项管理） */
    private _selectChoices;
    /** 空值回填判定集（ADR-0027）：默认集 + 用户附加，created 期经 resolveEmptyValues 解析缓存 */
    private _emptyValues;
    /** schema.default 元数据（ADR-0027 决策 3 的第二级；created 期静态读取，模板 default 优先） */
    private _schemaDefault;
    /** schema.autoSelect 元数据（ADR-0028 决策 2 第二级；undefined=未声明走默认 true） */
    private _schemaAutoSelect;
    /**
     * choices 渲染时记录的「default:true 第一项」的 option value（ADR-0028 选取依据）。
     * 静态模式无 choices 项标记，恒 undefined（回退首项规则）。
     */
    private _defaultTrueValue;
    /** DOM→state 回调（箭头函数绑定 this，供 add/removeEventListener 同引用） */
    private readonly onInput;
    /**
     * schema 读转换（state→输入值）：FieldDirective 控件形态组合注入（created 前赋值）。
     * 显式 `get` 优先（同存则 toInput 忽略）；声明即接管空值显示（ADR-0027 空值逻辑退出）。
     */
    toInputFn: ((v: any) => any) | null;
    /** schema 写转换（输入值→state）：落点 = `_writeToState` 统一出口入口，数组逐项。 */
    toStateFn: ((v: any) => any) | null;
    /** toInput 接管标志（writeToDom 现算）：true 时 ADR-0027 空值逻辑（default 回填/select 首项兜底）退出 */
    private _toInputOwns;
    /** 转换函数失败 warn 去重（per-instance 一次，_readonlyWarned 同款） */
    private _toInputWarned;
    private _toStateWarned;
    /** 转换函数失败 warn（per-instance 去重一次） */
    private _warnTransform;
    created(): void;
    compile(): void;
    destroy(): void;
    private _attachEvent;
    private _detachEvent;
    /**
     * select 初始化（created 期调用，先于读方向订阅）：
     *
     * 1. **multiple 收敛**（决策 2）：显式（静态属性 ≡ `.multiple` 修饰符 ≡ 指令/宿主选项，
     *    任一为真即真）> schema.multiple（合成注入，静态属性已存在则跳过）。运行时唯一
     *    真相源是 `el.multiple`，值语义（string / string[]）一律派生自它。
     * 2. **选项源三级优先**（决策 1）：静态 `<option>`/`<optgroup>` > 模板 choices
     *    （x-model-options/宿主选项）> schema.choices（响应式全量重建）。三源皆空 →
     *    warn 一次，不生成。
     */
    /**
     * x-model 绑定值对应的 configManager fullKey（`toFullConfigKey` 的实例便捷封装）。
     * 绑定值非简单路径（表达式）或 configManager 缺席时返回 undefined。
     */
    private _fullConfigKey;
    private _initSelect;
    /**
     * 全量重建 options 子树（无 diff，决策 1）并重放选中态。
     *
     * **group 分组**（决策 4）：`getOption("group")` 为字段名时按项的该字段值聚合到
     * `<optgroup label>`——顺序遍历，无该字段的项渲染为顶层 `<option>`（可与组交错），
     * 组按首次出现追加。group 仅作用于 choices 路径，静态手写不适用。
     *
     * choice 形态（决策 5）：缺 value → 省略属性走 HTML 原生回退（label 即 el.value）；
     * 缺 label → 回退 `String(value)`；附加字段（如 aa:"x"）合法，作 group 键取值来源。
     *
     * 重建后经 `_scheduleSelectReplay` 推迟重放当前选中：编译期的「选项就绪晚于首渲」与
     * 响应式变更场景共用同一条推迟路径（见 `_selectReplayFn` 注释）。
     */
    private _renderChoices;
    /** 读方向最近一次的显示值缓存（choices 重建后重放选中用；writeToDom 时更新） */
    private _lastDisplayValue;
    /**
     * 推迟应用 select 选中态：缓存值不变，microtask 重放。
     *
     * 两类时序都必须推迟：① 编译期 el 是浅克隆（静态 option 随后才挂入）；② 编译产物经
     * `engine.compile` 的 replaceChildren 搬运挂载，DOM 移动会重置 select 选中状态
     * （happy-dom 实测，浏览器同险）。scheduler Set 按闭包引用去重——本方法固定复用
     * 同一 `this._selectReplayFn`，同 tick 多次调度只跑一次，且总是取最新缓存值。
     */
    private _selectReplayFn;
    private _scheduleSelectReplay;
    /**
     * 应用 select 选中态（读方向写目标，严格 `===` 匹配，ADR-0026 决策 3 / Q11-a）。
     *
     * - 单选：`typeof display === "string"` 才写 `el.value`（option.value 恒字符串，字符串间
     *   `===` 即浏览器原生匹配）；非字符串（数字/数组等）**不勾中任何项**（`selectedIndex=-1`），
     *   warn 一次后自然退化——类型错误应出声，不参与自动选中（ADR-0028 决策 3）。
     * - 多选：数组逐 option `selected = state.includes(option.value)`（严格 includes，非字符串
     *   项恒不勾中）；非数组状态 warn 一次后恒不勾选。
     * - **空值回填（ADR-0027 决策 5）**：display 为 undefined（空值且无 default）时单选回退
     *   **首项默认**（渲染后第一个 option，含 optgroup 内首个）；多选回退 `[]`（全不勾）。
     * - **自动选中（ADR-0028，默认开启）**：display 是字符串但不在渲染后的 options 值集内 →
     *   选中 `default:true` 第一项（无则首项）并**回写 state**（与用户手选同一条 `_writeToState`
     *   管道 + `_selfWriting` 置位，回写触发下游级联）；多选是**过滤式**（剔除数组中过期项回写）。
     *   `autoSelect:false` 退回旧行为（不勾中不回写）。空选项集静默（无可选）。
     */
    private _applySelectSelection;
    /**
     * input/change 事件处理：读 DOM 值 → 修饰符管道 → 写 state（flags 标识 + 防循环置位）。
     *
     * 按 ControlKind 分派读源（ADR-0023 决策 1 / ADR-0026 决策 3）：
     * - text-like：读 `el.value`，走 trim/number/boolean 修饰符管道；
     * - checkbox：读 `el.checked`（恒写布尔），修饰符管道空转（类型转换对布尔无意义）；
     * - radio：仅勾选时读 `el.value`（字符串），取消时不写（另一个 radio 会接管）；
     *   值同样走修饰符管道（.boolean 对 radio 布尔对是主场景）；
     * - select：单选读 `el.value`；多选读 selectedOptions 收集 `string[]`，数组逐项过管道
     *   （ADR-0026 决策 8）。
     */
    private _handleInput;
    /**
     * 写方向修饰符管道：`el.value` →(.trim)→ (.number)→(.boolean)→ 写回。
     *
     * number/boolean 按书写序顺序执行（键序=书写序），不短路、不 warn——同写两个的冲突
     * 后果开发者自担。.boolean 严格集未识别值在 radio 场景 warn 一次（模板静态声明的
     * value 不在 {"true","false"} 集内是模板 bug，值得出声）；text 场景静默保留（用户输入不预设）。
     *
     * 键序来源：指令选项键在前（书写序）+ 宿主选项键在后（缺失才回退，ADR-0007 两层
     * fallback 的顺序投影）——`getOption` 逐键查不到顺序，此处自聚合键序表。
     * 键序表在实例生命周期内不变（指令/宿主选项编译期定格），缓存于 `_modifierKeys`，
     * 免去每次输入事件的重聚合（性能审查发现 2）。
     */
    private _modifierKeys;
    private _applyModifiers;
    /**
     * 写 state（DOM→state 方向）。
     *
     * - 有 set（`x-model-options="{set:'...'}"`）→ 经 set 表达式/action 反向变换（拆分到多字段等）；
     * - 无 set + 简单路径 → `binding.writeThrough` 透传（快路径，绝大多数场景；ADR-0075 读写对称）；
     * - 无 set + 表达式/computed → 只读降级（warn 一次，不写）。
     *
     * 经 `store.update({flags:-seq})` 承载 flags 标识（与 syncer 范式一致），供 syncer/未来指令识别。
     * set 在 fn 内执行——其 `with(scope)`/action 写入经 Proxy 落盘，处于 store.update 上下文故 flags 生效。
     */
    private _writeToState;
    /**
     * 写 DOM（state→DOM 方向），含 get 变换、空值回填与防循环跳过。
     *
     * 按 ControlKind 分派写目标（ADR-0023 决策 1 / ADR-0026 决策 3）：
     * - text-like：写 `el.value`；
     * - checkbox：写 `el.checked`（Boolean() coerce，ADR-0023 决策 2）；
     * - radio：写 `el.checked = (display === el.value)`（值匹配，ADR 决策）；
     * - select：经 `_applySelectSelection`（单选 String 写 el.value、多选逐 option 严格
     *   `===` includes 勾选；类型不匹配 warn 一次后自然退化）。
     *
     * **空值回填（ADR-0027）**：get 变换后 display 落在 emptyValues 集内 → 显示 default
     * 回填值（仅 text-like + select 参与；checkbox/radio 不参与）。每次读方向都判（无条件语义）。
     * select 无 default 时回退首项默认（见 `_applySelectSelection`）。不回写 state。
     *
     * 防循环：`_selfWriting=true` 表示本次值变化由 onInput 触发 → 跳过回写（避免 getter 立即覆盖
     * 用户输入、避免冗余 DOM 写），重置标志后返回。其他场景（外部改 state、其他 x-model 实例写入）
     * `_selfWriting=false`，正常更新显示。
     */
    private writeToDom;
    /**
     * 解析空值回填的 default（ADR-0027 决策 3）：模板 > schema 两级，静态值 only。
     *
     * - 模板：`getOption("default")`（`x-model-options="{default:...}"` / `x-options` 回退）；
     * - schema：`configurable(v, {default: y})` 的 `default` 元数据（created 期静态读取缓存）；
     * - 均无 → `undefined`（调用方按控件空值显示处理——text-like 空串、select 首项）。
     */
    private _resolveDefault;
    /** 静态读取 schema.default 元数据（configManager 缺席/表达式绑定/无 default 时 undefined） */
    private _readSchemaDefault;
    /** schema.autoSelect 元数据（ADR-0028 决策 2 第二级；undefined=未声明，由 _resolveAutoSelect 兜底） */
    private _readSchemaAutoSelect;
    /**
     * 解析 autoSelect（ADR-0028 决策 2）：模板显式声明 > schema 元数据 > 默认 true。
     * 模板侧 getOption 未声明时返回 undefined（两层回退穿透），与 boolean false 区分。
     */
    private _resolveAutoSelect;
    /**
     * 求值 get（state→DOM 变换）。
     *
     * ACTION_RE 分派：匹配 `name(args)?` → 调 action（当前值作首参 + 括号追加参数，`this`=ctx）；
     * 否则 → 表达式（形参 `value`=当前 state 值，`with(scope)` 注入状态）。
     */
    private _evalGet;
    /**
     * 求值 set（DOM→state 变换）。
     *
     * ACTION_RE 分派：匹配 `name(args)?` → 调 action（DOM 值作首参 + 括号追加参数）；
     * 否则 → 表达式（形参 `$value`=DOM 输入值，`with(scope)` 注入；语句体执行赋值，可写多字段）。
     */
    private _evalSet;
    /**
     * 求 action 调用括号内的追加参数。
     *
     * 首参（get 的 value / set 的 $value）由框架自动注入，括号内仅声明**额外**参数
     * （如 `splitIp(1)` 的 `1`，经 `with(data)` 求值，可引用 scope 内其他字段）。
     */
    private _evalArgs;
    /**
     * 构造 action 调用上下文：复用 x-on 的 `AutoSparkActionContext`（el/data/scope/store/
     * globalState/engine/$options），附加 get 的 `value` 或 set 的 `$value`。`$event` 无意义
     * （x-model 非事件驱动）。
     */
    private _makeCtx;
}
