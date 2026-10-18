import { describe, expect, test } from "bun:test";
import "../setup";
import { AutoSpark } from "../../engine/engine";
import { AutoSparkDirectiveBase } from "../../features/directive/base";
import { mount, nextTick } from "../helpers";

/** 读取宿主内挂载的错误覆盖层根（默认内置组件 .as-error；未挂载返回 null） */
const overlayOf = (host: Element | null): HTMLElement | null =>
    (host?.querySelector(".as-error") as HTMLElement) ?? null;

/** 覆盖层按钮按文本查找 */
const btnByText = (host: Element | null, text: string): HTMLButtonElement | null => {
    for (const b of Array.from(host?.querySelectorAll("button") ?? [])) {
        if (b.textContent?.trim() === text) return b as HTMLButtonElement;
    }
    return null;
};

// ── scope.errors（ADR-0118 决策 1：编译期错误两轨正交）─────────────────────

describe("scope.errors 编译期错误收集", () => {
    test("绑定表达式首次求值抛错 → 收集进所属 scope.errors（source:expression）", () => {
        // 非简单路径的表达式支路才会抛错（路径支路读不到键返回 undefined 不抛错）
        const { root, engine } = mount(`<div id="h" x-text="missing.trim()"></div>`, {});
        const el = root.querySelector("#h") as HTMLElement;
        const scope = engine.findScopeByEl(el)!;
        expect(scope.errors.length).toBe(1);
        const entry = scope.errors[0]!;
        expect(entry.source).toBe("expression");
        expect(entry.expression).toBe("missing.trim()");
        expect(entry.error).toBeInstanceOf(Error);
    });

    test("表达式首求值成功 → errors 为空；后续状态漂移抛错不收集", async () => {
        const { root, engine } = mount(`<div id="h" x-text="a.b.c"></div>`, {
            a: { b: { c: 1 } },
        });
        const el = root.querySelector("#h") as HTMLElement;
        const scope = engine.findScopeByEl(el)!;
        expect(scope.errors.length).toBe(0);
        // 状态漂移：a 置为 null → 重求值抛 TypeError——update 路径不收集
        engine.state.a = null;
        await nextTick();
        expect(scope.errors.length).toBe(0);
    });

    test("指令 created 抛错 → 收集（source:directive-created）且编译继续", () => {
        class BadDirective extends AutoSparkDirectiveBase {
            override created() {
                throw new Error("created boom");
            }
        }
        const root = document.createElement("div");
        root.innerHTML = `<div id="h" x-bad x-text="ok"></div><span id="s">after</span>`;
        const engine = new AutoSpark(root, { ok: "v" }, { autostart: false });
        engine.directives.set("bad", BadDirective);
        engine.compile();
        const el = root.querySelector("#h") as HTMLElement;
        const scope = engine.findScopeByEl(el)!;
        const entry = scope.errors.find((e) => e.source === "directive-created");
        expect(entry).toBeDefined();
        expect(entry!.directive).toBe("bad");
        expect(entry!.error.message).toBe("created boom");
        // 编译容错继续：同元素 x-text 已渲染
        expect(el.textContent).toBe("v");
    });

    test("compile 结束后 errors 被冻结（Object.isFrozen）", () => {
        const { root, engine } = mount(`<div id="h" x-text="ok"></div>`, { ok: 1 });
        const scope = engine.findScopeByEl(root.querySelector("#h") as HTMLElement)!;
        expect(Object.isFrozen(scope.errors)).toBe(true);
    });
});

// ── buildAction rejected 桥接（ADR-0118 决策 2）────────────────────────────

