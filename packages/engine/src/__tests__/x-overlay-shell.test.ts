import { describe, expect, test, afterEach } from "bun:test";
import "./setup";
import { mount, nextTick } from "./helpers";

/**
 * 覆盖物 shell 机制测试（ADR-0062）：面板层形态 = 可替换全局组件。
 *
 * 覆盖面：内置默认面板结构、自定义 shell 替换与 config 整包注入、配置链（成员表达式 /
 * 引擎级默认）、未命中回退、缺默认出口兜底、箭头显隐分工（渲染归 shell / 显隐定位归引擎）、
 * 双 scope 生命周期回收、命令式 shell 与 mask 选项。
 *
 * 约定：x-dialog 恒模态（面板在引擎遮罩内，shell 不含遮罩）；自定义 shell 的类名写
 * x-define 根元素（产物根 = 声明元素本身）；打开期 warn 经 scheduler 微任务 flush，
 * warn 断言用 catchWarnsAsync 覆盖 nextTick 窗口。
 */

const engines: any[] = [];
const mountShell = (html: string, state: any, options?: any) => {
    const m = mount(html, state, { animate: false, ...options });
    engines.push(m.engine);
    return m;
};

const containerOf = (): HTMLElement | null => document.querySelector(".autospark-overlays");
/** x-dialog 恒模态：面板在引擎遮罩内（shell 不含遮罩），不做「容器直接子级」限定 */
const panelOf = (name: string): HTMLElement | null =>
    document.querySelector(`[data-overlay="${name}"]`);
const scopedKeys = (engine: any): string[] =>
    Object.keys((engine.store.state as any).$scopes ?? {});

/** 劫持 console.warn 收集（覆盖 await 窗口——打开期 warn 经 scheduler 微任务 flush） */
async function catchWarnsAsync(open: () => void): Promise<string[]> {
    const warns: string[] = [];
    const orig = console.warn;
    console.warn = (...args: any[]) => warns.push(String(args[0] ?? ""));
    try {
        open();
        await nextTick();
    } finally {
        console.warn = orig;
    }
    return warns;
}

afterEach(() => {
    while (engines.length) engines.pop()?.destroy();
});

describe("内置默认 shell", () => {
    test("面板 = shell 产物根：data-overlay 契约 + 默认出口投影内容 + 退居中无箭头", async () => {
        const { root, engine } = mountShell(
            `<div id="app"><div x-scope>
                <div x-define="card"><b>卡片内容</b></div>
                <button x-dialog:card="on">打开</button>
            </div></div>`,
            { on: false },
        );
        engine.state.on = true;
        await nextTick();
        const panel = panelOf("card");
        expect(panel).not.toBeNull();
        // 面板 = 内置 dialog-shell 产物根（类名契约保留）
        expect(panel!.classList.contains("autospark-dialog")).toBe(true);
        expect(panel!.textContent).toContain("卡片内容");
        // 箭头载体恒渲染于 shell 模板（无 at → 引擎移除，退居中无孤立菱形）
        expect(panel!.querySelector(":scope > .autospark-overlay-arrow")).toBeNull();
        engine.state.on = false;
        await nextTick();
    });

    test("mask 模态形态：引擎遮罩根 > shell 面板（层级与组件化前一致）", async () => {
        const { root, engine } = mountShell(
            `<div id="app"><div x-scope>
                <div x-define="card"><b>x</b></div>
                <button x-dialog:card="on">打开</button>
            </div></div>`,
            { on: false },
        );
        engine.state.on = true;
        await nextTick();
        const panel = panelOf("card");
        expect(panel).not.toBeNull();
        // 遮罩 = 实例根（引擎建，shell 不含遮罩）；面板（shell 根）是遮罩直接子级
        const mask = panel!.parentElement!;
        expect(mask.classList.contains("autospark-dialog-mask")).toBe(true);
        expect(mask.parentElement).toBe(containerOf());
        engine.state.on = false;
        await nextTick();
    });

    test("内容组件响应式存活（live 投影不破坏状态绑定）", async () => {
        const { root, engine } = mountShell(
            `<div id="app"><div x-scope>
                <div x-define="card"><i>{{msg}}</i></div>
                <button x-dialog:card="on">打开</button>
            </div></div>`,
            { on: false, msg: "before" },
        );
        engine.state.on = true;
        await nextTick();
        expect(panelOf("card")!.textContent).toContain("before");
        engine.state.msg = "after";
        await nextTick();
        expect(panelOf("card")!.textContent).toContain("after");
        engine.state.on = false;
        await nextTick();
    });
});

