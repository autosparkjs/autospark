import { describe, expect, test, afterEach } from "bun:test";
import "./setup";
import { mount, nextTick } from "./helpers";
import { AutoSpark } from "../engine";

/**
 * 消息模块测试（ADR-0071）：三态入参 / 同 id 原地更新 / 记录⇄展示两态（persist/show）/
 * 分区 FIFO 队列 / delayClose 与 hover 暂停 / level 图标与语义色 / actions value 闭环 /
 * confirm / task 进度 / update+markRead / maxLen / 渲染双层组合 / anchor 三职 /
 * 持久化 local·load / 双通道事件与迁移期双发 / 全关语义 / destroy 收口 / 配套 action 三件套。
 *
 * 断言走 document 级选择器（容器挂 body，toast.test.ts 同模式）。卡片内容经响应式 watcher
 * 首渲染（schedule 微任务），内容断言前须 `await nextTick()`。动画关闭用 fireCardEnd 确定性
 * 收敛（slide 双属性 transitionend）；无动画路径（delete / clear(false) / destroy）同步完成。
 */

const engines: any[] = [];
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const containerOf = (): HTMLElement | null =>
    document.querySelector(".autospark-messages") as HTMLElement | null;
const columnOf = (pos: string): HTMLElement | null =>
    (containerOf()?.querySelector(`:scope > [data-message-pos="${pos}"]`) as HTMLElement) ?? null;
const cardsOf = (pos: string): HTMLElement[] =>
    (Array.from(columnOf(pos)?.querySelectorAll(":scope > .autospark-message") ?? []) as HTMLElement[]);
const cardOf = (pos = "top-right"): HTMLElement | null => cardsOf(pos)[0] ?? null;
const titleOf = (card: HTMLElement | null): string =>
    card?.querySelector(".autospark-message-title")?.innerHTML ?? "";
const descriptionOf = (card: HTMLElement | null): string =>
    card?.querySelector(".autospark-message-description")?.innerHTML ?? "";
const actionBtnsOf = (card: HTMLElement | null): HTMLElement[] =>
    (Array.from(card?.querySelectorAll(".autospark-message-action") ?? []) as HTMLElement[]);
/** 关闭钮显隐判定：x-show 只切 display（元素恒在 DOM），以 display 为准 */
const closeShownOf = (card: HTMLElement | null): boolean =>
    ((card?.querySelector(".autospark-message-close") as HTMLElement | null)?.style?.display ?? "none") !== "none";

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

/** 确定性收敛 leave 动画（slide 过渡 transform + opacity 双属性） */
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

const click = (el: Element) => el.dispatchEvent(new MouseEvent("click", { bubbles: true }));

afterEach(() => {
    for (const e of engines.splice(0)) {
        try {
            e.destroy();
        } catch {
            /* 已在用例内销毁 */
        }
    }
    localStorage.clear();
});

describe("API 三态入参（ADR-0071 决策 7）", () => {
    test("字符串简写 ≡ { title }：卡片挂 top-right 列、句柄可查", async () => {
        const { engine } = setup();
        const task = engine.messages.add("你好");
        await nextTick();
        expect(task.id).toMatch(/^message-\d+$/);
        expect(task.type).toBe("toast");
        expect(task.el).toBe(cardOf());
        expect(task.closed).toBe(false);
        expect(titleOf(cardOf())).toContain("你好");
        expect(engine.messages.get(task.id)).toBe(task);
    });

    test("props 对象：className 追加卡片根；show(props) 别名同路转发", async () => {
        const { engine } = setup();
        const task = engine.messages.show({ title: "别名通道", className: "my-toast", delayClose: 0 });
        await nextTick();
        expect(titleOf(cardOf())).toContain("别名通道");
        expect(cardOf()?.classList.contains("my-toast")).toBe(true);
        expect(engine.messages.get(task.id)).toBe(task);
    });

    test("async factory：resolve undefined 静默跳过；挂起期 hide() = 取消", async () => {
        const { engine } = setup();
        const skipped = engine.messages.add(async () => undefined);
        await sleep(10);
        expect(skipped.closed).toBe(true);
        expect(cardOf()).toBeNull();

        let resolved = false;
        const task = engine.messages.add(async () => {
            await sleep(20);
            resolved = true;
            return { title: "迟到数据" };
        });
        task.hide(); // 挂起期取消
        await sleep(40);
        expect(resolved).toBe(true);
        expect(cardOf()).toBeNull(); // 取消后不显示
    });

    test("空 title warn + no-op；未知键整包透传不 warn（ADR-0088）但不落盘（十键白名单修订）", () => {
        const { engine } = setup();
        const warns = hijackWarns(engine, () => {
            engine.messages.add({ title: "  " }); // 空 title：warn + 不建卡
        });
        expect(engine.messages.size).toBe(0);
        expect(warns.some((w) => w.includes("title 为空"))).toBe(true);
        // 未知键（旧键 delay / 自定义键）：props 层整包透传不 warn、卡片照建（ADR-0088）；
        // 持久化**不落盘**（ADR-0088 修订：十键白名单——后端通用消息表只管业务数据，
        // 自有业务数据走 owner/status/result 三透传键）
        const warns2 = hijackWarns(engine, () => {
            engine.messages.add({ id: "u1", title: "x", delay: 100, delayClose: 0, persist: 2 });
        });
        expect(warns2.length).toBe(0);
        expect(engine.messages.size).toBe(1);
        const stored = JSON.parse(localStorage.getItem("autospark-messages")!);
        expect(stored.find((r: any) => r.id === "u1")?.delay).toBeUndefined();
        engine.messages.clear(false); // 清理
    });
});

describe("同 id 原地更新（决策 7）", () => {
    test("显示中换内容 + 重置计时 + 不重播动画；未传键保留原值", async () => {
        const { engine } = setup();
        const task = engine.messages.add({ id: "up", title: "v1", level: "info", delayClose: 80 });
        await nextTick();
        const el = task.el!;
        engine.messages.add({ id: "up", title: "v2" }); // 只换 title
        await nextTick();
        expect(task.el).toBe(el); // 同一卡片 DOM（不重建）
        expect(titleOf(cardOf())).toContain("v2");
        // 未传的 type 保留
        expect(el.getAttribute("data-message-level")).toBe("info");
        // 重置计时：首 add 后 60ms 更新，更新后再 60ms（累计 120 > 80）仍存活
        await sleep(60);
        engine.messages.add({ id: "up", title: "v3" });
        await sleep(60);
        expect(task.closed).toBe(false);
        await sleep(50);
        expect(task.closed).toBe(true);
    });

    test("pos / id 更新时忽略（不迁移列）", async () => {
        const { engine } = setup();
        const task = engine.messages.add({ id: "fix", title: "a", pos: "top-right", delayClose: 0 });
        await nextTick();
        engine.messages.add({ id: "fix", title: "b", pos: "bottom-left" });
        await nextTick();
        expect(cardsOf("top-right").length).toBe(1); // 不迁移
        expect(cardsOf("bottom-left").length).toBe(0);
    });
});

describe("分区 FIFO 队列（沿 ADR-0068 决策 8）", () => {
    test("showCount 满员排队、关闭补位；分区互不阻塞", async () => {
        const { engine } = setup({ messages: { showCount: 2, delayClose: 0 } });
        const t1 = engine.messages.add({ title: "a" });
        const t2 = engine.messages.add({ title: "b" });
        const t3 = engine.messages.add({ title: "c" }); // 排队
        const t4 = engine.messages.add({ title: "d", pos: "bottom-left" }); // 右下不受右上满员阻塞
        await nextTick();
        expect(cardsOf("top-right").length).toBe(2);
        expect(cardsOf("bottom-left").length).toBe(1);
        expect(engine.messages.size).toBe(4);
        t1.hide();
        fireCardEnd(t1.el!);
        await nextTick();
        expect(cardsOf("top-right").length).toBe(2); // t3 补位
        expect(titleOf(cardsOf("top-right")[1])).toContain("c");
        expect(t3.closed).toBe(false);
        t2.hide();
        t3.hide();
        t4.hide();
        fireCardEnd(t2.el!);
        fireCardEnd(t3.el!);
        fireCardEnd(t4.el!);
    });
});

describe("delayClose / sticky / hover 暂停", () => {
    test("delayClose 0 = sticky 永不自动关；hover 暂停 / 移出恢复剩余时间", async () => {
        const { engine } = setup();
        const sticky = engine.messages.add({ title: "sticky", delayClose: 0 });
        const timed = engine.messages.add({ title: "timed", delayClose: 100 });
        await nextTick();
        timed.el!.dispatchEvent(new Event("mouseenter"));
        await sleep(120);
        expect(sticky.closed).toBe(false);
        expect(timed.closed).toBe(false); // hover 暂停
        timed.el!.dispatchEvent(new Event("mouseleave"));
        await sleep(130); // resume 按剩余时间（≈满额 100ms）续表
        expect(timed.closed).toBe(true); // 剩余时间恢复后到点
        sticky.hide();
        fireCardEnd(sticky.el!);
    });
});

describe("type 图标与语义色（沿现行实现契约）", () => {
    test("data-message-type 分派；none 无图标；success 图标 + 图标元素", async () => {
        const { engine } = setup();
        engine.messages.add({ title: "ok", level: "success", delayClose: 0 });
        engine.messages.add({ title: "plain", delayClose: 0, pos: "bottom-right" });
        await nextTick();
        expect(cardOf()?.getAttribute("data-message-level")).toBe("success");
        const icon = cardOf()?.querySelector(".autospark-message-icon");
        expect(icon).toBeTruthy();
        // x-icon 渲染内置 yes 图标（svg 注入）
        expect(icon?.innerHTML).not.toBe("");
        const plain = cardsOf("bottom-right")[0];
        expect(plain.getAttribute("data-message-level")).toBe("none");
        const plainIcon = plain.querySelector(".autospark-message-icon") as HTMLElement;
        expect(plainIcon.style.display).toBe("none"); // x-show 隐藏
    });

    test("显式 icon 优先于 type 默认映射", async () => {
        const { engine } = setup();
        engine.messages.add({ title: "x", level: "info", icon: "warn", delayClose: 0 });
        await nextTick();
        const icon = cardOf()?.querySelector(".autospark-message-icon");
        // warn 图标为内置同名词——与 info 不同的 svg 内容（此处仅断言渲染出了图标）
        expect(icon?.innerHTML).not.toBe("");
    });
});

