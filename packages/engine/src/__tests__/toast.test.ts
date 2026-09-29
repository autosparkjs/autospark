import { describe, expect, test, afterEach } from "bun:test";
import "./setup";
import { mount, nextTick } from "./helpers";
import { AutoSpark } from "../engine";

/**
 * 全局轻提示测试（ADR-0068）：三态入参 / id 与原地更新 / 分区 FIFO 队列 / delay 与 hover
 * 暂停 / type 图标与语义色 / actions 委托 / closable / 双通道事件 / 全关语义 / 生命周期收口 /
 * 全局 toast action / 自定义 shell。
 *
 * 断言走 document 级选择器（容器挂 body，tooltip.test.ts 同模式）。卡片内容经响应式
 * watcher 首渲染（schedule 微任务），内容断言前须 `await nextTick()`。确定性收敛离场动画
 * 循 tooltip 的 fireTipEnd 手法（slide 过渡 transform + opacity 双属性，逐属性派发
 * transitionend）；无动画路径（delete / clear(false) / destroy）同步完成可直接断言。
 */

const engines: any[] = [];
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const containerOf = (): HTMLElement | null =>
    document.querySelector(".autospark-toasts") as HTMLElement | null;
const columnOf = (pos: string): HTMLElement | null =>
    (containerOf()?.querySelector(`:scope > [data-toast-pos="${pos}"]`) as HTMLElement) ?? null;
const cardsOf = (pos: string): HTMLElement[] =>
    Array.from(columnOf(pos)?.querySelectorAll(":scope > .autospark-toast") ?? []) as HTMLElement[];
const cardOf = (pos = "top-right"): HTMLElement | null => cardsOf(pos)[0] ?? null;
const msgHtmlOf = (card: HTMLElement | null): string =>
    card?.querySelector(".autospark-toast-message")?.innerHTML ?? "";

/** 劫持 engine.logger.warn 收集告警 */
function hijackWarns(engine: any, fn: () => void): string[] {
    const warns: string[] = [];
    const orig = engine.logger.warn;
    engine.logger.warn = (...args: any[]) => warns.push(args.join(" "));
    try {
        fn();
    } finally {
        engine.logger.warn = orig;
    }
    return warns;
}

/**
 * 确定性收敛 leave 动画（tooltip fireTipEnd 同款）：slide 过渡 transform + opacity 双属性，
 * 结束检测按 computed transition-property 收齐两个 transitionend，逐属性派发。
 */
const fireCardEnd = (el: Element) => {
    for (const p of ["transform", "opacity"]) {
        const e = new Event("transitionend");
        (e as any).propertyName = p;
        el.dispatchEvent(e);
    }
};

const setup = (options: any = {}) => {
    const m = mount(`<div id="app"></div>`, {}, options);
    engines.push(m.engine);
    return m;
};

// 用例间收口（feedback.test.ts 同模式，try/catch 容「destroy 收口」用例的二次销毁）：
// 断言走 document 级选择器（容器挂 body），不销毁则 sticky 卡片跨用例泄漏——后续用例的
// `expect(cardOf()).toBeNull()` 失败时 bun 对 happy-dom 元素 diff 死循环（超时失效）。
afterEach(() => {
    for (const e of engines.splice(0)) {
        try {
            e.destroy();
        } catch {
            /* 已在用例内销毁 */
        }
    }
});

