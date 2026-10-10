import { describe, expect, test, beforeAll, beforeEach, afterEach, afterAll } from "bun:test";
import { AutoSpark } from "../../../engine/engine";
import { AutoSparkDirectiveBase, DirectiveKind } from "../../../features/directive/base";
import { GLOBAL_DIRECTIVES_QUEUE } from "../../../features/directive/global-queue";
import { TextDirective } from "../../../directives/x-text";

/**
 * 外部指令全局安装队列（ADR-0100）测试。
 *
 * 断言面守「重型对象禁令」：只断标量（注册表 has/get 结果、计数器、dataset 标记），
 * 不把 engine / 指令实例 / 队列数组放进比较面。
 *
 * 状态隔离：beforeAll 存原值、beforeEach 就地清空队列（`.length = 0`，不替换 window 属性
 * ——保持首个构造后获得的 Proxy 身份，晚推送广播才可断言）；afterEach 销毁 engine 并摘除
 * 挂载节点；afterAll 还原原值，不影响同进程其他测试文件。
 */

const host = globalThis as any;
const mountedRoots: HTMLElement[] = [];

/** 追踪创建的 engine，afterEach 统一 destroy（摘除存活表 + 清 DOM） */
const engines: AutoSpark<any>[] = [];

function makeEngine(html: string, state: any = {}, options?: Record<string, any>): { root: HTMLElement; engine: AutoSpark<any> } {
    const root = document.createElement("div");
    root.innerHTML = html;
    document.body.appendChild(root);
    mountedRoots.push(root);
    const engine = new AutoSpark(root, state, options as any);
    engines.push(engine);
    return { root, engine };
}

beforeAll(() => {
    // 不存在才建；已存在（含他文件首构造后留下的 Proxy）就地沿用——整体替换会让
    // queueProxied 守卫与真实属性脱钩（Proxy 身份丢失 → push trap 失效）
    if (!Array.isArray(host[GLOBAL_DIRECTIVES_QUEUE])) host[GLOBAL_DIRECTIVES_QUEUE] = [];
});

beforeEach(() => {
    // 就地清空（Proxy 化后经默认 set trap 写底层 target），保持 Proxy 身份
    const q = host[GLOBAL_DIRECTIVES_QUEUE];
    if (Array.isArray(q)) q.length = 0;
});

afterEach(() => {
    for (const engine of engines) engine.destroy();
    engines.length = 0;
    for (const root of mountedRoots) root.remove();
    mountedRoots.length = 0;
});

afterAll(() => {
    // 就地清空本文件残留安装器并归还属性（不替换——Proxy 身份属队列协议，他文件沿用）
    const q = host[GLOBAL_DIRECTIVES_QUEUE];
    if (Array.isArray(q)) q.length = 0;
});

describe("全局安装队列 - 构造期消费", () => {
    test("构造前 push 的安装器被首个 engine 消费，指令参与首次编译", () => {
        let mountedCount = 0;
        host[GLOBAL_DIRECTIVES_QUEUE].push((engine: AutoSpark<any>) => {
            engine.directives.install(
                "q-tip",
                class extends AutoSparkDirectiveBase {
                    static override kind = DirectiveKind.Runtime;
                    override mounted() {
                        mountedCount++;
                    }
                },
            );
        });
        const { root, engine } = makeEngine(`<span x-q-tip></span>`);
        expect(engine.directives.has("q-tip")).toBe(true);
        // runtime 指令：构造末尾 dispatcher 初始扫描同步触发首次 mounted
        expect(mountedCount).toBe(1);
        expect(root.querySelector("span")!.hasAttribute("x-q-tip")).toBe(true);
    });

    test("安装器抛错被隔离：不中断构造，其余安装器照常执行", () => {
        host[GLOBAL_DIRECTIVES_QUEUE].push(() => {
            throw new Error("boom");
        });
        host[GLOBAL_DIRECTIVES_QUEUE].push((engine: AutoSpark<any>) => {
            engine.directives.install("q-good", class extends AutoSparkDirectiveBase {});
        });
        const { engine } = makeEngine(`<i></i>`);
        expect(engine.directives.has("q-good")).toBe(true);
    });
});