describe("description / link / closable", () => {
    test("description 次行渲染；link 尾随外链（新标签）且点击不关、置已读；closable 出关闭钮", async () => {
        const { engine } = setup();
        const task = engine.messages.add({
            title: "标题",
            description: "正文说明",
            link: "https://example.com",
            closable: true,
            delayClose: 0,
        });
        await nextTick();
        expect(descriptionOf(cardOf())).toContain("正文说明");
        const link = cardOf()?.querySelector(".autospark-message-link") as HTMLAnchorElement;
        expect(link.getAttribute("target")).toBe("_blank");
        expect(link.getAttribute("rel")).toBe("noopener noreferrer");
        // 阻断 happy-dom 对 <a href> 的真实导航默认行为（在途请求失败会炸进程）——
        // 本用例只验证事件闭环：点击置已读、不关闭
        link.addEventListener("click", (e) => e.preventDefault());
        expect(task.read).toBe(false);
        click(link!);
        expect(task.read).toBe(true); // 任意点击置已读
        expect(task.closed).toBe(false); // 链接点击不关闭
        const closeBtn = cardOf()?.querySelector(".autospark-message-close") as HTMLElement;
        expect(closeBtn).toBeTruthy();
        closeBtn.click();
        expect(task.closed).toBe(true);
    });

    test("closable 缺省（非 sticky）无关闭钮", async () => {
        const { engine } = setup();
        engine.messages.add({ title: "x" }); // delayClose 默认 3000
        await nextTick();
        expect(closeShownOf(cardOf())).toBe(false);
    });

    test("sticky（delayClose: 0）自动补关闭钮；显式 closable: false 压制（三层显式源）", async () => {
        // 缺省：sticky 永不自动关——自动补 ×（否则除 API 外无法关闭）
        const a = setup();
        a.engine.messages.add({ title: "x", delayClose: 0 });
        await nextTick();
        expect(closeShownOf(cardOf())).toBe(true);
        a.engine.destroy();

        // 单次层显式 false：用户明确不要 ×
        const b = setup();
        b.engine.messages.add({ title: "x", delayClose: 0, closable: false });
        await nextTick();
        expect(closeShownOf(cardOf())).toBe(false);
        b.engine.destroy();

        // 全局层显式 false（构造期显式键快照——state 真身被兜底污染不可判 in）
        const c = setup({ messages: { closable: false } });
        c.engine.messages.add({ title: "x", delayClose: 0 });
        await nextTick();
        expect(closeShownOf(cardOf())).toBe(false);
        c.engine.destroy();

        // types 层显式 false
        const d = setup({ messages: { types: { notice: { closable: false } } } });
        d.engine.messages.add({ title: "x", type: "notice", delayClose: 0 });
        await nextTick();
        expect(closeShownOf(cardOf())).toBe(false);
        d.engine.destroy();
    });
});

describe("actions 与 value 闭环（决策 13）", () => {
    test("点击：置已读 → 写 result → message:action（双通道）→ handle → hide 判定", async () => {
        const { engine } = setup();
        const events: any[] = [];
        engine.on("message:action", (m: any) => events.push(m.payload));
        let handled = false;
        const task = engine.messages.add({
            title: "已删除",
            delayClose: 0,
            actions: [
                { title: "撤销", handle: () => (handled = true) }, // hide 默认 true
                { title: "查看", value: 42, hide: false }, // 数据应答 + 续显
            ],
        });
        await nextTick();
        const btns = actionBtnsOf(cardOf());
        expect(btns.length).toBe(2);
        click(btns[0]);
        expect(handled).toBe(true);
        expect(task.closed).toBe(true); // hide 默认关
        fireCardEnd(task.el!);
        expect(task.read).toBe(true); // 点击置已读
        // value 按钮：写 result + 发事件 + 续显
        const t2 = engine.messages.add({
            title: "问卷",
            delayClose: 0,
            actions: [{ title: "查看", value: 42, hide: false }],
        });
        await nextTick();
        click(actionBtnsOf(cardOf())[0]);
        expect(t2.result).toBe(42);
        expect(t2.closed).toBe(false); // hide: false 续显
        expect(events.length).toBeGreaterThanOrEqual(2);
        expect(events[events.length - 1].value).toBe(42);
        // DOM 通道：卡片元素可收到
        const domEvents: any[] = [];
        t2.el!.addEventListener("message:action", (e: any) => domEvents.push(e.detail));
        click(actionBtnsOf(cardOf())[0]);
        expect(domEvents.length).toBe(1);
        t2.hide();
        fireCardEnd(t2.el!);
    });

    test("字符串 action 查全局表（title 回退名）", async () => {
        const { engine } = setup();
        engine.actions["copyAll"] = { title: "全部复制", handle: () => {} };
        engine.messages.add({ title: "x", actions: ["copyAll"], delayClose: 0 });
        await nextTick();
        expect(actionBtnsOf(cardOf())[0].textContent).toContain("全部复制");
    });
});

describe("confirm（决策 11）", () => {
    test("value-only actions 糖：点击 resolve value、写 result、sticky 不自动关", async () => {
        const { engine } = setup();
        const promise = engine.messages.show({ title: "确认删除？", type: "confirm", delayClose: 0, actions: [{ title: "删除", value: true }, { title: "再想想", value: false }] });
        await nextTick();
        const btns = actionBtnsOf(cardOf());
        expect(btns.length).toBe(2);
        expect(btns[0].textContent).toContain("删除");
        expect(btns[1].textContent).toContain("再想想");
        const task = engine.messages.get(Array.from(engine.messages.keys())[0])!;
        await sleep(80);
        expect(task.closed).toBe(false); // sticky
        click(btns[1]);
        await Promise.resolve();
        expect(await promise).toBe(false);
        expect(task.result).toBe(false);
        expect(task.closed).toBe(true);
        fireCardEnd(task.el!);
    });

    test("{yes,no} 可提取键从 props 剥离（不落消息 props）", async () => {
        const { engine } = setup();
        const warns = hijackWarns(engine, () => {
            const p = engine.messages.show({ title: "删除？", type: "confirm", delayClose: 0, actions: [{ title: "删", value: true }, { title: "留", value: false }] });
            p.then(() => {});
        });
        await nextTick();
        expect(warns.some((w) => w.includes("未知配置键"))).toBe(false);
        const btns = actionBtnsOf(cardOf());
        expect(btns[0].textContent).toContain("删");
        btns[0].click();
    });

    test("永不 settle：关闭钮关闭不 resolve（不 reject）", async () => {
        const { engine } = setup();
        let settled = false;
        const p = engine.messages.show({ title: "q", type: "confirm", delayClose: 0 }).then((v: any) => ((settled = true), v));
        await nextTick();
        const task = engine.messages.get(Array.from(engine.messages.keys())[0])!;
        task.el!.querySelector(".autospark-message-close")!.dispatchEvent(
            new MouseEvent("click", { bubbles: true }),
        );
        await sleep(20);
        expect(task.closed).toBe(true);
        expect(settled).toBe(false); // 永不 settle
    });
});

describe("task 进度（决策 12）", () => {
    test("创建即 started（ADR-0083 二次修订）：progress 直呼推进；start() 幂等兼容面", async () => {
        const { engine } = setup();
        const upload = engine.messages.show({ title: "上传", type: "task", delayClose: 80 });
        await nextTick();
        expect(cardOf()?.querySelector(".autospark-message-progress")).toBeTruthy();
        upload.progress(50); // 创建即 started——无需显式 start
        await nextTick();
        expect((cardOf()?.querySelector(".autospark-message-progress-bar") as HTMLElement).style.width).toBe("50%");
        upload.start(); // 幂等兼容面（旧写法）——重复调用无效果
        upload.progress(60);
        await nextTick();
        expect((cardOf()?.querySelector(".autospark-message-progress-bar") as HTMLElement).style.width).toBe("60%");
        upload.progress(150); // clamp
        await nextTick();
        expect(upload.el!.querySelector(".autospark-message-progress-text")?.textContent).toBe("100%");
        await sleep(150); // 完成态 80ms 后收口
        expect(upload.closed).toBe(true);
    });

    test("全逻辑 factory 形态（ADR-0083 二次修订）：return 初始 props 立即弹卡 + 闭包驱动实时推进", async () => {
        const { engine } = setup();
        let settle!: () => void;
        const done = new Promise<void>((r) => (settle = r));
        const s = engine.messages.task(async (session) => {
            // 下载逻辑全部在 factory 内：异步闭包不 await——return 立即执行（卡先弹）
            void (async () => {
                for (let i = 1; i <= 4; i++) {
                    await sleep(25);
                    session.progress(i * 25); // 激活后实时推进（无需 start）
                }
                session.complete();
                settle();
            })();
            return { title: "下载 dataset.zip", delayClose: 60 }; // 初始 props——立即建卡
        });
        await nextTick();
        expect(cardsOf("top-right").length).toBe(1); // 卡已弹出（不等下载完成）
        expect(titleOf(cardOf())).toContain("下载");
        await done;
        await nextTick();
        expect(s.el!.querySelector(".autospark-message-progress-text")?.textContent).toBe("100%");
        await sleep(150); // complete → delayClose 60ms 收口
        expect(s.closed).toBe(true);
    });

    test("pause 闸门 / resume 恢复；cancel 立即关；update(id,{progress}) 同通道", async () => {
        const { engine } = setup();
        const task = engine.messages.show({ title: "导出", type: "task", delayClose: 0 });
        task.start();
        task.pause();
        task.progress(30);
        expect(task.el!.querySelector(".autospark-message-progress-text")?.textContent).toBe("0%");
        task.resume();
        task.progress(30);
        await nextTick();
        expect(task.el!.querySelector(".autospark-message-progress-text")?.textContent).toBe("30%");
        engine.messages.update(task.id, { progress: 60 });
        await nextTick();
        expect(task.el!.querySelector(".autospark-message-progress-text")?.textContent).toBe("60%");
        task.cancel();
        expect(task.closed).toBe(true);
    });

    test("task 专属键不再筛选：非 task 携带 progress 不 warn（ADR-0088 整包直传）", () => {
        const { engine } = setup();
        const warns = hijackWarns(engine, () => {
            engine.messages.add({ title: "n", type: "notice", progress: 50, delayClose: 0 });
        });
        expect(warns.length).toBe(0); // 无害透传——专属键 warn 已随白名单投影退役
        engine.messages.clear(false);
    });
});