describe("API 三态入参（ADR-0068 决策 4）", () => {
    test("字符串简写 ≡ { message }：卡片挂 top-right 列、x-html 渲染内容", async () => {
        const { engine } = setup();
        const task = engine.toast("你好");
        await nextTick();
        // id 自动生成（autoId 为模块级计数器——全量套件下不从头计数，断言形态与可查性即可）
        expect(task.id).toMatch(/^toast-\d+$/);
        expect(task.el).toBe(cardOf());
        expect(task.closed).toBe(false);
        expect(msgHtmlOf(cardOf())).toContain("你好");
        expect(engine.toastManager.get(task.id)).toBe(task);
    });

    test("props 对象：id 缺省自动生成自增；className 追加卡片根", () => {
        const { engine } = setup();
        const t1 = engine.toast({ message: "a", delay: 0 });
        const t2 = engine.toast({ message: "b", delay: 0, className: "my-toast extra" });
        expect(t1.id).toMatch(/^toast-\d+$/);
        expect(t2.id).toMatch(/^toast-\d+$/);
        expect(t2.id).not.toBe(t1.id);
        expect(t2.el!.className).toContain("my-toast");
        expect(t2.el!.className).toContain("extra");
    });

    test("async factory：resolve props 显示；resolve undefined 静默跳过", async () => {
        const { engine } = setup();
        const t1 = engine.toast(async () => ({ message: "异步内容", delay: 0 }));
        expect(t1.el).toBeNull(); // 挂起期无 DOM
        await nextTick();
        expect(t1.id).toMatch(/^toast-\d+$/);
        expect(msgHtmlOf(t1.el)).toContain("异步内容");
        const t2 = engine.toast(async () => undefined);
        await nextTick();
        expect(t2.el).toBeNull();
        expect(engine.toastManager.has(t2.id)).toBe(false); // 未入 Map
    });

    test("async factory：挂起期 hide() = 取消，resolve 后不显示", async () => {
        const { engine } = setup();
        let release: (v: any) => void = () => {};
        const gate = new Promise((r) => (release = r));
        const task = engine.toast(() => gate as Promise<any>);
        task.hide();
        release({ message: "迟到", delay: 0 });
        await nextTick();
        expect(task.closed).toBe(true);
        expect(engine.toastManager.size).toBe(0);
        expect(cardOf()).toBeNull();
    });

    test("空 message warn + no-op；未知保留键 warn + 忽略", () => {
        const { engine } = setup();
        const warns = hijackWarns(engine, () => {
            engine.toast("");
            engine.toast({ message: "  " });
            engine.toast({ message: "ok", foo: 1 });
        });
        expect(engine.toastManager.size).toBe(1); // 仅 "ok" 入列
        expect(warns.some((w) => w.includes("message 为空"))).toBe(true);
        expect(warns.some((w) => w.includes('未知配置键 "foo"'))).toBe(true);
    });

    test("message 经 sanitizer 消毒（x-html 默认通道）：script 剥除", async () => {
        const { engine } = setup();
        engine.toast({ message: 'hi<script>window.__toast_xss = 1</script>', delay: 0 });
        await nextTick();
        expect(cardOf()!.querySelector("script")).toBeNull();
        expect(msgHtmlOf(cardOf())).toContain("hi");
    });
});

describe("同 id 原地更新（ADR-0068 决策 5）", () => {
    test("显示中：换内容 + 换 type（响应式），不重复挂卡、不重播动画", async () => {
        const { engine } = setup();
        const task = engine.toast({ id: "u", message: "v1", type: "info", delay: 0 });
        await nextTick();
        const column = columnOf("top-right")!;
        expect(column.querySelectorAll(".autospark-toast").length).toBe(1);
        expect(msgHtmlOf(task.el)).toContain("v1");
        expect(task.el!.getAttribute("data-toast-type")).toBe("info");

        engine.toast({ id: "u", message: "v2", type: "error" });
        await nextTick();
        expect(msgHtmlOf(task.el)).toContain("v2");
        expect(task.el!.getAttribute("data-toast-type")).toBe("error"); // type 换色分派属性
        expect(column.querySelectorAll(".autospark-toast").length).toBe(1); // 卡片复用
        expect(engine.toastManager.size).toBe(1);
    });

    test("显示中：重置 delay 满额计时（更新后重新计满才关）", async () => {
        const { engine } = setup();
        const task = engine.toast({ id: "t", message: "v1", delay: 60 });
        await nextTick();
        await sleep(40);
        engine.toast({ id: "t", message: "v2" }); // 重置计时
        await sleep(40);
        expect(task.closed).toBe(false); // 原 delay 已过，重置后未到
        await sleep(40);
        expect(task.closed).toBe(true);
    });

    test("排队中：只换内容、位置不动（显示时以新值渲染）", async () => {
        const { engine } = setup({ toast: { showCount: 1, delay: 0 } });
        const t1 = engine.toast({ message: "a" });
        const t2 = engine.toast({ id: "q", message: "b" });
        expect(t2.el).toBeNull();
        engine.toast({ id: "q", message: "b2" });
        expect(engine.toastManager.size).toBe(2);
        engine.toastManager.delete(t1.id); // 无动画腾坑 → t2 补位
        await nextTick();
        expect(msgHtmlOf(t2.el)).toContain("b2");
    });
});