describe("自定义 shell", () => {
    // 类名写在 x-define 根（产物根 = 声明元素本身）；默认出口 `<div x-slot>` 承接内容组件
    const CARD = `<div x-define="card"><b>正文</b></div>`;
    const MY_SHELL_HTML = `<div class="my-shell"><em x-text="theme"></em><div x-slot></div></div>`;

    test("options.components 注册：面板替换 + config 整包注入 + 内容进默认出口", async () => {
        const { root, engine } = mountShell(
            `<div id="app"><div x-scope>
                ${CARD}
                <button x-dialog:card="on" x-dialog-options="{shell: 'my-shell', theme: 'dark'}">打开</button>
            </div></div>`,
            { on: false },
            { components: { "my-shell": MY_SHELL_HTML } },
        );
        engine.state.on = true;
        await nextTick();
        const panel = panelOf("card");
        expect(panel).not.toBeNull();
        // 面板 = 自定义 shell 产物根（data-overlay 挂其根）
        expect(panel!.classList.contains("my-shell")).toBe(true);
        // config 整包（含自由键 theme）注入 shell data 域
        expect(panel!.querySelector("em")!.textContent).toBe("dark");
        // 内容组件投影进自定义 shell 默认出口
        expect(panel!.textContent).toContain("正文");
        engine.state.on = false;
        await nextTick();
    });

    test("局部 x-define 声明 shell（与内容组件同源查找协议）", async () => {
        const { root, engine } = mountShell(
            `<div id="app"><div x-scope>
                ${CARD}
                <div x-define="local-shell" class="local-shell"><div x-slot></div></div>
                <button x-dialog:card="on" x-dialog-options="{shell: 'local-shell'}">打开</button>
            </div></div>`,
            { on: false },
        );
        engine.state.on = true;
        await nextTick();
        expect(panelOf("card")!.classList.contains("local-shell")).toBe(true);
        engine.state.on = false;
        await nextTick();
    });

    test("未命中：warn + 回退内置默认（弹窗照常工作）", async () => {
        const { root, engine } = mountShell(
            `<div id="app"><div x-scope>
                ${CARD}
                <button x-dialog:card="on" x-dialog-options="{shell: 'nope-shell'}">打开</button>
            </div></div>`,
            { on: false },
        );
        const warns = await catchWarnsAsync(() => {
            engine.state.on = true;
        });
        expect(warns.some((w) => w.includes("nope-shell") && w.includes("回退内置默认"))).toBe(
            true,
        );
        expect(panelOf("card")!.classList.contains("autospark-dialog")).toBe(true);
        engine.state.on = false;
        await nextTick();
    });

    test("成员属性表达式 shell（打开时求值一次）", async () => {
        const { root, engine } = mountShell(
            `<div id="app"><div x-scope>
                ${CARD}
                <div x-define="expr-shell" class="expr-shell"><div x-slot></div></div>
                <button x-dialog:card="on" x-dialog-options.shell="ui.shellName">打开</button>
            </div></div>`,
            { on: false, ui: { shellName: "expr-shell" } },
        );
        engine.state.on = true;
        await nextTick();
        expect(panelOf("card")!.classList.contains("expr-shell")).toBe(true);
        engine.state.on = false;
        await nextTick();
    });

    test("引擎级默认：options.overlay.dialog.shell", async () => {
        const { root, engine } = mountShell(
            `<div id="app"><div x-scope>
                ${CARD}
                <div x-define="eng-shell" class="eng-shell"><div x-slot></div></div>
                <button x-dialog:card="on">打开</button>
            </div></div>`,
            { on: false },
            { overlay: { dialog: { shell: "eng-shell" } } },
        );
        engine.state.on = true;
        await nextTick();
        expect(panelOf("card")!.classList.contains("eng-shell")).toBe(true);
        engine.state.on = false;
        await nextTick();
    });

    test("shell 未声明默认出口：warn + 内容直挂面板根", async () => {
        const { root, engine } = mountShell(
            `<div id="app"><div x-scope>
                ${CARD}
                <div x-define="bare-shell" class="bare-shell"><p>无出口</p></div>
                <button x-dialog:card="on" x-dialog-options="{shell: 'bare-shell'}">打开</button>
            </div></div>`,
            { on: false },
        );
        const warns = await catchWarnsAsync(() => {
            engine.state.on = true;
        });
        const panel = panelOf("card")!;
        expect(panel.classList.contains("bare-shell")).toBe(true);
        // 内容直挂根（仍渲染可用）
        expect(panel.textContent).toContain("正文");
        expect(warns.some((w) => w.includes("未声明默认出口"))).toBe(true);
        engine.state.on = false;
        await nextTick();
    });
});