describe("记录级写通道 update + 已读（决策 8/11）", () => {
    test("update 改 status/result/title + 专用事件；task 只读 getter", async () => {
        const { engine } = setup();
        const updates: any[] = [];
        const statuses: any[] = [];
        engine.on("message:update", (m: any) => updates.push(m.payload));
        engine.on("message:status", (m: any) => statuses.push(m.payload));
        const task = engine.messages.add({ title: "t", status: "sending", delayClose: 0 });
        await nextTick();
        engine.messages.update(task.id, { status: "failed", description: "网络中断" });
        await nextTick();
        expect(task.status).toBe("failed");
        expect(descriptionOf(cardOf())).toContain("网络中断");
        expect(updates.length).toBe(1);
        expect(statuses.length).toBe(1);
        // result 写走 update（task.result 只读）
        engine.messages.update(task.id, { result: { ok: false } });
        expect(task.result).toEqual({ ok: false });
    });

    test("markRead / markAllRead(type)；点击自动置已读", async () => {
        const { engine } = setup();
        const a = engine.messages.add({ title: "a", type: "notice", delayClose: 0 });
        const b = engine.messages.add({ title: "b", type: "notice", delayClose: 0, pos: "bottom-right" });
        const c = engine.messages.add({ title: "c", type: "toast", delayClose: 0 });
        expect(a.read).toBe(false);
        engine.messages.markAllRead("notice");
        expect(a.read).toBe(true);
        expect(b.read).toBe(true);
        expect(c.read).toBe(false);
        click(cardsOf("top-right")[1]!); // c 是 top-right 第二张（a 先入列在上；点击置本卡片已读）
        expect(c.read).toBe(true);
        b.hide();
        c.hide();
        a.hide();
        fireCardEnd(a.el!);
        fireCardEnd(b.el!);
        fireCardEnd(c.el!);
    });
});

describe("记录 ⇄ 展示两态与 show(id)（决策 5/9）", () => {
    test("persist none 隐藏即删；persist local 隐藏转已隐藏态存活、show(id) 重显", async () => {
        const { engine } = setup();
        const gone = engine.messages.add({ title: "gone", delayClose: 0 });
        const kept = engine.messages.add({ title: "kept", persist: 2, delayClose: 0 });
        await nextTick();
        gone.hide();
        fireCardEnd(gone.el!);
        expect(engine.messages.has(gone.id)).toBe(false); // 记录移除
        kept.hide();
        fireCardEnd(kept.el!);
        expect(kept.closed).toBe(true);
        expect(kept.el).toBeNull();
        expect(engine.messages.has(kept.id)).toBe(true); // 记录存活
        expect(cardsOf("top-right").length).toBe(0);
        const again = engine.messages.show(kept.id);
        expect(again).toBe(kept);
        await nextTick();
        expect(cardsOf("top-right").length).toBe(1);
        expect(titleOf(cardOf())).toContain("kept");
        kept.hide();
        fireCardEnd(kept.el!);
    });

    test("show 不存在 / 已移除 → warn + null；展示中幂等", async () => {
        const { engine } = setup();
        const task = engine.messages.add({ title: "x", delayClose: 0 });
        await nextTick();
        expect(engine.messages.show(task.id)).toBe(task); // 展示中幂等
        const warns = hijackWarns(engine, () => {
            expect(engine.messages.show("nope")).toBeNull();
        });
        expect(warns.length).toBe(1);
        task.hide();
        fireCardEnd(task.el!);
    });
});

describe("maxLen 缓冲（决策 6）", () => {
    test("溢出 FIFO 丢最旧（含展示中）", async () => {
        const { engine } = setup({ messages: { maxLen: 2, delayClose: 0 } });
        const a = engine.messages.add({ title: "a" });
        const b = engine.messages.add({ title: "b" });
        const c = engine.messages.add({ title: "c" });
        expect(engine.messages.size).toBe(2);
        expect(engine.messages.has(a.id)).toBe(false); // 最旧淘汰
        expect(engine.messages.has(c.id)).toBe(true);
        b.hide();
        c.hide();
        fireCardEnd(b.el!);
        fireCardEnd(c.el!);
    });
});

describe("渲染双层组合（ADR-0077，取代决策 16 四级互斥链）", () => {
    const CUSTOM = `<div class="probe-card"><b class="probe" x-html="title"></b></div>`;
    const setupCustom = () =>
        setup({
            components: { probe: CUSTOM },
            messages: { types: { notice: { render: "probe" } } },
        });

    test("types[type].render 命中；未配置 type 走内置 message-shell", async () => {
        const { engine } = setupCustom();
        engine.messages.add({ title: "通知体", type: "notice", delayClose: 0 });
        engine.messages.add({ title: "普通", delayClose: 0, pos: "bottom-right" });
        await nextTick();
        expect(cardOf()?.querySelector(".probe-card")).toBeTruthy(); // 自定义渲染
        expect(cardsOf("bottom-right")[0].classList.contains("autospark-message")).toBe(true); // 内置
    });

    test("render 未命中 → 回退 shell 全局兜底 → 内置注册表（task → task-shell 进度槽）", async () => {
        const { engine } = setup({
            components: { fallback: `<div class="fallback-card" x-html="title"></div>` },
            messages: {
                shell: "fallback",
                types: { notice: { render: "nope" } },
            },
        });
        const warns = hijackWarns(engine, () => {
            engine.messages.add({ title: "n", type: "notice", delayClose: 0 });
        });
        await nextTick();
        expect(warns.some((w) => w.includes("nope"))).toBe(true); // 第一级未命中 warn
        expect(cardOf()?.querySelector(".fallback-card")).toBeTruthy(); // 第二级兜底
        // task type：无 custom（fallback 只对 notice type 配置——shell 全局兜底也命中 fallback？
        // shell 是全局层：task 也走 fallback……此用例验证注册表仅在无用户配置时生效
        const t = engine.messages.show({ title: "t", type: "task", pos: "bottom-right", delayClose: 0 });
        await nextTick();
        expect(cardsOf("bottom-right")[0].querySelector(".fallback-card")).toBeTruthy();
        t.cancel();
    });

    test("无用户配置：task → 内置 task renderer（进度槽）；其他 type → message-shell（无进度槽）", async () => {
        const { engine } = setup();
        const t = engine.messages.show({ title: "t", type: "task", delayClose: 0 });
        engine.messages.add({ title: "m", delayClose: 0, pos: "bottom-right" });
        await nextTick();
        expect(cardsOf("top-right")[0].classList.contains("autospark-message")).toBe(true);
        expect(cardsOf("top-right")[0].querySelector(".autospark-message-progress")).toBeTruthy();
        expect(cardsOf("bottom-right")[0].querySelector(".autospark-message-progress")).toBeNull();
        t.cancel();
    });

    test("接管 task type：内容渲染整体随接管者（ADR-0088——title 亦归 type 模板，引擎不兜底）", async () => {
        const { engine } = setup({
            components: { "my-task": `<div class="my-task"><i x-text="progress"></i></div>` },
            messages: { types: { task: { render: "my-task" } } },
        });
        const t = engine.messages.show({ title: "t", type: "task", progress: 30, delayClose: 0 });
        await nextTick();
        const el = cardsOf("top-right")[0];
        expect(el.querySelector(".my-task")).toBeTruthy(); // 接管者渲染（数据域整包注入可绑 progress）
        expect(el.querySelector(".my-task i")?.textContent).toBe("30");
        expect(el.querySelector(".autospark-message-title")).toBeNull(); // 内容归接管者——引擎不再兜底 title
        expect(el.querySelector(".autospark-message-close")).toBeTruthy(); // shell 外观（close 钮）恒在
        t.cancel();
    });
});

describe("anchor 三职（决策 14）", () => {
    const PAGE = `
      <div id="app">
        <div x-data="{ hostVal: '来自发起域' }" id="host">
          <button id="btn" type="button">发起</button>
          <script type="autospark/actions">
            ({ localAct: { title: "局部动作", handle() { window.__localHit = true } } })
          </script>
        </div>
      </div>`;

    test("① 局部 action 解析根：actions 字符串沿 anchor scope 链解析", async () => {
        const m = mount(PAGE, {});
        engines.push(m.engine);
        const btn = m.root.querySelector("#btn") as HTMLElement;
        await nextTick();
        engine_messages_add(m.engine, {
            title: "x",
            actions: ["localAct"],
            anchor: btn,
            delayClose: 0,
        });
        await nextTick();
        expect(actionBtnsOf(cardOf())[0].textContent).toContain("局部动作");
        click(actionBtnsOf(cardOf())[0]);
        expect((window as any).__localHit).toBe(true);
    });

    test("③ 数据视图基准：anchor 存在时 render 挂链发起 scope（表达式访问发起域）", async () => {
        const m = mount(PAGE, {}, {
            components: { probe: `<div class="probe"><i x-text="hostVal"></i></div>` },
            messages: { types: { notice: { render: "probe" } } },
        });
        engines.push(m.engine);
        const btn = m.root.querySelector("#btn") as HTMLElement;
        await nextTick();
        engine_messages_add(m.engine, { title: "x", type: "notice", anchor: btn, delayClose: 0 });
        await nextTick();
        expect(cardOf()?.querySelector(".probe")?.textContent).toContain("来自发起域");
    });

    test("② 事件派发根：message:action 以 anchor 为根额外派发（发起子树可监听）", async () => {
        const m = mount(PAGE, {});
        engines.push(m.engine);
        const btn = m.root.querySelector("#btn") as HTMLElement;
        const got: any[] = [];
        btn.addEventListener("message:action", (e: any) => got.push(e.detail.value));
        await nextTick();
        const p = m.engine.messages.show({ title: "q", type: "confirm", anchor: btn, delayClose: 0 });
        await nextTick();
        click(actionBtnsOf(cardOf())[0]); // 确定
        await Promise.resolve();
        expect(await p).toBe(true);
        expect(got).toEqual([true]); // anchor 侧收到
    });

    test("anchor 选择器未命中 warn + 按无 anchor 处理", () => {
        const { engine } = setup();
        const warns = hijackWarns(engine, () => {
            engine.messages.add({ title: "x", anchor: "#nope", delayClose: 0 });
        });
        expect(warns.some((w) => w.includes("#nope"))).toBe(true);
    });
});

/** 独立小 helper：绕过 setup() 的固定空模板（anchor 用例需自定义页面） */
function engine_messages_add(engine: any, props: any) {
    return engine.messages.add(props);
}

describe("配套 action 三件套（决策 22/23）", () => {
    test("toast action：@click 发起 type='toast' 消息 + anchor 注入", async () => {
        const m = mount(
            `<div id="app"><button id="go" @click="toast(' hi ')" type="button">go</button></div>`,
            {},
        );
        engines.push(m.engine);
        const btn = m.root.querySelector("#go") as HTMLElement;
        btn.click();
        await nextTick();
        expect(titleOf(cardOf())).toContain("hi");
        expect(engine_messages_type(m.engine)).toBe("toast");
    });

    test("confirm action：yes/no 可提取键；结果经 message:action 以发起子树回流", async () => {
        const m = mount(
            `<div id="app"><button id="go" @click="confirm({ title: '删除？', yes: '删', no: '留' })" type="button">go</button></div>`,
            {},
        );
        engines.push(m.engine);
        const btn = m.root.querySelector("#go") as HTMLElement;
        const got: any[] = [];
        btn.addEventListener("message:action", (e: any) => got.push(e.detail.value));
        btn.click();
        await nextTick();
        const btns = actionBtnsOf(cardOf());
        expect(btns[0].textContent).toContain("删");
        expect(btns[1].textContent).toContain("留");
        click(btns[0]);
        expect(got).toEqual([true]); // anchor 派发回流
    });

    test("task action：task 转发 + 进度卡片", async () => {
        const m = mount(
            `<div id="app"><button id="go" @click="task({ title: '导出' })" type="button">go</button></div>`,
            {},
        );
        engines.push(m.engine);
        (m.root.querySelector("#go") as HTMLElement).click();
        await nextTick();
        expect(cardOf()?.querySelector(".autospark-message-progress")).toBeTruthy();
    });

    test("用户同名声明覆盖内置", async () => {
        let hit = false;
        const m = mount(`<div id="app"><button id="go" @click="toast()" type="button">go</button></div>`, {
            actions: { toast: { title: "x", handle: () => (hit = true) } },
        });
        engines.push(m.engine);
        (m.root.querySelector("#go") as HTMLElement).click();
        expect(hit).toBe(true);
        expect(cardOf()).toBeNull();
    });
});