describe("全局安装队列 - 晚推送广播", () => {
    test("engine 建立后 push，安装器立即作用于存活 engine", () => {
        const { engine } = makeEngine(`<i></i>`);
        expect(engine.directives.has("q-late")).toBe(false);
        host[GLOBAL_DIRECTIVES_QUEUE].push((eng: AutoSpark<any>) => {
            eng.directives.install("q-late", class extends AutoSparkDirectiveBase {});
        });
        expect(engine.directives.has("q-late")).toBe(true);
    });

    test("destroy 后的 engine 不再触达晚到的安装器（存活 engine 照常收到）", () => {
        const dead = makeEngine(`<i></i>`);
        engines.pop(); // 移出追踪：本用例手动 destroy，避免 afterEach 双销毁
        dead.engine.destroy();
        const alive = makeEngine(`<b></b>`);
        // 广播命中以 el 标记记录（liveEngines 进程级共享，禁用全局计数断言——他文件的
        // 存活 engine 也会合法收到广播）
        host[GLOBAL_DIRECTIVES_QUEUE].push((eng: AutoSpark<any>) => {
            eng.el.setAttribute("data-hit", "1");
        });
        expect(dead.root.hasAttribute("data-hit")).toBe(false);
        expect(alive.root.hasAttribute("data-hit")).toBe(true);
    });
});

describe("DirectiveManager.install - 受控注册语义", () => {
    test("撞预设指令名：warn + 跳过，预设原类保留", () => {
        const { engine } = makeEngine(`<i></i>`, {}, { autostart: false });
        class Pretender extends AutoSparkDirectiveBase {}
        engine.directives.install("text", Pretender);
        expect(engine.directives.get("text")).not.toBe(Pretender);
        expect(engine.directives.get("text")).toBe(TextDirective);
    });

    test("撞自定义指令名：warn + 覆盖", () => {
        const { engine } = makeEngine(`<i></i>`, {}, { autostart: false });
        const A = class extends AutoSparkDirectiveBase {};
        const B = class extends AutoSparkDirectiveBase {};
        engine.directives.install("q-dupe", A);
        engine.directives.install("q-dupe", B);
        expect(engine.directives.get("q-dupe")).toBe(B);
    });

    test("set 静默覆盖预设名的既有语义不变（回归）", () => {
        const { engine } = makeEngine(`<i></i>`, {}, { autostart: false });
        const Pretender = class extends AutoSparkDirectiveBase {};
        engine.directives.set("text", Pretender);
        expect(engine.directives.get("text")).toBe(Pretender);
    });
});

describe("AutoSpark.defineDirective - 定义即全局安装", () => {
    test("返回继承基类的类：静态键挂类、钩子挂原型", () => {
        const mounted = function (this: AutoSparkDirectiveBase) {};
        const Cls = AutoSpark.defineDirective({
            name: "q-def",
            kind: 1,
            priority: 5,
            mounted: mounted as any,
        });
        expect(Object.getPrototypeOf(Cls)).toBe(AutoSparkDirectiveBase);
        expect(Cls.kind).toBe(1);
        expect(Cls.priority).toBe(5);
        expect(Cls.prototype.mounted).toBe(mounted);
        // 未提供的钩子保持基类默认（原型链回退）
        expect(Cls.prototype.created).toBe(AutoSparkDirectiveBase.prototype.created);
    });

    test("缺 name 抛错", () => {
        expect(() => AutoSpark.defineDirective({} as any)).toThrow();
        expect(() => AutoSpark.defineDirective({ name: "" })).toThrow();
    });

    test("入队生效：define 后构造的 engine 自动注册并可编译生效", () => {
        AutoSpark.defineDirective({
            name: "q-hl",
            kind: 1,
            mounted(this: AutoSparkDirectiveBase) {
                (this.el as HTMLElement).dataset.qHl = "1";
            },
        });
        const { root, engine } = makeEngine(`<span x-q-hl></span>`);
        expect(engine.directives.has("q-hl")).toBe(true);
        expect(root.querySelector("span")!.dataset.qHl).toBe("1");
    });

    test("define 后晚推送通道一致：对已存活 engine 即时生效", () => {
        const { engine } = makeEngine(`<i></i>`);
        AutoSpark.defineDirective({
            name: "q-live",
            kind: 1,
            mounted() {},
        });
        expect(engine.directives.has("q-live")).toBe(true);
    });
});
