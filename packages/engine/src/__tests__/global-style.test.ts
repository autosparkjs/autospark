import { describe, expect, test, afterEach } from "bun:test";
import "./setup";
import { mount, nextTick } from "./helpers";
import type { AutoSpark } from "../engine";
import { GLOBAL_STYLE_CONTAINER_ID } from "../utils/globalStyle";

/**
 * 组件全局样式（ADR-0087）：`<style global>` 的注册期注入、容器聚合、engine 记账与边界。
 *
 * 覆盖 grilling 共识 Q1~Q9：
 * - Q1 注册即注入（无需实例化）+ destroy 统一移除
 * - Q2 无 id 段合并共享容器 autospark-styles（同组件多段 + 跨组件）
 * - Q3 同 id 跨组件追加
 * - Q4 bind() 不支持：warn + 原样保留
 * - Q5 仅 x-define 生效：组件外 warn
 * - Q6 无 global 的 id 静默忽略
 * - Q7 同名覆盖声明整组替换保位
 * - Q8 多 engine 按 engine 记账、destroy 不误伤
 * - Q9 继承链拼接不去重（父段重复注入）
 */

describe("x-define 全局样式（ADR-0087）", () => {
    // 本文件用例自管 engine 生命周期（head 是全局共享的，残留会污染后续用例）
    const spawned: AutoSpark[] = [];
    const spawn = (html: string, state: any = {}, options?: Parameters<typeof mount>[2]) => {
        const m = mount(html, state, options);
        spawned.push(m.engine);
        return m;
    };
    afterEach(() => {
        for (const e of spawned) {
            try {
                e.destroy();
            } catch {
                // 用例体内已 destroy（幂等性不作承诺，吞二次销毁错）
            }
        }
        spawned.length = 0;
        // 兜底清残留容器（异常路径泄漏时防跨用例污染）
        document.head.querySelector(`style#${GLOBAL_STYLE_CONTAINER_ID}`)?.remove();
        document.head.querySelector("style#xx")?.remove();
        document.head.querySelector("style#theme")?.remove();
    });

    /** 读取 head 中的全局样式容器 */
    const containerOf = (id = GLOBAL_STYLE_CONTAINER_ID) =>
        document.head.querySelector<HTMLStyleElement>(`style#${id}`);

    test("Q1：注册即注入——组件未实例化，样式已在 head 生效", () => {
        expect(containerOf()).toBeNull(); // 前置：容器不存在
        spawn(`<div x-scope>
            <div x-define="card"><div class="t">t</div><style global>.card-t { color: red }</style></div>
        </div>`, {});
        const el = containerOf();
        expect(el).not.toBeNull(); // 声明即生效（无需 x-component 实例）
        expect(el!.id).toBe(GLOBAL_STYLE_CONTAINER_ID);
        expect(el!.textContent).toContain(".card-t { color: red }"); // 原样注入（不改写、不去空白）
    });

    test("Q2：无 id 多段合并——同组件多个 + 跨组件，按声明序追加进同一容器", () => {
        spawn(`<div x-scope>
            <div x-define="a">
                <style global>.a1 { color: red }</style>
                <style global>.a2 { color: blue }</style>
            </div>
            <div x-define="b"><style global>.b1 { color: green }</style></div>
        </div>`, {});
        const css = containerOf()!.textContent!;
        expect(css).toContain(".a1");
        expect(css).toContain(".a2");
        expect(css).toContain(".b1");
        expect(css.indexOf(".a1")).toBeLessThan(css.indexOf(".a2"));
        expect(css.indexOf(".a2")).toBeLessThan(css.indexOf(".b1"));
        // 同 id 容器元素唯一（合并非多标签）
        expect(document.head.querySelectorAll(`style#${GLOBAL_STYLE_CONTAINER_ID}`).length).toBe(1);
    });

    test("Q3：带 id → 独立容器；同 id 跨组件追加", () => {
        spawn(`<div x-scope>
            <div x-define="a"><style id="xx" global>.x-a { color: red }</style></div>
            <div x-define="b"><style id="xx" global>.x-b { color: blue }</style></div>
            <div x-define="c"><style global>.plain { color: green }</style></div>
        </div>`, {});
        const named = containerOf("xx");
        expect(named).not.toBeNull();
        expect(named!.textContent).toContain(".x-a");
        expect(named!.textContent).toContain(".x-b"); // 同 id 追加不覆盖
        expect(named!.textContent.indexOf(".x-a")).toBeLessThan(named!.textContent.indexOf(".x-b"));
        // 无 id 段仍归共享容器，两者互不混
        expect(named!.textContent).not.toContain(".plain");
        expect(containerOf()!.textContent).toContain(".plain");
    });

    test("Q4：bind() 遇 global——warn + CSS 原样保留（不提取 styleBinds）", async () => {
        const warns: string[] = [];
        const orig = console.warn;
        console.warn = (...args: any[]) => warns.push(String(args[0] ?? ""));
        let root: HTMLElement;
        let engine: AutoSpark;
        try {
            // patch 须覆盖 engine 创建（logger 创建时绑定 console.warn，见 component-register 测试注释）
            ({ root, engine } = mount(`<div x-scope>
                <div x-define="gb"><style global>.gb { color: bind(color) }</style></div>
            </div>`, { color: "red" }));
        } finally {
            console.warn = orig;
        }
        spawned.push(engine);
        await new Promise((r) => setTimeout(r, 50)); // logger 异步 flush
        expect(warns.some((w) => w.includes("bind()"))).toBe(true);
        // CSS 原样保留（非法声明由浏览器丢弃，引擎不代为改写）
        expect(containerOf()!.textContent).toContain("bind(color)");
        // global 段不进 bindMap → def.styleBinds 不含该表达式
        const snap = engine.getComponentDeclaration(root.firstElementChild as HTMLElement, "gb")!;
        const def = engine.getComponentDef(snap)!;
        expect(def.styles).toEqual([
            { css: ".gb { color: bind(color) }", global: true, id: undefined },
        ]);
        expect(def.styleBinds).toBeUndefined();
    });

    test("Q6：无 global 的 id——静默忽略，维持 scoped 行为", async () => {
        const m = spawn(`<div x-scope>
            <div id="h" x-component:s></div>
            <div x-define="s"><span class="t">x</span><style id="ignored">.t { color: red }</style></div>
        </div>`, {});
        await nextTick();
        // id 未被用作全局容器
        expect(containerOf("ignored")).toBeNull();
        expect(containerOf()).toBeNull(); // 也没有无 id 段
        // scoped 路径照常：head 出现 data-cmp-def 标识的样式表（选择器已加属性后缀）
        const scoped = document.head.querySelector<HTMLStyleElement>(
            'style[data-cmp-def="s"]',
        );
        expect(scoped).not.toBeNull();
        expect(scoped!.textContent).toContain("[data-cmp-");
    });

    test("Q7：同名组件覆盖声明——旧段整组替换、保持原注入位置", () => {
        spawn(`<div x-scope>
            <div x-define="g1"><style global>.g1-old { color: red }</style></div>
            <div x-define="g2"><style global>.g2 { color: blue }</style></div>
            <div x-define="g1"><style global>.g1-new { color: green }</style></div>
        </div>`, {}); // g1 后者覆盖（ADR-0022 决策四-4 warn + 覆盖）
        const css = containerOf()!.textContent!;
        expect(css).not.toContain(".g1-old"); // 旧段被整组替换（无幽灵样式）
        expect(css).toContain(".g1-new");
        expect(css.indexOf(".g1-new")).toBeLessThan(css.indexOf(".g2")); // 保位：g1 原位置在前
    });

    test("混用：scoped 段不进全局容器、global 段不做 scoped 改写", async () => {
        spawn(`<div x-scope>
            <div id="h" x-component:mix></div>
            <div x-define="mix">
                <span class="s">s</span>
                <style>.s { color: red }</style>
                <style global>.mix-g { color: blue }</style>
            </div>
        </div>`, {});
        await nextTick();
        const globalCss = containerOf()!.textContent!;
        expect(globalCss).toContain(".mix-g { color: blue }"); // 原样：无 [data-cmp- 后缀
        expect(globalCss).not.toContain("[data-cmp-");
        expect(globalCss).not.toContain(".s {"); // scoped 段不进全局容器
        const scoped = document.head.querySelector<HTMLStyleElement>(
            'style[data-cmp-def="mix"]',
        );
        expect(scoped).not.toBeNull();
        expect(scoped!.textContent).toContain(".s[data-cmp-"); // scoped 段照常改写
    });

    test("Q8：多 engine 共页——destroy 只移除本 engine 段；段清空容器移除", () => {
        const a = spawn(`<div x-scope><div x-define="ea"><style global>.ea { color: red }</style></div></div>`, {});
        spawn(`<div x-scope><div x-define="eb"><style global>.eb { color: blue }</style></div></div>`, {});
        expect(containerOf()!.textContent).toContain(".ea");
        expect(containerOf()!.textContent).toContain(".eb");
        a.engine.destroy(); // 只销毁 a
        const css = containerOf()!.textContent!;
        expect(css).not.toContain(".ea");
        expect(css).toContain(".eb"); // 不误伤共页其他 engine
    });

    test("destroy 后段清空——容器元素一并移除", () => {
        const m = spawn(`<div x-scope><div x-define="only"><style global>.only { color: red }</style></div></div>`, {});
        expect(containerOf()).not.toBeNull();
        m.engine.destroy();
        expect(containerOf()).toBeNull();
    });

    test("Q9：继承链——子 def 注入父段 + 子段，父 def 独立注册再注入一次（接受重复）", async () => {
        spawn(`<div x-scope>
            <div id="h" x-component:child></div>
            <div x-define="parent"><style global>.pp { color: red }</style></div>
            <div x-define="child" x-define:inherit="parent"><style global>.cc { color: blue }</style></div>
        </div>`, {});
        await nextTick();
        const css = containerOf()!.textContent!;
        // 父段两份（parent def + child def 继承拼接），子段一份——不去重（ADR-0087 决策六）
        expect(css.match(/\.pp/g)?.length).toBe(2);
        expect(css.match(/\.cc/g)?.length).toBe(1);
    });

    test("Q5：组件外 <style global>——warn + 引擎不接管（按普通样式元素处理）", async () => {
        const warns: string[] = [];
        const orig = console.warn;
        console.warn = (...args: any[]) => warns.push(String(args[0] ?? ""));
        let engine: AutoSpark;
        try {
            ({ engine } = mount(`<div x-scope><style global>.outside { color: red }</style></div>`, {}));
        } finally {
            console.warn = orig;
        }
        spawned.push(engine);
        await new Promise((r) => setTimeout(r, 50));
        expect(warns.some((w) => w.includes("<style global>"))).toBe(true);
        // 引擎不接管：不注入共享容器（样式元素本身按浏览器语义留在结果 DOM）
        expect(containerOf()).toBeNull();
    });

    test("全局组件懒预编译路径：options.components 首次命中即注入", () => {
        const m = spawn(`<div x-scope><span x-text="1"></span></div>`, {}, {
            components: {
                card: `<div x-define="card"><style global>.lazy-g { color: red }</style><b>hi</b></div>`,
            },
        });
        expect(containerOf()).toBeNull(); // 懒预编译：未消费不解析
        m.engine.getComponentDeclaration(m.root.firstElementChild as HTMLElement, "card");
        expect(containerOf()?.textContent).toContain(".lazy-g");
    });

    test("运行时注册路径：engine.registerComponent 即注入", () => {
        const m = spawn(`<div x-scope><span x-text="1"></span></div>`, {});
        m.engine.registerComponent(
            `<div x-define="rt"><style global>.rt-g { color: red }</style></div>`,
        );
        expect(containerOf()?.textContent).toContain(".rt-g");
    });
});
