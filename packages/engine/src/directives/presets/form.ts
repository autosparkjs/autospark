import { DataDirective } from "./data";
import { SCOPES_KEY } from "../../engine";
import { detectDataForm } from "./async-source";
import { getVal, setVal, splitPath, type Watcher } from "autostore";
import { isSimpleStatePath, type AutoSparkScope } from "../../scope";
import type { FieldDirective } from "./field";
import type { AutoSpark } from "../../engine";

/**
 * 字段注册条目（x-form 中心化监听的登记单元，ADR-0045 决策 4）。
 *
 * x-field 编译期向所属 x-form 注册，form 统一建立 value / 元数据订阅并分发；
 * entry 承载该字段的快照（reset 回滚用）与桥接副本（error / dirty）。
 */
export interface FormFieldEntry {
    /** 注册者（x-field 实例，逆查 warn / 分发用） */
    field: FieldDirective;
    /** 字段绝对状态路径（从 store.state 根起算，含 `$scopes.<id>.` 前缀） */
    absPath: string;
    /** 注册时的初始值深快照（reset 回滚 + dirty 判定基准） */
    initial: any;
    /** 桥接副本：当前校验错误（store.errors 非响应式，经 value watcher 回调刷新，ADR-0045 决策 5） */
    error: string | undefined;
    /** 桥接副本：字段值是否偏离初始快照 */
    dirty: boolean;
}

/**
 * 解析简单路径的**绝对状态路径**（从 store.state 根起算）：
 * 路径首段沿 parent 链查找所属容器——命中某层 `_data`（私有域 / 挂载容器）则拼该容器
 * 前缀；全链未命中视为全局路径原样返回。
 *
 * 供 x-form / x-field 统一推导字段绝对路径（form 的精准订阅 / 快照 / getState(true) 与
 * 控件形态内部 model 的读写目标都依赖它——绝对路径保证 with 求值与 setVal 写入同位）。
 */
export function resolveFieldAbsPath(scope: AutoSparkScope, expr: string): string {
    const first = expr.split(".")[0]!;
    let s: AutoSparkScope | null = scope;
    while (s) {
        if (s._data && Object.prototype.hasOwnProperty.call(s._data, first)) {
            // path 模式（mount:'x.y'）的 _data 指向挂载容器（不在 $scopes 下）——取其真实容器段
            const dd = s.directives.find(
                (d): d is DataDirective => d instanceof DataDirective && d.isPathMode(),
            );
            const prefix = dd ? dd.getMountSegments() : [SCOPES_KEY, String(s.id)];
            return [...prefix, ...splitPath(expr)].join(".");
        }
        s = s.parent;
    }
    return expr;
}

/**
 * x-form：表单域指令（仅 `<form>` 元素，ADR-0045）。
 *
 * **表单行为壳**：submit 拦截 + 校验门 + reset 快照回滚 + 元数据中心化监听 + `$form` 注入。
 * 只处理表单逻辑，不处理模板和渲染。
 *
 * ## 状态基座（ADR-0045 决策 1/2）
 *
 * 继承 DataDirective——literal / url / action 三值形态与 `<script type="autospark/data">`
 * stash 消费全额继承；mount **强制 local**（恒私有域 `$scopes[id]`，mount/global 选项拦截 + warn）。
 *
 * ## 值形态终表（决策 2）
 *
 * - `x-form`（空）/ `x-form="{...}"` / url / action：走 x-data 同款数据管道（空值建空域）；
 * - `x-form="login"`（状态路径）：**不建域**——binding.read 命中（`$scopes` 祖先链优先、全局
 *   兜底，聚合视图天然实现该序）即建立**路径上下文**（后代 x-field 相对路径拼接，决策 4），
 *   未命中 warn 后退化为行为壳；此形态下数据脚本 stash 冲突忽略 + warn。
 *
 * ## 中心化监听（决策 4）
 *
 * x-field 编译期注册（`registerField`），form 统一建立并持有订阅，destroy 统一回收：
 * - **value watcher**（`store.watch(absPath)`）：字段值变更 → 刷新 error 副本（errors 非响应式，
 *   但校验只发生在写入路径——value 回调时 errors 已就绪，天然闭环）+ dirty 重算 + refresh；
 * - **schema watcher**（`cm.watch(fullKey, {depth:2})`，schema 存在时）：元数据字面量改写
 *   （enable/visible 等）→ refresh 驱动 `$field` 元数据读取重求值。
 *
 * ## 表单行为（决策 8）
 *
 * - **submit**：恒 `preventDefault`（拦截原生提交，`action` 属性留给无 JS 降级）；
 *   `validateOnSubmit`（默认开）时逐注册字段跑 schema.validate（同步直调）+ `store.errors`
 *   存量检查，任一存在错 → `stopImmediatePropagation` 阻止放行（`@submit` action 不触发）；
 *   校验通过 → 放行后续 listener（action 执行）。form 的 listener 先于 `@submit` 注册
 *  （priority 200 > on 50），`stopImmediatePropagation` 即「校验门」。
 * - **reset**：恒 `preventDefault` + 逐字段 `setVal` 回初始深快照 + 清 error/dirty + refresh
 *  （原生 reset 只重置 DOM 不重置 state，状态驱动架构下必须接管）。
 *
 * ## `$form`（决策 7）
 *
 * 注入宿主 scope 的 locals 层：`getState()`（无参 `{name:值}` / `getState(true)` `{path:value}`）、
 * `valid`、`errors`、`dirty`、`reset()`（与 reset 事件同管道）。均为桥接副本读取
 * （依赖收集不可见），更新经 refresh 驱动重求值。
 */