describe("分区 FIFO 队列（ADR-0068 决策 8）", () => {
    test("满员排队（el null）、delete 腾坑后 FIFO 补位", async () => {
        const { engine } = setup({ toast: { showCount: 2, delay: 0 } });
        const t1 = engine.toast("a");
        const t2 = engine.toast("b");
        const t3 = engine.toast("c");
        await nextTick();
        expect(t1.el).toBeTruthy();
        expect(t2.el).toBeTruthy();
        expect(t3.el).toBeNull(); // 排队
        engine.toastManager.delete(t1.id);
        expect(t3.el).toBeTruthy(); // 同步补位
        expect(cardsOf("top-right").length).toBe(2);
    });

    test("按 pos 分区各计：top-right 满员不阻塞 bottom-left 入队", () => {
        const { engine } = setup({ toast: { showCount: 1, delay: 0 } });
        const tr = engine.toast({ message: "a" });
        const tr2 = engine.toast({ message: "b" });
        const bl = engine.toast({ message: "c", pos: "bottom-left" });
        expect(tr.el).toBeTruthy();
        expect(tr2.el).toBeNull();
        expect(bl.el).toBeTruthy(); // 独立分区不受 top-right 满员影响
    });

    test("append 列尾：先来在上、后来在下", async () => {
        const { engine } = setup({ toast: { delay: 0 } });
        engine.toast("first");
        engine.toast("second");
        engine.toast("third");
        await nextTick();
        const cards = cardsOf("top-right");
        expect(cards.length).toBe(3);
        expect(cards[0].textContent).toContain("first");
        expect(cards[2].textContent).toContain("third");
    });

    test("clear()：清全部（含等待队列）带动画；clear(false) 立即清空", () => {
        const { engine } = setup({ toast: { showCount: 1, delay: 0 } });
        const t1 = engine.toast("a");
        engine.toast("b");
        expect(engine.toastManager.size).toBe(2);
        engine.toastManager.clear(false);
        expect(engine.toastManager.size).toBe(0);
        expect(cardsOf("top-right").length).toBe(0);
        expect(t1.closed).toBe(true);
    });

    test("自动关闭后按序补位", async () => {
        const { engine } = setup({ toast: { showCount: 1, delay: 30 } });
        const t1 = engine.toast("a");
        const t2 = engine.toast("b");
        await nextTick();
        expect(t2.el).toBeNull();
        await sleep(60); // t1 自动关 + leave 零时长降级自动 teardown → 补位
        expect(t2.el).toBeTruthy();
    });
});