function engine_messages_type(engine: any): string {
    const first = Array.from(engine.messages.values())[0];
    return first?.type ?? "";
}

describe("事件族与迁移期双发（决策 20/3）", () => {
    test("add/show/hide 时序 + type='toast' 双发 toast:show/hide；notice 不双发", async () => {
        const { engine } = setup();
        const seq: string[] = [];
        const legacy: string[] = [];
        engine.on("message:add", () => seq.push("add"));
        engine.on("message:show", () => seq.push("show"));
        engine.on("message:hide", () => seq.push("hide"));
        engine.on("toast:show", () => legacy.push("toast:show"));
        engine.on("toast:hide", () => legacy.push("toast:hide"));
        const t = engine.messages.add({ title: "x", delayClose: 0 });
        const n = engine.messages.add({ title: "n", type: "notice", delayClose: 0, pos: "bottom-right" });
        // add 即同步 mount（有空坑）→ show 紧随 add
        expect(seq).toEqual(["add", "show", "add", "show"]);
        expect(legacy).toEqual(["toast:show"]); // 仅 type=toast 双发（notice 不发）
        t.hide();
        fireCardEnd(t.el!);
        expect(seq).toEqual(["add", "show", "add", "show", "hide"]);
        expect(legacy).toEqual(["toast:show", "toast:hide"]);
        n.hide();
        fireCardEnd(n.el!);
    });

    test("payload 形态 { message, el }；一切移除路径广播 hide（delete 含）", async () => {
        const { engine } = setup();
        let hidePayload: any = null;
        engine.on("message:hide", (m: any) => (hidePayload = m.payload));
        const t = engine.messages.add({ title: "x", delayClose: 0 });
        await nextTick();
        const el = t.el; // delete 的 teardown 会把 t.el 置 null——先存引用再比对
        engine.messages.delete(t.id);
        expect(hidePayload.message.id).toBe(t.id);
        expect(hidePayload.el).toBe(el);
    });
});

describe("持久化（决策 17/18）", () => {
    test("persist local：变更即同步全量写；destroy 后新引擎启动恢复（只入枚举不重弹）", async () => {
        const first = setup();
        const task = first.engine.messages.add({
            id: "persist-1",
            title: "持久通知",
            type: "notice",
            persist: 2,
            delayClose: 0,
        });
        await nextTick();
        let stored = JSON.parse(localStorage.getItem("autospark-messages")!);
        expect(stored.length).toBe(1);
        expect(stored[0].id).toBe("persist-1");
        task.hide();
        fireCardEnd(task.el!);
        stored = JSON.parse(localStorage.getItem("autospark-messages")!);
        expect(stored.length).toBe(1); // 隐藏后仍持久化（记录存续）

        // 新引擎启动：恢复为隐藏态记录（不自动重弹）——先收口旧引擎
        // （containerOf 查全局第一个容器，双引擎并存会找错容器）
        first.engine.destroy();
        const second = setup();
        expect(second.engine.messages.size).toBe(1);
        const restored = second.engine.messages.get("persist-1")!;
        expect(restored.closed).toBe(true); // 隐藏态
        expect(restored.el).toBeNull();
        expect(cardsOf("top-right").length).toBe(0);
        const again = second.engine.messages.show("persist-1");
        await nextTick();
        expect(titleOf(cardOf())).toContain("持久通知");
        again!.hide();
        fireCardEnd(again!.el!);
    });

    test("load：GET 数组、按 id 覆盖合并、只入记录不弹；失败 resolve []", async () => {
        const origFetch = globalThis.fetch;
        let asked = "";
        globalThis.fetch = (async (url: any) => {
            asked = String(url);
            return new Response(
                JSON.stringify([
                    { id: "srv-1", title: "服务端通知", type: "notice" },
                    { id: "srv-2", title: "第二条", type: "notice", read: true },
                ]),
                { status: 200 },
            );
        }) as any;
        try {
            const { engine } = setup({ messages: { fetchOptions: { url: "/api/messages" } } });
            engine.messages.add({ id: "srv-1", title: "本地旧值", type: "notice", delayClose: 0 });
            await nextTick();
            const loaded = await engine.messages.load();
            expect(asked).toBe("/api/messages");
            expect(loaded.length).toBe(2); // srv-1 upsert + srv-2 追加
            const s1 = engine.messages.get("srv-1")!;
            expect(s1).toBeTruthy(); // upsert 命中
            expect(cardsOf("top-right").length).toBe(1); // 只入记录不弹：无新增卡片（1 = 本地旧卡，load 不动展示）
            expect(engine.messages.get("srv-2")!.read).toBe(true);
            // 重显走 show（srv-2 无 pos → 默认 top-right，列内第二张——第一张是本地旧卡）
            engine.messages.show("srv-2");
            await nextTick();
            expect(titleOf(cardsOf("top-right")[1])).toContain("第二条");
            // 失败路径
            globalThis.fetch = (async () => new Response("boom", { status: 500 })) as any;
            const warns = hijackWarns(engine, async () => {
                expect(await engine.messages.load()).toEqual([]);
            });
            await warns;
        } finally {
            globalThis.fetch = origFetch;
        }
    });

    test("save：立即 flush（remote POST 全量）", async () => {
        const origFetch = globalThis.fetch;
        let body: any = null;
        globalThis.fetch = (async (url: any, init: any) => {
            if (init?.method === "POST") body = JSON.parse(init.body);
            return new Response("{}", { status: 200 });
        }) as any;
        try {
            const { engine } = setup({ messages: { fetchOptions: { url: "/api/messages" } } });
            engine.messages.add({ title: "r", persist: 3, delayClose: 0 });
            await engine.messages.save();
            expect(Array.isArray(body)).toBe(true);
            expect(body[0].title).toBe("r");
            expect(body[0].actions).toBeUndefined();
        } finally {
            globalThis.fetch = origFetch;
        }
    });

    test("序列化白名单十键（ADR-0088 修订：纯业务数据）：actions/渲染键/运行态/自有键全不入载荷", () => {
        const { engine } = setup();
        engine.messages.add({
            id: "s1",
            title: "x",
            level: "warn",
            owner: "u1",
            persist: 2,
            delayClose: 0,
            custom: "not-persisted",
            canCancel: true,
            actions: ["undo", { title: "inline", value: 7, handle: () => {} }],
            anchor: document.body,
        });
        const stored = JSON.parse(localStorage.getItem("autospark-messages")!)[0];
        // 十二键白名单封闭：业务数据落盘（createAt/updateAt 时间戳恒有）
        expect(stored.createAt).toBeGreaterThan(0);
        expect(stored.updateAt).toBeGreaterThanOrEqual(stored.createAt);
        const { createAt, updateAt, ...data } = stored;
        expect(data).toEqual({ id: "s1", type: "toast", read: false, title: "x", level: 3, owner: "u1" });
        expect([createAt, updateAt].every((t: any) => typeof t === "number")).toBe(true);
        // 渲染 / 行为 / 运行态 / 边界 / 自有未知键一律不入（后端通用消息表只管数据）
        expect(stored.actions).toBeUndefined(); // actions = 渲染行为键——恢复由 session 按生效配置重建
        expect(stored.anchor).toBeUndefined(); // DOM 引用
        expect(stored.custom).toBeUndefined(); // 自有键不透传（原黑名单式语义退役）
        expect(stored.delayClose).toBeUndefined(); // 渲染键
        expect(stored.canCancel).toBeUndefined(); // 三控制键（行为）
        expect(stored.persist).toBeUndefined(); // 介质反推
        engine.messages.clear(false);
    });

    test("createAt/updateAt（数据审计）：创建同刻；数据变更入口刷新；恢复按载荷还原", async () => {
        const { engine } = setup();
        const s = engine.messages.add({ id: "t1", title: "v1", persist: 2, delayClose: 0 });
        let stored = JSON.parse(localStorage.getItem("autospark-messages")!)[0];
        const { createAt, updateAt } = stored;
        expect(updateAt).toBe(createAt); // 创建时同刻
        await sleep(15);
        engine.messages.update("t1", { title: "v2" }); // 数据变更入口 → touch
        stored = JSON.parse(localStorage.getItem("autospark-messages")!)[0];
        expect(stored.updateAt).toBeGreaterThan(createAt); // 刷新
        expect(stored.createAt).toBe(createAt); // 创建时间不变
        expect(stored.title).toBe("v2");
        // 置已读 / result 写入同样刷新
        await sleep(15);
        engine.messages.markRead("t1");
        stored = JSON.parse(localStorage.getItem("autospark-messages")!)[0];
        expect(stored.updateAt).toBeGreaterThan(stored.createAt);
        expect(stored.read).toBe(true);
        // 恢复还原：时间戳以载荷为准（淘汰序/审计跨会话准确）
        const first = { createAt: stored.createAt, updateAt: stored.updateAt };
        engine.destroy();
        const second = setup();
        const rec = (second.engine.store.state.$messages.items as any[]).find((r: any) => r.id === "t1");
        expect(rec.createAt).toBe(first.createAt);
        expect(rec.updateAt).toBe(first.updateAt);
        s.remove();
    });
});

