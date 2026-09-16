import { describe, expect, test } from "bun:test";
import "./setup";
import { mount, nextTick, finishAnim } from "./helpers";
import type { AutoSpark } from "../engine";
import type { AutoSparkScope } from "../scope";

/**
 * 从 engine.scopes 反查指定渲染元素对应的 scope。
 * eager x-if 的 binding.children 恰为当前编译出的子树 scope 集合
 * （ownsChildren 保证：子 scope 经 _linkParent 挂为本 scope 子代），
 * 故其 size 是"子树 watcher 是否堆积/泄露"的精确可观测信号。
 *
 * detach 期间宿主 el 离开 DOM，但 scope 由 parent.children 强引用保活、
 * engine.scopes 条目不删（WeakRef.deref 仍返回被测试强引用的 el），故仍可反查。
 */
function scopeOf(engine: AutoSpark, el: Element): AutoSparkScope | undefined {
    for (const [ref, scope] of engine.scopes) {
        if (ref.deref() === el) return scope;
    }
    return undefined;
}

describe("x-if eager（默认：false 摘宿主 + 锚点注释 + 销毁子树）", () => {
    test("true 编译子树挂载，false 摘宿主并以注释占位", async () => {
        const { root, store } = mount(`<div id="t" x-if="show">hi</div>`, { show: true });
        await nextTick();
        expect(root).toEqualHTML(`<div>
  <div id="t">hi</div>
</div>`);
        store.state.show = false;
        await nextTick();
        // 宿主 detach（离开 DOM），原位留锚点注释（toEqualHTML 忽略注释 → 容器空）
        expect(root.querySelector("#t")).toBeNull();
        expect(root).toEqualHTML(`<div></div>`);
        store.state.show = true;
        await nextTick();
        // 重新显示：reattach 宿主 + 重新编译子树，"hi" 复现
        expect(root).toEqualHTML(`<div>
  <div id="t">hi</div>
</div>`);
    });

    test("初始为 false 时子树从不编译、宿主 detach（懒挂载）", async () => {
        const { root, store } = mount(`<div id="t" x-if="show">hi</div>`, { show: false });
        await nextTick();
        expect(root.querySelector("#t")).toBeNull();
        expect(root).toEqualHTML(`<div></div>`);
        store.state.show = true;
        await nextTick();
        expect(root).toEqualHTML(`<div>
  <div id="t">hi</div>
</div>`);
    });

    test("false 销毁子树 watcher：隐藏期间变更不被订阅，重新显示重编译取最新值", async () => {
        const { root, store } = mount(`<div id="t" x-if="show"><span x-text="msg"></span></div>`, {
            show: true,
            msg: "a",
        });
        await nextTick();
        expect(root).toEqualHTML(`<div>
  <div id="t">
    <span>a</span>
  </div>
</div>`);
        // 隐藏：span 子树移除、x-text watcher 销毁、宿主 detach
        store.state.show = false;
        await nextTick();
        expect(root.querySelector("#t")).toBeNull();
        // 隐藏期间改 msg：watcher 已销毁，DOM 不变（仍空）
        store.state.msg = "b";
        await nextTick();
        expect(root.querySelector("#t")).toBeNull();
        // 重新显示：重新编译子树，x-text 读取当前最新值 b
        store.state.show = true;
        await nextTick();
        expect(root).toEqualHTML(`<div>
  <div id="t">
    <span>b</span>
  </div>
</div>`);
    });

    test("falsy 值（false/0/空串/null/undefined）统一摘宿主", async () => {
        for (const flag of [false, 0, "", null, undefined]) {
            const { root } = mount(`<div id="t" x-if="flag">x</div>`, { flag });
            await nextTick();
            expect(root.querySelector("#t")).toBeNull();
        }
    });

    test("truthy 非空字符串（'false'/'0'）保留宿主与子树", async () => {
        for (const flag of [true, 1, "false", "0"]) {
            const { root } = mount(`<div id="t" x-if="flag">x</div>`, { flag });
            await nextTick();
            expect(root).toEqualHTML(`<div>
  <div id="t">x</div>
</div>`);
        }
    });

    test("表达式 a && b 依赖多状态，切换任一即响应", async () => {
        const { root, store } = mount(`<div id="t" x-if="a && b">x</div>`, {
            a: true,
            b: false,
        });
        await nextTick();
        expect(root.querySelector("#t")).toBeNull();
        store.state.b = true;
        await nextTick();
        expect(root).toEqualHTML(`<div>
  <div id="t">x</div>
</div>`);
        store.state.a = false;
        await nextTick();
        expect(root.querySelector("#t")).toBeNull();
    });

    test("多次显隐切换后状态稳定（每次 true 重编译子树）", async () => {
        const { root, store } = mount(`<div id="t" x-if="show">x</div>`, { show: true });
        await nextTick();
        for (let i = 0; i < 3; i++) {
            store.state.show = false;
            await nextTick();
            store.state.show = true;
            await nextTick();
        }
        expect(root).toEqualHTML(`<div>
  <div id="t">x</div>
</div>`);
    });

    test("x-if 元素的普通属性保留，仅移除指令属性", async () => {
        const { root } = mount(`<section class="box" x-if="show"><p x-text="msg"></p></section>`, {
            show: true,
            msg: "ok",
        });
        await nextTick();
        expect(root).toEqualHTML(`<div>
  <section class="box">
    <p>ok</p>
  </section>
</div>`);
    });
});

