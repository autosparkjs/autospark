import { describe, expect, test, afterEach } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";
import type { AutoSpark } from "../../engine/engine";
import { BASE_PRESET_NAME } from "../../components";

/**
 * 通知族单层装配（ADR-0095 终态——type 组件经继承族根即完整卡片，无独立 shell 实例与投影）：
 * - 契约绑定化：`data-notification-type/level` 由族根模板自绑（props 注水驱动），引擎静态写
 *   卡片根退役；原地 update 的 level 变更经注水刷新响应式跟随；
 * - 覆盖语义：用户覆盖 `autospark.notifications.base` = 全族换根（外观 + 内容结构一体）；
 * - 链起点：type 链 `types[type].render` → `autospark.notifications.<type>` → base 兜底。
 *
 * 断言纪律：标量 / class 字符串面（元素引用与 engine 实例不进比较面——OOM 事故定约）。
 */

describe("通知族单层装配（ADR-0095）", () => {
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
        expect(card?.classList.contains("autospark-notification-type")).toBe(true); // 内容结构同卡（单层）
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

    test("task 继承族根：出口覆盖段（进度条）与 chrome 同卡呈现（单层继承）", async () => {
        const { engine } = spawn(`<div><span>x</span></div>`, {});
        engine.notifications.show({ title: "t", type: "task", delayClose: 0 });
        await nextTick();
        const card = cardOf();
        expect(card?.classList.contains("autospark-notification")).toBe(true); // 族根 chrome
        expect(card?.querySelector(".autospark-notification-progress")).not.toBeNull(); // 出口覆盖段
    });

    test("覆盖族根：用户接管 autospark.notifications.base = 全族换根", async () => {
        const { engine } = spawn(
            `<div><span>x</span></div>`,
            {},
            {
                components: {
                    [BASE_PRESET_NAME]: `<div class="my-root" x-define="${BASE_PRESET_NAME}"><b class="my-body" x-html="title"></b><div x-slot></div></div>`,
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
                    [BASE_PRESET_NAME]: `<div class="builtin-override" x-define="${BASE_PRESET_NAME}"><div x-slot></div></div>`,
                },
            },
        );
        engine.notifications.add({ title: "t", delayClose: 0 });
        await nextTick();
        expect(cardOf()?.classList.contains("builtin-override")).toBe(true);
    });
});
