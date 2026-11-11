import { describe, expect, test } from "bun:test";
import "../setup";
import { AutoSpark } from "../../engine/engine";
import { mount, nextTick } from "../helpers";

/**
 * x-slot 插槽查找边界回归（button-group 子钮场景，2026-11-10）：
 *
 * 组件实例必须构成插槽查找边界——「容器组件的默认插槽内容里实例化自带 default
 * 出口的子组件」时，子组件的出口不得沿 parent 链穿透吃到外层容器收集它进来的
 * slotContents map（否则把自身宿主克隆投影进自己的出口 → 无限递归实例化，
 * 微任务饿死 + 内存暴涨）。根因是 instantiateComponent / instantiateDetachedComponent
 * 两处 stash 原为「有内容才写」——无内容的实例 scope 上没有 map，SlotDirective
 * 的 `if (holder.slotContents || holder.slotForwarding)` 判定跳过该级继续上溯。
 * 修复：恒写 map（空 map 即边界），对齐 ADR-0056「嵌套组件各持独立 map」意图。
 *
 * 本文件锁定：① 不递归（渲染终止、叶子实例唯一）；② 子组件出口走自己的
 * fallback；③ 容器出口正常投影子组件；④ 显式转发（ADR-0125）不受边界影响。
 */

describe("x-slot 查找边界（组件实例恒持 map，防穿透）", () => {
    test("插槽内容为自带 default 出口的子组件：不穿透、不递归、双方出口各归各位", async () => {
        const { root, engine } = mount(
            `<div x-scope>
                <div x-define="wrap-comp">
                    <div class="wrap-outlet"><span x-slot>容器兜底</span></div>
                </div>
                <div x-define="leaf-comp">
                    <div class="leaf-outlet"><span x-slot>叶子兜底</span></div>
                </div>
                <div id="app">
                    <div x-component:wrap-comp>
                        <div x-component:leaf-comp id="leaf"></div>
                    </div>
                </div>
            </div>`,
            {},
        );
        await nextTick();
        // 容器出口投影了子组件（leaf 实例在场）
        const outlet = root.querySelector(".wrap-outlet")!;
        expect(outlet.querySelector("#leaf .leaf-outlet")).toBeTruthy();
        // 子组件出口走自己的 fallback（未被外层 map 穿透投出自身克隆）
        expect(outlet.querySelector("#leaf .leaf-outlet")!.textContent).toBe("叶子兜底");
        // 不递归：叶子实例只有一个（无限递归会产生嵌套自身的克隆链）
        expect(root.querySelectorAll("#leaf").length).toBe(1);
        expect(root.querySelectorAll(".leaf-outlet").length).toBe(1);
        engine.destroy();
    });

    test("显式插槽转发（ADR-0125）不受空 map 边界影响：声明转发仍接力上溯", async () => {
        // shell 声明 slots="*"：其内嵌组件实例化（无自身内容 → 空 map）后，
        // 出口经转发声明继续把外层内容接力进来——边界修复不改变转发语义
        const { root, engine } = mount(
            `<div x-scope>
                <div x-define="shell-comp">
                    <div x-component:inner-comp x-component-options.slots="*">
                        <div class="shell-outlet"><span x-slot>壳兜底</span></div>
                    </div>
                </div>
                <div x-define="inner-comp">
                    <div class="inner-outlet"><span x-slot>内兜底</span></div>
                </div>
                <div id="app">
                    <div x-component:shell-comp>外部内容</div>
                </div>
            </div>`,
            {},
        );
        await nextTick();
        // 外部内容经 shell 出口 → 转发进 inner 的 default 出口（不吃内兜底）
        const inner = root.querySelector(".inner-outlet")!;
        expect(inner.textContent).toBe("外部内容");
        engine.destroy();
    });
});
