import { afterEach, describe, expect, test } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";
import type { AutoSpark } from "../../engine/engine";

/**
 * x-html.compile 样式通道测试（组件样式管线复用）。
 *
 * - 非 global `<style>`：摘出模板树，scoped 改写注入 head（宿主+后代打 data-cmp-{实例id}）；
 * - `<style global>`：留模板原位置随子树编译进结果 DOM，剥 global 属性；
 * - `bind()`：CSS 变量订阅挂宿主 el，宿主 scope 求值（祖先 x-data 可读）；
 * - 每轮 apply 换血：值变替换样式表与 watcher；空值 / destroy 回收。
 */

const engines: AutoSpark[] = [];

/** mount 并登记 engine（afterEach 统一 destroy——样式表/watcher 不泄漏到下个用例） */
function mountTracked(html: string, state: any) {
    const m = mount(html, state);
    engines.push(m.engine);
    return m;
}

afterEach(() => {
    for (const e of engines.splice(0)) e.destroy();
    // 兜底清理（destroy 走指令钩子已移除；此处防漏）
    for (const s of Array.from(document.head.querySelectorAll('style[id^="autospark-host-style-"]'))) {
        s.remove();
    }
});

/** 取本轮注入的 host scoped 样式表（autospark-host-style-* id） */
function hostStyle(): HTMLStyleElement | null {
    return document.head.querySelector('style[id^="autospark-host-style-"]');
}

/** 取宿主的 scoped 属性名（data-cmp-*） */
function scopedAttr(el: Element): string | undefined {
    return el.getAttributeNames().find((n) => n.startsWith("data-cmp-"));
}

/** 列举元素内联样式上的自定义属性名（happy-dom 的 CSSStyleDeclaration 不可迭代） */
function inlineVars(el: HTMLElement): string[] {
    const names: string[] = [];
    for (let i = 0; i < el.style.length; i++) {
        const n = el.style.item(i);
        if (n.startsWith("--")) names.push(n);
    }
    return names;
}