describe("x-if + x-text 同元素（宿主 scope 跨 detach 存活）", () => {
    test("eager 摘宿主时 x-text watcher 在宿主 scope 存活，reattach 反映累积最新值", async () => {
        // div 无模板子树（subtreeNodes 空），x-text 写 textContent；eager false 摘宿主但宿主
        // scope 不销毁（仅 destroyChildren 销毁子树 scope），故 x-text watcher 存活并更新 detach 的 el
        const { root, store } = mount(`<div id="t" x-if="show" x-text="title"></div>`, {
            show: true,
            title: "T1",
        });
        await nextTick();
        expect(root).toEqualHTML(`<div>
  <div id="t">T1</div>
</div>`);
        const el = root.querySelector("#t")!;
        store.state.show = false;
        await nextTick();
        // 宿主 detach，但 x-text watcher 在宿主 scope 存活，更新到 detach 的 el
        expect(root.querySelector("#t")).toBeNull();
        expect(root.contains(el)).toBe(false);
        store.state.title = "T2";
        await nextTick();
        expect(el.textContent).toBe("T2"); // detach 的 el 仍被 x-text 更新
        // 重新显示：reattach 原宿主，反映累积最新值 T2
        store.state.show = true;
        await nextTick();
        expect(root).toEqualHTML(`<div>
  <div id="t">T2</div>
</div>`);
    });
});

describe("x-if.keepalive（摘宿主但保活子树与 watcher）", () => {
    test("keepalive：false 摘宿主（注释占位）保活子树，true reattach 原宿主（状态保留）", async () => {
        const { root, store } = mount(
            `<div id="t" x-if.keepalive="show"><span x-text="msg"></span></div>`,
            { show: true, msg: "a" },
        );
        await nextTick();
        expect(root).toEqualHTML(`<div>
  <div id="t">
    <span>a</span>
  </div>
</div>`);
        const el = root.querySelector("#t")!;
        store.state.show = false;
        await nextTick();
        // 宿主 detach，子树 scope/watcher 保活（不销毁，区别于 eager）
        expect(root.querySelector("#t")).toBeNull();
        expect(root.contains(el)).toBe(false);
        // 隐藏期间改 msg：watcher 存活，patch 到 detach 的 el
        store.state.msg = "b";
        await nextTick();
        expect(el.querySelector("span")!.textContent).toBe("b");
        // 重新显示：reattach 原宿主（子树状态保留）
        store.state.show = true;
        await nextTick();
        expect(root).toEqualHTML(`<div>
  <div id="t">
    <span>b</span>
  </div>
</div>`);
    });
});

describe("x-show（独立指令：display:none，宿主永留 DOM）", () => {
    test("x-show 假时 display:none、宿主永留 DOM（区别于 x-if 的 detach）", async () => {
        const { root, store } = mount(
            `<div id="t" x-show="show"><span x-text="msg"></span></div>`,
            { show: true, msg: "a" },
        );
        await nextTick();
        expect(root).toEqualHTML(`<div>
  <div id="t">
    <span>a</span>
  </div>
</div>`);
        const el = root.querySelector("#t")!;
        store.state.show = false;
        await nextTick();
        // display:none，宿主永留 DOM（与 x-if 的 detach 相反）
        expect(root.contains(el)).toBe(true);
        expect(root).toEqualHTML(`<div>
  <div id="t" style="display: none;">
    <span>a</span>
  </div>
</div>`);
        // 隐藏期间 watcher 存活
        store.state.msg = "b";
        await nextTick();
        expect(root).toEqualHTML(`<div>
  <div id="t" style="display: none;">
    <span>b</span>
  </div>
</div>`);
        store.state.show = true;
        await nextTick();
        expect(root).toEqualHTML(`<div>
  <div id="t">
    <span>b</span>
  </div>
</div>`);
    });
});

