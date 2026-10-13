import { describe, expect, test, afterEach } from "bun:test";
import { AutoSpark } from "../../../engine/engine";
import { AutoSparkDirectiveBase, DirectiveKind } from "../../../features/directive/base";
import { enqueueDirectiveInstaller } from "../../../features/plugin";
import { TextDirective } from "../../../directives/x-text";

/**
 * 外部指令安装队列（ADR-0111，承接 ADR-0100 语义）测试。
 *
 * 队列载体已从 window 键改为插件机制的模块内存数组（ADR-0111 决策 5）——无 window
 * 属性可就地清空，隔离纪律改为：**指令名全文件唯一** + 不做「未注册」的全局性断言
 * （进程级共享的队列/存活表会让残留安装器被后续构造消费，has=false 断言只对从未
 * define 过的名字安全）。
 *
 * 断言面守「重型对象禁令」：只断标量（注册表 has/get 结果、计数器、dataset 标记），
 * 不把 engine / 指令实例 / 队列数组放进比较面。
 */

const mountedRoots: HTMLElement[] = [];

/** 追踪创建的 engine，afterEach 统一 destroy（摘除存活表 + 清 DOM） */
const engines: AutoSpark<any>[] = [];

function makeEngine(
    html: string,
    state: any = {},
    options?: Record<string, any>,
): { root: HTMLElement; engine: AutoSpark<any> } {
    const root = document.createElement("div");
    root.innerHTML = html;
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

describe("安装队列 - 构造期消费", () => {
    test("构造前入队的安装器被 engine 消费，指令参与首次编译", () => {
        let mountedCount = 0;
        enqueueDirectiveInstaller((engine: AutoSpark<any>) => {
            engine.directives.install(
                "gq-construct",
                class extends AutoSparkDirectiveBase {
                    static override kind = DirectiveKind.Runtime;
                    override mounted() {
                        mountedCount++;
                    }
                },
            );
        });
        const { root, engine } = makeEngine(`<span x-gq-construct></span>`);
        expect(engine.directives.has("gq-construct")).toBe(true);
        // runtime 指令：构造末尾 dispatcher 初始扫描同步触发首次 mounted
        expect(mountedCount).toBe(1);
        expect(root.querySelector("span")!.hasAttribute("x-gq-construct")).toBe(true);
    });

    test("安装器抛错被隔离：不中断构造，其余安装器照常执行", () => {
        enqueueDirectiveInstaller(() => {
            throw new Error("boom");
        });
        enqueueDirectiveInstaller((engine: AutoSpark<any>) => {
            engine.directives.install("gq-good", class extends AutoSparkDirectiveBase {});
        });
        const { engine } = makeEngine(`<i></i>`);
        expect(engine.directives.has("gq-good")).toBe(true);
    });
});

describe("安装队列 - 晚入队广播", () => {
    test("engine 建立后入队，安装器立即作用于存活 engine", () => {
        const { engine } = makeEngine(`<i></i>`);
        enqueueDirectiveInstaller((eng: AutoSpark<any>) => {
            eng.directives.install("gq-late", class extends AutoSparkDirectiveBase {});
        });
        expect(engine.directives.has("gq-late")).toBe(true);
    });

    test("destroy 后的 engine 不再触达晚到的安装器（存活 engine 照常收到）", () => {
        const dead = makeEngine(`<i></i>`);
        engines.pop(); // 移出追踪：本用例手动 destroy，避免 afterEach 双销毁
        dead.engine.destroy();
        const alive = makeEngine(`<b></b>`);
        // 广播命中以 el 标记记录（liveEngines 进程级共享，禁用全局计数断言——他文件的
        // 存活 engine 也会合法收到广播）
        enqueueDirectiveInstaller((eng: AutoSpark<any>) => {
            eng.el.setAttribute("data-gq-hit", "1");
        });
        expect(dead.root.hasAttribute("data-gq-hit")).toBe(false);
        expect(alive.root.hasAttribute("data-gq-hit")).toBe(true);
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
        engine.directives.install("gq-dupe", A);
        engine.directives.install("gq-dupe", B);
        expect(engine.directives.get("gq-dupe")).toBe(B);
    });

    test("set 静默覆盖预设名的既有语义不变（回归）", () => {
        const { engine } = makeEngine(`<i></i>`, {}, { autostart: false });
        const Pretender = class extends AutoSparkDirectiveBase {};
        engine.directives.set("text", Pretender);
        expect(engine.directives.get("text")).toBe(Pretender);
    });
});

describe("AutoSpark.directive（唯一入口，双重载）- 定义即全局安装", () => {
    test("spec 重载：返回继承基类的类，静态键挂类、钩子挂原型", () => {
        const mounted = function (this: AutoSparkDirectiveBase) {};
        const Cls = AutoSpark.directive({
            name: "gq-def",
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

    test("spec 重载缺 name 抛错", () => {
        expect(() => AutoSpark.directive({} as any)).toThrow();
        expect(() => AutoSpark.directive({ name: "" })).toThrow();
    });

    test("入队生效：define 后构造的 engine 自动注册并可编译生效", () => {
        AutoSpark.directive({
            name: "gq-hl",
            kind: 1,
            mounted(this: AutoSparkDirectiveBase) {
                (this.el as HTMLElement).dataset.gqHl = "1";
            },
        });
        const { root, engine } = makeEngine(`<span x-gq-hl></span>`);
        expect(engine.directives.has("gq-hl")).toBe(true);
        expect(root.querySelector("span")!.dataset.gqHl).toBe("1");
    });

    test("define 后晚入队通道一致：对已存活 engine 即时生效", () => {
        const { engine } = makeEngine(`<i></i>`);
        AutoSpark.directive({
            name: "gq-live",
            kind: 1,
            mounted() {},
        });
        expect(engine.directives.has("gq-live")).toBe(true);
    });
});

describe("AutoSpark.directive - 类重载（高级形态）", () => {
    test("结构指令类经类重载安装：ownsChildren 等类级静态保留", () => {
        class Reverse extends AutoSparkDirectiveBase {
            static override kind = DirectiveKind.Compile;
            static ownsChildren() {
                return true;
            }
        }
        AutoSpark.directive("gq-reverse", Reverse);
        const { engine } = makeEngine(`<i></i>`, {}, { autostart: false });
        expect(engine.directives.has("gq-reverse")).toBe(true);
        expect(engine.directives.get("gq-reverse")!.ownsChildren()).toBe(true);
    });

    test("晚安装广播存活 engine（与 spec 重载同通道）", () => {
        const { engine } = makeEngine(`<i></i>`);
        AutoSpark.directive("gq-late-cls", class extends AutoSparkDirectiveBase {});
        expect(engine.directives.has("gq-late-cls")).toBe(true);
    });

    test("类重载第二参缺失或非指令类抛错", () => {
        expect(() => AutoSpark.directive("gq-bad-1")).toThrow();
        expect(() => AutoSpark.directive("gq-bad-2", {} as any)).toThrow();
    });
});