describe("delay 与 hover 暂停（ADR-0068 决策 9）", () => {
    test("delay 到时自动关闭并广播 hide；teardown 后出 Map", async () => {
        const { engine } = setup();
        const events: string[] = [];
        engine.on("toast:show", () => events.push("show"));
        engine.on("toast:hide", () => events.push("hide"));
        const task = engine.toast({ message: "m", delay: 30 });
        expect(events).toEqual(["show"]);
        await sleep(50);
        // happy-dom 无动画环境：leave 结束检测零时长降级，teardown 在下一宏任务自动完成
        expect(task.closed).toBe(true);
        await nextTick();
        expect(engine.toastManager.has(task.id)).toBe(false);
        expect(events).toEqual(["show", "hide"]);
    });

    test("delay: 0 = sticky 永不自动关", async () => {
        const { engine } = setup();
        const task = engine.toast({ message: "m", delay: 0 });
        await sleep(60);
        expect(task.closed).toBe(false);
    });

    test("hover 暂停 / 移出恢复（剩余时间制）", async () => {
        const { engine } = setup();
        const task = engine.toast({ message: "m", delay: 60 });
        await nextTick();
        task.el!.dispatchEvent(new MouseEvent("mouseenter"));
        await sleep(80); // 已超原 delay——暂停中不关
        expect(task.closed).toBe(false);
        task.el!.dispatchEvent(new MouseEvent("mouseleave"));
        await sleep(80); // 剩余时间（< 60ms）内关
        expect(task.closed).toBe(true);
    });

    test("全局 delay 默认（options.toast.delay）+ 单次覆盖", async () => {
        const { engine } = setup({ toast: { delay: 40 } });
        const t1 = engine.toast("全局");
        const t2 = engine.toast({ message: "覆盖", delay: 0 });
        await sleep(60);
        expect(t1.closed).toBe(true);
        expect(t2.closed).toBe(false); // sticky 覆盖全局
    });
});

describe("pos 与分区列（ADR-0068 决策 7）", () => {
    test("7 值枚举建列；data-toast-pos 标记挂卡片根（slide 覆写层分派）", async () => {
        const { engine } = setup({ toast: { delay: 0 } });
        engine.toast({ message: "m", pos: "bottom-left" });
        engine.toast({ message: "m", pos: "center" });
        await nextTick();
        expect(columnOf("bottom-left")).toBeTruthy();
        expect(columnOf("center")).toBeTruthy();
        expect(cardOf("bottom-left")!.getAttribute("data-toast-pos")).toBe("bottom-left");
    });

    test("非法 pos warn + 回退 top-right；offset 仅列创建时生效（已建列不迁移）", () => {
        const { engine } = setup({ toast: { delay: 0 } });
        const warns = hijackWarns(engine, () => {
            engine.toast({ message: "m", offset: 42 });
            engine.toast({ message: "m", pos: "nope" as any, offset: 99 });
        });
        expect(columnOf("top-right")!.style.getPropertyValue("--autospark-toast-inset")).toBe("42px");
        expect(warns.some((w) => w.includes('未知 pos "nope"'))).toBe(true);
    });
});

describe("type / 图标 / 语义色（ADR-0068 决策 12/13）", () => {
    test("type 分派 data-toast-type + x-icon 渲染内置图标；none 无图标", async () => {
        const { engine } = setup({ toast: { delay: 0 } });
        engine.toast({ message: "m", type: "error" });
        engine.toast({ message: "m2", type: "none", id: "t2" });
        await nextTick();
        const errCard = cardOf("top-right")!;
        expect(errCard.getAttribute("data-toast-type")).toBe("error");
        expect(errCard.querySelector(".autospark-toast-icon svg")).toBeTruthy(); // 内置 error 图标
        const noneCard = engine.toastManager.get("t2")!.el!;
        // none：图标区 x-show 隐藏（display:none 零占位）
        expect(noneCard.getAttribute("data-toast-type")).toBe("none");
        expect(noneCard.querySelector(".autospark-toast-icon")!.style.display).toBe("none");
    });

    test("icons 重映射（options.toast.icons）+ success 默认映射内置 yes 图标", async () => {
        const { engine } = setup({ toast: { delay: 0, icons: { error: "warn" } } });
        engine.toast({ message: "m", type: "error" });
        engine.toast({ message: "s", type: "success", id: "s1" });
        await nextTick();
        const icon = cardOf("top-right")!.querySelector(".autospark-toast-icon svg use")!;
        expect(icon.getAttribute("href")).toContain("as-warn"); // 重映射生效
        const okIcon = engine.toastManager.get("s1")!.el!.querySelector(".autospark-toast-icon svg use")!;
        expect(okIcon.getAttribute("href")).toContain("as-yes"); // success → yes
    });

    test("语义色：type 分派 accent CSS 变量（data-toast-type 选择器，ADR-0068 决策 13）", () => {
        const { engine } = setup({ toast: { delay: 0 } });
        engine.toast({ message: "m", type: "error" });
        // 变量分派规则存在于注入样式（.autospark-toast[data-toast-type="error"] 分派 accent）
        const style = document.getElementById("autospark-toast-styles")!;
        expect(style.textContent).toContain('--autospark-toast-accent: var(--autospark-toast-error-color');
    });
});