describe("x-for + eager x-if 同元素冲突", () => {
    test("x-for 与 eager x-if 同元素：编译期抛错并提示替代方案", () => {
        expect(() =>
            mount(
                `<ul x-for="item of items" :key="item.id" x-if="show"><li x-text="item.name"></li></ul>`,
                { show: false, items: [] },
            ),
        ).toThrow(/结构指令冲突[\s\S]*x-for[\s\S]*x-if[\s\S]*x-show[\s\S]*keepalive/);
    });

    test("x-for + x-if.keepalive 同元素：不冲突，.keepalive detach 容器、保活项子树", async () => {
        const { root, store } = mount(
            `<ul id="t" x-for="item of items" :key="item.id" x-if.keepalive="show"><li x-text="item.name"></li></ul>`,
            { show: false, items: [{ id: 1, name: "a" }] },
        );
        await nextTick();
        // x-if.keepalive 不占 ownsChildren，与 x-for 共存；show=false 摘容器（注释占位）
        expect(root.querySelector("#t")).toBeNull();
        store.state.show = true;
        await nextTick();
        expect(root).toEqualHTML(`<div>
  <ul id="t">
    <li>a</li>
  </ul>
</div>`);
    });

    test("x-for + x-show 同元素：x-show display:none 控制容器显隐（保留项子树）", async () => {
        const { root, store } = mount(
            `<ul id="t" x-for="item of items" :key="item.id" x-show="show"><li x-text="item.name"></li></ul>`,
            { show: false, items: [{ id: 1, name: "a" }] },
        );
        await nextTick();
        // x-show display:none，容器永留 DOM
        expect(root).toEqualHTML(`<div>
  <ul id="t" style="display: none;">
    <li>a</li>
  </ul>
</div>`);
        store.state.show = true;
        await nextTick();
        expect(root).toEqualHTML(`<div>
  <ul id="t">
    <li>a</li>
  </ul>
</div>`);
    });
});

describe("eager x-if 重建后响应式恢复与反复切换无泄露", () => {
    test("false→true 重建子树后，内部响应式元素恢复订阅并持续响应", async () => {
        const { root, store } = mount(`<div id="t" x-if="show"><span x-text="msg"></span></div>`, {
            show: true,
            msg: "a",
        });
        await nextTick();
        const xifEl = root.querySelector("#t")!;
        // 隐藏：子树（span）移除、x-text watcher 销毁、宿主 detach
        store.state.show = false;
        await nextTick();
        expect(xifEl.querySelectorAll("span").length).toBe(0);
        expect(root.contains(xifEl)).toBe(false);
        // 重新显示：重新编译子树，span 取当前 msg=a
        store.state.show = true;
        await nextTick();
        expect(root).toEqualHTML(`<div>
  <div id="t">
    <span>a</span>
  </div>
</div>`);
        // 核心：重建后再次变更 msg —— 新的 x-text watcher 必须存活并响应
        store.state.msg = "c";
        await nextTick();
        expect(root.querySelector("#t span")!.textContent).toBe("c");
    });

    test("反复 true↔false 切换：子树 DOM 与子 scope 均不堆积（无泄露）", async () => {
        const { root, store, engine } = mount(
            `<div id="t" x-if="show"><span x-text="msg"></span></div>`,
            { show: true, msg: "a" },
        );
        await nextTick();
        const xifEl = root.querySelector("#t")!;
        const binding = scopeOf(engine, xifEl);
        expect(binding).toBeDefined();
        // 反复交替切换 6 轮（每轮 false→true 各 flush 一次）
        for (let i = 0; i < 6; i++) {
            store.state.show = false;
            await nextTick();
            store.state.show = true;
            await nextTick();
        }
        // 停在 true：恰好一份子树（subtreeNodes 防二次编译 → 无重复挂载）
        expect(xifEl.querySelectorAll("span").length).toBe(1);
        // 子作用域恰好 1 个（span 的 scope）—— size 不增长即子树 watcher 未堆积（无泄露）
        expect(binding!.children.size).toBe(1);
        // 最终态响应式仍正确：重建出的 watcher 活着
        store.state.msg = "z";
        await nextTick();
        expect(xifEl.querySelector("span")!.textContent).toBe("z");
        // 再次隐藏：子作用域应被 destroyChildren 清空（无残留 watcher）、宿主 detach
        store.state.show = false;
        await nextTick();
        expect(binding!.children.size).toBe(0);
        expect(xifEl.querySelectorAll("span").length).toBe(0);
    });
});

