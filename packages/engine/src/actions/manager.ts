/**
 * ActionManager —— action 管理单元（自 engine/compiler 提炼，行为不变；ADR-0036 元数据化）。
 *
 * 统一收编 action 的**注册、规范化、包装与模板提取**四条脉络（原散落于 engine 构造函数、
 * engine.actions Proxy、compiler `_extractScriptActions`）：
 *
 * 1. **全局表**（`options.actions`）：构造期 `registerGlobals()` 一次性扫描规范化包装；
 * 2. **全局 Proxy**（`proxy` getter）：`engine.actions[name] = decl` 赋值即自动规范化包装（set trap）；
 * 3. **模板提取**（`extractScript`）：`<script type="autospark/actions">` 内容解析与注入
 *    （global 标志分流全局/局部，ADR-0012）。
 *
 * 三入口均经 `_normalize` **存储层全量规范化**（ADR-0036 决策 1）：函数简写 | 对象写法 →
 * `ActionDesc` 描述符（name 以注册键注入、handle 经 buildAction 包装），`engine.actions` 与
 * `scope.actions` 的值恒为描述符；非法声明（非函数、对象缺 `handle` / `handle` 非函数）记
 * error 日志后**跳过该条**（决策 2）。
 *
 * **职责边界**：scope 链查找（`scope.getAction`）与 `scope.actions` 字段归 scope 域
 * （与 getData/getComponent/getMethod 的 parent 链就近 + 全局兜底范式同构），不在本管理单元内；
 * 提取入口的 scope 解析（`_findNearestScope`）依赖 compiler 私有 templateScopeMap，由 compiler
 * 查好后作为入参传入。
 */
import type { AutoSpark } from "../engine";
import type { AutoSparkScope } from "../scope";
import { buildAction } from "./buildAction";
import type { ActionDecl, ActionDesc } from "./types";

/**
 * 内置信号型全局 action（ADR-0036 决策 7）：yes / no / cancel / close。
 *
 * handle 为**参数透传**（`close(1)` → resolved 广播 `result:1`）：价值不在执行体而在**广播语义**——
 * 模板任意元素 `@click="close"` 触发，祖先监听 `action:close` DOM 冒泡事件（或总线
 * `actions/close/*`）即可实现关闭对话框、确认/取消等通用交互，无需为每个对话框手写空 action；
 * 透传首参让信号可携带载荷（如 `close("cancel-icon")`、`yes(formData)`），监听方从
 * `detail.result` / `$event.detail.result` 读取。value=title 供 UI 消费。
 * 用户同名声明**覆盖**内置（registerGlobals 先扫用户声明、后补缺失键，用户优先）。
 */
const BUILTIN_ACTIONS: Record<string, string> = {
    yes: "确认",
    no: "否",
    cancel: "取消",
    close: "关闭",
};

export class ActionManager {
    readonly engine: AutoSpark<any>;

    /** actions 代理（set 时自动规范化 + buildAction 包装，懒构造） */
    private _proxy: Record<string, ActionDesc> | null = null;

    constructor(engine: AutoSpark<any>) {
        this.engine = engine;
    }

    /**
     * 全局事件 action 表（来自 options.actions），作为 scope.getAction 查找链的终点。
     *
     * 返回 Proxy：**赋值即自动规范化包装**——`engine.actions.save = decl`（函数简写或对象写法）
     * 时经 `_normalize` 规范化为 ActionDesc（name 注入 + buildAction 包装，获得
     * `actions/<name>/*` 生命周期广播）后写入底层 options.actions；读取、遍历、getAction
     * 均透明（get 默认转发底层）。非法声明 error + 不写入（跳过该条）。故 action 注册即追踪，无需手动包装。
     */
    get proxy(): Record<string, ActionDesc> {
        if (this._proxy) return this._proxy;
        // target 运行时恒存 ActionDesc（规范化后写入）；options.actions 的声明类型
        // Record<string, ActionDecl> 描述的是构造入参形态，读取侧断言收敛
        const target = this.engine.options.actions! as Record<string, ActionDesc>;
        this._proxy = new Proxy(target, {
            set: (t, key: string, value: any) => {
                const desc = this._normalize(key, value);
                if (desc) t[key] = desc;
                return true;
            },
        });
        return this._proxy;
    }

    /**
     * 构造期注册：options.actions 一次性扫描规范化包装，末尾补内置信号型 action 缺失键
     * （ADR-0036 决策 7——用户同名声明先扫先占，覆盖内置）。
     * engine 构造函数调用；运行时赋值走 `proxy` 的 set trap，模板声明走 `extractScript`。
     * 非法条目 error 日志后删除（getAction 链读不到、不残存原值）。
     */
    registerGlobals(): void {
        const initActions = this.engine.options.actions!;
        for (const k of Object.keys(initActions)) {
            const desc = this._normalize(k, initActions[k]);
            if (desc) initActions[k] = desc;
            else delete initActions[k];
        }
        // 内置信号型 action 只补用户未占用的键（用户优先）；handle 透传首参作信号载荷
        for (const [k, title] of Object.entries(BUILTIN_ACTIONS)) {
            if (!(k in initActions)) {
                initActions[k] = buildAction(
                    (type, payload) => this.engine.emit(type as any, payload),
                    { handle: (payload?: any) => payload, name: k, title, builtin: true },
                );
            }
        }
    }