describe("buildAction rejected 桥接 error 事件", () => {
    test("全局 action 同步抛错：触发元素派发 error 事件（detail 带归一化 error + action + args）", () => {
        const { root } = mount(
            `<div id="zone"><button id="b" @click="fail('x', 2)">go</button></div>`,
            {},
            {
                actions: {
                    fail: () => {
                        throw new Error("sync boom");
                    },
                },
            } as any,
        );
        const zone = root.querySelector("#zone")!;
        let captured: CustomEvent | null = null;
        zone.addEventListener("error", (e) => {
            captured = e as CustomEvent;
        });
        (root.querySelector("#b") as HTMLButtonElement).click();
        expect(captured).not.toBeNull();
        const err = captured!.detail.error;
        expect(err.name).toBe("Error");
        expect(err.message).toBe("sync boom");
        expect(err.source).toBe("action");
        expect(err.action.id).toBe("fail");
        expect(err.args).toEqual(["x", 2]);
    });

    test("异步 action reject：同样桥接", async () => {
        const { root } = mount(
            `<div id="zone"><button id="b" @click="fail()">go</button></div>`,
            {},
            {
                actions: {
                    fail: async () => {
                        throw new Error("async boom");
                    },
                },
            } as any,
        );
        const zone = root.querySelector("#zone")!;
        let captured: CustomEvent | null = null;
        zone.addEventListener("error", (e) => {
            captured = e as CustomEvent;
        });
        (root.querySelector("#b") as HTMLButtonElement).click();
        await nextTick();
        expect(captured).not.toBeNull();
        expect(captured!.detail.error.message).toBe("async boom");
    });

    test("命令式直调（无触发元素）不桥接", () => {
        const { root, engine } = mount(`<div id="zone"></div>`, {}, {
            actions: {
                fail: () => {
                    throw new Error("boom");
                },
            },
        } as any);
        const zone = root.querySelector("#zone")!;
        let count = 0;
        zone.addEventListener("error", () => count++);
        // 无 ctx（this 非 AutoSparkActionContext）→ 无 triggerEl → 不派发 error 事件
        expect(() => (engine.actions.fail as any).handle()).toThrow();
        expect(count).toBe(0);
    });
});

// ── raise 内置 action（ADR-0118 决策 2/6）──────────────────────────────────

describe("raise 内置 action", () => {
    const raiseAndCapture = (expr: string) => {
        const { root } = mount(
            `<div id="zone"><button id="b" @click="${expr}">go</button></div>`,
            {},
        );
        const zone = root.querySelector("#zone")!;
        let captured: CustomEvent | null = null;
        zone.addEventListener("error", (e) => {
            captured = e as CustomEvent;
        });
        (root.querySelector("#b") as HTMLButtonElement).click();
        return captured!;
    };

    test("字符串 → {message} + source:raise", () => {
        const e = raiseAndCapture("raise('出错了')");
        expect(e.detail.error.message).toBe("出错了");
        expect(e.detail.error.source).toBe("raise");
    });

    test("Error 实例 → {name,message,stack} 归一化", () => {
        const e = raiseAndCapture("raise(new TypeError('bad'))");
        const err = e.detail.error;
        expect(err.name).toBe("TypeError");
        expect(err.message).toBe("bad");
        expect(typeof err.stack).toBe("string");
        expect(err.source).toBe("raise");
    });

    test("普通对象原样保留 + 注入 source；options 的 closeable/retryable/actions/props 透传 detail", () => {
        const e = raiseAndCapture(
            "raise({code: 4001, message: '校验失败'}, { closeable: false, retryable: true, actions: ['close'], props: { extra: 1 } })",
        );
        const d = e.detail;
        expect(d.error.code).toBe(4001);
        expect(d.error.message).toBe("校验失败");
        expect(d.error.source).toBe("raise");
        expect(d.closeable).toBe(false);
        expect(d.retryable).toBe(true);
        expect(d.actions).toEqual(["close"]);
        expect(d.props).toEqual({ extra: 1 });
    });
});

// ── x-error 就近消费（ADR-0118 决策 3）──────────────────────────────────────