export class FormDirective extends DataDirective {
    /** 注册字段（文档序）；键 = 字段绝对路径（去重：同路径多 x-field 只注册一次订阅） */
    private fields = new Map<string, FormFieldEntry>();
    /** 字段名注册表（getState 无参形态的键冲突检测：后者覆盖 + warn，ADR-0045 决策 7） */
    private fieldNames = new Map<string, string>();
    /** 中心化监听持有的 watcher（value + schema，destroy 统一 off） */
    private formWatchers: Watcher[] = [];
    /** 路径形态解析出的相对路径上下文（`x-form="login"` → "login"）；其余形态为 null */
    pathContext: string | null = null;
    /** 宿主元素事件回调（submit/reset，箭头函数绑定 this 供移除同引用） */
    private onSubmit = (e: SubmitEvent) => this._handleSubmit(e);
    private onReset = (e: Event) => this._handleReset(e);
    /** 事件实际挂载的宿主（容器自身形态下为 engine.el，见 created 宿主修正） */
    private _hostEl: HTMLElement | null | undefined = undefined;
    /** x-form-options.onInvalid 缓存（submit 校验门的消息回退来源之一） */
    private formOnInvalid: string | undefined;

    override created() {
        const el = this.el;
        // 宿主约束（决策 2）：仅 <form> 元素合法——warn 后宽容继续（行为壳照常，便于渐进修复）
        if (el && !(el instanceof HTMLFormElement)) {
            this.warn("x-form: 仅能声明在 <form> 元素上（其他元素行为不受保证，ADR-0045 决策 2）");
        }
        // mount 强制 local：拦截 mount/global 读取（resolveMode 得不 到非 local 值，ADR-0045 决策 2）
        const mountDeclared = this.getOption("mount") !== undefined || this.getOption("global") !== undefined;
        if (mountDeclared) {
            this.warn("x-form: 表单数据恒挂私有域（mount 强制 local），mount/global 选项已忽略（ADR-0045）");
        }
        // 表单级 onInvalid 默认值缓存（x-form-options；字段 schema 的 onInvalid 覆盖之，决策 9）
        const inv = this.getOption("onInvalid");
        if (typeof inv === "string") this.formOnInvalid = inv;

        const raw = String(this.value ?? "").trim();
        // 值分流（决策 2/4）。与 x-data 的关键分歧：**裸标识符优先按状态路径解析**
        //（x-data 的裸词是 action 取数；x-form 的裸词是指向已有状态的路径上下文）——
        // 路径未命中再回退 action 异步（编辑表单 action 拉初始数据的场景仍可用）。
        // url（/ http ./ ../ 前缀）与带括号 action 调用（`loadForm(1)`，非简单路径）不冲突，直接异步管道。
        const dataForm = detectDataForm(raw);
        let handled = false;
        if (dataForm !== "url" && isSimpleStatePath(raw)) {
            const hit = this.binding.read(raw);
            if (hit !== undefined) {
                // 路径形态：不建域，建立路径上下文（决策 4：后代 x-field 相对路径拼接）
                this.pathContext = raw;
                handled = true;
                // 数据脚本与路径形态冲突（数据归路径所有者管）：丢弃 stash + warn（读后即删语义）
                const stash = this.engine.compiler.consumeDataScriptStash(this.binding);
                if (stash) {
                    this.warn(
                        "x-form: 路径形态下 <script type=\"autospark/data\"> 数据脚本被忽略（数据归属路径所有者，ADR-0045 决策 2）",
                    );
                }
            }
            // 未命中：裸词回退 action 异步（落入下方 super）或彻底未命中 → warn 退化行为壳
            else if (dataForm !== "action") {
                this.warn(
                    `x-form: 路径 "${raw}" 在作用域链与全局状态中均不存在，退化为行为壳（字段请用绝对路径引用，ADR-0045 决策 2）`,
                );
                handled = true;
                void this.engine.compiler.consumeDataScriptStash(this.binding);
            }
        }
        if (!handled) {
            // 空 / literal / url / action（含裸词路径未命中回退）：x-data 同款数据管道
            super.created();
        }

        // $form 注入（决策 7）：locals 层（聚合视图第一优先级）+ 失效视图缓存。
        // 独立拷贝层（locals 可能是祖先共享引用——x-for item 等，直接加键会外溢污染）
        const scope = this.binding;
        scope.locals = { ...(scope.locals ?? {}), $form: this._buildFormContext() };
        scope.invalidateScopeView();

        // submit / reset 拦截（决策 8）：listener 注册先于 @submit（priority 200 > on 50，
        // created 先行）——校验门的 stopImmediatePropagation 才能拦住后续 action listener。
        // 宿主修正：x-form 挂在**挂载容器自身**时，binding.el 是 template 根的浅克隆（编译产物
        // 只挂子节点、容器保留原 el），事件挂克隆上永远收不到——经 binding.template ===
        // engine.template 判定根容器，挂到 engine.el 实容器
        const isRootContainer =
            !!this.binding.template && this.binding.template === this.engine.template;
        const host = (isRootContainer ? this.engine.el : el) ?? el;
        this._hostEl = host;
        host?.addEventListener("submit", this.onSubmit);
        host?.addEventListener("reset", this.onReset);
    }

