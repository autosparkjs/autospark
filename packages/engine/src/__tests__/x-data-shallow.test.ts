import { describe, expect, test, afterEach } from "bun:test";
import "./setup";
import { AutoSpark } from "../engine";
import { mount, nextTick } from "./helpers";

/**
 * x-data 浅响应选项（ADR-0078）
 *
 * 五组：档位语义（0/1 档失效边界与整体替换唤醒）/ root·path 拒载 warn + 忽略 /
 * 三入口等价与归一表（含显式 options 键优先于修饰符）/ 异步落地与 engine.data()
 * 追加的自动继承（autostore 1 档惰性纳管，零特判）。
 */

/** 挂载并拦截 logger.warn（autostart:false + 手动 compile，编译期同步 warn 也可靠捕获） */
function mountCaptureWarn(html: string, state: any) {
    const root = document.createElement("div");
    root.innerHTML = html.trim();
    const engine = new AutoSpark(root, state, { autostart: false });
    const warns: string[] = [];
    (engine.logger as any).warn = (msg: any) => warns.push(String(msg));
    engine.compile();
    return { root, engine, warns };
}

/** 取首个私有域代理（单域测试约定；$scopes 容器自身未标记，读出即域浅代理） */
function firstScope(engine: AutoSpark): Record<string, any> {
    const scopes = engine.state.$scopes as Record<string, any>;
    return scopes[Object.keys(scopes)[0]!];
}

const engines: AutoSpark[] = [];
const mountCase = (html: string, state: any = {}) => {
    const m = mount(html, state);
    engines.push(m.engine);
    return m;
};
const mountWarnCase = (html: string, state: any = {}) => {
    const m = mountCaptureWarn(html, state);
    engines.push(m.engine);
    return m;
};

const realFetch = globalThis.fetch;

afterEach(() => {
    while (engines.length) engines.pop()?.destroy();
    (globalThis as any).fetch = realFetch;
});