    /**
     * 提取 `<script type="autospark/actions">` 内容为 action 并注册（注入目标由 `global` 标志决定）：
     * - 默认（无 global）：**局部 action** → 注入最近祖先 scope.actions（buildAction local=true，只 DOM 冒泡）。
     * - `global` 标志（`<script type="autospark/actions" global>`）：**全局 action** → 注入 engine.actions
     *   （Proxy set trap 自动规范化包装，双发总线+DOM），供任意 scope 经 getAction 终点查到。
     *
     * 内容须为对象字面量（如 `{ pay(v){...}, submit:{title,handle} }`，两种写法可混用，ADR-0036），
     * 经 new Function 求值得对象。求值失败或非对象记日志；非法条目（缺 handle 等）error + 逐条跳过；
     * 局部模式无祖先 scope（入参 undefined）则忽略。返回 null 表示剪枝——script 不进渲染 DOM。
     * 普通 `<script>`（无 type 或其他 type）不匹配调用方的 transformer，经 transformElement 默认路径原样保留。
     *
     * @param script 模板中的 action 声明 script 元素
     * @param scope  最近祖先 scope（由 compiler 经 templateScopeMap 解析后传入；global 分支不消费）
     */
    extractScript(script: HTMLScriptElement, scope: AutoSparkScope | undefined): null {
        const text = script.textContent?.trim();
        if (!text) return null;
        let parsed: Record<string, ActionDecl>;
        try {
            const result = new Function(`return (${text})`)();
            if (!result || typeof result !== "object") {
                this.engine.logger.error(`<script type="autospark/actions"> 内容须为对象字面量`);
                return null;
            }
            parsed = result;
        } catch (e: any) {
            this.engine.logger.error(`<script type="autospark/actions"> 解析失败: ${e?.message ?? e}`);
            return null;
        }
        // global 标志（`<script type="autospark/actions" global>`）：声明全局 action，注入 engine.actions
        // （Proxy set trap 自动规范化包装，local=false 双发总线+DOM），供任意 scope
        // 经 getAction 终点查到；不依赖最近祖先 scope，可在模板任意位置声明。
        if (script.hasAttribute("global")) {
            // 与 proxy set trap 同构（_normalize + 写底层表），直写免类型摩擦
            for (const [k, decl] of Object.entries(parsed)) {
                const desc = this._normalize(k, decl);
                if (desc) this.engine.options.actions![k] = desc;
            }
            return null;
        }
        if (scope) {
            // 默认局部 action：buildAction local=true，只 DOM 冒泡、不进总线（ADR-0012 避免同名串扰）；
            // 祖先聚合经 DOM action:<name> 冒泡隔离作用域
            const wrapped: Record<string, ActionDesc> = {};
            for (const [k, decl] of Object.entries(parsed)) {
                const desc = this._normalize(k, decl, true);
                if (desc) wrapped[k] = desc;
            }
            scope.actions = { ...scope.actions, ...wrapped };
        }
        return null;
    }

    /**
     * 声明形态规范化（ADR-0036 决策 1/2/3）：函数简写 | 对象写法 → ActionDesc。
     *
     * - 函数简写 ≡ `{ handle: fn }`（一等公民形态，非 deprecated）；
     * - 对象写法浅拷贝入存（不突变调用方源对象），`handle` 缺失/非函数 → error 日志 + 返回 null（跳过该条）；
     * - `name` 以注册键统一注入覆盖（决策 3）：descriptor 自知其名，用户声明里的 name 不生效；
     * - handle 经 buildAction 包装（descriptor 级防重包装，重复赋值同一 handle 不双重广播）。
     *
     * @returns 规范化后的描述符；null 表示非法声明，调用方跳过该条
     */
    private _normalize(name: string, decl: unknown, local = false): ActionDesc | null {
        let desc: ActionDesc;
        if (typeof decl === "function") {
            desc = { handle: decl as (...args: any[]) => any, name };
        } else if (
            decl &&
            typeof decl === "object" &&
            typeof (decl as ActionDesc).handle === "function"
        ) {
            // 入参可能是已规范化的描述符（重复/跨名赋值）：解包出原始 handle 重包装，
            // 广播名跟随本次注册键（原包装闭包捕获的是旧 name）
            const h = (decl as ActionDesc).handle;
            const raw = ((h as any).__buildActionWrapped ? (h as any).__rawAction : h) as (
                ...args: any[]
            ) => any;
            desc = { ...(decl as object), handle: raw, name } as ActionDesc;
        } else {
            this.engine.logger.error(
                `action "${name}" 声明非法：须为函数或含函数 handle 的对象，已跳过（ADR-0036）`,
            );
            return null;
        }
        desc.name = name;
        return buildAction((type, payload) => this.engine.emit(type as any, payload), desc, local);
    }
}