    /** mount/global 恒不声明（resolveMode 读不到 → 恒 local，ADR-0045 决策 2） */
    override getOption(key: string): any {
        if (key === "mount" || key === "global") return undefined;
        return super.getOption(key);
    }

    /**
     * x-field 编译期注册（中心化监听入口，ADR-0045 决策 4）。
     *
     * - 同路径重复注册（一个字段多个 x-field 引用）：仅登记 field 引用（订阅一份）；
     * - value watcher：变更 → error 副本刷新（写入即校验，errors 已就绪）+ dirty 重算 + refresh；
     * - schema watcher：configManager 有该字段 schema 时 `cm.watch(fullKey,{depth:2})`——
     *   字面量元数据改写（enable/visible 等）驱动 refresh 重读。
     */
    registerField(field: FieldDirective): FormFieldEntry {
        const absPath = field.absPath;
        let entry = this.fields.get(absPath);
        if (entry) {
            // 同路径已注册：复用条目（订阅去重），字段引用保持首个（getState 名字冲突检测用最新）
            entry.field = field;
            return entry;
        }
        const state = this.engine.store.state as Record<string, any>;
        entry = {
            field,
            absPath,
            initial: _cloneDeep(getVal(state, absPath)),
            error: _readError(this.engine, absPath),
            dirty: false,
        };
        this.fields.set(absPath, entry);
        // value watcher：精准订阅绝对路径（含 $scopes 域前缀——state 树一部分）
        const store = this.engine.store;
        this.formWatchers.push(
            store.watch(absPath, () => {
                entry!.error = _readError(this.engine, absPath);
                entry!.dirty = !_valueEq(getVal(state, absPath), entry!.initial);
                this._scheduleRefresh();
            }),
        );
        // schema watcher：元数据字面量改写桥接（cm 是独立 AutoStore，字面量读取对根 store
        // 管线不可见——grilling 实测，ADR-0045 决策 5）
        const cm = (store as any).configManager;
        if (cm) {
            const fullKey = _toFullConfigKey(store as any, absPath);
            const schema = (cm.state as Record<string, any>)[fullKey];
            if (schema != null) {
                // 表单级 onInvalid 默认（决策 8/9）：schema 未显式声明时补 'pass'（写入即校验
                // 静默收集进 errors，不阻断输入；schema 显式声明覆盖表单默认）。就地补写共享
                // schema 对象——schema 随本 store 注册/注销（cm.remove），无跨表单污染
                if (schema.onInvalid === undefined) {
                    schema.onInvalid = typeof this.formOnInvalid === "string" ? this.formOnInvalid : "pass";
                }
                this.formWatchers.push(
                    cm.watch(fullKey, () => this._scheduleRefresh(), { depth: 2 } as any),
                );
            }
        }
        return entry;
    }