describe("x-html.compile - 样式通道", () => {
    test("scoped 段：提取出模板树、改写注入 head、宿主+后代打 scoped 属性", () => {
        const { root } = mountTracked(`<div id="app"><div x-html.compile="tpl"></div></div>`, {
            tpl: `<style>.card{color:red}</style><div class="card"><span>x</span></div>`,
        });
        // style 不进结果 DOM（已摘出模板树）
        expect(root.querySelector("style")).toBeNull();
        expect(root.querySelector("div#app > div > .card")).not.toBeNull();
        // head 注入改写后样式：选择器带 [data-cmp-{id}] 后缀
        const style = hostStyle();
        expect(style).not.toBeNull();
        expect(style!.textContent).toContain(".card[data-cmp-");
        // 宿主 + 后代打 scoped 属性（组件 mountComponentScopedAttr 同款）
        const host = root.querySelector("#app > div") as HTMLElement;
        const attr = scopedAttr(host);
        expect(attr).toMatch(/^data-cmp-/);
        expect(host.querySelector(".card")!.hasAttribute(attr!)).toBe(true);
    });

    test("scoped 隔离：两实例各自独立样式表（实例级随机 id，同模板不共享）", () => {
        const { root } = mountTracked(
            `<div id="app">
                <div class="h1" x-html.compile="tpl"></div>
                <div class="h2" x-html.compile="tpl"></div>
            </div>`,
            { tpl: `<style>.card{color:red}</style><div class="card"></div>` },
        );
        const h1 = root.querySelector(".h1") as HTMLElement;
        const h2 = root.querySelector(".h2") as HTMLElement;
        expect(scopedAttr(h1)).not.toBe(scopedAttr(h2));
        // 两张样式表各自独立
        const styles = document.head.querySelectorAll('style[id^="autospark-host-style-"]');
        expect(styles.length).toBe(2);
    });

    test("global 段：留 DOM 原位置、剥 global 属性、浏览器原生全局生效姿态", () => {
        const { root } = mountTracked(`<div id="app"><div x-html.compile="tpl"></div></div>`, {
            tpl: `<style global>body{margin:0}</style><div class="card"></div>`,
        });
        // global style 留在结果 DOM（宿主子树内，浏览器全局生效）
        const style = root.querySelector("#app > div > style") as HTMLStyleElement;
        expect(style).not.toBeNull();
        expect(style.textContent).toContain("body{margin:0}");
        // global 属性已剥（语义被消费，不再误触编译器告警）
        expect(style.hasAttribute("global")).toBe(false);
        // 不注入 head、不打 scoped 属性（宿主无 data-cmp-*）
        expect(hostStyle()).toBeNull();
        expect(scopedAttr(root.querySelector("#app > div")!)).toBeUndefined();
    });

    test("global 段内 bind()：warn + 原样保留（组件 ADR-0087 姿态）", async () => {
        const warns: string[] = [];
        const orig = console.warn;
        console.warn = (...args: any[]) => {
            warns.push(String(args[0] ?? ""));
        };
        let root!: HTMLElement;
        try {
            const mounted = mountTracked(`<div id="app"><div x-html.compile="tpl"></div></div>`, {
                tpl: `<style global>.g{color:bind(c)}</style><div></div>`,
            });
            root = mounted.root;
            // 首轮 apply 在 mount 后的微任务（scheduler defer），须等待其触发 warn
            await new Promise((r) => setTimeout(r, 150));
        } finally {
            console.warn = orig;
        }
        expect(warns.some((w) => w.includes("bind()"))).toBe(true);
        const style = root.querySelector("#app > div > style") as HTMLStyleElement;
        // 原样保留（浏览器丢弃非法声明，不影响其余规则）
        expect(style.textContent).toContain("bind(c)");
    });

    test("bind() 响应式：变量挂宿主 el、首值写入、状态变化更新", async () => {
        const { root, engine } = mountTracked(
            `<div id="app"><div x-html.compile="tpl"></div></div>`,
            {
                tpl: `<style>.card{color:bind(c)}</style><div class="card"></div>`,
                c: "red",
            },
        );
        const host = root.querySelector("#app > div") as HTMLElement;
        expect(host.style.getPropertyValue("--c")).toBe("red");
        engine.state.c = "blue";
        await nextTick();
        expect(host.style.getPropertyValue("--c")).toBe("blue");
    });

    test("bind() 表达式可读祖先 x-data（与普通模板同一数据视图）", async () => {
        // 祖先 x-data 挂路径 mount:'ui'（merge 进 state.ui）——外部可写、表达式经 scope 链可读
        const { root, engine } = mountTracked(
            `<div id="app">
                <div x-data="{theme:'dark'}" x-data-options="{mount:'ui'}">
                    <div x-html.compile="tpl"></div>
                </div>
            </div>`,
            { tpl: `<style>.card{color:bind(theme)}</style><div class="card"></div>` },
        );
        const host = root.querySelector("#app > div > div") as HTMLElement;
        expect(host.style.getPropertyValue("--theme")).toBe("dark");
        engine.state.ui.theme = "light";
        await nextTick();
        expect(host.style.getPropertyValue("--theme")).toBe("light");
    });

    test("bind() 表达式形态：hash 变量名 + 复杂表达式求值", async () => {
        const { root, engine } = mountTracked(
            `<div id="app"><div x-html.compile="tpl"></div></div>`,
            {
                tpl: `<style>.card{width:bind(size * 2)}</style><div class="card"></div>`,
                size: 10,
            },
        );
        const host = root.querySelector("#app > div") as HTMLElement;
        // 非纯路径表达式 → --h{hash36} 变量名
        const varName = inlineVars(host).find((n) => n.startsWith("--h"));
        expect(varName).toBeDefined();
        expect(host.style.getPropertyValue(varName!)).toBe("20");
        engine.state.size = 20;
        await nextTick();
        expect(host.style.getPropertyValue(varName!)).toBe("40");
    });

    test("值变换血：样式表内容替换、旧变量清除、旧 bind watcher 不累积", async () => {
        const { root, engine } = mountTracked(
            `<div id="app"><div x-html.compile="tpl"></div></div>`,
            {
                tpl: `<style>.card{color:bind(c)}</style><div class="card"></div>`,
                c: "red",
                d: "1px",
            },
        );
        const host = root.querySelector("#app > div") as HTMLElement;
        expect(host.style.getPropertyValue("--c")).toBe("red");
        // 换成只含另一 bind 的新模板
        engine.state.tpl = `<style>.card{border:bind(d)}</style><div class="card"></div>`;
        await nextTick();
        // 样式表同实例 id、内容已替换
        const style = hostStyle();
        expect(style).not.toBeNull();
        expect(style!.textContent).toContain("var(--d, unset)");
        expect(style!.textContent).not.toContain("var(--c, unset)");
        // 旧变量已从宿主清除、新变量写入
        expect(host.style.getPropertyValue("--c")).toBe("");
        expect(host.style.getPropertyValue("--d")).toBe("1px");
        // 旧 watcher 已摘除：c 变化不再写宿主
        engine.state.c = "blue";
        await nextTick();
        expect(host.style.getPropertyValue("--c")).toBe("");
    });

    test("空值回收：样式表移除 + bind 变量清除；恢复非空重新注入", async () => {
        const { root, engine } = mountTracked(
            `<div id="app"><div x-html.compile="tpl"></div></div>`,
            {
                tpl: `<style>.card{color:bind(c)}</style><div class="card"></div>`,
                c: "red",
            },
        );
        const host = root.querySelector("#app > div") as HTMLElement;
        expect(hostStyle()).not.toBeNull();
        engine.state.tpl = null;
        await nextTick();
        // 样式表移除、变量清除（var(--name, unset) 回退，不影响布局）
        expect(hostStyle()).toBeNull();
        expect(host.style.getPropertyValue("--c")).toBe("");
        // 恢复非空 → 重新注入
        engine.state.tpl = `<style>.card{color:bind(c)}</style><div class="card"></div>`;
        await nextTick();
        expect(hostStyle()).not.toBeNull();
        expect(host.style.getPropertyValue("--c")).toBe("red");
    });

    test("destroy 回收：样式表移除", () => {
        const { engine } = mountTracked(`<div id="app"><div x-html.compile="tpl"></div></div>`, {
            tpl: `<style>.card{color:red}</style><div class="card"></div>`,
        });
        expect(hostStyle()).not.toBeNull();
        engine.destroy();
        expect(hostStyle()).toBeNull();
    });

    test("多 <style> 块：合并注入、bind 跨块按 expr 去重", () => {
        const { root } = mountTracked(`<div id="app"><div x-html.compile="tpl"></div></div>`, {
            tpl: `<style>.a{color:bind(c)}</style><div class="a"></div><style>.b{background:bind(c)}</style>`,
        });
        const style = hostStyle();
        expect(style).not.toBeNull();
        // 两块都改写注入、同 expr 只派生一个变量名
        expect(style!.textContent).toContain(".a[data-cmp-");
        expect(style!.textContent).toContain(".b[data-cmp-");
        expect(style!.textContent.match(/var\(--c, unset\)/g)?.length).toBe(2);
        // 两块 style 均不进结果 DOM
        expect(root.querySelector("style")).toBeNull();
    });

    test("嵌套 @media 内选择器照常 scoped 改写", () => {
        const { root } = mountTracked(`<div id="app"><div x-html.compile="tpl"></div></div>`, {
            tpl: `<style>@media (min-width:600px){.card{color:red}}</style><div class="card"></div>`,
        });
        const style = hostStyle();
        expect(style!.textContent).toContain("@media (min-width:600px)");
        expect(style!.textContent).toContain(".card[data-cmp-");
    });

    test("默认通道（非 compile）不受影响：style 留 innerHTML 原样", () => {
        const { root } = mountTracked(`<div id="app"><div x-html="tpl"></div></div>`, {
            tpl: `<style>.card{color:red}</style><div class="card"></div>`,
        });
        // 默认通道不提取不改写（浏览器原生解析 body 内 style）
        expect(root.querySelector("#app > div > style")).not.toBeNull();
        expect(hostStyle()).toBeNull();
    });
});
