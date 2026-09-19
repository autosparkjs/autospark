import { AutoSparkDirectiveBase } from "../base";
import { FormDirective, resolveFieldAbsPath } from "./form";
import { ModelDirective } from "./model";
import { getVal, setVal, splitPath } from "autostore";
import { isSimpleStatePath, type AutoSparkScope } from "../../scope";
import type { AutoDirectiveInfo } from "../types";

/** input 系 widget（可直接作 `<input type>` 的 AutoStoreWidgets 键；textarea/select 是控件标签级映射） */
const INPUT_WIDGETS = new Set([
    "text", "number", "email", "password", "search", "tel", "url",
    "checkbox", "radio", "file", "range", "date", "month", "time", "week",
    "color", "hidden", "image", "datetime-local",
]);
/** 含 min/max/step 约束的 widget（x-model 元数据注入白名单的 numeric 扩展同源，ADR-0020） */
const NUMERIC_WIDGETS = new Set(["number", "range", "date", "time", "datetime-local", "month", "week"]);
/** 控件展开键集的元数据注入白名单（ADR-0045 决策 6；与 x-model 注入白名单同族不同集） */
const SPREAD_META_KEYS = [
    "placeholder", "title", "required", "readonly", "pattern", "minlength", "maxlength",
] as const;

/**
 * 绝对路径 → 可求值表达式形态：数字段（scope id）用索引写法（`$scopes.5.x` 的 `.5`
 * 不是合法 JS 属性访问，`with(scope)` 求值会编译崩溃；`$scopes['5'].x` 合法）。
 * 非数字段保持点分（简单路径享受 model 的 setVal 直写快路径）。
 */
function toStateExpr(segments: string[]): string {
    return segments
        .map((seg, i) => (/^\d+$/.test(seg) ? `[${JSON.stringify(seg)}]` : i === 0 ? seg : `.${seg}`))
        .join("");
}

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
 *   setter `setVal` 直写；
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
export class FieldDirective extends AutoSparkDirectiveBase {
    /** 150：晚于 x-form(200)，早于 bind/on/model(50)——$field locals 注入先于同元素绑定建视图缓存 */
    static override readonly priority = 150;
    static override readonly singleton = true;

    /** 所属表单（created 时沿链解析；强依赖，null = 指令失效） */
    form: FormDirective | null = null;
    /** 解析后的绝对状态路径（唯一真相源）；created 前为空串 */
    absPath: string = "";
    /** 内部 ModelDirective（控件形态组合；容器形态 null） */
    private _model: ModelDirective | null = null;
    /** $field Proxy（懒构建缓存） */
    private _fieldProxy: Record<string, any> | null = null;
    /** 事件封装缓存（稳定引用：spread 重复 apply 不重挂监听） */
    private _handlers: Record<"onInput" | "onChange", ((e: Event) => void) | null> = {
        onInput: null,
        onChange: null,
    };

    /**
     * 字段的 configManager schema（ADR-0045 决策 10：schema 是增强非前提——
     * 无 schema 返回 undefined，绑定照常、元数据键 undefined，不 warn）。
     */
    get schema(): any {
        const store = this.engine.store as any;
        const cm = store.configManager;
        if (!cm) return undefined;
        const segs = splitPath(this.absPath);
        const fullKey = (store.configKey ? [store.configKey, ...segs] : segs).join(".");
        return (cm.state as Record<string, any>)[fullKey];
    }

    override created() {
        // 强依赖 x-form（决策 4）：沿 scope 链就近查找（含自身 scope——<form x-form x-field> 同元素形态）
        this.form = this._findForm();
        if (!this.form) {
            this.error("x-field: 必须声明在 x-form 内（未找到祖先表单域），指令失效（ADR-0045 决策 4）");
            return;
        }
        // 路径解析（决策 2/4）：pathContext 拼接优先、失败回退原值；统一绝对化（唯一真相源）
        const raw = String(this.value ?? "").trim();
        if (!isSimpleStatePath(raw)) {
            this.error(`x-field: 值 "${raw}" 须为简单状态路径（不支持表达式），指令失效（ADR-0045）`);
            this.form = null;
            return;
        }
        this.absPath = resolveFieldAbsPath(this.binding, this._resolvePath(raw));

        // 双形态分派（决策 3）：标准控件宿主 → 组合 ModelDirective（x-model 全部语义）
        const el = this.el;
        if (
            el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement
        ) {
            const ModelCls = this.engine.directives.get("model");
            if (ModelCls) {
                // 绑定值 = absPath 的可求值表达式形态（数字段索引化，见 toStateExpr）；
                // 写方向恒附 set 表达式（域内路径含索引段时 setVal 直写快路径不可达，经 with 赋值
                // 写入聚合视图 → 根 state，读写同位）；options 透传 x-field-options（修饰符管道同款）
                const expr = toStateExpr(splitPath(this.absPath));
                const opts = { ...(this.options ?? {}), set: `${expr}=$value` };
                const info: AutoDirectiveInfo = { name: "model", value: expr, options: opts };
                this._model = new (ModelCls as unknown as new (...a: any[]) => ModelDirective)(
                    this.engine,
                    this.binding,
                    info,
                );
                this._model.created();
            }
        }

        // 注册进表单（中心化监听，决策 4）：建立 value/schema 订阅与初始快照
        this.form.registerField(this);

        // $field 注入（决策 5）：locals 层 + 失效视图缓存（后代/同元素绑定重建视图才可见）。
        // **独立拷贝层**：_linkParent 把父 scope 的 locals 以共享引用下传——直接在共享对象上加键
        // 会污染整个表单子树（多个 x-field 的 $field 互相覆盖），故恒新建对象拷贝父键后注入
        const scope = this.binding;
        scope.locals = { ...(scope.locals ?? {}), $field: this.fieldProxy };
        scope.invalidateScopeView();
    }

