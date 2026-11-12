import type { AutoSpark } from "../../engine/engine";
import type { AutoSparkScope } from "../../engine/scope";
import type { ScopeT } from "../../features/locale/translate";
import type { AutoSparkActionContext } from "./types";
import { createDirectiveOptions } from "../../features/directive/utils/createDirectiveOptions";
import { getDirectiveGlobalDefaults } from "../../features/directive/utils/getDirectiveGlobalDefaults";

/**
 * 匹配"标识符"或"标识符(参数)"：^Identifier(.Identifier)* 可选 (args)
 * - `submit`      → name="submit", argsSrc=undefined（无括号）
 * - `submit()`    → name="submit", argsSrc=""（空括号）
 * - `pay(1, x)`   → name="pay",    argsSrc="1, x"
 * - `order.add(1)` → name="order.add", argsSrc="1"（点号名 action：资源方法平铺点号名，如
 *   `x-resource`/`autospark/resources` 生成的 `order.get` 等，注册后即可 `@click="order.get(1)"` 调用）
 * - `count++` / `a + b` → 不匹配（含运算符），无 name，走表达式兜底
 * - `user.name`（点号属性访问、未注册同名 action）→ 匹配 name="user.name"，method/action
 *   均未命中后**仍走表达式兜底**（查找顺序不变，无破坏；仅当注册了点号名 action 才分叉）
 */
const ACTION_RE = /^([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*(?:\(([\s\S]*)\))?$/;

/**
 * 构造事件业务 handler：**Action 优先 + 表达式兜底**。
 *
 * **关键：Action 查找延迟到事件触发时**（闭包内调 `scope.getAction`）——因 actions 可能在
 * 指令 `created` 之后才注册（`engine.actions` 赋值、`<script type="autospark/actions">` 注入均晚于
 * 编译）。若在 created 时缓存 action 引用，会查到 undefined 误走表达式。
 *
 * 仅"表达式编译"（`new Function`，expr 不变）与"args 求值器"在 created 时一次性完成。
 *
 * 求值异常均记 `engine.logger.error` 不中断（复用 `scope.ts` watchExpression 宽松求值模式）。
 *
 * @returns `(event) => void` 闭包，捕获 engine/scope/el/$options
 */
export function createEvalHandler(
    expr: string,
    engine: AutoSpark,
    scope: AutoSparkScope,
    el: HTMLElement,
    directiveOptions: Record<string, any> | undefined,
    hostOptions: Record<string, any> | null | undefined,
): (event: Event) => any {
    const trimmed = expr.trim();
    const match = trimmed.match(ACTION_RE);

    // 预编译（expr 不变，created 时完成）：
    // - name：ACTION_RE 提取的标识符（可含点号）；每次触发时据它查 action
    // - argsFn：name(args) 的参数求值器，返回数组；无参数时为 null
    // - exprGetter：表达式兜底求值器（action 未命中时用）
    const name = match?.[1];
    const argsSrc = match?.[2];
    // `t` 经 getter 函数参数注入表达式环境（ADR-0136）：with 链上无 `t` 标识符才落到该参数
    const argsFn =
        argsSrc != null && argsSrc.trim() !== ""
            ? (new Function("$event", "data", "t", `with(data){return [${argsSrc}];}`) as (
                  $event: Event,
                  data: any,
                  t?: ScopeT,
              ) => any[])
            : null;
    const compileGetter = (body: string) =>
        new Function("$event", "data", "t", body) as ($event: Event, data: any, t?: ScopeT) => any;
    let exprGetter: ReturnType<typeof compileGetter>;
    try {
        // 单表达式形态：包 return 取返回值（.feedback 等 wrapper 依赖返回值冒泡，ADR-0008）
        exprGetter = compileGetter(`with(data){return (${trimmed});}`);
    } catch {
        // 多语句退化（Alpine 惯用副作用写法，如 `flag = true; setTimeout(...)`）：
        // 多语句包 return 是 SyntaxError——整段降级为语句体执行（无返回值，副作用型本就不依赖）
        exprGetter = compileGetter(`with(data){${trimmed};}`);
    }

    // 指令配置聚合视图（ADR-0007 + 全局层 ADR-0127；本文件为 x-on 专用，指令名恒 "on"）：
    // created 时构造一次，闭包捕获，事件触发时复用；全局层以解析器注入——$options 每次访问活读
    const $options = createDirectiveOptions(
        directiveOptions,
        hostOptions,
        () => getDirectiveGlobalDefaults(engine, "on"),
    );
    // 返回值冒泡（ADR-0008）：action/表达式分支的返回值经管道透传，供 .feedback 等 wrapper 捕获
    // （如 async action 返回的 Promise）。同步抛错经 catch logger 后 rethrow，供 .feedback 检测同步失败（ADR-0013）。
    return (event) => {
        // 聚合数据视图：localData + data + 全局 state，供表达式 with 求值与 ctx.data（写入透传 data）
        const data = scope.getContext();
        // 1) 组件 method 优先（ADR-0022 决策二-3 修订）：组件内部方法，this=Proxy。
        //    method 经组件边界查找（不穿透父组件）；经 Proxy get 取出时自动 bind 其**所属组件实例**
        //    的 Proxy（_findMethodOwner），保证 method 内 this 与所属组件的钩子 this 一致。
        if (name) {
            const method = scope.getMethod?.(name);
            if (typeof method === "function") {
                try {
                    const args = argsFn ? argsFn(event, data, scope.getT()) : [];
                    // 经当前 scope 的 Proxy get 陷阱取 method（触发 _findMethodOwner + bind owner proxy），
                    // 再调用——比 method.call(scope.getMethodThis()) 更准（后者 this 绑当前 scope 非 owner）。
                    const proxy = scope.getMethodThis();
                    return (proxy as any)[name](...args);
                } catch (e: any) {
                    engine.logger.error(`x-on method "${name}" 执行失败: ${e?.message ?? e}`);
                    throw e;
                }
            }
        }
        // 2) Action 兜底：每次触发时查 scope.getAction（actions 可能后于 created 注册）。
        //    值恒为 ActionDesc 描述符（ADR-0036），取 .handle 调用——模板侧行为不变
        if (name) {
            const action = scope.getAction(name);
            if (action) {
                const ctx: AutoSparkActionContext = {
                    el,
                    $event: event,
                    data,
                    scope,
                    store: engine.store,
                    globalState: engine.store.state,
                    engine,
                    $options,
                };
                try {
                    const args = argsFn ? argsFn(event, data, scope.getT()) : [];
                    return action.handle.call(ctx, ...args);
                } catch (e: any) {
                    // logger 后 rethrow（ADR-0013）：让 .feedback 等 wrapper 检测同步失败。
                    // 冒泡错误由 OnDirective finalHandler / debounce setTimeout 兜底吞掉（防 uncaught）。
                    engine.logger.error(`x-on action "${name}" 执行失败: ${e?.message ?? e}`);
                    throw e;
                }
            }
        }
        // 2) 表达式兜底：覆盖 alert(1)、全局/模板函数 pay(1)、count++ 等
        try {
            return exprGetter(event, data, scope.getT());
        } catch (e: any) {
            engine.logger.error(`x-on 表达式 "${expr}" 求值失败: ${e?.message ?? e}`);
        }
    };
}
