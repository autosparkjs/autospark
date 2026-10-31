import { describe, expect, test, afterEach } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";
import type { AutoSpark } from "autospark";
// 插件自举（ADR-0001）：注册通知组件模板 + ready 挂载 engine.notifications
import "../../modules/notifications";

/**
 * 通知事件分层命名 + task 完成语义（ADR-0102）：
 * - 事件 = `notifications/<type>/<id>/<verb>`（verb：add/update/show/hide/read/status；
 *   action = `actions/<名>`，名 = 字符串形态 action 名 / 对象形态 name ?? title）；
 *   emit 面恒具体名，订阅面 `*` 配一段、`**` 配尾段；type/id/action 名中 `/`、`*` 段卫生替换 `-`；
 * - 双通道：总线 + 卡片元素 dispatchEvent（具体名冒泡）；
 * - **回调参数形态**：精确名订阅收裸 payload；通配订阅收 `{ type, payload }` 信封
 *   （payload 在 `.payload` 上——FastLiteEvent 契约）；
 * - task 完成：默认常驻（delayClose 对 task 彻底无效）；closeWhenDone true = 即关 /
 *   number(ms) = 经 holdOpen watcher 管道按该值收口（hover 暂停/remaining 保留）；
 * - × 点击经组件 cancel() 派发：task 未完成 ≡ cancel（signal abort）；task 运行键
 *   （progress/paused/completed）变更广播 update 事件（值比对——首个真实变更不吞）。
 */

