import { describe, expect, test, afterEach } from "bun:test";
import "./setup";
import { mount, nextTick } from "./helpers";

/**
 * 临时复现：docs/demos/overlay/declare.html（overlays.md 快速入门「打开登录框」无效果）。
 * 复刻 demo 的 DOM 结构：消费按钮（x-dialog:login）与 x-data 域是【兄弟节点】。
 */
const containerOf = (): HTMLElement | null => document.querySelector(".autospark-overlays");
const maskOf = (name: string): HTMLElement | null =>
    document.querySelector(`.autospark-dialog-mask [data-overlay="${name}"]`)?.parentElement ?? null;

const engines: any[] = [];
const mountOverlay = (html: string, state: any) => {
    const m = mount(html, state, { animate: false });
    engines.push(m.engine);
    return m;
};

afterEach(() => {
    while (engines.length) engines.pop()?.destroy();
});

describe("复现：overlay/declare.html 快速入门", () => {
    test("对照组：按钮在 x-data 子树内 → 点击应打开", async () => {
        const { root } = mountOverlay(
            `<div class="demo-app">
                <div x-data="{ ui: { loginVisible: false }, appTitle: 'AutoSpark' }">
                    <div class="block">
                        <button id="t" x-dialog:login="ui.loginVisible"
                                @click="ui.loginVisible = true">打开登录框</button>
                    </div>
                    <div x-define="login">
                        <div class="ov-panel"><h3>登录 {{appTitle}}</h3></div>
                    </div>
                </div>
            </div>`,
            {},
        );
        console.log("[对照] x-text 初始 =",
            root.querySelector(".tag")?.textContent ?? "(无)");
        (root.querySelector("#t") as HTMLElement).click();
        await nextTick();
        console.log("[对照] 点击后 mask =", maskOf("login") ? "已打开" : "未打开");
        expect(maskOf("login")).not.toBeNull();
    });

    test("demo 修复后结构：x-data 上移到共同祖先 → 点击应打开", async () => {
        const { root } = mountOverlay(
            `<div class="demo-app section" x-data="{ ui: { loginVisible: false }, appTitle: 'AutoSpark' }">
                <div class="block">
                    <button id="t" class="button" x-dialog:login="ui.loginVisible"
                            @click="ui.loginVisible = true">打开登录框</button>
                    <span class="tag" x-text="'ui.loginVisible = ' + ui.loginVisible"></span>
                </div>
                <div x-define="login">
                    <div class="ov-panel"><h3>登录 {{appTitle}}</h3></div>
                </div>
            </div>`,
            {},
        );
        console.log("[demo] x-text 初始 =", root.querySelector(".tag")?.textContent);
        (root.querySelector("#t") as HTMLElement).click();
        await nextTick();
        console.log("[demo] 点击后 mask =", maskOf("login") ? "已打开" : "未打开");
        console.log("[demo] 点击后 x-text =", root.querySelector(".tag")?.textContent);
        expect(maskOf("login")).not.toBeNull();
    });
});
