import { describe, expect, test, afterEach } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";
import type { AutoSpark } from "autospark";
// 插件自举（ADR-0001）：注册通知组件模板 + ready 挂载 engine.notifications
import "../../modules/notifications";

/**
 * task 控制钮渲染与交互回归：
 * 1. 渲染（修复：控制钮容器 x-show 读取未物化键使求值抛错、整容器永久隐藏）：
 *    - 声明 canPause/canStop/canCancel 时，容器与对应按钮可见（canStart 未声明 → 「开始」隐藏）；
 *    - canCancel 缺省 true：未声明任何控制键也有「取消」按钮（取消是任务卡的基本出口）；
 *    - 显式 canCancel: false 压制缺省。
 * 2. 交互（修复：暂停/恢复按钮 @click 曾用三元表达式形态——methods 不在数据视图内、
 *    表达式兜底路径求值失败、点击无效）：togglePause 裸标识符形态经 getMethod 命中。
 */
describe("task 控制钮渲染可见性", () => {
    const spawned: AutoSpark[] = [];
    afterEach(() => {
        for (const e of spawned) {
            try { e.destroy(); } catch { /* 幂等 */ }
        }
        spawned.length = 0;
        document.querySelectorAll("[data-notification-pos]").forEach((n) => n.remove());
    });

    const cardOf = () => document.querySelector<HTMLElement>("[data-notification-pos] > *");
    const opButton = (text: string) => {
        const ops = Array.from(cardOf()?.querySelectorAll(".autospark-notification-op") ?? []);
        return ops.find((b) => b.textContent?.trim() === text) as HTMLElement | undefined;
    };
    const visible = (el?: HTMLElement) => !!el && el.style.display !== "none" && el.parentElement?.style.display !== "none";

    test("声明 canPause/canStop/canCancel：容器与三按钮可见，「开始」隐藏", async () => {
        const { engine } = mount(`<div><span>x</span></div>`, {});
        spawned.push(engine);
        engine.notifications.task({
            id: "r1", title: "任务", delayClose: 0,
            canPause: true, canStop: true, canCancel: true,
        });
        await nextTick();
        expect(visible(opButton("暂停"))).toBe(true);
        expect(visible(opButton("停止"))).toBe(true);
        expect(visible(opButton("取消"))).toBe(true);
        expect(visible(opButton("开始"))).toBe(false); // canStart 未声明
    });

    test("canCancel 缺省 true：未声明任何控制键也有「取消」按钮", async () => {
        const { engine } = mount(`<div><span>x</span></div>`, {});
        spawned.push(engine);
        engine.notifications.task({ id: "r2", title: "任务", delayClose: 0 });
        await nextTick();
        expect(visible(opButton("取消"))).toBe(true);
        expect(visible(opButton("暂停"))).toBe(false);
        expect(visible(opButton("停止"))).toBe(false);
    });

    test("显式 canCancel: false 压制缺省——无控制钮", async () => {
        const { engine } = mount(`<div><span>x</span></div>`, {});
        spawned.push(engine);
        engine.notifications.task({ id: "r3", title: "任务", delayClose: 0, canCancel: false });
        await nextTick();
        expect(visible(opButton("取消"))).toBe(false);
    });

    test("终态收起控制钮：completed / stopped 后不可见", async () => {
        const { engine } = mount(`<div><span>x</span></div>`, {});
        spawned.push(engine);
        const task = engine.notifications.task({ id: "r4", title: "任务", delayClose: 0 });
        await nextTick();
        expect(visible(opButton("取消"))).toBe(true);
        task?.methods.complete();
        await nextTick();
        expect(visible(opButton("取消"))).toBe(false);
    });

    test("卡片「暂停/恢复」按钮点击闭环：togglePause 切换状态机 + 同发 actions 事件", async () => {
        const { engine } = mount(`<div><span>x</span></div>`, {});
        spawned.push(engine);
        const task = engine.notifications.task({
            id: "r5", title: "任务", delayClose: 0, canPause: true,
        });
        await nextTick();
        expect(task?.data.state).toBe("running");
        const verbs: string[] = [];
        engine.on("notifications/task/r5/actions/pause", () => verbs.push("pause"));
        engine.on("notifications/task/r5/actions/resume", () => verbs.push("resume"));
        // 回归：@click 曾用三元表达式形态（methods 不在数据视图内，求值失败、点击无效）
        opButton("暂停")?.click();
        await nextTick();
        expect(task?.data.state).toBe("paused");
        expect(visible(opButton("恢复"))).toBe(true); // 文案随状态切换
        opButton("恢复")?.click();
        await nextTick();
        expect(task?.data.state).toBe("running");
        expect(visible(opButton("暂停"))).toBe(true);
        expect(verbs).toEqual(["pause", "resume"]); // 按钮 ≡ 会话方法：同发事件
    });

    test("factory 形态（canPause 随 return props 注入）：点击暂停/恢复 + 闭包 onResume 响应", async () => {
        const { engine } = mount(`<div><span>x</span></div>`, {});
        spawned.push(engine);
        let resumed = 0;
        const task = engine.notifications.task(async (session) => {
            session.onResume(() => resumed++); // 闭包内挂接（task-closure demo 同路径）
            return { title: "下载", delayClose: 0, canPause: true };
        });
        await nextTick();
        await new Promise((r) => setTimeout(r, 40)); // 等 factory resolve + 注水刷新
        expect(visible(opButton("暂停"))).toBe(true); // return props 注入后按钮可见
        expect(task?.data.state).toBe("running");
        opButton("暂停")?.click();
        await nextTick();
        expect(task?.data.state).toBe("paused");
        expect(visible(opButton("恢复"))).toBe(true);
        opButton("恢复")?.click();
        await nextTick();
        expect(task?.data.state).toBe("running");
        expect(resumed).toBe(1); // 闭包 onResume 收到恢复
    });
});