describe("actions 双形态（ADR-0068 决策 14）", () => {
    test("内联对象：点击直调 handle、hide 默认 true 关 toast", async () => {
        const { engine } = setup();
        let calls = 0;
        const task = engine.toast({
            message: "m",
            delay: 0,
            actions: [{ title: "撤销", handle: () => calls++ }],
        });
        await nextTick();
        const btn = task.el!.querySelector(".autospark-toast-action") as HTMLElement;
        expect(btn.textContent).toContain("撤销");
        btn.click();
        expect(calls).toBe(1);
        expect(task.closed).toBe(true); // hide 默认 true
        fireCardEnd(task.el ?? cardOf()!);
        await nextTick();
        expect(cardOf()).toBeNull();
    });

    test("hide: false 续显（点击后 toast 保留）", async () => {
        const { engine } = setup();
        const task = engine.toast({
            message: "m",
            delay: 0,
            actions: [{ title: "重试", handle: () => {}, hide: false }],
        });
        await nextTick();
        (task.el!.querySelector(".autospark-toast-action") as HTMLElement).click();
        expect(task.closed).toBe(false);
        expect(task.el).toBeTruthy();
    });

    test("字符串查 engine.actions 全局表（title 注入）；未命中 warn + 剪枝", async () => {
        const { engine } = setup();
        let calls = 0;
        engine.actions.undo = { handle: () => calls++, title: "撤销改动" };
        const task = engine.toast({ message: "m", delay: 0, actions: ["undo", "ghost"] });
        const warns = hijackWarns(engine, () => engine.toast({ message: "m2", delay: 0, id: "w1", actions: ["ghost"] }));
        await nextTick();
        const btn = task.el!.querySelector(".autospark-toast-action") as HTMLElement;
        expect(btn.textContent).toContain("撤销改动");
        btn.click();
        expect(calls).toBe(1);
        expect(task.closed).toBe(true);
        expect(warns.some((w) => w.includes('"ghost" 未在全局 action 表命中'))).toBe(true);
        expect(engine.toastManager.get("w1")!.el!.querySelector(".autospark-toast-action")).toBeNull();
    });
});

describe("closable 关闭钮（ADR-0068 决策 11）", () => {
    test("默认隐藏；closable: true 点击关 toast", async () => {
        const { engine } = setup();
        const t1 = engine.toast({ message: "m", delay: 0 });
        const t2 = engine.toast({ message: "m", delay: 0, closable: true, id: "c2" });
        await nextTick();
        expect(t1.el!.querySelector(".autospark-toast-close")!.style.display).toBe("none");
        const closeBtn = engine.toastManager.get("c2")!.el!.querySelector(
            ".autospark-toast-close",
        ) as HTMLElement;
        expect(closeBtn.style.display).not.toBe("none");
        closeBtn.click();
        expect(engine.toastManager.get("c2")!.closed).toBe(true);
    });
});

describe("全局 toast action（ADR-0068 决策 15）", () => {
    test("engine.actions.toast 存在：payload 字符串 / 对象直通 engine.toast", async () => {
        const { engine } = setup();
        expect(engine.actions.toast).toBeTruthy();
        engine.actions.toast.handle("来自 action");
        await nextTick();
        expect(msgHtmlOf(cardOf())).toContain("来自 action");
        engine.actions.toast.handle({ id: "from-obj", message: "对象载荷", type: "error", delay: 0 });
        await nextTick();
        expect(engine.toastManager.get("from-obj")!.el!.getAttribute("data-toast-type")).toBe("error");
    });

    test("toast action 调用广播 actions/toast/*（buildAction 包装）", async () => {
        const { engine } = setup();
        const events: string[] = [];
        engine.on("actions/toast/pending", () => events.push("pending"));
        engine.actions.toast.handle("m");
        expect(events).toEqual(["pending"]);
    });

    test("用户同名声明覆盖内置", async () => {
        let custom = 0;
        const { engine } = setup({ actions: { toast: { handle: () => custom++ } } });
        engine.actions.toast.handle();
        await nextTick();
        expect(custom).toBe(1);
        expect(engine.toastManager.size).toBe(0); // 内置被覆盖，不弹 toast
    });
});