    override compile() {
        // 控件形态：内部 model 首渲 + 事件挂载；ADR-0020 元数据注入（合成 @ 绑定，复用全部能力）。
        // 注入用**点分形态**的绑定值（isSimpleStatePath 需认简单路径；@ 配置绑定走路径 API，
        // 数字段无碍——synth 内部拼 configStatePath/fullKey 均路径操作）
        if (this._model) {
            this._model.compile();
            ModelDirective.synthesizeSchemaBindings(
                this.engine,
                this.binding,
                this.el,
                { ...this._model.info, value: this.absPath },
            );
        }
    }

    override destroy() {
        this._model?.destroy();
    }

    /** $field Proxy（懒构建；get/ownKeys 职责分离——任意元数据读取 vs 控件展开键集） */
    get fieldProxy(): Record<string, any> {
        if (this._fieldProxy) return this._fieldProxy;
        const field = this;
        this._fieldProxy = new Proxy(
            {},
            {
                get(_t, k: string | symbol) {
                    if (typeof k !== "string") return undefined;
                    return field._readFieldKey(k);
                },
                set(_t, k: string | symbol, v: any): boolean {
                    if (k === "value") {
                        setVal(field.engine.store.state as any, splitPath(field.absPath), v);
                        return true;
                    }
                    field.warn(`$field: 仅 value 可写（"${String(k)}" 为元数据/派生键，忽略写入）`);
                    return true;
                },
                ownKeys() {
                    return field._spreadKeys();
                },
                getOwnPropertyDescriptor(_t, k: string | symbol) {
                    if (typeof k === "string" && field._spreadKeys().includes(k)) {
                        return { enumerable: true, configurable: true, value: undefined };
                    }
                    return undefined;
                },
            },
        );
        return this._fieldProxy;
    }

    /**
     * $field 键读取分派（决策 5）：
     * value → 根 store 直读（依赖收集穿透）；checked → checkbox 布尔（Boolean coerce）；
     * error → form 条目副本；onInput/onChange → 事件封装；name → 覆盖链回退路径末段；
     * disabled → schema.disabled 显式优先、否则 enable 反向；其余 → 覆盖链（options > schema）。
     */
    private _readFieldKey(k: string): any {
        const state = this.engine.store.state as Record<string, any>;
        switch (k) {
            case "value":
                return getVal(state, this.absPath);
            case "checked":
                // checkbox 布尔语义（ADR-0023 决策 2 同构：Boolean coerce）
                return Boolean(getVal(state, this.absPath));
            case "error":
                return this.form?.getFieldEntry(this.absPath)?.error;
            case "onInput":
            case "onChange":
                return this._makeHandler(k);
            case "name": {
                const meta = this._meta("name");
                if (typeof meta === "string" && meta !== "") return meta;
                return this.absPath.split(".").pop();
            }
            case "type": {
                // widget → 原生 input type 映射（决策 6）：input 系 widget 直接作 type；
                // textarea/select 是标签级映射（宿主标签已定控件），type 键不出（ownKeys 同判）
                const widget = this._meta("widget");
                return typeof widget === "string" && INPUT_WIDGETS.has(widget) ? widget : undefined;
            }
            case "disabled": {
                // enable 反向映射（决策 6，与 ADR-0025 .invert 语义同构）：schema.disabled 显式优先
                const explicit = this._meta("disabled");
                if (explicit !== undefined) return explicit;
                const enable = this._meta("enable");
                return enable === undefined ? undefined : !enable;
            }
            default:
                return this._meta(k);
        }
    }

    /** 元数据覆盖链读取（决策 9）：x-field-options > configurable schema；不写回 schema 本体 */
    private _meta(k: string): any {
        if (this.options && Object.prototype.hasOwnProperty.call(this.options, k)) {
            return this.options[k];
        }
        return this.schema?.[k];
    }

