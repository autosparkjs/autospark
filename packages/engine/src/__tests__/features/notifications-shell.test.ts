import { describe, expect, test, afterEach } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";
import type { AutoSpark } from "../../engine/engine";
import { SHELL_PRESET_NAME } from "../../components";

/**
 * 通知族单层装配（ADR-0095 终态 → ADR-0097 三出口化）：
 * - 契约绑定化：`data-notification-type/level` 由族根模板自绑（props 注水驱动），引擎静态写
 *   卡片根退役；原地 update 的 level 变更经注水刷新响应式跟随；
 * - 三出口：header（icon+title/link+description fallback）/ 默认出口（task 专属区）/
 *   actions（内联 x-for 按钮行，原子组件退役）——type 经 `<template x-slot:名>` 覆盖段重载，
 *   关闭钮为根直接子节点（chrome 分离，出口重载不伤 ×）；
 * - closeable 默认 true 常显（ADR-0097 语义翻转），显式 false 压制；
 * - 覆盖语义：用户覆盖 `autospark.notifications.shell` = 全族换根（外观 + 内容结构一体）；
 * - 链起点：type 链 `types[type].render` → `autospark.notifications.<type>` → shell 兜底。
 *
 * 断言纪律：标量 / class 字符串面（元素引用与 engine 实例不进比较面——OOM 事故定约）。
 */

describe("通知族单层装配（ADR-0095/0097）", () => {
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

    /** 卡片根（挂进分区列的 type 实例根） */
    const cardOf = () =>
        document.querySelector<HTMLElement>("[data-notification-pos] > *");

    test("契约绑定化：卡片根（type 实例根）自带引擎类与分派属性（族根模板自绑，继承下渗）", async () => {
        const { engine } = spawn(`<div><span>x</span></div>`, {});
        engine.notifications.add({ title: "t", delayClose: 0 });
        await nextTick();
        const card = cardOf();
        expect(card?.classList.contains("autospark-notification")).toBe(true); // 族根 chrome 类
        expect(card?.getAttribute("data-notification-type")).toBe("toast");
        expect(card?.getAttribute("data-notification-level")).toBe("none");
        expect(card?.querySelector(".autospark-notification-title")?.textContent).toContain("t");
    });

    test("原地 update 的 level 变更：契约属性经注水响应式跟随（静态写退役）", async () => {
        const { engine } = spawn(`<div><span>x</span></div>`, {});
        const inst = engine.notifications.add({ title: "t", delayClose: 0 });
        await nextTick();
        engine.notifications.update(inst!.data.id as string, { level: "warn" });
        await nextTick();
        expect(cardOf()?.getAttribute("data-notification-level")).toBe("warn");
    });

    test("closeable 默认 true：自动关闭的 toast 也常显 ×（ADR-0097 语义翻转）", async () => {
        const { engine } = spawn(`<div><span>x</span></div>`, {});
        engine.notifications.add({ title: "t" }); // delayClose 默认 3000（非 sticky，原无 ×）
        await nextTick();
        const close = cardOf()?.querySelector<HTMLElement>(".autospark-notification-close");
        expect(close).not.toBeNull(); // chrome 关闭钮存在
        expect(close?.style.display).not.toBe("none"); // 且可见
    });

    test("closeable 显式 false：任意配置层压制 ×", async () => {
        const { engine } = spawn(`<div><span>x</span></div>`, {}, {
            notifications: { delayClose: 0 },
        });
        engine.notifications.add({ title: "t", closeable: false });
        await nextTick();
        const close = cardOf()?.querySelector<HTMLElement>(".autospark-notification-close");
        expect(close?.style.display).toBe("none"); // 存在但隐藏（sticky 下原会被启发式强制补 ×）
    });

    test("actions 内联按钮行：confirm 默认双钮渲染 + 委托契约属性（原子组件退役，ADR-0097）", async () => {
        const { engine } = spawn(`<div><span>x</span></div>`, {});
        engine.notifications.confirm("确认？");
        await nextTick();
        const card = cardOf();
        const btns = card?.querySelectorAll<HTMLElement>(".autospark-notification-action") ?? [];
        expect(btns.length).toBe(2); // 确定 / 取消
        expect(btns[0]?.getAttribute("data-notification-action")).toBe("0"); // 委托索引契约
        expect(btns[1]?.getAttribute("data-notification-action")).toBe("1");
        expect(btns[0]?.textContent).toBe("确定");
        expect(card?.querySelector(".autospark-notification-actions")).not.toBeNull(); // 行容器
    });

    test("header / actions 出口重载：type 覆盖段替换 fallback，关闭钮不受伤（chrome 分离）", async () => {
        const { engine } = spawn(
            `<div><span>x</span></div>`,
            {},
            {
                components: {
                    "autospark.notifications.custom": `
                        <div x-define="autospark.notifications.custom" x-define:inherit="${SHELL_PRESET_NAME}">
                            <template x-slot:header><b class="my-header" x-text="title"></b></template>
                            <template x-slot:actions><i class="my-actions">A</i></template>
                        </div>`,
                },
            },
        );
        engine.notifications.add({ title: "自定义", type: "custom", delayClose: 0 });
        await nextTick();
        const card = cardOf();
        expect(card?.querySelector(".my-header")?.textContent).toBe("自定义"); // header 覆盖段生效
        expect(card?.querySelector(".autospark-notification-title")).toBeNull(); // 原 fallback 被替换
        expect(card?.querySelector(".my-actions")).not.toBeNull(); // actions 覆盖段生效
        expect(card?.querySelector(".autospark-notification-actions")).toBeNull(); // 原按钮行被替换
        expect(card?.querySelector(".autospark-notification-close")).not.toBeNull(); // × 是 chrome 不受伤
    });

    test("task 继承族根：出口覆盖段（进度条）与 chrome 同卡呈现（单层继承）", async () => {
        const { engine } = spawn(`<div><span>x</span></div>`, {});
        engine.notifications.show({ title: "t", type: "task", delayClose: 0 });
        await nextTick();
        const card = cardOf();
        expect(card?.classList.contains("autospark-notification")).toBe(true); // 族根 chrome
        expect(card?.querySelector(".autospark-notification-progress")).not.toBeNull(); // 出口覆盖段
    });

    test("覆盖族根：用户接管 autospark.notifications.shell = 全族换根", async () => {
        const { engine } = spawn(
            `<div><span>x</span></div>`,
            {},
            {
                components: {
                    [SHELL_PRESET_NAME]: `<div class="my-root" x-define="${SHELL_PRESET_NAME}"><b class="my-body" x-html="title"></b><div x-slot></div></div>`,
                },
            },
        );
        engine.notifications.add({ title: "换根", delayClose: 0 });
        await nextTick();
        const card = cardOf();
        expect(card?.classList.contains("my-root")).toBe(true); // 卡片根 = 用户族根
        expect(card?.classList.contains("autospark-notification")).toBe(false); // 零引擎类
        expect(card?.querySelector(".my-body")?.textContent).toContain("换根"); // 内容经用户结构渲染
    });

    test("builtinComponents 覆盖通道：明确接管内置族根（末端注册位）", async () => {
        const { engine } = spawn(
            `<div><span>x</span></div>`,
            {},
            {
                builtinComponents: {
                    [SHELL_PRESET_NAME]: `<div class="builtin-override" x-define="${SHELL_PRESET_NAME}"><div x-slot></div></div>`,
                },
            },
        );
        engine.notifications.add({ title: "t", delayClose: 0 });
        await nextTick();
        expect(cardOf()?.classList.contains("builtin-override")).toBe(true);
    });
});
