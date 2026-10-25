import { AutoSparkDirectiveBase } from "../features/directive/base";
import { FormDirective } from "./x-form";
/**
 * x-field：字段域指令（单指令双形态按宿主分派，ADR-0045 决策 3）。
 *
 * - **控件形态**（input / textarea / select 宿主）：= **x-model 全部语义**（组合内部
 *   ModelDirective——ControlKind 分派 / 修饰符管道 / ADR-0020 元数据自动注入全复用）+ `$field` 注入；
 * - **容器形态**（div 等非控件宿主）：字段域声明 + `$field` 注入后代，渲染完全归模板
 *  （不 ownsChildren、不自动渲染）；后代经 `<input x-bind="$field"/>`（控件展开键集）或
 *   `{{ $field.label }}` 消费。**radio 不支持 spread 消费**（checked 需与宿主 value 比对，
 *   $field 不感知消费宿主——radio 请用控件形态）。
 *
 * **强依赖 x-form**（决策 4）：沿 scope 链就近查找 FormDirective（内层表单遮蔽外层），
 * 未找到编译期 error + 指令失效——字段注册进表单的中心化监听（value/error/dirty/元数据）。
 *
 * ## 路径解析（决策 2/4）
 *
 * 值须为简单路径。祖先 x-form 有路径上下文（`x-form="login"`）时先试拼接
 * （`username` → `login.username`，作用域链内可解析即采用），失败回退原值（warn）。
 * 解析产物 `absPath`（绝对状态路径，含 `$scopes.<id>.` 前缀）是**唯一真相源**——
 * 内部 model 的绑定值、`$field.value` 读写、form 的订阅/快照/getState 全走它
 * （绝对路径保证 with 求值与 setVal 写入同位，规避域内相对路径写错层）。
 *
 * ## `$field`（决策 5/6）
 *
 * Proxy 对象注入宿主 scope 的 locals 层（聚合视图第一优先级 + 失效视图缓存）：
 * - `.value`：getter 读 `getVal(state, absPath)`（求值栈内依赖收集**穿透成立**，插值自动响应式）、
 *   setter `setVal` 直写；**schema 声明 toInput/toState 时即为「字段输入值」**（getter 过 toInput、
 *   setter 过 toState，ADR-0050——未声明即状态值，读写同构）；
 * - `.error`：form 注册条目的桥接副本（value watcher 回调刷新，refresh 驱动显示）；
 * - `.onInput` / `.onChange`：写方向事件封装（控件感知读值 + 修饰符管道 + setVal，
 *   供容器形态 `x-bind="$field"` 展开挂载；稳定引用缓存避免重复挂卸）；
 * - `.xxx`：元数据覆盖链读取（`x-field-options` > configurable schema > 默认，决策 9——
 *   仅视图层覆盖，不写回 schema 本体）；
 * - **ownKeys**（`x-bind="$field"` 展开时）：控件展开键集——`type`（input 系 widget）/
 *   `value`（checkbox widget 为 `checked`）/ `name` / schema 有的注入白名单属性
 *   （enable→disabled 反向）/ `onInput`/`onChange`；label/help/widget 原键/choices 等非控件
 *   元数据**不进键集**（get 与 ownKeys 职责分离）。
 */