describe("x-error 就近消费", () => {
    test("嵌套时内层捕获并 stopPropagation：内层呈现、外层不呈现", () => {
        const { root } = mount(
            `<div id="outer" x-error>
                <div id="inner" x-error>
                    <button id="b" @click="raise('内层错')">go</button>
                </div>
            </div>`,
            {},
        );
        (root.querySelector("#b") as HTMLButtonElement).click();
        expect(overlayOf(root.querySelector("#inner"))).not.toBeNull();
        // 外层整个子树只有内层那一份 overlay（外层宿主不再捕获）
        expect(root.querySelectorAll(".as-error").length).toBe(1);
    });

    test("behavior:none 纯消费同样 stopPropagation（外层不越级呈现）", () => {
        const { root } = mount(
            `<div id="outer" x-error>
                <div id="inner" x-error x-error-options.behavior="'none'">
                    <button id="b" @click="raise('认领')">go</button>
                </div>
            </div>`,
            {},
        );
        (root.querySelector("#b") as HTMLButtonElement).click();
        expect(root.querySelectorAll(".as-error").length).toBe(0);
    });

    test("无 x-error 捕获：事件冒泡到顶自然消亡（无呈现无异常）", () => {
        const { root } = mount(`<div id="z"><button id="b" @click="raise('x')">go</button></div>`, {});
        (root.querySelector("#b") as HTMLButtonElement).click();
        expect(root.querySelectorAll(".as-error").length).toBe(0);
    });

    test("单错误槽：新错误替换旧呈现（无堆叠）", () => {
        const { root } = mount(
            `<div id="zone" x-error>
                <button id="a" @click="raise('第一错')">a</button>
                <button id="b" @click="raise('第二错')">b</button>
            </div>`,
            {},
        );
        const zone = root.querySelector("#zone")!;
        (root.querySelector("#a") as HTMLButtonElement).click();
        expect(zone.querySelectorAll(".as-error").length).toBe(1);
        expect(zone.querySelector(".as-error-message")!.textContent).toContain("第一错");
        (root.querySelector("#b") as HTMLButtonElement).click();
        expect(zone.querySelectorAll(".as-error").length).toBe(1);
        expect(zone.querySelector(".as-error-message")!.textContent).toContain("第二错");
    });
});

// ── behavior 三态（ADR-0118 决策 4）─────────────────────────────────────────

describe("x-error behavior 三态", () => {
    test("默认 overlay：挂载覆盖层呈现 message；close 按钮清除", () => {
        const { root } = mount(
            `<div id="zone" x-error><button id="b" @click="raise('缺省态')">go</button></div>`,
            {},
        );
        const zone = root.querySelector("#zone")!;
        (root.querySelector("#b") as HTMLButtonElement).click();
        const overlay = overlayOf(zone);
        expect(overlay).not.toBeNull();
        expect(zone.querySelector(".as-error-message")!.textContent).toContain("缺省态");
        btnByText(zone, "关闭")!.click();
        expect(overlayOf(zone)).toBeNull();
    });

    test("addErrorClass：宿主加默认 error class，新错误替换后 class 仍在；closeable 无关", () => {
        const { root } = mount(
            `<div id="zone" x-error x-error-options.behavior="'addErrorClass'">
                <button id="b" @click="raise('x')">go</button>
            </div>`,
            {},
        );
        const zone = root.querySelector("#zone")!;
        (root.querySelector("#b") as HTMLButtonElement).click();
        expect(zone.classList.contains("error")).toBe(true);
        expect(overlayOf(zone)).toBeNull();
    });

    test("addErrorClass + errorClass 自定义 class 名", () => {
        const { root } = mount(
            `<div id="zone" x-error x-error-options.behavior="'addErrorClass'" x-error-options.error-class="'has-error'">
                <button id="b" @click="raise('x')">go</button>
            </div>`,
            {},
        );
        const zone = root.querySelector("#zone")!;
        (root.querySelector("#b") as HTMLButtonElement).click();
        expect(zone.classList.contains("has-error")).toBe(true);
        expect(zone.classList.contains("error")).toBe(false);
    });

    test("overlayAt：覆盖层挂到相对查询目标（'../' 爬升形态）", () => {
        const { root } = mount(
            `<div id="panel" style="position:relative"></div>
             <div id="zone" x-error x-error-options.overlay-at="'../#panel'">
                <button id="b" @click="raise('x')">go</button>
             </div>`,
            {},
        );
        (root.querySelector("#b") as HTMLButtonElement).click();
        expect(overlayOf(root.querySelector("#panel"))).not.toBeNull();
        expect(overlayOf(root.querySelector("#zone"))).toBeNull();
    });
});

// ── 组件解析链（ADR-0118 决策 5）───────────────────────────────────────────