describe("delete / clear / 全关 / destroy（决策 10/15）", () => {
    test("delete 硬移除（persist 记录一并删、无动画）；clear 清全部存活含隐藏", async () => {
        const { engine } = setup();
        const shown = engine.messages.add({ title: "shown", delayClose: 0 });
        const hidden = engine.messages.add({ title: "hidden", persist: 2, delayClose: 0, pos: "bottom-right" });
        await nextTick();
        hidden.hide();
        fireCardEnd(hidden.el!);
        expect(engine.messages.delete(hidden.id)).toBe(true);
        expect(engine.messages.has(hidden.id)).toBe(false);
        expect(engine.messages.delete("nope")).toBe(false);
        engine.messages.clear();
        expect(engine.messages.size).toBe(0);
        expect(shown.closed).toBe(true);
    });

    test("options.messages: false 全关：add warn 死句柄、无容器、内置 action no-op", () => {
        const m = mount(`<div id="app"><button id="go" @click="toast('x')" type="button">go</button></div>`, {}, {
            messages: false,
        });
        engines.push(m.engine);
        const warns = hijackWarns(m.engine, () => {
            const t = m.engine.messages.add("x");
            expect(t.closed).toBe(true);
            expect(t.el).toBeNull();
            (m.root.querySelector("#go") as HTMLElement).click();
        });
        expect(warns.length).toBeGreaterThanOrEqual(1);
        expect(containerOf()).toBeNull();
    });

    test("destroy 收口：卡片/容器移除 + local 终态 flush", async () => {
        const { engine } = setup();
        engine.messages.add({ title: "sticky", persist: 2, delayClose: 0 });
        await nextTick();
        expect(containerOf()).not.toBeNull();
        localStorage.clear(); // 清掉 add 时的写入，验证 destroy flush 重建
        engine.destroy();
        expect(containerOf()).toBeNull();
        expect(cardsOf("top-right").length).toBe(0);
        const stored = JSON.parse(localStorage.getItem("autospark-messages")!);
        expect(stored.length).toBe(1); // destroy 终态 flush
    });
});

describe("types 默认与全局 options（决策 15）", () => {
    test("types[type] 提供默认值（delayClose/closable），单次可覆盖", async () => {
        const { engine } = setup({
            messages: { types: { notice: { delayClose: 0, closable: true, level: "info" } } },
        });
        const n = engine.messages.add({ title: "n", type: "notice" });
        await nextTick();
        expect(cardOf()?.getAttribute("data-message-level")).toBe("info");
        expect(cardOf()?.querySelector(".autospark-message-close")).toBeTruthy();
        await sleep(60);
        expect(n.closed).toBe(false); // types 默认 sticky 生效
        n.hide();
        fireCardEnd(n.el!);
    });

    test("types 内 manager 级键 warn + 忽略", () => {
        const { engine } = setup({
            messages: { types: { notice: { showCount: 9 } as any } },
        });
        const warns = hijackWarns(engine, () => {
            engine.messages.add({ title: "n", type: "notice", delayClose: 0 });
        });
        expect(warns.some((w) => w.includes("不允许管理器级键"))).toBe(true);
    });
});

describe("$messages 状态暴露（ADR-0072）", () => {
    const itemsOf = (engine: any): any[] => engine.store.state.$messages.items;

    test("保留键注入：enabled 注入 { items, options }（生效配置）；messages:false 不注入", () => {
        const { engine } = setup({ messages: { showCount: 3 } });
        const m = engine.store.state.$messages;
        expect(m).toBeTruthy();
        expect(Array.isArray(m.items)).toBe(true);
        expect(m.options.showCount).toBe(3);
        expect(m.options.delayClose).toBe(3000); // 生效配置：内置默认并入真身
        expect(m.options.level).toBe(0);
        const off = mount(`<div id="app"></div>`, {}, { messages: false });
        engines.push(off.engine);
        expect((off.engine.store.state as any).$messages).toBeUndefined();
    });

    test("镜像同步：add 纯数据投影 → update/markRead 整替换 → hide(none 删 / local 转 closed) → delete 移除", async () => {
        const { engine } = setup();
        const t1 = engine.messages.add({
            title: "a",
            description: "d",
            link: "https://e.com",
            owner: "u1",
            level: 2,
            delayClose: 0,
        });
        await nextTick();
        expect(itemsOf(engine).length).toBe(1);
        const rec: any = itemsOf(engine)[0];
        expect(rec.id).toBe(t1.id);
        expect(rec.closed).toBe(false);
        expect(rec.read).toBe(false);
        expect(rec.description).toBe("d");
        expect(rec.link).toBe("https://e.com");
        expect(rec.owner).toBe("u1");
        expect(rec.level).toBe(2);
        expect(rec.handle).toBeUndefined(); // 无函数
        expect(rec.anchor).toBeUndefined(); // 无 DOM 引用
        engine.messages.update(t1.id, { status: "failed", description: "改" });
        expect(itemsOf(engine)[0].status).toBe("failed");
        expect(itemsOf(engine)[0].description).toBe("改");
        engine.messages.markRead(t1.id);
        expect(itemsOf(engine)[0].read).toBe(true);
        // persist local：hide → closed=true 存活（镜像整替换）
        const t2 = engine.messages.add({ title: "b", persist: 2, delayClose: 0 });
        t2.hide();
        fireCardEnd(t2.el!);
        expect(itemsOf(engine).length).toBe(2);
        expect(itemsOf(engine).find((r: any) => r.id === t2.id).closed).toBe(true);
        // persist none：hide → 记录与镜像一并移除
        t1.hide();
        fireCardEnd(t1.el!);
        expect(itemsOf(engine).length).toBe(1);
        engine.messages.delete(t2.id);
        expect(itemsOf(engine).length).toBe(0);
    });

    test("shallow 响应式：模板 x-for / 聚合表达式直绑 items，add·update·markRead·hide 驱动渲染", async () => {
        const m = mount(
            `<div id="app">` +
                `<ul id="list" x-for="r of $messages.items"><li :data-id="r.id">` +
                `<span x-text="r.title"></span><b class="dot" x-show="!r.read"></b>` +
                `</li></ul>` +
                `<span id="count" x-text="$messages.items.filter(r => true).length"></span>` +
                `<span id="unread" x-text="$messages.items.filter(r => !r.read).length"></span>` +
                `</div>`,
            {},
            {},
        );
        engines.push(m.engine);
        const engine = m.engine;
        const rowOf = (id: string) => m.root.querySelector(`li[data-id="${id}"]`) as HTMLElement | null;
        const t = engine.messages.add({ title: "m1", delayClose: 0 });
        await nextTick();
        expect(rowOf(t.id)).toBeTruthy();
        expect(m.root.querySelector("#count")!.textContent).toBe("1"); // 聚合表达式（filter 形态）
        expect(m.root.querySelector("#unread")!.textContent).toBe("1");
        engine.messages.update(t.id, { title: "m1x" });
        await nextTick();
        expect(rowOf(t.id)!.querySelector("span")!.textContent).toBe("m1x");
        engine.messages.markRead(t.id);
        await nextTick();
        expect((rowOf(t.id)!.querySelector(".dot") as HTMLElement).style.display).toBe("none"); // deep=1 字段级事件
        expect(m.root.querySelector("#unread")!.textContent).toBe("0");
        t.hide();
        fireCardEnd(t.el!);
        await nextTick();
        expect(rowOf(t.id)).toBeNull();
        expect(m.root.querySelector("#count")!.textContent).toBe("0");
    });

    test("options 真身直改：delayClose / showCount 运行时修改对后续操作生效", async () => {
        const { engine } = setup();
        engine.store.state.$messages.options.delayClose = 10; // 默认 3000 → 直改生效
        const t = engine.messages.add("短命");
        await nextTick();
        await sleep(120);
        expect(t.closed).toBe(true); // happy-dom 无过渡 → dismiss 同步收口（el 已 null）
        engine.store.state.$messages.options.showCount = 1;
        engine.messages.add({ title: "one", delayClose: 0 });
        engine.messages.add({ title: "two", delayClose: 0 });
        await nextTick();
        expect(cardsOf("top-right").length).toBe(1); // 运行时上限收紧 → 第二条排队
    });

    test("边界键：options.messages 的 anchor/actions 全局默认不入 state、构造期固化照常生效", async () => {
        const { engine } = setup({
            messages: { anchor: document.body, actions: [{ title: "全局钮", value: 1 }] },
        });
        const opts = engine.store.state.$messages.options;
        expect("anchor" in opts).toBe(false);
        expect("actions" in opts).toBe(false);
        const t = engine.messages.add({ title: "x", delayClose: 0 });
        await nextTick();
        const btn = cardOf()?.querySelector(".autospark-message-action") as HTMLElement;
        expect(btn?.textContent).toBe("全局钮");
        click(btn!);
        expect(t.result).toBe(1);
        t.hide();
        fireCardEnd(t.el!);
    });

    test("fetchOptions 现读：无 url 静默跳过；运行时补 url 即激活 remote POST（token 刷新同路）", async () => {
        const origFetch = globalThis.fetch;
        let posted = "";
        globalThis.fetch = (async (url: any, init: any) => {
            if (init?.method === "POST") posted = String(url);
            return new Response("{}", { status: 200 });
        }) as any;
        try {
            const { engine } = setup(); // 构造期无 fetchOptions
            engine.messages.add({ title: "r", persist: 3, delayClose: 0 });
            await engine.messages.save();
            expect(posted).toBe(""); // 无 url 跳过
            engine.store.state.$messages.options.fetchOptions = {
                url: "/api/m",
                headers: { Authorization: "Bearer t" },
            };
            await engine.messages.save();
            expect(posted).toBe("/api/m");
        } finally {
            globalThis.fetch = origFetch;
        }
    });

    test("FIFO 定序（ADR-0079 排序移除）：列内纯到达序、镜像创建序——level 只管语义不管位置", async () => {
        const { engine } = setup();
        const first = engine.messages.add({ title: "先到", delayClose: 0 });
        await nextTick();
        engine.messages.add({ title: "后到", level: "error", delayClose: 0 }); // 高严重度不插队
        engine.messages.add({ title: "迟到", delayClose: 0, pos: "bottom-right" });
        await nextTick();
        // 列内：到达序（原 level 边端定序已删）
        expect(titleOf(cardsOf("top-right")[0])).toContain("先到");
        expect(titleOf(cardsOf("top-right")[1])).toContain("后到");
        // 镜像：创建序
        expect(itemsOf(engine).map((r: any) => r.title)).toEqual(["先到", "后到", "迟到"]);
        // level 语义面照常：data-message-level 名字面（CSS 语义色挂它）+ 镜像数值
        expect(cardsOf("top-right")[1].getAttribute("data-message-level")).toBe("error");
        expect(itemsOf(engine)[1].level).toBe(4);
        // update 改 level：语义跟随（属性 + 镜像刷新），位置不动
        engine.messages.update(first.id, { level: "success" });
        await nextTick();
        expect(titleOf(cardsOf("top-right")[0])).toContain("先到"); // 不重排
        expect(cardsOf("top-right")[0].getAttribute("data-message-level")).toBe("success");
        expect(itemsOf(engine).find((r: any) => r.id === first.id).level).toBe(2);
    });

    test("level 宽松归一（ADR-0079）：字符串名与数字同权；非法值 warn + 回退 none", async () => {
        const { engine } = setup();
        const a = engine.messages.add({ title: "a", level: "warn", delayClose: 0 });
        const b = engine.messages.add({ title: "b", level: 3, delayClose: 0, pos: "bottom-right" });
        let c: any;
        const warns = hijackWarns(engine, () => {
            c = engine.messages.add({ title: "c", level: 9, delayClose: 0, pos: "bottom-left" });
        });
        await nextTick();
        expect(a.el!.getAttribute("data-message-level")).toBe("warn"); // 名字串
        expect(b.el!.getAttribute("data-message-level")).toBe("warn"); // 数字 3 ≡ "warn"
        expect(warns.some((w) => w.includes("未知 level"))).toBe(true); // 越界（>4）
        expect(c?.el?.getAttribute("data-message-level")).toBe("none"); // 回退
        a.hide();
        b.hide();
        c?.hide();
        fireCardEnd(a.el!);
        fireCardEnd(b.el!);
        if (c?.el) fireCardEnd(c.el);
    });

    test("persist 载荷 = Record 字段：closed/persist/className/icon/pos/closable/delayClose 不入", () => {
        const { engine } = setup();
        engine.messages.add({
            id: "p1",
            title: "x",
            description: "d",
            owner: "o1",
            level: 3,
            link: "https://l",
            persist: 2,
            delayClose: 0,
            className: "custom",
            icon: "star",
            closable: true,
        });
        const rec = JSON.parse(localStorage.getItem("autospark-messages")!)[0];
        expect(rec.description).toBe("d");
        expect(rec.owner).toBe("o1");
        expect(rec.level).toBe(3);
        expect(rec.link).toBe("https://l");
        expect(rec.closed).toBeUndefined();
        expect(rec.persist).toBeUndefined();
        expect(rec.className).toBeUndefined();
        expect(rec.icon).toBeUndefined();
        expect(rec.pos).toBeUndefined();
        expect(rec.closable).toBeUndefined();
        expect(rec.delayClose).toBeUndefined();
    });

    test("恢复语义：closed 由策略统一置 true、persist 按存储介质反推 local", () => {
        localStorage.setItem(
            "autospark-messages",
            JSON.stringify([{ id: "r1", title: "旧通知", type: "notice", description: "d" }]),
        );
        const { engine } = setup();
        const rec = itemsOf(engine).find((r: any) => r.id === "r1");
        expect(rec).toBeTruthy();
        expect(rec.closed).toBe(true);
        expect(rec.persist).toBe(2);
        expect(engine.messages.get("r1")!.read).toBe(false);
    });
});