    /** 字段注册条目读取（$field.error 桥接副本的读取通道；无条目返回 undefined） */
    getFieldEntry(absPath: string): FormFieldEntry | undefined {
        return this.fields.get(absPath);
    }

    /**
     * 字段名解析（三层链，ADR-0045 决策 7/9）：
     * `x-field-options="{name}"` > `configurable(v,{name})` schema > 路径末段。
     * 注册时检测同名冲突（后者覆盖 + warn，决策 7）。
     */
    resolveFieldName(field: FieldDirective, schema: any): string {
        const optName = field.getOption("name");
        let name: string;
        if (typeof optName === "string" && optName !== "") {
            name = optName;
        } else if (typeof schema?.name === "string" && schema.name !== "") {
            name = schema.name;
        } else {
            name = field.absPath.split(".").pop()!;
        }
        const prev = this.fieldNames.get(name);
        if (prev !== undefined && prev !== field.absPath) {
            this.warn(
                `x-form: 字段名 "${name}" 冲突（${prev} 与 ${field.absPath} 解析出同名），后者覆盖（ADR-0045 决策 7）`,
            );
        }
        this.fieldNames.set(name, field.absPath);
        return name;
    }

    /** 校验门（决策 8）：schema.validate 同步直调 + store.errors 存量，任一存在错即返回 false */
    private _validateAll(): boolean {
        const store = this.engine.store;
        const state = store.state as Record<string, any>;
        for (const entry of this.fields.values()) {
            // 存量错误（写入即校验的累积）：命中即回填 entry.error（$field.error 显示用——
            // 同值写入不触发 value watcher，副本可能陈旧，此处强制刷新）
            const existing = _readError(this.engine, entry.absPath);
            if (existing !== undefined) {
                entry.error = existing;
                return false;
            }
            // schema.validate 直调（覆盖「初始值从未经历写入」的字段，ADR-0045 决策 8）
            const cm = (store as any).configManager;
            if (!cm) continue;
            const fullKey = _toFullConfigKey(store as any, entry.absPath);
            const schema = (cm.state as Record<string, any>)[fullKey];
            const validate = schema?.validate;
            if (typeof validate !== "function") continue;
            const current = getVal(state, entry.absPath);
            try {
                if (validate(current, current, splitPath(entry.absPath)) === false) {
                    // 校验失败消息入 errors 副本（供 $field.error 显示）
                    entry.error = _invalidMessage(schema, this.formOnInvalid, entry.absPath);
                    return false;
                }
            } catch (e: any) {
                entry.error = e?.message ?? String(e);
                return false;
            }
        }
        return true;
    }

    private _handleSubmit(e: SubmitEvent): void {
        // 恒拦截原生提交（action 属性留给无 JS 降级，决策 8）
        e.preventDefault();
        if (this.getOption("validateOnSubmit") === false) return; // 校验门关闭：直接放行
        if (!this._validateAll()) {
            // 阻止放行：拦截同元素后续 submit listener（@submit action），即「校验门」
            e.stopImmediatePropagation();
            this._scheduleRefresh();
        }
    }

    private _handleReset(e: Event): void {
        e.preventDefault();
        this.reset();
    }

    /** reset 管道（决策 8）：逐字段回初始深快照（拷贝回写，快照不被运行时变更污染）+ 清态 + refresh */
    reset(): void {
        const store = this.engine.store;
        const state = store.state as Record<string, any>;
        for (const entry of this.fields.values()) {
            setVal(state, splitPath(entry.absPath), _cloneDeep(entry.initial));
            entry.dirty = false;
            // 回滚后重跑一次自身写入以刷新 errors（回写可能触发校验；未触发的字段清副本）
            entry.error = _readError(this.engine, entry.absPath);
        }
        this._scheduleRefresh();
    }