describe("x-data 浅响应选项（ADR-0078）", () => {
    test("默认（无声明）：全深不变——第三层写照常触发更新", async () => {
        const { root, engine } = mountCase(
            `<div id="a" x-data="{user:{name:'张三',profile:{city:'北京'}}}">
               <span x-text="user.name"></span><em x-text="user.profile.city"></em>
             </div>`,
        );
        expect(root.querySelector("span")!.textContent).toBe("张三");
        firstScope(engine).user.profile.city = "上海";
        await nextTick();
        expect(root.querySelector("em")!.textContent).toBe("上海");
    });

    test("1 档：第二层字段写触发更新，第三层写静默失效", async () => {
        const { root, engine } = mountCase(
            `<div id="a" x-data="{user:{name:'张三',profile:{city:'北京'}}}" x-data-options="{shallow:1}">
               <span x-text="user.name"></span><em x-text="user.profile.city"></em>
             </div>`,
        );
        const scope = firstScope(engine);
        expect(root.querySelector("span")!.textContent).toBe("张三");
        // 第二层（user.name）：成员层浅代理 → 有事件
        scope.user.name = "李四";
        await nextTick();
        expect(root.querySelector("span")!.textContent).toBe("李四");
        // 第三层（user.profile.city）：读出即原始引用 → 无事件、DOM 不更新
        scope.user.profile.city = "上海";
        await nextTick();
        expect(root.querySelector("em")!.textContent).toBe("北京");
    });

    test("0 档（.shallow 修饰符）：键内字段深写静默失效，整体替换键值唤醒深路径订阅", async () => {
        const { root, engine } = mountCase(
            `<div id="a" x-data.shallow="{user:{name:'张三'}}"><span x-text="user.name"></span></div>`,
        );
        const scope = firstScope(engine);
        expect(root.querySelector("span")!.textContent).toBe("张三");
        // 键内字段直改：读出即原始引用 → 无通知，DOM 不更新（但数据本身已写入 raw）
        scope.user.name = "李四";
        await nextTick();
        expect(root.querySelector("span")!.textContent).toBe("张三");
        expect(scope.user.name).toBe("李四");
        // 顶层键整体替换：容器代理 set 事件 + 为已订阅后代派生通知 → 深路径订阅被唤醒
        scope.user = { name: "王五" };
        await nextTick();
        expect(root.querySelector("span")!.textContent).toBe("王五");
    });

    test("root 形态（.global）声明 shallow：warn + 忽略，保持全深响应", async () => {
        const { root, engine, warns } = mountWarnCase(
            `<div id="a" x-data.global="{user:{name:'张三'}}" x-data-options="{shallow:1}">
               <span x-text="user.name"></span>
             </div>`,
        );
        expect(root.querySelector("span")!.textContent).toBe("张三");
        expect(warns.some((w) => w.includes("shallow 仅支持默认私有域") && w.includes("根挂载"))).toBe(
            true,
        );
        // 全深保留：深层写照常触发
        engine.state.user.name = "李四";
        await nextTick();
        expect(root.querySelector("span")!.textContent).toBe("李四");
    });

    test("path 形态（mount）声明 shallow：warn + 忽略，挂载容器保持全深响应", async () => {
        const { root, engine, warns } = mountWarnCase(
            `<div id="a" x-data="{user:{name:'张三'}}" x-data-options="{mount:'cfg', shallow:1}">
               <span x-text="cfg.user.name"></span>
             </div>`,
        );
        expect(root.querySelector("span")!.textContent).toBe("张三");
        expect(warns.some((w) => w.includes("shallow 仅支持默认私有域") && w.includes("路径挂载"))).toBe(
            true,
        );
        engine.state.cfg.user.name = "李四";
        await nextTick();
        expect(root.querySelector("span")!.textContent).toBe("李四");
    });

    test("三入口等价：{shallow:true} 与 {shallow:0} 同为 0 档（≡ .shallow 修饰符）", async () => {
        const html = (opt: string) =>
            `<div id="a" x-data="{user:{name:'张三'}}" ${opt}><span x-text="user.name"></span></div>`;
        for (const opt of [`x-data-options="{shallow:true}"`, `x-data-options="{shallow:0}"`]) {
            const { root, engine } = mountCase(html(opt));
            firstScope(engine).user.name = "李四";
            await nextTick();
            expect(root.querySelector("span")!.textContent).toBe("张三"); // 0 档：深写静默
        }
    });

    test("归一表：{shallow:2} warn 归 1 档；非法值 warn 忽略保持全深；{shallow:'true'} ≡ 0 档", async () => {
        // {shallow:2} → warn + 归 1：第二层写触发
        {
            const { root, engine, warns } = mountWarnCase(
                `<div id="a" x-data="{user:{name:'张三'}}" x-data-options="{shallow:2}">
                   <span x-text="user.name"></span>
                 </div>`,
            );
            expect(warns.some((w) => w.includes("已归 1"))).toBe(true);
            firstScope(engine).user.name = "李四";
            await nextTick();
            expect(root.querySelector("span")!.textContent).toBe("李四");
        }
        // 非法值 → warn + 忽略：全深（第三层写触发）
        {
            const { root, engine, warns } = mountWarnCase(
                `<div id="a" x-data="{user:{name:'张三',profile:{city:'北京'}}}" x-data-options="{shallow:'x'}">
                   <em x-text="user.profile.city"></em>
                 </div>`,
            );
            expect(warns.some((w) => w.includes("保持全深"))).toBe(true);
            firstScope(engine).user.profile.city = "上海";
            await nextTick();
            expect(root.querySelector("em")!.textContent).toBe("上海");
        }
        // 字符串宽容：{shallow:'true'} ≡ 0 档
        {
            const { root, engine } = mountCase(
                `<div id="a" x-data="{user:{name:'张三'}}" x-data-options="{shallow:'true'}">
                   <span x-text="user.name"></span>
                 </div>`,
            );
            firstScope(engine).user.name = "李四";
            await nextTick();
            expect(root.querySelector("span")!.textContent).toBe("张三");
        }
    });

    test("显式 options 键优先于 .shallow 修饰符（决策 5）：同写取 1 档", async () => {
        const { root, engine } = mountCase(
            `<div id="a" x-data.shallow="{user:{name:'张三'}}" x-data-options="{shallow:1}">
               <span x-text="user.name"></span>
             </div>`,
        );
        firstScope(engine).user.name = "李四";
        await nextTick();
        expect(root.querySelector("span")!.textContent).toBe("李四"); // 1 档胜出
    });

    test("数据脚本入口：options 属性承载 shallow ≡ x-data-options（1 档）", async () => {
        const { root, engine } = mountCase(
            `<div id="host" x-data>
               <script type="autospark/data" options="{shallow:1}">
                 { user: { name: '张三', profile: { city: '北京' } } }
               </script>
               <span x-text="user.name"></span><em x-text="user.profile.city"></em>
             </div>`,
        );
        const scope = firstScope(engine);
        scope.user.name = "李四";
        await nextTick();
        expect(root.querySelector("span")!.textContent).toBe("李四");
        scope.user.profile.city = "上海";
        await nextTick();
        expect(root.querySelector("em")!.textContent).toBe("北京");
    });

    test("自动继承（engine.data 运行时追加）：后写入键继承域档位（1 档惰性纳管）", async () => {
        const { root, engine } = mountCase(
            `<div id="a" x-data="{n:1}" x-data-options="{shallow:1}">
               <span x-text="o.title"></span><em x-text="o.meta.k"></em>
             </div>`,
        );
        engine.data(root.querySelector("#a")!, { o: { title: "t1", meta: { k: "v0" } } });
        await nextTick();
        expect(root.querySelector("span")!.textContent).toBe("t1");
        const scope = firstScope(engine);
        // 追加键的第二层写：有事件
        scope.o.title = "t2";
        await nextTick();
        expect(root.querySelector("span")!.textContent).toBe("t2");
        // 追加键的第三层写：静默失效
        scope.o.meta.k = "v1";
        await nextTick();
        expect(root.querySelector("em")!.textContent).toBe("v0");
    });

    test("自动继承（异步 url 落地）：响应数据落浅域，档位照常生效", async () => {
        (globalThis as any).fetch = async () => ({
            ok: true,
            status: 200,
            json: async () => ({ user: { name: "张三", profile: { city: "北京" } } }),
        });
        const { root, engine } = mountCase(
            `<div id="host" x-data="/api/user" x-data-options="{shallow:1}">
               <span x-text="user.name"></span><em x-text="user.profile.city"></em>
             </div>`,
        );
        await new Promise<void>((r) => setTimeout(r, 0)); // 等 fetch 微任务链 + scheduler flush
        expect(root.querySelector("span")!.textContent).toBe("张三");
        const scope = firstScope(engine);
        scope.user.name = "李四";
        await nextTick();
        expect(root.querySelector("span")!.textContent).toBe("李四");
        scope.user.profile.city = "上海";
        await nextTick();
        expect(root.querySelector("em")!.textContent).toBe("北京");
    });
});
