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
 * `ActionDesc` 描述符（id 以注册键注入、handle 经 buildAction 包装），`engine.actions` 与
 * `scope.actions` 的值恒为描述符；非法声明（非函数、对象缺 `handle` / `handle` 非函数）记
 * error 日志后**跳过该条**（决策 2）。
 *
 * **职责边界**：scope 链查找（`scope.getAction`）与 `scope.actions` 字段归 scope 域
 * （与 getData/getComponentDeclaration/getMethod 的 parent 链就近 + 全局兜底范式同构），不在本管理单元内；
 * 提取入口的 scope 解析（`_findNearestScope`）依赖 compiler 私有 templateScopeMap，由 compiler
 * 查好后作为入参传入。
 *
 * **内置 action**：信号型全局 action（yes/no/cancel/close）的表与构造/补齐逻辑在 `builtins.ts`
 * （ADR-0036 决策 7），`registerGlobals` 末尾调用补用户未占用的键。
 */
import type { AutoSpark } from "../../engine/engine";
import type { AutoSparkScope } from "../../engine/scope";
import type { AutoSparkAction } from "./types";
export declare class ActionManager {
    readonly engine: AutoSpark<any>;
    /** actions 代理（set 时自动规范化 + buildAction 包装，懒构造） */
    private _proxy;
    constructor(engine: AutoSpark<any>);
    /**
     * 全局事件 action 表（来自 options.actions），作为 scope.getAction 查找链的终点。
     *
     * 返回 Proxy：**赋值即自动规范化包装**——`engine.actions.save = decl`（函数简写或对象写法）
     * 时经 `_normalize` 规范化为 ActionDesc（id 注入 + buildAction 包装，获得
     * `actions/<name>/*` 生命周期广播）后写入底层 options.actions；读取、遍历、getAction
     * 均透明（get 默认转发底层）。非法声明 error + 不写入（跳过该条）。故 action 注册即追踪，无需手动包装。
     */
    get proxy(): Record<string, AutoSparkAction>;
    /**
     * 构造期注册：options.actions 一次性扫描规范化包装，末尾补内置信号型 action 缺失键
     * （ADR-0036 决策 7——用户同名声明先扫先占，覆盖内置）。
     * engine 构造函数调用；运行时赋值走 `proxy` 的 set trap，模板声明走 `extractScript`。
     * 非法条目 error 日志后删除（getAction 链读不到、不残存原值）。
     */
    registerGlobals(): void;
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
    extractScript(script: HTMLScriptElement, scope: AutoSparkScope | undefined): null;
    /**
     * 声明形态规范化（ADR-0036 决策 1/2/3）：函数简写 | 对象写法 → ActionDesc。
     *
     * - 函数简写 ≡ `{ handle: fn }`（一等公民形态，非 deprecated）；
     * - 对象写法浅拷贝入存（不突变调用方源对象），`handle` 缺失/非函数 → error 日志 + 返回 null（跳过该条）；
     * - `id` 以注册键统一注入覆盖（决策 3）：descriptor 自知其 id，用户声明里的 id 不生效；
     * - handle 经 buildAction 包装（descriptor 级防重包装，重复赋值同一 handle 不双重广播）。
     *
     * @returns 规范化后的描述符；null 表示非法声明，调用方跳过该条
     */
    private _normalize;
}