    /**
     * 控件展开键集（决策 6，`x-bind="$field"` 的 ownKeys）：
     * type（input 系 widget）/ value（checkbox widget 为 checked）/ name / onInput / onChange
     * + schema 有的注入白名单属性（enable→disabled 反向；min/max/step 仅 numeric widget）。
     * 动态生成、每读现算——schema 变更后的下一次展开自动反映新键集，消失键由 SpreadBinder 清理。
     */
    _spreadKeys(): string[] {
        const widget = this._meta("widget");
        // checkbox widget：checked 替 value（checkbox 的状态语义是布尔勾选，value 属性是选项值）
        const valueKey = widget === "checkbox" ? "checked" : "value";
        const keys: string[] = [valueKey, "name", "onInput", "onChange"];
        // type：input 系 widget 才作 type（textarea/select 是标签级映射，宿主标签已定控件）
        if (typeof widget === "string" && INPUT_WIDGETS.has(widget)) keys.push("type");
        const schema = this.schema;
        if (schema) {
            // 元数据注入白名单：仅 schema 有的属性出键（动态交集，决策 6）
            for (const metaKey of SPREAD_META_KEYS) {
                if (schema[metaKey] != null) keys.push(metaKey);
            }
            if (schema.enable !== undefined || schema.disabled !== undefined) keys.push("disabled");
            if (typeof widget === "string" && NUMERIC_WIDGETS.has(widget)) {
                for (const extra of ["min", "max", "step"]) {
                    if (schema[extra] != null) keys.push(extra);
                }
            }
            // choices：widget=select 且 schema.choices 存在时出键（决策 6 修订——spread 在 select
            // 宿主上渲染 option 子树；其他宿主由 SpreadBinder 剔除 + warn）
            if (widget === "select" && schema.choices != null) keys.push("choices");
        }
        return keys;
    }

    /**
     * 写方向事件封装（onInput/onChange，决策 5）：控件感知读值 + 修饰符管道 + setVal。
     *
     * 控件元素经挂载时的 e.target 取得（$field 不感知消费宿主——容器形态下展开目标任意）。
     * 读值分派对齐 x-model 的 ControlKind（checkbox→checked、radio→勾选值、select→value/多选数组、
     * 其余→value）；修饰符（.trim/.number/.boolean）经 x-field-options 生效（合成 model options 同源）。
     */
    private _makeHandler(kind: "onInput" | "onChange"): (e: Event) => void {
        let fn = this._handlers[kind];
        if (fn) return fn;
        fn = (e: Event) => {
            const el = e.target as HTMLInputElement | HTMLSelectElement | null;
            if (!el) return;
            let v: any;
            if (el instanceof HTMLInputElement && el.type === "checkbox") {
                v = el.checked; // 恒布尔（ADR-0023 决策 2）
            } else if (el instanceof HTMLInputElement && el.type === "radio") {
                if (!el.checked) return; // 取消态不写（另一支接管）
                v = el.value;
            } else if (el instanceof HTMLSelectElement && el.multiple) {
                v = Array.from(el.selectedOptions).map((o) => o.value);
            } else {
                v = el.value;
            }
            try {
                setVal(this.engine.store.state as any, splitPath(this.absPath), this._applyModifiers(v));
            } catch (err: any) {
                // 校验 throw 模式拒绝写入（ValidateError）：错误已由 autostore 记入 store.errors
                //（决策 5 桥接可见），中断无益——warn 不打断事件流
                this.warn(`x-field: 写入 "${this.absPath}" 被校验拒绝: ${err?.message ?? err}`);
            }
        };
        this._handlers[kind] = fn;
        return fn;
    }

    /** 写方向修饰符管道（对齐 x-model：trim → number → boolean；NaN/严格集外不破坏） */
    private _applyModifiers(v: any): any {
        if (this.getOption("trim") && typeof v === "string") v = v.trim();
        if (this.getOption("number")) {
            const n = Number(v);
            v = Number.isNaN(n) ? v : n; // NaN 回退原值，不破坏
        }
        if (this.getOption("boolean")) {
            if (v === "true") v = true;
            else if (v === "false") v = false;
            else if (v === "") v = false;
            // 严格集外保留原值（x-model .boolean 同款不破坏原则）
        }
        return v;
    }

    /**
     * 路径解析（决策 2/4）：祖先 x-form 的 pathContext 拼接优先（作用域链内可解析即采用），
     * 失败回退原值 + warn（回退后仍走绝对化——原值可能本身是全局路径）。
     */
    private _resolvePath(raw: string): string {
        const ctx = this._findPathContext();
        if (!ctx) return raw;
        const candidate = `${ctx}.${raw}`;
        if (this.binding.read(candidate) !== undefined) return candidate;
        this.warn(
            `x-field: 路径上下文拼接 "${candidate}" 不存在，按原路径 "${raw}" 解析（ADR-0045 决策 4）`,
        );
        return raw;
    }

    /** 沿 scope 链就近取 x-form 的 pathContext（内层表单遮蔽外层，与 _findForm 同序） */
    private _findPathContext(): string | null {
        let s: AutoSparkScope | null = this.binding;
        while (s) {
            for (const d of s.directives) {
                if (d instanceof FormDirective && d.pathContext) return d.pathContext;
            }
            s = s.parent;
        }
        return null;
    }

    /** 沿 scope 链就近查找 FormDirective（含自身 scope；最近祖先优先） */
    private _findForm(): FormDirective | null {
        let s: AutoSparkScope | null = this.binding;
        while (s) {
            for (const d of s.directives) {
                if (d instanceof FormDirective) return d;
            }
            s = s.parent;
        }
        return null;
    }
}