describe("通知事件分层命名与 task 完成语义（ADR-0102）", () => {
    const spawned: AutoSpark[] = [];
    afterEach(() => {
        for (const e of spawned) {
            try {
                e.destroy();
            } catch {
                // 幂等销毁吞错
            }
        }
        spawned.length = 0;
        document.querySelectorAll("[data-notification-pos]").forEach((n) => n.remove());
    });

    const spawn = (html: string, state: any = {}, options?: Parameters<typeof mount>[2]) => {
        const m = mount(html, state, options);
        spawned.push(m.engine);
        return m;
    };

    const cardOf = () =>
        document.querySelector<HTMLElement>("[data-notification-pos] > *");

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    test("具体名订阅：add/show 事件带完整四段名（精确名回调收裸 payload）", async () => {
        const { engine } = spawn(`<div><span>x</span></div>`, {});
        const seen: string[] = [];
        engine.on("notifications/toast/n1/add", (env: any) => seen.push("add:" + typeof env.payload.notification));
        engine.on("notifications/toast/n1/show", (env: any) => seen.push("show:" + (env.payload.el != null)));
        engine.notifications.add({ id: "n1", title: "t", delayClose: 0 });
        await nextTick();
        await sleep(20);
        expect(seen).toContain("add:object"); // payload：notification = 组件实例（add 时 el 可为 null——排队未挂）
        expect(seen).toContain("show:true"); // show 时卡片已挂，el 非 null
    });

    test("通配订阅：`*` 配一段（按 verb 过滤）、`**` 配尾段（按 type 全收）；回调收 {type,payload} 信封", async () => {
        const { engine } = spawn(`<div><span>x</span></div>`, {});
        const shows: string[] = [];
        const taskAll: string[] = [];
        engine.on("notifications/*/*/show", (env: any) => shows.push(env.payload.notification.props.type));
        engine.on("notifications/task/**", (env: any) => taskAll.push(env.type));
        engine.notifications.add({ id: "w1", title: "t", delayClose: 0 });
        const task = engine.notifications.task({ id: "w2", title: "任务", delayClose: 0 });
        task?.methods.progress(40);
        await nextTick();
        await sleep(20);
        expect(shows).toContain("toast"); // verb 通配命中 toast 的 show
        expect(shows).toContain("task"); // 同一通配也命中 task 的 show
        expect(taskAll).toContain("notifications/task/w2/add"); // ** 尾段全收且信封带具体 type 名
        expect(taskAll).toContain("notifications/task/w2/update"); // 运行键变更 → update
    });

    test("段卫生：id 含 `/` 与 `*` 时事件名替换为 `-`（记录 id 本身不变）", async () => {
        const { engine } = spawn(`<div><span>x</span></div>`, {});
        let hit = false;
        engine.on("notifications/toast/a-b-c/add", (env: any) => {
            hit = true;
            expect(env.payload.notification.props.id).toBe("a/b*c"); // 记录面原 id 不受段卫生影响
        });
        engine.notifications.add({ id: "a/b*c", title: "t", delayClose: 0 });
        await nextTick();
        expect(hit).toBe(true);
    });

    test("action 事件：末段 = 对象形态 id 键", async () => {
        const { engine } = spawn(`<div><span>x</span></div>`, {});
        let payload: any = null;
        engine.on("notifications/toast/a1/actions/save", (env: any) => (payload = env.payload));
        engine.notifications.add({
            id: "a1",
            title: "t",
            delayClose: 0,
            actions: [{ id: "save", title: "保存", value: "ok" }],
        });
        await nextTick();
        (cardOf()?.querySelector(".autospark-notification-action") as HTMLElement).click();
        await nextTick();
        expect(payload).not.toBeNull();
        expect(payload.action.title).toBe("保存"); // payload 保留展示文案
        expect(payload.value).toBe("ok"); // value 应答
    });

    test("action 事件：缺省回落 title（无 id 键的对象 action）", async () => {
        const { engine } = spawn(`<div><span>x</span></div>`, {});
        let hit = false;
        engine.on("notifications/toast/a2/actions/确定", () => (hit = true));
        engine.notifications.add({
            id: "a2",
            title: "t",
            delayClose: 0,
            actions: [{ title: "确定", value: true }],
        });
        await nextTick();
        (cardOf()?.querySelector(".autospark-notification-action") as HTMLElement).click();
        await nextTick();
        expect(hit).toBe(true);
    });

    test("DOM 双通道：卡片元素以具体名 dispatchEvent 冒泡", async () => {
        const { engine } = spawn(`<div><span>x</span></div>`, {});
        let domHit = false;
        document.addEventListener("notifications/toast/d1/show", () => (domHit = true));
        engine.notifications.add({ id: "d1", title: "t", delayClose: 0 });
        await nextTick();
        await sleep(20);
        expect(domHit).toBe(true);
    });

    test("task 默认完成常驻：progress(100) 后卡片不收口（delayClose 对 task 无效）", async () => {
        const { engine } = spawn(`<div><span>x</span></div>`, {});
        const task = engine.notifications.task({ id: "s1", title: "任务", delayClose: 30 });
        task?.methods.progress(100); // 完成（无 closeWhenDone）
        await sleep(120); // 远超 delayClose
        expect(cardOf()).not.toBeNull(); // 常驻
        expect(task?.data.state).toBe("completed");
        expect(task?.data.holdOpen).toBe(true); // 未交还计时器
    });

    test("closeWhenDone: true：完成即关", async () => {
        const { engine } = spawn(`<div><span>x</span></div>`, {});
        const task = engine.notifications.task({ id: "s2", title: "任务", delayClose: 0, closeWhenDone: true });
        task?.methods.progress(100);
        await nextTick();
        await sleep(30);
        expect(cardOf()).toBeNull(); // 已关
        expect(task?.data.state).toBe("completed");
    });

    test("closeWhenDone: number(ms)：完成后按该值收口（holdOpen watcher 管道 + update 事件观测）", async () => {
        const { engine } = spawn(`<div><span>x</span></div>`, {});
        let hidden = false;
        engine.on("notifications/task/s3/hide", () => (hidden = true));
        const task = engine.notifications.task({ id: "s3", title: "任务", delayClose: 0, closeWhenDone: 60 });
        task?.methods.progress(50);
        await nextTick();
        expect(cardOf()).not.toBeNull(); // 推进中常驻
        task?.methods.progress(100);
        await sleep(30);
        expect(cardOf()).not.toBeNull(); // 60ms 未到——仍在
        expect(task?.data.holdOpen).toBe(false); // 已交还计时器
        await sleep(80);
        expect(hidden).toBe(true); // 60ms 收口 → hide 事件
    });

    test("task 运行键变更广播 update 事件：首个真实变更不吞（值比对修复）", async () => {
        const { engine } = spawn(`<div><span>x</span></div>`, {});
        const updates: any[] = [];
        engine.on("notifications/task/u1/update", (env: any) => updates.push(env.payload.notification.data.progress));
        const task = engine.notifications.task({ id: "u1", title: "任务", delayClose: 0 });
        await nextTick();
        task?.methods.progress(10); // 首个真实变更——旧 fire 计数实现会吞掉这次
        task?.methods.progress(20);
        await sleep(20);
        expect(updates).toContain(10); // 首变更即广播
        expect(updates).toContain(20);
    });

    test("× 点击 = close 独立动词（ADR-0104，修订 ADR-0102 × ≡ cancel）：运行中先 abort signal 再关", async () => {
        const { engine } = spawn(`<div><span>x</span></div>`, {});
        const task = engine.notifications.task({ id: "c1", title: "任务", delayClose: 0, canCancel: true });
        task?.methods.progress(30);
        await nextTick();
        // 换假 controller：happy-dom 的 AbortSignal.abort 在事件派发链内重入 dispatchEvent 触发其内部
        // private-method bug——本测试断言引擎路由（× → close → abort + hide），不测 happy-dom 内部。
        // 方法放原型（autostore 对 state 内自有函数属性按计算属性语义劫持——fetchOptions 警示同源）
        class FakeAbort {
            aborted = false;
            get signal() {
                return { aborted: this.aborted };
            }
            abort() {
                this.aborted = true;
            }
        }
        const fake = new FakeAbort();
        (task?.data as any)._abort = fake;
        let closeVerb = false;
        let cancelVerb = false;
        engine.on("notifications/task/c1/actions/close", () => (closeVerb = true));
        engine.on("notifications/task/c1/actions/cancel", () => (cancelVerb = true));
        (cardOf()?.querySelector(".autospark-notification-close") as HTMLElement).click();
        await nextTick();
        await sleep(30);
        expect(fake.aborted).toBe(true); // 运行中 ×：signal 中断
        expect(closeVerb).toBe(true); // 独立 close 动词事件
        expect(cancelVerb).toBe(false); // 不再冒充 cancel（ADR-0102 语义已修订）
        expect(cardOf()).toBeNull(); // 已关
    });
});