describe("x-error 组件解析链", () => {
    test("指令值简写：x-error='my.err' 用自定义组件（data 注入 error/message/props）", () => {
        const { root } = mount(
            `<div x-scope>
                <div x-define="my.err" class="my-err">
                    <span class="m" x-text="message"></span>:<span class="e" x-text="extra"></span>
                </div>
                <div id="zone" x-error="my.err">
                    <button id="b" @click="raise('自定义', { props: { extra: 'E1' } })">go</button>
                </div>
            </div>`,
            {},
        );
        const zone = root.querySelector("#zone")!;
        (root.querySelector("#b") as HTMLButtonElement).click();
        expect(zone.querySelector(".my-err .m")!.textContent).toBe("自定义");
        expect(zone.querySelector(".my-err .e")!.textContent).toBe("E1");
        expect(zone.querySelector(".as-error")).toBeNull();
    });

    test("options.overlay 优先于指令值简写", () => {
        const { root } = mount(
            `<div x-scope>
                <div x-define="a.err" class="a-err"><span class="m" x-text="message"></span></div>
                <div x-define="b.err" class="b-err"><span class="m" x-text="message"></span></div>
                <div id="zone" x-error="a.err" x-error-options.overlay="'b.err'">
                    <button id="b" @click="raise('prio')">go</button>
                </div>
            </div>`,
            {},
        );
        const zone = root.querySelector("#zone")!;
        (root.querySelector("#b") as HTMLButtonElement).click();
        expect(zone.querySelector(".b-err")).not.toBeNull();
        expect(zone.querySelector(".a-err")).toBeNull();
    });

    test("未找到的组件名 warn 回退内置 autospark.error", () => {
        const { root } = mount(
            `<div id="zone" x-error="no.such"><button id="b" @click="raise('fb')">go</button></div>`,
            {},
        );
        (root.querySelector("#b") as HTMLButtonElement).click();
        expect(overlayOf(root.querySelector("#zone"))).not.toBeNull();
    });

    test("props 保留键同名 warn 忽略（error 不被覆盖）", () => {
        const { root } = mount(
            `<div x-scope>
                <div x-define="p.err" class="p-err"><span class="m" x-text="message"></span></div>
                <div id="zone" x-error="p.err">
                    <button id="b" @click="raise('正主', { props: { error: '篡位', message: '篡改' } })">go</button>
                </div>
            </div>`,
            {},
        );
        const zone = root.querySelector("#zone")!;
        (root.querySelector("#b") as HTMLButtonElement).click();
        // error/message 保留键：props 传入被忽略，呈现归一化错误的 message
        expect(zone.querySelector(".p-err .m")!.textContent).toBe("正主");
    });
});

// ── closeable / retryable / retry 语义（ADR-0118 决策 7）────────────────────

describe("x-error closeable / retryable / retry", () => {
    test("raise 源默认无重试按钮；显式 retryable:true 也不渲染（无源可重）", () => {
        const { root } = mount(
            `<div id="zone" x-error>
                <button id="a" @click="raise('plain')">a</button>
                <button id="b" @click="raise('forced', { retryable: true })">b</button>
            </div>`,
            {},
        );
        const zone = root.querySelector("#zone")!;
        const retryBtn = () => btnByText(zone, "重试");
        (root.querySelector("#a") as HTMLButtonElement).click();
        // x-show 隐藏（display:none）而非移除
        expect(retryBtn()!.style.display).toBe("none");
        (root.querySelector("#b") as HTMLButtonElement).click();
        expect(retryBtn()!.style.display).toBe("none");
    });

    test("action 源默认有重试按钮：以原 args 重调，resolved 后自动清除", async () => {
        let calls: any[][] = [];
        let fail = true;
        const { root } = mount(
            `<div id="zone" x-error><button id="b" @click="job('p1', 7)">go</button></div>`,
            {},
            {
                actions: {
                    job: (...args: any[]) => {
                        calls.push(args);
                        if (fail) throw new Error("首次失败");
                        return "ok";
                    },
                },
            } as any,
        );
        const zone = root.querySelector("#zone")!;
        (root.querySelector("#b") as HTMLButtonElement).click();
        expect(overlayOf(zone)).not.toBeNull();
        expect(btnByText(zone, "重试")!.style.display).not.toBe("none");
        fail = false;
        btnByText(zone, "重试")!.click();
        await nextTick();
        // 原 args 重调
        expect(calls).toEqual([
            ["p1", 7],
            ["p1", 7],
        ]);
        // resolved → 呈现自动清除
        expect(overlayOf(zone)).toBeNull();
    });

    test("retry 持续 rejected：桥接新 error 事件更新呈现（仍为单错误槽）", async () => {
        let n = 0;
        const { root } = mount(
            `<div id="zone" x-error><button id="b" @click="job()">go</button></div>`,
            {},
            {
                actions: {
                    job: () => {
                        n++;
                        throw new Error(`失败${n}次`);
                    },
                },
            } as any,
        );
        const zone = root.querySelector("#zone")!;
        (root.querySelector("#b") as HTMLButtonElement).click();
        expect(zone.querySelector(".as-error-message")!.textContent).toContain("失败1次");
        btnByText(zone, "重试")!.click();
        await nextTick();
        expect(zone.querySelectorAll(".as-error").length).toBe(1);
        expect(zone.querySelector(".as-error-message")!.textContent).toContain("失败2次");
    });

    test("closeable:false 关闭按钮隐藏（事件层优先，x-show 置 display:none）", () => {
        const { root } = mount(
            `<div id="zone" x-error><button id="b" @click="raise('x', { closeable: false })">go</button></div>`,
            {},
        );
        const zone = root.querySelector("#zone")!;
        (root.querySelector("#b") as HTMLButtonElement).click();
        expect(overlayOf(zone)).not.toBeNull();
        expect(btnByText(zone, "关闭")!.style.display).toBe("none");
    });
});