describe("会话与双层渲染（ADR-0077）", () => {
    const itemsOf = (engine: any) => engine.store.state.$messages.items;

    test("Session 家族：add 按 type 分派返回；sessions 即 manager Map 正名视图", async () => {
        const { engine } = setup();
        const toast = engine.messages.add({ title: "t", delayClose: 0 });
        const task = engine.messages.add({ type: "task", title: "k", progress: 10, delayClose: 0 });
        const confirm = engine.messages.add({ type: "confirm", title: "c", delayClose: 0 });
        await nextTick();
        // 基类面三态恒有
        for (const s of [toast, task, confirm]) {
            expect(typeof s.show).toBe("function");
            expect(typeof s.hide).toBe("function");
            expect(typeof s.remove).toBe("function");
        }
        // task 域六方法
        expect(typeof (task as any).start).toBe("function");
        expect(typeof (task as any).progress).toBe("function");
        expect(typeof (task as any).pause).toBe("function");
        expect(typeof (task as any).resume).toBe("function");
        expect(typeof (task as any).stop).toBe("function");
        expect(typeof (task as any).cancel).toBe("function");
        // confirm 域三方法
        expect(typeof (confirm as any).yes).toBe("function");
        expect(typeof (confirm as any).no).toBe("function");
        // sessions 正名视图 = 同一张 Map
        expect(engine.messages.sessions).toBe(engine.messages);
        expect(engine.messages.sessions.get(task.id)).toBe(task);
        expect(engine.messages.sessions.size).toBe(3);
        toast.remove();
        task.cancel();
        fireCardEnd(task.el!);
        confirm.remove();
    });

    test("type 快捷方式（ADR-0077 便捷层）：toast/confirm/task ≡ show({type}) 强制对应 type", async () => {
        const { engine } = setup();
        // toast：强制 type（误传他 type 归 toast）
        const t = engine.messages.toast({ title: "t", type: "notice", delayClose: 0 });
        expect(t.type).toBe("toast");
        // confirm：thenable 会话（await 得 choice）+ {yes,no} 文案提取 + sticky
        const c = engine.messages.confirm("保存修改？", { yes: "保存", no: "放弃" });
        expect(c.type).toBe("confirm");
        await nextTick();
        const cCard = cardsOf("top-right")[1]; // 第一张是先入列的 toast（sticky）
        expect(actionBtnsOf(cCard).map((b) => b.textContent)).toEqual(["保存", "放弃"]);
        c.yes();
        await nextTick();
        expect(c.result).toBe(true);
        expect(await c).toBe(true); // thenable（会话本体，非独立 Promise）
        // task：六方法句柄 + 强制 type
        const k = engine.messages.task({ title: "k", type: "notice", progress: 10, delayClose: 0 });
        expect(k.type).toBe("task");
        k.start();
        (k as any).progress(50);
        const rec = itemsOf(engine).find((r: any) => r.id === k.id);
        expect(rec?.progress).toBe(50);
        k.cancel();
        fireCardEnd(k.el!);
        t.remove();
        c.remove();
    });

    test("尺寸五键（ADR-0077）：confirm/task 内置默认 width 300px；单次/types/全局层可覆盖；toast auto", async () => {
        const { engine } = setup();
        // toast：无 width inline（auto 归 CSS）
        const t = engine.messages.toast({ title: "t", delayClose: 0 });
        await nextTick();
        expect(t.el!.style.width).toBe("");
        expect(t.el!.style.getPropertyValue("min-width")).toBe("");
        // confirm：内置 type 种子默认 300px
        const c = engine.messages.confirm("q");
        await nextTick();
        expect(c.el!.style.width).toBe("300px");
        c.remove();
        // task：同 300px + 单次 props 覆盖
        const k = engine.messages.task({ title: "k", width: 420, delayClose: 0 });
        await nextTick();
        expect(k.el!.style.width).toBe("420px");
        // minWidth/maxWidth 字符串 CSS 透传 + 镜像记录
        const m = engine.messages.add({ title: "m", minWidth: "20rem", maxWidth: 600, delayClose: 0, pos: "bottom-right" });
        await nextTick();
        expect(m.el!.style.getPropertyValue("min-width")).toBe("20rem");
        expect(m.el!.style.getPropertyValue("max-width")).toBe("600px");
        const rec = itemsOf(engine).find((r: any) => r.id === m.id);
        expect(rec?.minWidth).toBe("20rem");
        // 原地更新换装：width 变更重写
        engine.messages.update(m.id, { width: 260 });
        await nextTick();
        expect(m.el!.style.width).toBe("260px");
        m.remove();
        k.cancel();
        fireCardEnd(k.el!);
        t.remove();
    });

    test("show 别名（ADR-0077）：对象 ≡ add；string 保留重显语义（消歧零冲突）", async () => {
        const { engine } = setup();
        const s = engine.messages.show({ title: "via-show", delayClose: 0 });
        await nextTick();
        expect(titleOf(cardOf())).toContain("via-show");
        expect(engine.messages.get(s.id)).toBe(s);
        // string 形态 = 决策 9 重显（行为不变）
        const b = engine.messages.show({ title: "buf", persist: 1, delayClose: 0 });
        b.hide();
        fireCardEnd(b.el!);
        expect(engine.messages.show(b.id)).toBe(b);
        await nextTick();
        expect(b.closed).toBe(false);
        // 未命中 string：warn + null（旧行为保留——不误弹新消息）
        const warns = hijackWarns(engine, () => {
            expect(engine.messages.show("nope")).toBeNull();
        });
        expect(warns.some((w) => w.includes("未命中存活记录"))).toBe(true);
        s.remove();
        b.remove();
    });

    test("死会话：remove 后方法 no-op + warn（不复活）", async () => {
        const { engine } = setup();
        const s = engine.messages.add({ title: "x", delayClose: 0 });
        await nextTick();
        s.remove();
        expect(engine.messages.has(s.id)).toBe(false);
        const warns = hijackWarns(engine, () => {
            s.show();
            s.remove();
        });
        expect(warns.filter((w) => w.includes("会话已死亡")).length).toBe(2);
    });

    test("Confirm 会话 yes()/no() ≡ 点击按钮（value 闭环 + thenable await）", async () => {
        const { engine } = setup();
        const p = engine.messages.show({ title: "保存修改？", type: "confirm", delayClose: 0 });
        await nextTick();
        const s = engine.messages.values().next().value as any; // type='confirm' 会话（与 p 同一对象——thenable 本体）
        expect(s).toBe(p as any);
        expect(s.type).toBe("confirm");
        const hit: any[] = [];
        engine.on("message:action" as any, (e: any) => hit.push(e.payload.value));
        s.yes();
        await nextTick();
        expect(hit).toEqual([true]); // 事件与 DOM 点击同形
        expect(s.result).toBe(true); // value 写入 result
        expect(s.closed).toBe(true); // hide 判定收口
        expect(await p).toBe(true); // thenable：await 会话 = choice 应答（原 confirm() Promise 语义由会话承载）
    });

    test("persist=1 会话缓冲：hide 后 items 可见（closed）、不持久化、show 重显、maxLen 淘汰", async () => {
        const { engine } = setup({ messages: { maxLen: 3 } });
        const a = engine.messages.add({ title: "a", persist: 1, delayClose: 0 });
        await nextTick();
        a.hide();
        fireCardEnd(a.el!);
        // 记录存活（管理界面可再查看）：Map 与镜像都可见、closed 翻 true
        expect(engine.messages.has(a.id)).toBe(true);
        const rec = itemsOf(engine).find((r: any) => r.id === a.id);
        expect(rec?.closed).toBe(true);
        expect(rec?.persist).toBe(1);
        // 不持久化：localStorage 载荷为空（level 1 不入桶——全量覆盖式写空数组）
        expect(JSON.parse(localStorage.getItem("autospark-messages") ?? "[]").length).toBe(0);
        // show 重显
        a.show();
        await nextTick();
        expect(cardsOf("top-right").length).toBe(1);
        expect(a.closed).toBe(false);
        a.hide();
        fireCardEnd(a.el!);
        // maxLen 淘汰：缓冲记录同受单一上限约束（3 条上限 → 加 3 条新 → a 被淘汰）
        engine.messages.add({ title: "b", delayClose: 0, pos: "bottom-right" });
        engine.messages.add({ title: "c", delayClose: 0, pos: "bottom-left" });
        engine.messages.add({ title: "d", delayClose: 0, pos: "bottom-center" });
        expect(engine.messages.has(a.id)).toBe(false); // 最旧的缓冲记录被清除
    });

    test("remove()：persist 记录立即同步删除（local 即写，刷新不复活）", async () => {
        const { engine } = setup();
        const s = engine.messages.add({ title: "r", persist: 2, delayClose: 0 });
        s.hide();
        fireCardEnd(s.el!);
        expect(JSON.parse(localStorage.getItem("autospark-messages")!).length).toBe(1);
        s.remove();
        expect(engine.messages.has(s.id)).toBe(false);
        expect(localStorage.getItem("autospark-messages")).toBe("[]"); // 立即同步（非防抖延迟）
    });

    test("$session 派生变量：type renderer 层可访问（行为专职）", async () => {
        const { engine } = setup({
            components: {
                "my-kind": `<div class="my-kind"><button class="go" @click="$session.progress(66)"></button></div>`,
            },
            messages: { types: { task: { render: "my-kind" } } },
        });
        const t = engine.messages.add({ type: "task", title: "k", progress: 10, delayClose: 0 });
        await nextTick();
        (t as any).start();
        // type renderer 层的 $session：点击按钮推进进度 → 出口内进度文本（自定义 renderer 接管，
        // 无内置进度槽——推进效果经镜像 items 断言）
        click(cardOf()!.querySelector(".my-kind .go")!);
        await nextTick();
        const rec = itemsOf(engine).find((r: any) => r.id === t.id);
        expect(rec?.progress).toBe(66);
        (t as any).stop();
        fireCardEnd(t.el!);
    });

    test("$session 行为专职：非响应式（closed 翻转不驱动绑定），数据走 data 域", async () => {
        const { engine } = setup({
            uiShells: {
                message: `<div class="my-shell"><b class="t" x-text="title"></b><span class="c" x-text="$session.closed"></span><div x-slot></div></div>`,
            },
        });
        const s = engine.messages.add({ title: "hi", persist: 1, delayClose: 0 });
        await nextTick();
        const el = s.el!;
        expect(el.querySelector(".my-shell")).toBeTruthy(); // uiShells 覆盖内置 message 骨架
        expect(el.querySelector(".t")?.textContent).toBe("hi"); // data 域响应式照常
        expect(el.querySelector(".c")?.textContent).toBe("false"); // $session 派生变量可读（首渲染求值）
        s.hide();
        fireCardEnd(s.el!);
        expect(s.closed).toBe(true);
        s.show();
        await nextTick();
        // $session 非响应式：closed 再翻不重求值（仍为首渲染值）——行为专职纪律
        expect(s.el!.querySelector(".c")?.textContent).toBe("false");
        s.remove();
    });

    test("uiShells：用户同键覆盖 message；shell 选择器运行时直写换键对后续 add 生效", async () => {
        const { engine } = setup({
            uiShells: { message: `<div class="shell-a"><b x-text="title"></b><div x-slot></div></div>` },
        });
        engine.messages.add({ title: "one", delayClose: 0 });
        await nextTick();
        expect(cardOf()!.querySelector(".shell-a")).toBeTruthy();
        // 用户 shell 无引擎类名契约 → wrapper 装配（卡片根 = wrapper 持引擎类，用户组件根零污染）
        expect(cardOf()!.classList.contains("autospark-message")).toBe(true);
        // 注册第二个键 + 选择器直写换键（options 真身契约：后续生效）
        (engine as any)._uiShells["shell-b"] = `<div class="shell-b"><b x-text="title"></b><div x-slot></div></div>`;
        (engine as any)._uiShellCache.delete("shell-b");
        engine.messages.add({ title: "two", delayClose: 0, pos: "bottom-right" });
        engine.store.state.$messages.options.shell = "shell-b";
        engine.messages.add({ title: "three", delayClose: 0, pos: "bottom-left" });
        await nextTick();
        expect(cardsOf("bottom-right")[0].querySelector(".shell-a")).toBeTruthy(); // 直写前仍旧键
        expect(cardsOf("bottom-left")[0].querySelector(".shell-b")).toBeTruthy(); // 直写后新键生效
        engine.messages.clear(false);
    });

    test("uiShells：内置种子（dialog）供 overlay 兜底——dialog 弹窗照常渲染", async () => {
        const m = mount(
            `<div id="app" x-scope><div x-define="panel">内容</div><button x-dialog:panel="ui.d"></button></div>`,
            { ui: { d: false } },
        );
        engines.push(m.engine);
        (m.engine.store.state as any).ui.d = true;
        await nextTick();
        const panel = document.querySelector(".autospark-dialog") as HTMLElement | null;
        expect(panel).toBeTruthy(); // uiShells 内置 dialog 种子 → 面板骨架照常（x-slot 默认出口投影内容）
        (m.engine.store.state as any).ui.d = false;
    });

    test("styles：cssText 写入卡片根；className 并列；不入持久化载荷", async () => {
        const { engine } = setup();
        const s = engine.messages.add({
            title: "s",
            styles: "border-left:3px solid red",
            className: "imp",
            persist: 2,
            delayClose: 0,
        });
        await nextTick();
        const el = s.el!;
        expect(el.style.borderLeft).toContain("3px");
        expect(el.classList.contains("imp")).toBe(true);
        const stored = JSON.parse(localStorage.getItem("autospark-messages")!)[0];
        expect(stored.styles).toBeUndefined(); // 渲染键不入载荷
        s.remove();
    });

    test("shallow: 0：仅结构变更有事件（镜像增删照常）；真身可读、构造期一次性", async () => {
        const { engine } = setup({ messages: { shallow: 0 } });
        expect(engine.store.state.$messages.options.shallow).toBe(0); // 真身可读
        const s = engine.messages.add({ title: "v1", delayClose: 0 });
        await nextTick();
        expect(itemsOf(engine).length).toBe(1); // 镜像结构变更照常（add 落 items）
        s.remove();
        expect(itemsOf(engine).length).toBe(0);
    });
});

