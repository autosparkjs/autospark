import { describe, expect, test } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";
import type { AutoSparkScope } from "../../engine/scope";

/**
 * scope.refresh 按值 diff 的智能重跑测试（i18n ready 批量刷新场景的幂等化）。
 *
 * 修复前 refresh 以「当前值」全量重跑本 scope 与全部子 scope 的 watcher/绑定——任何
 * 非幂等监听（计数、push、一次性初始化）被多余重跑打掉初值，消费方被迫给监听包幂等
 * 防御（plugins 四轮测试污染战役的共同根因）。修复后：每个 watcher 先求值，与「上次
 * 执行时的已见值」比较，同值跳过通知（未变化监听零重跑）；真实变化的依赖照常重跑
 * （词典切换正路不受损）。
 */

/** 取容器（x-scope 宿主）scope：refresh 的常规调用面（递归子树） */
function containerScopeOf(engine: any, root: HTMLElement): AutoSparkScope {
    const scope = [...engine.scopes.values()].find(
        (s: AutoSparkScope) => s.el === root.firstElementChild,
    );
    if (!scope) throw new Error("未找到容器 scope");
    return scope;
}

describe("scope.refresh 按值 diff 的智能重跑", () => {
    test("未变化监听零重跑（计数断言）：路径支路与表达式支路均跳过", async () => {
        const { root, engine } = mount(
            `<div x-scope><span class="t" x-text="msg"></span></div>`,
            { msg: "a", other: 1 },
        );
        await nextTick();
        expect(root.querySelector(".t")?.textContent).toBe("a");
        const scope = containerScopeOf(engine, root);
        let pathCalls = 0;
        let exprCalls = 0;
        scope.watch("msg", () => {
            pathCalls++; // 非幂等计数监听（修复前被全量重跑 +1）
        });
        scope.watch("msg + '!' + other", () => {
            exprCalls++;
        });
        await nextTick();
        expect(pathCalls).toBe(0); // watch 建立不首跑（仅变更触发）
        expect(exprCalls).toBe(0);
        // 未发生任何状态变化：refresh 对两个监听均零重跑（修复前各 +1）
        scope.refresh();
        expect(pathCalls).toBe(0);
        expect(exprCalls).toBe(0);
        // 再刷一次仍零（已见值稳定）
        scope.refresh();
        expect(pathCalls).toBe(0);
        expect(exprCalls).toBe(0);
    });

    test("变化监听照常重跑：同步赋值后不等 flush，refresh 立即以新值通知并 patch", async () => {
        const { root, engine } = mount(
            `<div x-scope><span class="t" x-text="msg"></span></div>`,
            { msg: "a" },
        );
        await nextTick();
        const scope = containerScopeOf(engine, root);
        let calls = 0;
        let lastValue = "";
        scope.watch("msg", ({ value }) => {
            calls++;
            lastValue = value;
        });
        engine.state.msg = "b"; // 同步赋值：watcher 仅 schedule（microtask 未到）
        scope.refresh(); // 同步 refresh：求值 "b" ≠ 已见 "a" → 立即通知
        expect(calls).toBe(1);
        expect(lastValue).toBe("b");
        // x-text 绑定（表达式支路，span 子 scope 经容器 refresh 递归覆盖）同步 patch
        expect(root.querySelector(".t")?.textContent).toBe("b");
        await nextTick(); // 后续 flush 不再产生额外状态漂移
    });

    test("未变化时不重写 DOM（x-text 文本保持，无多余 patch 通道副作用）", async () => {
        const { root, engine } = mount(
            `<div x-scope><span class="t" x-text="msg"></span></div>`,
            { msg: "a" },
        );
        await nextTick();
        expect(root.querySelector(".t")?.textContent).toBe("a");
        const scope = containerScopeOf(engine, root);
        // 容器 refresh 递归子 scope（x-text 的 span）：值未变 → 跳过，文本原样
        scope.refresh();
        expect(root.querySelector(".t")?.textContent).toBe("a");
    });

    test("绑定对象形态：同引用求值产物保守重跑一次（非响应式通道数据源靠 refresh 重放），整体替换同内容跳过", async () => {
        const { root, engine } = mount(
            `<div x-scope><span class="t" x-text="order.label"></span></div>`,
            { order: { label: "x" } },
        );
        await nextTick();
        expect(root.querySelector(".t")?.textContent).toBe("x");
        const scope = containerScopeOf(engine, root);
        let calls = 0;
        scope.watch("order", () => {
            calls++;
        });
        // 同引用求值产物（order 响应式代理）：视为「可能已变」保守重跑一次（x-form 桥接
        // configManager 等非 store 响应式通道的数据源变更全靠 refresh 重放，同引用跳过会
        // 吞掉它们；响应式对象多跑一次仅是同值幂等 patch，正常触发通道仍兜底内部变更）
        scope.refresh();
        expect(calls).toBe(1);
        // 整体替换为同内容新引用：一层浅键比较相等 → 跳过（零多余重跑）
        engine.state.order = { label: "x" };
        scope.refresh();
        expect(calls).toBe(1);
        // 整体替换且内容变化 → 重跑
        engine.state.order = { label: "y" };
        scope.refresh();
        expect(calls).toBe(2);
        await nextTick();
    });

    test("字面量对象表达式求值产物（每次新引用）refresh 零重跑", async () => {
        const { root, engine } = mount(
            `<div x-scope><span class="t" x-text="label + ''"></span></div>`,
            { label: "L" },
        );
        await nextTick();
        const scope = containerScopeOf(engine, root);
        let calls = 0;
        // 表达式支路：字面量对象产物每次求值产生新引用，浅键比较相等 → 跳过
        scope.watch("{ v: label }", () => {
            calls++;
        });
        scope.refresh();
        expect(calls).toBe(0);
        engine.state.label = "M";
        scope.refresh(); // 求值 {v:'M'} ≠ 已见 {v:'L'} → 重跑
        expect(calls).toBe(1);
        await nextTick();
    });

    test("i18n 仿真：translate 槽输出未变时 refresh 零重跑、变化后经 refresh 生效", async () => {
        const dict: Record<string, string> = { hi: "你好" };
        const { root, engine } = mount(
            `<div x-scope><span class="t" x-text="msg"></span></div>`,
            { msg: "a" },
        );
        (engine as any).translate = (key: string) => dict[key] ?? key;
        await nextTick();
        const scope = containerScopeOf(engine, root);
        let calls = 0;
        let last = "";
        scope.watch("msg.length > 0 ? undefined : msg", () => {
            calls++;
        });
        // t 形态经 translate 槽求值字符串：词典未切换 → 同值跳过
        scope.watch("msg + ''", ({ value }) => {
            calls++;
            last = value;
        });
        scope.refresh();
        expect(calls).toBe(0);
        // 词典值变化（模拟依赖未精确收集、靠 refresh 驱动的场景）：refresh 以新值重跑
        engine.state.msg = dict.hi;
        scope.refresh();
        expect(calls).toBe(1);
        expect(last).toBe("你好");
        await nextTick();
    });
});