export declare class FieldDirective extends AutoSparkDirectiveBase {
    /** 150：晚于 x-form(200)，早于 bind/on/model(50)——$field locals 注入先于同元素绑定建视图缓存 */
    static readonly priority = 150;
    static readonly singleton = true;
    /** 所属表单（created 时沿链解析；强依赖，null = 指令失效） */
    form: FormDirective | null;
    /** 解析后的绝对状态路径（唯一真相源）；created 前为空串 */
    absPath: string;
    /** 内部 ModelDirective（控件形态组合；容器形态 null） */
    private _model;
    /** $field Proxy（懒构建缓存） */
    private _fieldProxy;
    /** 事件封装缓存（稳定引用：spread 重复 apply 不重挂监听） */
    private _handlers;
    /** schema 读转换 toInput（created 期静态缓存；仅 schema 来源——函数进不了 relaxed-json，覆盖链不延伸） */
    private _toInput;
    /** schema 写转换 toState（同上） */
    private _toState;
    /** 转换函数失败 warn 去重（per-instance 一次） */
    private _toInputWarned;
    private _toStateWarned;
    /**
     * 字段的 configManager schema（ADR-0045 决策 10：schema 是增强非前提——
     * 无 schema 返回 undefined，绑定照常、元数据键 undefined，不 warn）。
     */
    get schema(): any;
    created(): void;
    compile(): void;
    destroy(): void;
    /** $field Proxy（懒构建；get/ownKeys 职责分离——任意元数据读取 vs 控件展开键集） */
    get fieldProxy(): Record<string, any>;
    /**
     * $field 键读取分派（决策 5）：
     * value → 根 store 直读（依赖收集穿透）；checked → checkbox 布尔（Boolean coerce）；
     * error → form 条目副本；onInput/onChange → 事件封装；name → 覆盖链回退路径末段；
     * disabled → schema.disabled 显式优先、否则 enable 反向；其余 → 覆盖链（options > schema）。
     */
    private _readFieldKey;
    /** 元数据覆盖链读取（决策 9）：x-field-options > configurable schema；不写回 schema 本体 */
    private _meta;
    /** 读方向 toInput 应用：恒喂（空值也喂，接管语义）、数组逐项；未声明原样返回 */
    private _applyToInput;
    /** 写方向 toState 应用：数组逐项；任一项失败放弃整次写入（返回 TRANSFORM_ABORT） */
    private _applyToState;
    /** 转换函数失败 warn（per-instance 去重一次） */
    private _warnTransform;
    /**
     * 控件展开键集（决策 6，`x-bind="$field"` 的 ownKeys）：
     * type（input 系 widget）/ value（checkbox widget 为 checked）/ name / onInput / onChange
     * + schema 有的注入白名单属性（enable→disabled 反向；min/max/step 仅 numeric widget）。
     * 动态生成、每读现算——schema 变更后的下一次展开自动反映新键集，消失键由 SpreadBinder 清理。
     */
    _spreadKeys(): string[];
    /**
     * 写方向事件封装（onInput/onChange，决策 5）：控件感知读值 + 修饰符管道 + setVal。
     *
     * 控件元素经挂载时的 e.target 取得（$field 不感知消费宿主——容器形态下展开目标任意）。
     * 读值分派对齐 x-model 的 ControlKind（checkbox→checked、radio→勾选值、select→value/多选数组、
     * 其余→value）；修饰符（.trim/.number/.boolean）经 x-field-options 生效（合成 model options 同源）。
     */
    private _makeHandler;
    /** 写方向修饰符管道（对齐 x-model：trim → number → boolean；NaN/严格集外不破坏） */
    private _applyModifiers;
    /**
     * 路径解析（决策 2/4）：祖先 x-form 的 pathContext 拼接优先（作用域链内可解析即采用），
     * 失败回退原值 + warn（回退后仍走绝对化——原值可能本身是全局路径）。
     */
    private _resolvePath;
    /** 沿 scope 链就近取 x-form 的 pathContext（内层表单遮蔽外层，与 _findForm 同序） */
    private _findPathContext;
    /** 沿 scope 链就近查找 FormDirective（含自身 scope；最近祖先优先） */
    private _findForm;
    /**
     * 沿链是否存在「数据未就绪」的 DataDirective（x-data/x-form 异步源 in-flight：
     * 域 `_data` 尚未建立）。按指令名判定（data/form——FormDirective 继承 DataDirective
     * 同样建域），避免 field→data 的运行时 import 依赖。就绪的域不在此列（其字段解析
     * 会命中 `_data`，不触发 warn）。
     */
    private _hasPendingDataAncestor;
}