describe("x-if / x-show 进出场动画（ADR-0039）", () => {
    // duration 拉长到 5000ms 使动画在断言窗口内稳定「在播」；结束由 finishAnim 手动驱动（确定性）
    const OPT = `{animate:{name:'fade',duration:5000}}`;

    test("首次渲染静默：初始挂载不播进场（决策 6）", async () => {
        const { root } = mount(
            `<div id="t" x-if="on" x-if-options="${OPT}"><span x-text="msg"></span></div>`,
            { on: true, msg: "a" },
        );
        await nextTick();
        const t = root.querySelector<HTMLElement>("#t")!;
        expect(t.className).toBe("");
        expect(t.querySelector("span")!.textContent).toBe("a");
    });

    test("进场：状态变化挂载播 enter，六类名按相挂摘（决策 2）", async () => {
        const { root, engine } = mount(
            `<div id="t" x-if="on" x-if-options="${OPT}"><span>Hi</span></div>`,
            { on: false },
        );
        await nextTick();
        engine.state.on = true;
        await nextTick();
        const t = root.querySelector<HTMLElement>("#t")!;
        expect(t.classList.contains("fade-enter-active")).toBe(true);
        expect(t.classList.contains("fade-enter-to")).toBe(true); // from 已同步摘除（reflow 后）
        expect(t.classList.contains("fade-enter-from")).toBe(false);
        finishAnim(t);
        expect(t.classList.contains("fade-enter-active")).toBe(false);
        expect(t.classList.contains("fade-enter-to")).toBe(false);
    });

    test("离场：DOM 延迟移除、子树 inert、播完锚点占位（决策 9）", async () => {
        const { root, engine } = mount(
            `<div id="t" x-if="on" x-if-options="${OPT}"><span x-text="msg"></span></div>`,
            { on: true, msg: "a" },
        );
        await nextTick();
        engine.state.on = false;
        await nextTick();
        const t = root.querySelector<HTMLElement>("#t")!; // 仍在 root 内（延迟移除）
        expect(root.contains(t)).toBe(true);
        expect(t.classList.contains("fade-leave-active")).toBe(true);
        // 子树 watcher 已销毁（inert）：msg 变更不再影响离场元素
        engine.state.msg = "changed";
        await nextTick();
        expect(t.querySelector("span")!.textContent).toBe("a");
        finishAnim(t);
        expect(root.contains(t)).toBe(false);
        expect(root.innerHTML).toContain("<!--x-if-->");
    });

    test("抢占：离场中翻真 → 在播取消、全新编译无重复内容（决策 7）", async () => {
        const { root, engine } = mount(
            `<div id="t" x-if="on" x-if-options="${OPT}"><span x-text="msg"></span></div>`,
            { on: true, msg: "a" },
        );
        await nextTick();
        engine.state.on = false;
        await nextTick();
        const t = root.querySelector<HTMLElement>("#t")!;
        expect(t.classList.contains("fade-leave-active")).toBe(true);
        engine.state.on = true; // 离场播到一半翻真
        await nextTick();
        expect(t.classList.contains("fade-leave-active")).toBe(false);
        expect(t.classList.contains("fade-enter-active")).toBe(true);
        expect(t.querySelectorAll("span").length).toBe(1); // 无新旧子树共存
        expect(t.querySelector("span")!.textContent).toBe("a");
        finishAnim(t);
        expect(t.className).toBe("");
    });

    test("keepalive：离场/切回同权播动画（决策 11）", async () => {
        const { root, engine } = mount(
            `<div id="t" x-if.keepalive="on" x-if-options="${OPT}" x-text="msg">A</div>`,
            { on: true, msg: "A" },
        );
        await nextTick();
        engine.state.on = false;
        await nextTick();
        const t = root.querySelector<HTMLElement>("#t")!;
        expect(root.contains(t)).toBe(true); // 离场延迟摘除
        expect(t.classList.contains("fade-leave-active")).toBe(true);
        finishAnim(t);
        expect(root.contains(t)).toBe(false);
        engine.state.on = true;
        await nextTick();
        expect(root.contains(t)).toBe(true); // 同一元素重挂
        expect(t.classList.contains("fade-enter-active")).toBe(true);
        finishAnim(t);
        expect(t.className).toBe("");
    });

    test("x-show 离场延迟 display:none、进场恢复显示", async () => {
        const { root, engine } = mount(
            `<div id="t" x-show="on" x-show-options="${OPT}">T</div>`,
            { on: true },
        );
        await nextTick();
        engine.state.on = false;
        await nextTick();
        const t = root.querySelector<HTMLElement>("#t")!;
        expect(t.style.display).not.toBe("none"); // 动画期间仍可见
        expect(t.classList.contains("fade-leave-active")).toBe(true);
        finishAnim(t);
        expect(t.style.display).toBe("none"); // 播完才隐藏
        expect(t.className).toBe("");
        engine.state.on = true;
        await nextTick();
        expect(t.style.display).not.toBe("none");
        expect(t.classList.contains("fade-enter-active")).toBe(true);
        finishAnim(t);
        expect(t.style.display).not.toBe("none");
        expect(t.className).toBe("");
    });

    test("x-show 抢占：离场中翻真 → 终态可见且播进场（决策 7）", async () => {
        const { root, engine } = mount(
            `<div id="t" x-show="on" x-show-options="${OPT}">T</div>`,
            { on: true },
        );
        await nextTick();
        engine.state.on = false;
        await nextTick();
        const t = root.querySelector<HTMLElement>("#t")!;
        expect(t.classList.contains("fade-leave-active")).toBe(true);
        engine.state.on = true;
        await nextTick();
        expect(t.classList.contains("fade-leave-active")).toBe(false);
        expect(t.style.display).not.toBe("none");
        expect(t.classList.contains("fade-enter-active")).toBe(true);
        finishAnim(t);
        expect(t.className).toBe("");
    });

    test("多属性过渡：收齐全部属性事件才结束，先到者不提前终结", async () => {
        // 模拟真实浏览器 computed（happy-dom 不可得）：transition-property 两个属性
        const origGCS = window.getComputedStyle;
        window.getComputedStyle = (() => ({
            transitionProperty: "grid-template-rows, opacity",
            transitionDuration: "5s",
            transitionDelay: "0s",
            animationName: "none",
            animationDuration: "0s",
            animationDelay: "0s",
        })) as unknown as typeof window.getComputedStyle;
        try {
            const { root, engine } = mount(
                `<div id="t" x-if="on" x-if-options="${OPT}"><span>A</span></div>`,
                { on: true },
            );
            await nextTick();
            engine.state.on = false;
            await nextTick();
            const t = root.querySelector("#t")!;
            const fire = (prop: string) => {
                const e = new Event("transitionend");
                Object.defineProperty(e, "propertyName", { value: prop });
                t.dispatchEvent(e);
            };
            fire("opacity"); // 先到的属性事件：不得提前终结（元素仍在播）
            expect(root.contains(t)).toBe(true);
            expect(t.classList.contains("fade-leave-active")).toBe(true);
            fire("grid-template-rows"); // 收齐第二个：此刻结束 + 执行延迟移除
            expect(root.contains(t)).toBe(false);
            // 无关属性的事件被忽略
        } finally {
            window.getComputedStyle = origGCS;
        }
    });

    test("engine.destroy：在播离场同步完成、不抛错（dispose 收口）", async () => {
        const { root, engine } = mount(
            `<div id="t" x-if="on" x-if-options="${OPT}"><span>A</span></div>`,
            { on: true },
        );
        await nextTick();
        engine.state.on = false;
        await nextTick();
        expect(root.querySelector<HTMLElement>("#t")!.classList.contains("fade-leave-active")).toBe(true);
        engine.destroy();
        expect(root.innerHTML).toBe("");
    });
});