describe("会话 class 化与 run/respond（ADR-0083）", () => {
    const sessionsOf = (engine: any): string[] => engine.store.state.$messages.sessions;
    const itemsOf = (engine: any): any[] => engine.store.state.$messages.items;

    test("complete ≡ stop：完成态进度 100 并按 delayClose 收口", async () => {
        const { engine } = setup();
        const t = engine.messages.show({ title: "t", type: "task", delayClose: 60 });
        t.start();
        t.complete(); // 显式别名
        await nextTick();
        expect(t.el!.querySelector(".autospark-message-progress-text")?.textContent).toBe("100%");
        await sleep(120);
        expect(t.closed).toBe(true);
    });

    test("创建即完成态：初始 progress 100 直接进入 delayClose 收口（factory return 完成卡配套）", async () => {
        const { engine } = setup();
        const t = engine.messages.show({ title: "done", type: "task", progress: 100, delayClose: 60 });
        await nextTick();
        expect(t.el!.querySelector(".autospark-message-progress-text")?.textContent).toBe("100%");
        await sleep(130); // 未 start 也未 complete——初始完成态直接计时收口
        expect(t.closed).toBe(true);
    });

    test("三控制钮（ADR-0088：task 模板分立按钮）：x-show 数据域驱动；@click 直调 session；不发 message:action（观测走 message:update）；取消 signal abort", async () => {
        const { engine } = setup();
        const actionLog: string[] = [];
        const updateLog: number[] = [];
        engine.on("message:action" as any, (e: any) => actionLog.push(e.payload.action.title));
        engine.on("message:update" as any, () => updateLog.push(updateLog.length)); // payload.message 为会话（无 paused getter）——以事件计数断言
        const t = engine.messages.show({
            title: "下载", type: "task", delayClose: 0,
            canPause: true, canCancel: true, canStop: true,
        });
        await nextTick();
        const el = t.el!;
        const opsOf = () => Array.from(el.querySelectorAll(".autospark-message-op")) as HTMLElement[]; // 控制钮（task 模板自带，非 actions 行）
        expect(opsOf().length).toBe(3); // 三分立控制钮
        expect(opsOf().map((b) => b.textContent)).toEqual(["暂停", "停止", "取消"]);
        expect([t.canPause, t.canCancel, t.canStop]).toEqual([true, true, true]);
        expect(t.signal).toBeTruthy(); // AbortSignal 暴露
        // 暂停：@click 直调 session.pause()——不发 message:action，paused 投影经 message:update 可观测
        click(opsOf().find((b) => b.textContent.includes("暂停"))!);
        await nextTick();
        expect(actionLog).toEqual([]); // 控制钮是行为不是 action（ADR-0088）
        expect(updateLog.length).toBe(1); // paused 转换经 message:update 可观测
        expect(opsOf()[0].textContent).toContain("恢复");
        expect(t.read).toBe(true); // 卡片点击委托置已读（任意点击）
        t.progress(50);
        await nextTick();
        expect(el.querySelector(".autospark-message-progress-text")?.textContent).toBe("0%"); // 闸门拦截
        // 恢复：文案回「暂停」+ 推进恢复
        click(opsOf()[0]);
        await nextTick();
        expect(updateLog.length).toBe(2); // resume 转换再发一次
        expect(opsOf()[0].textContent).toContain("暂停");
        t.progress(50);
        await nextTick();
        expect(el.querySelector(".autospark-message-progress-text")?.textContent).toBe("50%");
        // 停止：完成态 → 控制钮行经 completed 投影 x-show 收起（display:none——行收起，按钮仍在行内）
        click(opsOf().find((b) => b.textContent.includes("停止"))!);
        await nextTick();
        expect(el.querySelector(".autospark-message-progress-text")?.textContent).toBe("100%");
        expect((el.querySelector(".autospark-message-ops") as HTMLElement).style.display).toBe("none");
        t.remove();
        // canCancel：点「取消」→ 卡关 + signal abort（协作取消信号）
        const c = engine.messages.show({ title: "c", type: "task", delayClose: 0, canCancel: true, pos: "bottom-right" });
        await nextTick();
        let aborted = false;
        c.signal!.addEventListener("abort", () => (aborted = true));
        click(Array.from(c.el!.querySelectorAll(".autospark-message-op")).find((b) => b.textContent.includes("取消"))!);
        fireCardEnd(c.el!);
        expect(aborted).toBe(true);
        expect(c.closed).toBe(true);
        // 非 task 携带三键 → 不再 warn（ADR-0088 整包直传）
        const warns = hijackWarns(engine, () => {
            engine.messages.add({ title: "n", canPause: true, delayClose: 0, pos: "bottom-left" });
        });
        expect(warns.length).toBe(0);
        engine.messages.clear(false);
    });

    test("respond(id, value)：≡ yes()/点击按钮（同一闭环）；未命中 warn", async () => {
        const { engine } = setup();
        const p = engine.messages.show({ title: "q", type: "confirm", delayClose: 0 });
        await nextTick();
        const s = engine.messages.values().next().value as any;
        const hit: any[] = [];
        engine.on("message:action" as any, (e: any) => hit.push(e.payload.value));
        engine.messages.respond(s.id, false);
        await nextTick();
        expect(hit).toEqual([false]);
        expect(s.result).toBe(false);
        expect(await p).toBe(false); // thenable 同路 resolve
        expect(s.closed).toBe(true);
        const warns = hijackWarns(engine, () => engine.messages.respond("nope", true));
        expect(warns.some((w) => w.includes("未命中存活记录"))).toBe(true);
    });

    test("$messages.sessions：展示序 id 列表——入队即进、teardown 出、重显回；items 含隐藏（分工）", async () => {
        const { engine } = setup({ messages: { showCount: 1, delayClose: 0 } });
        const a = engine.messages.add({ title: "a", persist: 1 });
        const b = engine.messages.add({ title: "b", persist: 1 }); // 满员排队（queued 也入列）
        await nextTick();
        expect(Array.from(sessionsOf(engine))).toEqual([a.id, b.id]);
        a.hide();
        fireCardEnd(a.el!);
        await nextTick();
        expect(Array.from(sessionsOf(engine))).toEqual([b.id]); // 隐藏出列
        expect(itemsOf(engine).length).toBe(2); // items 数据全集（含隐藏）
        expect(itemsOf(engine).find((r: any) => r.id === a.id).closed).toBe(true);
        a.show(); // b 仍占坑 → a 排队，但重回展示序列
        await nextTick();
        expect(Array.from(sessionsOf(engine))).toEqual([b.id, a.id]);
        a.remove();
        b.remove();
    });

    test("factory 第二参 type（ADR-0083 修订）：挂起即子类（task 方法可用）；return type 冲突以声明为准；对象形态携带 warn 忽略", async () => {
        const { engine } = setup();
        let pending: any = null;
        const s = engine.messages.add(async (session) => {
            pending = session;
            expect(typeof session.progress).toBe("function"); // 挂起即 Task 会话
            await sleep(20);
            return { title: "f", type: "notice" }; // 与声明冲突 → warn + 以 'task' 为准
        }, "task");
        expect(typeof (s as any).progress).toBe("function"); // 同步返回的也是 Task 实例
        const warns: string[] = [];
        const origWarn = engine.logger.warn;
        engine.logger.warn = (...args: any[]) => warns.push(args.join(" "));
        try {
            await sleep(40);
        } finally {
            engine.logger.warn = origWarn;
        }
        await nextTick();
        expect(s.type).toBe("task"); // 声明锁定
        expect(engine.messages.get(s.id)).toBe(s);
        expect(warns.some((w) => w.includes("不一致，以声明为准"))).toBe(true);
        // 对象形态携带第二参：warn + 忽略（对象自带 type 字段）
        const warns2 = hijackWarns(engine, () => {
            engine.messages.add({ title: "obj", type: "notice", delayClose: 0, pos: "bottom-left" }, "task");
        });
        expect(warns2.some((w) => w.includes("仅对 factory 形态生效"))).toBe(true);
        const obj = Array.from(engine.messages.values()).find((x: any) => x.type === "notice") as any;
        expect(obj?.type).toBe("notice"); // 第二参未改对象的 type
        s.remove();
        obj?.remove();
    });

    test("task(factory)：快捷方式透传挂起 session 且为 Task 实例（factory 内可驱动进度）", async () => {
        const { engine } = setup();
        let held: any = null;
        const t = engine.messages.task(async (session) => {
            held = session;
            expect(typeof session.progress).toBe("function"); // 挂起即 Task 会话（非基类）
            await sleep(20);
            return { title: "快捷任务", delayClose: 0 };
        });
        expect(held).toBe(t); // factory 收到的就是返回的同一实例
        await sleep(40);
        await nextTick();
        expect(t.type).toBe("task");
        t.start();
        t.progress(30);
        await nextTick();
        expect(t.el!.querySelector(".autospark-message-progress-text")?.textContent).toBe("30%");
        t.cancel();
        fireCardEnd(t.el!);
    });

    test("factory(session) 挂起注入：update 缓存随 return 落地；挂起期 cancel 不弹", async () => {
        const { engine } = setup();
        let held: any = null;
        const s = engine.messages.add(async (session) => {
            held = session;
            session.update({ level: "warn" }); // 挂起缓存
            await sleep(20);
            return { title: "迟到", delayClose: 0 };
        });
        expect(held).toBeTruthy(); // factory 收到挂起会话
        expect(s.closed).toBe(true); // 挂起期（无 entry）
        await sleep(40);
        await nextTick();
        expect(engine.messages.has(s.id)).toBe(true);
        expect(s.el).toBeTruthy();
        expect(s.el!.getAttribute("data-message-level")).toBe("warn"); // 缓存补丁落地
        // 挂起期 cancel：resolve 后不弹
        const s2 = engine.messages.add(async (session) => {
            session.cancel();
            return { title: "被取消", delayClose: 0 };
        });
        await sleep(20);
        expect(engine.messages.has(s2.id)).toBe(false);
        expect(cardOf()?.querySelector(".autospark-message-title")?.innerHTML).not.toContain("被取消");
        s.remove();
    });

    test("class 面：toast/自定义 type 无 task 方法；task 有 complete；confirm 有 then", async () => {
        const { engine } = setup();
        const t = engine.messages.add({ title: "t", delayClose: 0 });
        const n = engine.messages.add({ title: "n", type: "notice", delayClose: 0, pos: "bottom-right" });
        const k = engine.messages.show({ title: "k", type: "task", delayClose: 0 });
        const c = engine.messages.show({ title: "c", type: "confirm", delayClose: 0 });
        expect(typeof (t as any).progress).toBe("undefined"); // 类型面 = 运行时面（ADR-0083）
        expect(typeof (n as any).progress).toBe("undefined");
        expect(typeof (k as any).complete).toBe("function");
        expect(typeof (c as any).then).toBe("function");
        expect(typeof t.update).toBe("function"); // 基类新面
        k.cancel();
        fireCardEnd(k.el!);
        c.remove();
        t.remove();
        n.remove();
    });
});

