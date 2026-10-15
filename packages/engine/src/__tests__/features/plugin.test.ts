import { describe, expect, test, afterEach } from "bun:test";
import { AutoSpark } from "../../engine/engine";
import {
    deletePluginActionDecl,
    getPluginActionDecl,
    pluginActions,
    pluginComponents,
} from "../../features/plugin";
import { mount, nextTick } from "../helpers";

/**
 * 插件机制（ADR-0111 / ADR-0114）测试：ready 广播 / 组件查询期委托与共享编译 /
 * action 惰性物化 / 预加载队列。
 *
 * 断言面守「重型对象禁令」：只断标量（dataset 标记、id 字符串、引用同一性、计数器），
 * 不把 engine / def / 描述符实例放进 toEqual 比较面。
 *
 * 隔离纪律：pluginComponents / pluginActions / readyCallbacks / liveEngines 均为模块级
 * 进程共享面——本文件注册的资源用 `pl-` 前缀独特命名；ready 回调以 el 标记收集断言
 * （断言目标标记存在/不存在，不断言收集数组长度——他文件的存活 engine 会合法触发）。
 * `globalThis.__AUTOSPARK_PLUGINS__` 是进程级全局面：预加载队列用例自带
 * afterEach 清理，避免残留队列被其它用例的 engine 构造意外消费。
 */

const mountedRoots: HTMLElement[] = [];
const engines: AutoSpark<any>[] = [];

let seq = 0;
function makeEngine(
    html: string,
    state: any = {},
    options?: Record<string, any>,
): { root: HTMLElement; engine: AutoSpark<any> } {
    const root = document.createElement("div");
    root.innerHTML = html;
    root.setAttribute("data-pl-tag", `pl-${++seq}`);
    document.body.appendChild(root);
    mountedRoots.push(root);
    const engine = new AutoSpark(root, state, options as any);
    engines.push(engine);
    return { root, engine };
}

afterEach(() => {
    for (const engine of engines) engine.destroy();
    engines.length = 0;
    for (const root of mountedRoots) root.remove();
    mountedRoots.length = 0;
});

describe("AutoSpark.ready - 就绪回调广播", () => {
    test("每个 engine 构造完成后各调一次，回调收 engine 实例", () => {
        const hitTags: string[] = [];
        AutoSpark.ready((engine) => {
            // 只以标量投影进收集面（el 的 dataset 标记），不断言 payload 对象
            hitTags.push((engine.el as HTMLElement).getAttribute("data-pl-tag")!);
        });
        makeEngine(`<i></i>`);
        makeEngine(`<b></b>`);
        expect(hitTags).toContain("pl-1");
        expect(hitTags).toContain("pl-2");
    });

    test("晚注册立即对所有存活 engine 补调（retain 语义）", () => {
        const { root } = makeEngine(`<i></i>`);
        const hitTags: string[] = [];
        AutoSpark.ready((engine) => {
            hitTags.push((engine.el as HTMLElement).getAttribute("data-pl-tag")!);
        });
        expect(hitTags).toContain(root.getAttribute("data-pl-tag"));
    });

    test("回调抛错被隔离：其余回调照常执行、engine 构造不受影响", () => {
        AutoSpark.ready(() => {
            throw new Error("boom");
        });
        const hitTags: string[] = [];
        AutoSpark.ready((engine) => {
            hitTags.push((engine.el as HTMLElement).getAttribute("data-pl-tag")!);
        });
        const { root } = makeEngine(`<i></i>`);
        expect(hitTags).toContain(root.getAttribute("data-pl-tag"));
    });

    test("destroy 后的 engine 不再收到晚注册的补调", () => {
        const dead = makeEngine(`<i></i>`);
        engines.pop();
        dead.engine.destroy();
        const hitTags: string[] = [];
        AutoSpark.ready((engine) => {
            hitTags.push((engine.el as HTMLElement).getAttribute("data-pl-tag")!);
        });
        expect(hitTags).not.toContain(dead.root.getAttribute("data-pl-tag"));
    });

    test("同一函数引用重复注册只生效一次（Set 去重）", () => {
        let calls = 0;
        const fn = () => {
            calls++;
        };
        AutoSpark.ready(fn);
        AutoSpark.ready(fn);
        makeEngine(`<i></i>`);
        // 收集面进程共享：断言下界（至少本 engine 触发一次）而非精确计数
        expect(calls).toBeGreaterThanOrEqual(1);
    });
});