describe("箭头显隐分工（渲染归 shell / 显隐定位归引擎）", () => {
    // 锚点须在宿主（searchRoot）子树内——相对查询无前缀在 searchRoot 内查
    const setup = (options: string) =>
        mountShell(
            `<div id="app"><div x-scope>
                <div x-define="card"><b>x</b></div>
                <button x-dialog:card="on" x-dialog-options="{${options}}">
                    <span id="anchor">锚</span>打开
                </button>
            </div></div>`,
            { on: false },
        );

    test("锚定命中：shell 渲染的载体保留，floating-ui 定位", async () => {
        const { root, engine } = setup(`at: {selector: '#anchor', placement: 'top'}`);
        engine.state.on = true;
        await nextTick();
        await nextTick();
        const panel = panelOf("card")!;
        expect(panel.querySelector(":scope > .autospark-overlay-arrow")).not.toBeNull();
        expect(panel.getAttribute("data-overlay-placement")!.startsWith("top")).toBe(true);
        engine.state.on = false;
        await nextTick();
    });

    test("锚定 + arrow:false：引擎移除载体", async () => {
        const { root, engine } = setup(
            `at: {selector: '#anchor', placement: 'top', arrow: false}`,
        );
        engine.state.on = true;
        await nextTick();
        await nextTick();
        expect(panelOf("card")!.querySelector(":scope > .autospark-overlay-arrow")).toBeNull();
        engine.state.on = false;
        await nextTick();
    });

    test("无 at（居中）：引擎移除载体，无孤立菱形", async () => {
        const { root, engine } = setup(``);
        engine.state.on = true;
        await nextTick();
        expect(panelOf("card")!.querySelector(":scope > .autospark-overlay-arrow")).toBeNull();
        engine.state.on = false;
        await nextTick();
    });
});

describe("双 scope 生命周期（ADR-0062）", () => {
    // 内容组件带 setup data（写 $scopes 域）——内容 + shell 双 scope 键都可观测
    const CARD = `<div x-define="card"><script type="autospark/setup">{ data: { n: 1 } }</script><b>x</b></div>`;

    test("打开创建内容 + shell 双 scope，关闭对称回收", async () => {
        const { root, engine } = mountShell(
            `<div id="app"><div x-scope>
                ${CARD}
                <button x-dialog:card="on">打开</button>
            </div></div>`,
            { on: false },
        );
        const base = scopedKeys(engine).length;
        engine.state.on = true;
        await nextTick();
        expect(panelOf("card")).not.toBeNull();
        expect(scopedKeys(engine).length).toBe(base + 2); // 内容（setup data）+ shell（config 注入）
        engine.state.on = false;
        await nextTick();
        expect(scopedKeys(engine).length).toBe(base); // 双 scope 对称回收
    });

    test("engine.destroy：打开中实例（含 shell scope）随引擎整体摘除", async () => {
        const { root, engine } = mountShell(
            `<div id="app"><div x-scope>
                ${CARD}
                <button x-dialog:card="on">打开</button>
            </div></div>`,
            { on: false },
        );
        engine.state.on = true;
        await nextTick();
        expect(panelOf("card")).not.toBeNull();
        engine.destroy();
        expect(panelOf("card")).toBeNull();
    });
});

describe("命令式（OverlayHandle）", () => {
    // host = x-scope 元素（有 scope 的元素才能起链查找局部 x-define）
    test("mask 缺省模态；mask:false 裸面板；shell 选项替换面板", async () => {
        const { root, engine } = mountShell(
            `<div id="app"><div x-scope id="host">
                <div x-define="card"><b>x</b></div>
            </div></div>`,
            {},
            {
                components: {
                    "cmd-shell": `<div class="cmd-shell"><div x-slot></div></div>`,
                },
            },
        );
        const host = root.querySelector("#host")!;
        // 缺省：mask:true（引擎遮罩根）+ 内置 dialog-shell
        const handle1 = engine.getOverlay(host, "card", { animate: false })!;
        const inst1 = handle1.open();
        await nextTick();
        expect(inst1.el!.classList.contains("autospark-dialog-mask")).toBe(true);
        expect(inst1.el!.querySelector(".autospark-dialog")).not.toBeNull();
        inst1.close();
        await nextTick();
        // mask:false + shell 选项（handle options 通道）
        const handle2 = engine.getOverlay(host, "card", {
            animate: false,
            mask: false,
            shell: "cmd-shell",
        })!;
        const inst2 = handle2.open();
        await nextTick();
        expect(inst2.el!.classList.contains("cmd-shell")).toBe(true);
        expect(inst2.el!.parentElement).toBe(containerOf());
        inst2.close();
        await nextTick();
    });
});