describe("presets 预设组件族（ADR-0083 → ADR-0088 内容归属）", () => {
    test("全局组件表种子五件；base 有实体内容；task 自有布局（不继承 base，ADR-0088）", async () => {
        const { engine } = setup();
        const snap = (engine as any)._resolveGlobalComponent("autospark.messages.task");
        expect(snap).toBeTruthy();
        expect(snap.querySelector(".autospark-message-progress")).toBeTruthy(); // 进度槽（自有布局）
        expect(snap.querySelector(".autospark-message-ops")).toBeTruthy(); // 三控制钮行（模板自带）
        expect(snap.classList.contains("autospark-message-type")).toBe(false); // 不再继承 base（YAGNI 裁决）
        // task 模板内 x-component 组合 actions 组件（ADR-0088 唯一公共复用件）
        const host = Array.from(snap.querySelectorAll("div")).find((d) =>
            d.hasAttribute("x-component:autospark.messages.actions"),
        );
        expect(host).toBeTruthy();
        const base = (engine as any)._resolveGlobalComponent("autospark.messages.base");
        expect(base?.classList.contains("autospark-message-type")).toBe(true); // 根保持 type 类
        expect(base?.querySelector(".autospark-message-title")).toBeTruthy(); // ADR-0088：base 升格默认内容模板
        expect(base?.querySelector("[x-slot]")).toBeTruthy(); // 继承覆盖出口保留（ADR-0081）
        const actions = (engine as any)._resolveGlobalComponent("autospark.messages.actions");
        expect(actions?.querySelector(".autospark-message-action")).toBeTruthy(); // 公共按钮行组件
        // task 样式经 <style> 组件 scoped 提取（ADR-0083 修订；styles 形态 ComponentStyleDecl[]）
        const decls = (engine as any).getGlobalComponentDef("autospark.messages.task")?.styles ?? [];
        expect(decls.map((d: any) => d.css ?? "").join("")).toContain(".autospark-message-progress");
        expect(decls.map((d: any) => d.css ?? "").join("")).toContain(".autospark-message-op");
    });

    test("scoped 样式二次实例化不丢失（ADR-0087 修订：def 级 scoped id）——进度条在第二张卡照常", async () => {
        const { engine } = setup();
        const trackH = () => {
            const track = cardOf()?.querySelector(".autospark-message-progress-track") as HTMLElement | null;
            return track ? getComputedStyle(track).height : "无track";
        };
        // 第一次：创建 → 关闭（teardown 引用归零移除 <style>）
        const a = engine.messages.show({ title: "a", type: "task", delayClose: 0 });
        await nextTick();
        expect(trackH()).toBe("6px");
        a.cancel();
        fireCardEnd(a.el!);
        expect(engine.messages.size).toBe(0);
        // 第二次：重注入的样式须与本次实例的 data-cmp 属性同 id 命中（原 bug：按实例
        // scope.id 打属性 + 按 defName 复用首实例选择器 → 二次起 [data-cmp-1] 永不命中）
        const b = engine.messages.show({ title: "b", type: "task", delayClose: 0 });
        await nextTick();
        expect(trackH()).toBe("6px");
        b.cancel();
        fireCardEnd(b.el!);
    });

    test("无用户配置：task 走预设组件渲染进度槽（type 链默认指向 autospark.messages.<type>）", async () => {
        const { engine } = setup();
        const t = engine.messages.show({ title: "t", type: "task", delayClose: 0 });
        await nextTick();
        expect(cardOf()?.querySelector(".autospark-message-progress")).toBeTruthy();
        t.cancel();
    });

    test("用户 components 同名覆盖预设：全局 toast 定制免配置", async () => {
        const { engine } = setup({
            components: {
                "autospark.messages.toast": `<div class="my-global-toast"><b x-text="title"></b></div>`,
            },
        });
        const t = engine.messages.add({ title: "覆盖", delayClose: 0 });
        await nextTick();
        expect(cardOf()?.querySelector(".my-global-toast")).toBeTruthy(); // 同名覆盖优先于种子
        t.remove();
    });

    test("用户自定义 type 组件 inherit 官方 base：全局组件继承（ADR-0081 V1 边界修订）", async () => {
        const { engine } = setup({
            components: {
                "my-notice": `<div x-define="my-notice" x-define:inherit="autospark.messages.base"><b class="inh" x-text="title"></b></div>`,
            },
            messages: { types: { notice: { render: "my-notice" } } },
        });
        const n = engine.messages.add({ title: "继承", type: "notice", delayClose: 0 });
        await nextTick();
        const el = cardOf()!;
        expect(el.querySelector(".inh")).toBeTruthy(); // 子覆盖段
        expect(el.querySelector(".autospark-message-type")).toBeTruthy(); // 父根结构（base 骨架）
        n.remove();
    });
});