    /** 桥接刷新：scheduler 微任务内重跑宿主 scope 全部绑定（含后代，ADR-0045 决策 5 refresh 通道） */
    private _scheduleRefresh(): void {
        this.engine.scheduler.schedule(() => this.binding.refresh());
    }

    /** `$form` 上下文对象（决策 7）：桥接副本 getter + 方法 */
    private _buildFormContext() {
        const form = this;
        const store = () => form.engine.store;
        return {
            /** 全部注册字段的校验错误聚合（`Record<字段路径, 信息>`；空对象 = valid） */
            get errors(): Record<string, string> {
                const out: Record<string, string> = {};
                for (const entry of form.fields.values()) {
                    if (entry.error !== undefined) out[entry.absPath] = entry.error;
                }
                return out;
            },
            /** 无任何校验错误即 true（桥接副本，refresh 驱动） */
            get valid(): boolean {
                for (const entry of form.fields.values()) {
                    if (entry.error !== undefined) return false;
                }
                return true;
            },
            /** 任一注册字段值 ≠ 初始快照即 true（决策 7：dirty 提前一版） */
            get dirty(): boolean {
                for (const entry of form.fields.values()) {
                    if (entry.dirty) return true;
                }
                return false;
            },
            /**
             * 聚合注册字段的当前值（字段可分散于状态树，故是方法而非 state 对象，决策 7）。
             *
             * @param byPath true → `{ path: value }`（键为完整状态路径）；缺省 → `{ name: 值 }`
             *（name 经三层解析：x-field-options > schema.name > 路径末段）
             */
            getState(byPath?: boolean): Record<string, any> {
                const state = (store().state as Record<string, any>);
                const out: Record<string, any> = {};
                for (const entry of form.fields.values()) {
                    const key = byPath === true ? entry.absPath : form.resolveFieldName(entry.field, entry.field.schema);
                    out[key] = getVal(state, entry.absPath);
                }
                return out;
            },
            /** 回初始快照（与原生 reset 按钮同一条管道，决策 8） */
            reset(): void {
                form.reset();
            },
        };
    }

    override destroy(): void {
        // 表单级行为资源回收（域数据回收归 super.destroy 的 DataDirective 管道）
        this._hostEl?.removeEventListener("submit", this.onSubmit);
        this._hostEl?.removeEventListener("reset", this.onReset);
        this._hostEl = null;
        for (const w of this.formWatchers) w.off();
        this.formWatchers.length = 0;
        this.fields.clear();
        this.fieldNames.clear();
        super.destroy();
    }
}

/** 深拷贝（structuredClone 优先，函数/undefined 等退化 JSON 拷贝；表单值以可结构化为主） */
function _cloneDeep(v: any): any {
    if (v == null || typeof v !== "object") return v;
    try {
        return structuredClone(v);
    } catch {
        try {
            return JSON.parse(JSON.stringify(v));
        } catch {
            return v;
        }
    }
}

/** 值等价判定（dirty 基准）：严格相等或 JSON 序列化等价（对象字段） */
function _valueEq(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null || typeof a !== "object" || typeof b !== "object") return false;
    try {
        return JSON.stringify(a) === JSON.stringify(b);
    } catch {
        return false;
    }
}

/** 读字段的校验错误（store.errors 懒创建普通对象，非响应式——恒安全直读，ADR-0045 决策 5） */
function _readError(engine: AutoSpark, absPath: string): string | undefined {
    const errors = (engine.store as any).errors as Record<string, string> | undefined;
    const msg = errors?.[absPath];
    return typeof msg === "string" && msg !== "" ? msg : undefined;
}

/** fullKey 拼接（复刻 configManager.add 的 joinPath，与 model.ts toFullConfigKey 同构） */
function _toFullConfigKey(store: any, statePath: string): string {
    const segs = splitPath(statePath);
    return (store.configKey ? [store.configKey, ...segs] : segs).join(".");
}

/** 校验失败消息：schema.errorMessage > 表单级 onInvalid 回退占位 > 通用文案 */
function _invalidMessage(schema: any, formOnInvalid: string | undefined, absPath: string): string {
    if (typeof schema?.errorMessage === "string" && schema.errorMessage !== "") {
        return schema.errorMessage;
    }
    if (formOnInvalid) return `${absPath}: ${formOnInvalid}`;
    return `字段 ${absPath} 校验失败`;
}