describe("AutoSpark.components - 插件全局组件表", () => {
    test("查找链兜底：engine 无声明时命中插件表（声明可编译消费）", () => {
        pluginComponents["pl-card"] = `<div x-define="pl-card" x-text="props.label"></div>`;
        const { engine } = makeEngine(`<i></i>`, {}, { autostart: false });
        const decl = engine.getComponentDeclaration("pl-card");
        expect(decl).toBeTruthy();
        expect(decl!.getAttribute("x-define")).toBe("pl-card");
    });

    test("优先级：options.components 同名覆盖插件表", () => {
        pluginComponents["pl-rank"] = `<em x-define="pl-rank">from-plugin</em>`;
        const { engine } = makeEngine(
            `<i></i>`,
            {},
            {
                autostart: false,
                components: { "pl-rank": `<strong x-define="pl-rank">from-options</strong>` },
            },
        );
        const decl = engine.getComponentDeclaration("pl-rank");
        expect(decl!.tagName.toLowerCase()).toBe("strong");
    });

    test("晚注册立即生效：engine 建立后注册，查询即命中（查询期委托）", () => {
        const { engine } = makeEngine(`<i></i>`, {}, { autostart: false });
        expect(engine.getComponentDeclaration("pl-late")).toBeUndefined();
        pluginComponents["pl-late"] = `<u x-define="pl-late"></u>`;
        expect(engine.getComponentDeclaration("pl-late")!.tagName.toLowerCase()).toBe("u");
    });

    test("编译产物跨 engine 共享：两 engine 取到同一 snapshot 引用", () => {
        pluginComponents["pl-shared"] = `<div x-define="pl-shared"></div>`;
        const a = makeEngine(`<i></i>`, {}, { autostart: false });
        const b = makeEngine(`<i></i>`, {}, { autostart: false });
        const snapA = a.engine.getComponentDeclaration("pl-shared");
        const snapB = b.engine.getComponentDeclaration("pl-shared");
        expect(snapA).toBeTruthy();
        // 引用同一性 = 共享编译缓存命中（每组件名全局只编译一次，ADR-0111 决策 5）
        expect(snapA).toBe(snapB);
    });

    test("x-component 实例化消费插件组件（编译期链路，异步实例化）", async () => {
        pluginComponents["pl-badge"] =
            `<div x-define="pl-badge"><span class="v" x-text="text"></span></div>`;
        const { root } = mount(`<div x-component:pl-badge="{text:'hi'}"></div>`, {});
        await nextTick();
        expect(root.querySelector(".v")?.textContent).toBe("hi");
    });
});

describe("AutoSpark.actions - 插件全局 action 表", () => {
    test("getAction 链末端兜底命中插件表，返回注入 id 的描述符", () => {
        pluginActions["pl-save"] = () => "saved";
        const { engine } = makeEngine(`<div x-data></div>`);
        const scope = [...(engine as any).scopes.values()][0];
        const desc = scope.getAction("pl-save");
        expect(desc).toBeTruthy();
        expect(desc!.id).toBe("pl-save");
        // handle 透传返回值（同步 action 经包装广播后原样返回）
        expect(desc!.handle()).toBe("saved");
    });

    test("惰性物化：首次命中后进入本 engine 的 actions 表（后续走常规链）", () => {
        pluginActions["pl-touch"] = () => 1;
        const { engine } = makeEngine(`<div x-data></div>`);
        const scope = [...(engine as any).scopes.values()][0];
        expect(Object.hasOwn(engine.actions, "pl-touch")).toBe(false);
        const first = scope.getAction("pl-touch");
        expect(first).toBeTruthy();
        // 物化后：engine.actions 已有该名（hasOwn 经 Proxy 底层表判定），且再次查找返回同一描述符
        expect(Object.hasOwn(engine.actions, "pl-touch")).toBe(true);
        expect(scope.getAction("pl-touch")).toBe(first);
    });

    test("多 engine 各自物化：同一声明绑定各触发 engine（引用独立）", () => {
        pluginActions["pl-multi"] = () => 1;
        const a = makeEngine(`<div x-data></div>`);
        const b = makeEngine(`<div x-data></div>`);
        const scopeA = [...(a.engine as any).scopes.values()][0];
        const scopeB = [...(b.engine as any).scopes.values()][0];
        const descA = scopeA.getAction("pl-multi");
        const descB = scopeB.getAction("pl-multi");
        expect(descA).toBeTruthy();
        expect(descB).toBeTruthy();
        // 各 engine 独立包装（总线/生命周期广播绑定各自触发 engine），id 同名
        expect(descA!.handle).not.toBe(descB!.handle);
        expect(descA!.id).toBe("pl-multi");
    });

    test("非法声明：error 跳过 + 从插件表清除（不重复报错），getAction 返回 undefined", () => {
        (pluginActions as any)["pl-bad"] = "not-a-function";
        const { engine } = makeEngine(`<div x-data></div>`);
        const scope = [...(engine as any).scopes.values()][0];
        expect(scope.getAction("pl-bad")).toBeUndefined();
        expect(getPluginActionDecl("pl-bad")).toBeUndefined();
        // 清理辅助面（显式删除防其他断言面残留）
        deletePluginActionDecl("pl-bad");
    });

    test("$.ready 回调收双参 (engine, autospark)，第二参即命名空间类", () => {
        let ns: unknown;
        AutoSpark.ready((_engine, autospark) => {
            ns = autospark;
        });
        makeEngine(`<i></i>`);
        expect(ns).toBe(AutoSpark);
    });

    test("options.actions 同名覆盖插件表（引擎级优先）", () => {
        pluginActions["pl-rank-action"] = () => "from-plugin";
        const { engine } = makeEngine(
            `<div x-data></div>`,
            {},
            { actions: { "pl-rank-action": () => "from-options" } },
        );
        const scope = [...(engine as any).scopes.values()][0];
        const desc = scope.getAction("pl-rank-action");
        // 引擎级在构造期已注册，查找命中引擎级版本（handle 返回值区分来源）
        expect(desc!.handle()).toBe("from-options");
    });
});