// ── actions 按钮（ADR-0118 决策 7 + ADR-0038 委托）─────────────────────────

describe("x-error actions 按钮", () => {
    // x-for 首次渲染走 scheduler microtask（x-loading 测试同款），断言前先 nextTick
    test("事件层 actions：string 经 getAction 链解析 title，渲染 data-action 按钮", async () => {
        const { root } = mount(
            `<div id="zone" x-error>
                <button id="b" @click="raise('x', { actions: ['close'] })">go</button>
            </div>`,
            {},
        );
        const zone = root.querySelector("#zone")!;
        (root.querySelector("#b") as HTMLButtonElement).click();
        await nextTick();
        const btn = zone.querySelector("[data-action='close']") as HTMLElement;
        expect(btn).not.toBeNull();
        // 内置 close 的 title「关闭」
        expect(btn.textContent).toBe("关闭");
    });

    test("点击已注册 action 按钮：走真 action（总线广播）", async () => {
        const { root, engine } = mount(
            `<div id="zone" x-error>
                <button id="b" @click="raise('x', { actions: ['fix'] })">go</button>
            </div>`,
            {},
            { actions: { fix: () => "done" } } as any,
        );
        const zone = root.querySelector("#zone")!;
        let resolved: any = null;
        engine.on("actions/fix/resolved" as any, (p: any) => {
            resolved = p;
        });
        (root.querySelector("#b") as HTMLButtonElement).click();
        await nextTick();
        (zone.querySelector("[data-action='fix']") as HTMLElement).click();
        await nextTick();
        expect(resolved).not.toBeNull();
    });

    test("点击未注册 action 按钮：合成透传 descriptor 照播双通道", async () => {
        const { root, engine } = mount(
            `<div id="zone" x-error>
                <button id="b" @click="raise('x', { actions: ['ghost'] })">go</button>
            </div>`,
            {},
        );
        const zone = root.querySelector("#zone")!;
        let resolved: any = null;
        engine.on("actions/ghost/resolved" as any, (p: any) => {
            resolved = p;
        });
        (root.querySelector("#b") as HTMLButtonElement).click();
        await nextTick();
        (zone.querySelector("[data-action='ghost']") as HTMLElement).click();
        await nextTick();
        expect(resolved).not.toBeNull();
    });

    test("静态层 actions 表达式（全局 store watch）：渲染 [{name,title}]", async () => {
        const { root } = mount(
            `<div id="zone" x-error x-error-options.actions="acts">
                <button id="b" @click="raise('x')">go</button>
            </div>`,
            { acts: ["close"] },
        );
        const zone = root.querySelector("#zone")!;
        (root.querySelector("#b") as HTMLButtonElement).click();
        await nextTick();
        expect(zone.querySelector("[data-action='close']")).not.toBeNull();
    });
});