describe("开关与生命周期（ADR-0068 决策 6/10）", () => {
    test("options.toast: false 全关：warn + 死句柄、不建容器", () => {
        const { engine } = setup({ toast: false });
        const warns = hijackWarns(engine, () => {
            const task = engine.toast("m");
            expect(task.closed).toBe(true);
            expect(task.el).toBeNull();
        });
        expect(warns.some((w) => w.includes("options.toast: false"))).toBe(true);
        // 全关语义 = 本引擎不建容器（toast: false 时构造即短路）；样式表是 document 级共享
        // 资产（首个启用 toast 的引擎注入后跨用例常驻），不可断言其不存在。
        // ⚠️ 勿对 happy-dom 元素做会失败的 expect——bun 序列化元素 diff 死循环（实测）。
        expect(document.querySelector(".autospark-toasts")).toBeNull();
    });

    test("engine.stop() 不动 toast（无锚非树内，生命周期独立）", async () => {
        const { engine } = setup();
        const task = engine.toast({ message: "m", delay: 0 });
        await nextTick();
        engine.stop();
        expect(task.closed).toBe(false);
        expect(task.el!.isConnected).toBe(true);
    });

    test("engine.destroy() 收口：全部销毁 + 容器整体移除", async () => {
        const { engine } = setup();
        const task = engine.toast({ message: "m", delay: 0 });
        await nextTick();
        engine.destroy();
        expect(task.closed).toBe(true);
        expect(engine.toastManager.size).toBe(0);
        expect(document.querySelector(".autospark-toasts")).toBeNull();
    });

    test("delete(id)：立即销毁（无动画）——与 hide() 的动画关闭区分", async () => {
        const { engine } = setup();
        const task = engine.toast({ message: "m", delay: 0 });
        await nextTick();
        expect(engine.toastManager.delete(task.id)).toBe(true);
        expect(engine.toastManager.delete(task.id)).toBe(false); // 幂等
        expect(engine.toastManager.size).toBe(0);
        expect(cardOf()).toBeNull();
    });
});

describe("自定义 shell（ADR-0068 决策 2/11）", () => {
    test("options.toast.shell 查全局组件表：自定义结构 + ToastProps 注入（x-text 消费 message）", async () => {
        const { engine } = setup({
            components: {
                "my-toast": `<div class="my-toast"><b x-text="message"></b></div>`,
            },
            toast: { delay: 0, shell: "my-toast" },
        });
        const task = engine.toast("自定义外壳");
        await nextTick();
        const custom = document.querySelector(".my-toast") as HTMLElement;
        expect(custom).toBeTruthy();
        expect(custom.textContent).toContain("自定义外壳");
        expect(task.el).toBe(custom); // 产物根即自定义结构
        expect(custom.getAttribute("data-toast-pos")).toBe("top-right"); // 引擎契约标记照打
    });

    test("shell 未命中 warn + 回退内置 toast-shell（弹窗照常工作）", async () => {
        const { engine } = setup({ toast: { delay: 0, shell: "nope" } });
        const warns = hijackWarns(engine, () => engine.toast("m"));
        await nextTick();
        expect(warns.some((w) => w.includes('"nope" 未在全局组件表命中'))).toBe(true);
        expect(cardOf()).toBeTruthy(); // 内置兜底
    });

    test("hide 广播双通道：卡片元素 dispatchEvent（body 侧通道）", async () => {
        const { engine } = setup();
        let domSide = 0;
        const task = engine.toast({ message: "m", delay: 0 });
        await nextTick();
        task.el!.addEventListener("toast:hide", () => domSide++);
        engine.toastManager.delete(task.id);
        expect(domSide).toBe(1);
    });
});