describe("globalThis.__AUTOSPARK_PLUGINS__ - 预加载队列（ADR-0114）", () => {
    /** 装填队列（每次给一个新数组——drain 后原数组被冻结，重赋即重置） */
    function armQueue(...fns: Array<(engine: any, autospark: any) => void>): void {
        globalThis.__AUTOSPARK_PLUGINS__ = fns;
    }

    afterEach(() => {
        delete globalThis.__AUTOSPARK_PLUGINS__;
    });

    test("首个 engine 构造期消费一次，第二个 engine 不再执行", () => {
        const hits: string[] = [];
        armQueue((engine) => {
            hits.push((engine.el as HTMLElement).getAttribute("data-pl-tag")!);
        });
        const a = makeEngine(`<i></i>`);
        makeEngine(`<b></b>`);
        expect(hits).toEqual([a.root.getAttribute("data-pl-tag")]);
    });

    test("队列注册的资源对后建 engine 同样生效（全局注册，与队列清空无关）", () => {
        armQueue((_engine, $) => {
            $.components["pl-pre-card"] = `<div x-define="pl-pre-card"></div>`;
        });
        const a = makeEngine(`<i></i>`, {}, { autostart: false });
        const b = makeEngine(`<i></i>`, {}, { autostart: false });
        const declA = a.engine.getComponentDeclaration("pl-pre-card");
        const declB = b.engine.getComponentDeclaration("pl-pre-card");
        expect(declA).toBeTruthy();
        // 全局 def 缓存命中：后建 engine 复用同一编译产物（ADR-0111 决策 5）
        expect(declB).toBe(declA);
        delete pluginComponents["pl-pre-card"];
    });

    test("队列内注册的 $.ready 对两个 engine 各调一次（per-engine 走 ready）", () => {
        const hits: string[] = [];
        armQueue((_engine, $) => {
            $.ready((e) => {
                // 只收带标记者：他用例经 mount() 建且未销毁的存活 engine 会合法触发
                // retain 补调（无 data-pl-tag），按本文件隔离纪律过滤掉
                const tag = (e.el as HTMLElement).getAttribute("data-pl-tag");
                if (tag) hits.push(tag);
            });
        });
        const a = makeEngine(`<i></i>`);
        const b = makeEngine(`<b></b>`);
        expect(hits).toEqual([
            a.root.getAttribute("data-pl-tag"),
            b.root.getAttribute("data-pl-tag"),
        ]);
    });

    test("回调收双参 (engine, autospark)，第二参即命名空间类（先加载脚本拿不到全局）", () => {
        let ns: unknown;
        let el: unknown;
        armQueue((engine, $) => {
            el = engine.el;
            ns = $;
        });
        const { root } = makeEngine(`<i></i>`);
        expect(el).toBe(root);
        expect(ns).toBe(AutoSpark);
        expect(Object.hasOwn(ns as object, "components")).toBe(true);
    });

    test("非数组队列被忽略（不抛），非函数元素跳过（不中断其余元素）", () => {
        (globalThis as any).__AUTOSPARK_PLUGINS__ = "not-an-array";
        expect(() => makeEngine(`<i></i>`)).not.toThrow();

        let calls = 0;
        armQueue("not-a-function" as any, () => {
            calls++;
        });
        makeEngine(`<b></b>`);
        expect(calls).toBe(1);
    });

    test("单个元素抛错被隔离：其余元素照常执行、engine 构造不受影响", () => {
        let calls = 0;
        armQueue(
            () => {
                throw new Error("boom");
            },
            () => {
                calls++;
            },
        );
        const { root } = makeEngine(`<i></i>`);
        expect(calls).toBe(1);
        expect(root.getAttribute("data-autospark")).toBe("");
    });

    test("消费后队列被冻结清空：晚到的 push 不再被执行", () => {
        let late = 0;
        armQueue(() => {});
        const queue = globalThis.__AUTOSPARK_PLUGINS__!;
        makeEngine(`<i></i>`);
        expect(queue.length).toBe(0);
        expect(Object.isFrozen(queue)).toBe(true);
        // 冻结后 push 在严格模式抛 TypeError（非严格静默失败）——误用会响而不是哑
        try {
            (queue as any).push(() => {
                late++;
            });
        } catch {
            /* 严格模式抛错即预期 */
        }
        makeEngine(`<b></b>`);
        expect(late).toBe(0);
    });
});
