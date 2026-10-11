import { describe, expect, test, afterEach } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";

/**
 * x-popover 悬浮形态测试（ADR-0060）。
 *
 * 与 x-dialog 的差异面：宿主 mouseenter 触发（非状态驱动）、共享 hover 域（宿主∪面板）、
 * hover 链（嵌套popover）、delayShow/delayHide、值不参与驱动。消费模型（组件即内容 /
 * props / 查找 / 插槽）由 x-overlay 基线测试覆盖，此处只冒烟。
 *
 * 面板为裸形态（容器直接子级）；延迟用例用小值真实等待；祖先重估的 elementFromPoint
 * 在用例内 stub（happy-dom 无真实命中测试）。
 */

const containerOf = (): HTMLElement | null => document.querySelector(".autospark-overlays");
const panelOf = (name: string): HTMLElement | null =>
    document.querySelector(`.autospark-overlays > [data-overlay="${name}"]`);

const engines: any[] = [];
const mountPopover = (html: string, state: any, options?: any) => {
    const m = mount(html, state, { animate: false, ...options });
    engines.push(m.engine);
    return m;
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** 悬浮事件辅助：mouseenter/mouseleave 不冒泡，直接对目标元素派发 */
const enter = (el: Element) => el.dispatchEvent(new MouseEvent("mouseenter"));
const leave = (el: Element, relatedTarget?: Element | null) =>
    el.dispatchEvent(new MouseEvent("mouseleave", { relatedTarget } as MouseEventInit));

/** elementFromPoint stub（happy-dom 无命中测试）：按坐标返回指定元素，返回后恢复原状 */
function stubElementFromPoint<T>(hit: HTMLElement | null, fn: () => T): T {
    const desc = Object.getOwnPropertyDescriptor(document, "elementFromPoint");
    const original = document.elementFromPoint.bind(document);
    (document as any).elementFromPoint = () => hit;
    try {
        return fn();
    } finally {
        if (desc) Object.defineProperty(document, "elementFromPoint", desc);
        else (document as any).elementFromPoint = original;
    }
}

/** 拦截 console.warn 收集编译期 warn（mount 同步编译，engine 建立后劫持 logger 已晚） */
function catchCompileWarns(fn: () => void): string[] {
    const warns: string[] = [];
    const orig = console.warn;
    console.warn = (...args: any[]) => warns.push(String(args[0] ?? ""));
    try {
        fn();
    } finally {
        console.warn = orig;
    }
    return warns;
}

afterEach(() => {
    while (engines.length) engines.pop()?.destroy();
});

describe("悬浮触发（delayShow）", () => {
    test("mouseenter 打开：裸面板直挂容器（无遮罩）、默认锚定宿主 placement bottom", async () => {
        const { root } = mountPopover(
            `<div id="app"><div x-scope>
                <div x-define="tip"><span>提示内容</span></div>
                <button id="t" x-popover:tip x-popover-options="{delayShow: 0}">悬停</button>
            </div></div>`,
            {},
        );
        expect(panelOf("tip")).toBeNull();
        enter(root.querySelector("#t")!);
        await nextTick();
        const panel = panelOf("tip");
        expect(panel).not.toBeNull();
        expect(panel!.textContent).toContain("提示内容");
        // 裸形态：面板是容器直接子级（无遮罩外壳）
        expect(panel!.parentElement).toBe(containerOf());
        // 默认锚 = 宿主自身，placement 默认 bottom（floating-ui 异步计算后写回）
        await nextTick();
        expect(panel!.getAttribute("data-overlay-placement")!.startsWith("bottom")).toBe(true);
    });

    test("delayShow 延迟：计时未到不显示，到点显示", async () => {
        const { root } = mountPopover(
            `<div id="app"><div x-scope>
                <div x-define="tip"><span>x</span></div>
                <button id="t" x-popover:tip x-popover-options="{delayShow: 30}">悬停</button>
            </div></div>`,
            {},
        );
        enter(root.querySelector("#t")!);
        await sleep(10);
        expect(panelOf("tip")).toBeNull(); // 计时中
        await sleep(50);
        expect(panelOf("tip")).not.toBeNull();
    });

    test("delayShow 计时中离开：取消打开", async () => {
        const { root } = mountPopover(
            `<div id="app"><div x-scope>
                <div x-define="tip"><span>x</span></div>
                <button id="t" x-popover:tip x-popover-options="{delayShow: 30}">悬停</button>
            </div></div>`,
            {},
        );
        const host = root.querySelector("#t")!;
        enter(host);
        await sleep(10);
        leave(host, null);
        await sleep(50);
        expect(panelOf("tip")).toBeNull(); // 快速掠过不触发
    });
});

describe("共享 hover 域关闭", () => {
    const setup = () =>
        mountPopover(
            `<div id="app"><div x-scope>
                <div x-define="tip"><span>内容</span></div>
                <button id="t" x-popover:tip x-popover-options="{delayShow: 0, delayHide: 30}">悬停</button>
            </div></div>`,
            {},
        );

    test("宿主→面板互移不闪关；离开域（delayHide 宽限后）关闭", async () => {
        const { root } = setup();
        const host = root.querySelector("#t")!;
        enter(host);
        await nextTick();
        const panel = panelOf("tip")!;
        // 宿主 → 面板（relatedTarget 在域内）：豁免
        leave(host, panel);
        await sleep(50);
        expect(panelOf("tip")).toBe(panel); // 未闪关
        // 面板 → 域外（relatedTarget null）：delayHide 宽限后关闭
        leave(panel, null);
        await sleep(10);
        expect(panelOf("tip")).not.toBeNull(); // 宽限期内
        await sleep(40);
        expect(panelOf("tip")).toBeNull(); // 关闭即销毁
    });

    test("宽限期内回到域内：取消关闭", async () => {
        const { root } = setup();
        const host = root.querySelector("#t")!;
        enter(host);
        await nextTick();
        const panel = panelOf("tip")!;
        leave(panel, null);
        await sleep(10);
        enter(panel);
        await sleep(40);
        expect(panelOf("tip")).toBe(panel); // mouseenter 清除挂起关闭
    });

    test("ESC 关闭（打开栈栈顶）", async () => {
        const { root } = setup();
        enter(root.querySelector("#t")!);
        await nextTick();
        expect(panelOf("tip")).not.toBeNull();
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        await nextTick();
        expect(panelOf("tip")).toBeNull();
    });

    test("消费者销毁：打开中的实例一并关闭，注册表清理", async () => {
        const { root, engine } = mountPopover(
            `<div id="app"><div x-scope>
                <div x-define="tip"><span>x</span></div>
                <button id="t" x-popover:tip x-popover-options="{delayShow: 0}">悬停</button>
            </div></div>`,
            {},
        );
        enter(root.querySelector("#t")!);
        await nextTick();
        expect(panelOf("tip")).not.toBeNull();
        engine.destroy();
        expect(panelOf("tip")).toBeNull();
    });
});

describe("嵌套 hover 链（ADR-0060）", () => {
    const setup = () =>
        mountPopover(
            `<div id="app"><div x-scope>
                <button id="root" x-popover:menu x-popover-options="{delayShow: 0, delayHide: 0}">菜单</button>
                <div x-define="menu">
                    <button id="child" x-popover:submenu x-popover-options="{delayShow: 0, delayHide: 0}">更多</button>
                </div>
                <div x-define="submenu"><span>子菜单内容</span></div>
            </div></div>`,
            {},
        );

    test("指针入子面板：父级保持打开（域并入）", async () => {
        const { root } = setup();
        enter(root.querySelector("#root")!);
        await nextTick();
        const menuPanel = panelOf("menu")!;
        const childHost = menuPanel.querySelector("#child")!;
        enter(childHost);
        await nextTick();
        const subPanel = panelOf("submenu")!;
        expect(subPanel).not.toBeNull();
        // 父面板 → 子面板（DOM 兄弟）：relatedTarget 落在后代 popover 域内，父级豁免
        leave(menuPanel, subPanel);
        await nextTick();
        expect(panelOf("menu")).toBe(menuPanel); // 父级保持
        expect(panelOf("submenu")).toBe(subPanel); // 子级保持
    });

    test("ESC 关子：子级关闭，父级经重估保持（指针仍在父域）", async () => {
        const { root } = setup();
        enter(root.querySelector("#root")!);
        await nextTick();
        const menuPanel = panelOf("menu")!;
        enter(menuPanel.querySelector("#child")!);
        await nextTick();
        expect(panelOf("submenu")).not.toBeNull();
        stubElementFromPoint(menuPanel, () => {
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        });
        await nextTick();
        expect(panelOf("submenu")).toBeNull(); // 栈顶子级关闭
        expect(panelOf("menu")).toBe(menuPanel); // 指针最后位置在父域内：父级不残留也不误关
    });

    test("ESC 关子：指针已出父域则父级一并重估关闭", async () => {
        const { root } = setup();
        enter(root.querySelector("#root")!);
        await nextTick();
        const menuPanel = panelOf("menu")!;
        enter(menuPanel.querySelector("#child")!);
        await nextTick();
        // 子面板悬浮于父面板旁（指针在子面板上 = 父域外）：子关闭后父级无残留
        stubElementFromPoint(null, () => {
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        });
        await nextTick();
        expect(panelOf("submenu")).toBeNull();
        expect(panelOf("menu")).toBeNull();
    });
});

describe("编译期 warn 与值语义", () => {
    test("值不参与驱动：非空值 warn，悬浮照常打开", async () => {
        let m!: ReturnType<typeof mountPopover>;
        const warns = catchCompileWarns(
            () =>
                (m = mountPopover(
                    `<div id="app"><div x-scope>
                        <div x-define="tip"><span>x</span></div>
                        <button id="t" x-popover:tip="ui.flag" x-popover-options="{delayShow: 0}">悬停</button>
                    </div></div>`,
                    { ui: { flag: false } },
                )),
        );
        expect(warns.some((w) => w.includes("不参与驱动"))).toBe(true);
        enter(m.root.querySelector("#t")!);
        await nextTick();
        expect(panelOf("tip")).not.toBeNull(); // 值被忽略，悬浮照常
    });

    test("同宿主多 popover：warn（不去重不拦截）", () => {
        const warns = catchCompileWarns(() =>
            mountPopover(
                `<div id="app"><div x-scope>
                    <div x-define="a"><span>x</span></div>
                    <div x-define="b"><span>y</span></div>
                    <button x-popover:a x-popover:b x-popover-options="{delayShow: 0}">悬停</button>
                </div></div>`,
                {},
            ),
        );
        expect(warns.some((w) => w.includes("触发源重合"))).toBe(true);
    });

    test("缺 attr：warn 且不挂触发器", () => {
        const warns = catchCompileWarns(() =>
            mountPopover(
                `<div id="app"><div x-scope>
                    <div x-define="tip"><span>x</span></div>
                    <button x-popover x-popover-options="{delayShow: 0}">悬停</button>
                </div></div>`,
                {},
            ),
        );
        expect(warns.some((w) => w.includes("缺少组件名 attr"))).toBe(true);
        expect(panelOf("tip")).toBeNull();
    });
});

describe("配置（锚 / 延迟表达式 / props）", () => {
    test("自定义锚：at 覆盖默认锚（placement 显式 top）", async () => {
        const { root } = mountPopover(
            `<div id="app"><div x-scope>
                <div x-define="tip"><span>x</span></div>
                <button id="t" x-popover:tip x-popover-options="{delayShow: 0, at: {selector: '#anchor', placement: 'top'}}">
                    <span id="anchor">锚</span>悬停
                </button>
            </div></div>`,
            {},
        );
        enter(root.querySelector("#t")!);
        await nextTick();
        await nextTick();
        expect(panelOf("tip")!.getAttribute("data-overlay-placement")!.startsWith("top")).toBe(true);
    });

    test("部分锚对象（只写 placement）：selector 回退宿主，placement 生效不退居中", async () => {
        const { root } = mountPopover(
            `<div id="app"><div x-scope>
                <div x-define="tip"><span>x</span></div>
                <button id="t" x-popover:tip x-popover-options="{delayShow: 0, at: {placement: 'right-start'}}">悬停</button>
            </div></div>`,
            {},
        );
        enter(root.querySelector("#t")!);
        await nextTick();
        await nextTick();
        // 成员级回退：selector 缺省宿主（锚定生效），placement 取用户值
        expect(panelOf("tip")!.getAttribute("data-overlay-placement")!.startsWith("right")).toBe(true);
    });

    test("delayShow 经成员属性表达式绑定状态（表达式求值 0 → 立即开）", async () => {
        const { root } = mountPopover(
            `<div id="app"><div x-scope>
                <div x-define="tip"><span>x</span></div>
                <button id="t" x-popover:tip x-popover-options.delay-show="ui.ms">悬停</button>
            </div></div>`,
            { ui: { ms: 0 } },
        );
        const host = root.querySelector("#t")!;
        enter(host);
        await nextTick();
        expect(panelOf("tip")).not.toBeNull(); // 表达式求值 0 → 无延迟
    });

    test("props 通道：成员属性注入组件数据域", async () => {
        const { root } = mountPopover(
            `<div id="app"><div x-scope>
                <div x-define="tip"><span>{{title}}</span></div>
                <button id="t" x-popover:tip x-popover-options="{delayShow: 0}" x-popover-options.props="{title: '悬浮标题'}">悬停</button>
            </div></div>`,
            {},
        );
        enter(root.querySelector("#t")!);
        await nextTick();
        expect(panelOf("tip")!.textContent).toContain("悬浮标题");
    });
});

describe("形态样式", () => {
    test("类级初始化注入 shell 视觉样式（含裸面板 z-index；幂等）", () => {
        mountPopover(
            `<div id="app"><div x-scope>
                <div x-define="tip"><span>x</span></div>
                <button x-popover:tip x-popover-options="{delayShow: 0}">悬停</button>
            </div></div>`,
            {},
        );
        const style = document.getElementById("autospark-shell-styles");
        expect(style).not.toBeNull();
        expect(style!.textContent).toContain("z-index");
        // 面板视觉随组件文件 <style global id> 注册期注入独立容器（ADR-0092：shell 即组件，
        // 容器名沿旧注入通道 autospark-shell-styles——指令 initialize 预热触发）
        expect(style!.textContent).toContain("[data-overlay][data-overlay-border]");
    });
});

describe("fit（面板尺寸跟随宿主）", () => {
    // happy-dom 无真实布局：stub offsetWidth/offsetHeight 模拟宿主尺寸
    function stubHostSize(el: HTMLElement, w: number, h: number) {
        Object.defineProperty(el, "offsetWidth", { value: w, configurable: true });
        Object.defineProperty(el, "offsetHeight", { value: h, configurable: true });
    }

    test("fit=true + 上下弹出：面板宽度与宿主一致", async () => {
        const { root } = mountPopover(
            `<div id="app"><div x-scope>
                <div x-define="tip"><span>x</span></div>
                <button id="t" x-popover:tip x-popover-options="{delayShow: 0, fit: true, at: {placement: 'top'}}">悬停</button>
            </div></div>`,
            {},
        );
        const host = root.querySelector("#t")!;
        stubHostSize(host, 200, 50);
        enter(host);
        await nextTick();
        await nextTick();
        await nextTick();
        const panel = panelOf("tip")!;
        // 上下弹出 → 宽度跟随宿主
        expect(panel.style.width).toBe("200px");
        expect(panel.style.height).toBe("");
    });

    test("fit=true + 左右弹出：面板高度与宿主一致", async () => {
        const { root } = mountPopover(
            `<div id="app"><div x-scope>
                <div x-define="tip"><span>x</span></div>
                <button id="t" x-popover:tip x-popover-options="{delayShow: 0, fit: true, at: {placement: 'right-start'}}">悬停</button>
            </div></div>`,
            {},
        );
        const host = root.querySelector("#t")!;
        stubHostSize(host, 200, 50);
        enter(host);
        await nextTick();
        await nextTick();
        await nextTick();
        const panel = panelOf("tip")!;
        // 左右弹出 → 高度跟随宿主
        expect(panel.style.height).toBe("50px");
        expect(panel.style.width).toBe("");
    });

    test("fit 默认 false：不设置面板尺寸", async () => {
        const { root } = mountPopover(
            `<div id="app"><div x-scope>
                <div x-define="tip"><span>x</span></div>
                <button id="t" x-popover:tip x-popover-options="{delayShow: 0}">悬停</button>
            </div></div>`,
            {},
        );
        const host = root.querySelector("#t")!;
        stubHostSize(host, 200, 50);
        enter(host);
        await nextTick();
        await nextTick();
        const panel = panelOf("tip")!;
        expect(panel.style.width).toBe("");
        expect(panel.style.height).toBe("");
    });
});

describe("触发方式（trigger 选项，ADR-0060 2026-10-11 修订）", () => {
    /** click 派发（bubbles：外点判定依赖 document capture 真实传播链） */
    const click = (el: Element) => el.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    /** 劫持 console.warn 收集运行期 warn（trigger 现读——warn 在触发时而非编译期） */
    function catchRuntimeWarns(fn: () => void): string[] {
        const warns: string[] = [];
        const orig = console.warn;
        console.warn = (...args: any[]) => warns.push(String(args[0] ?? ""));
        try {
            fn();
        } finally {
            console.warn = orig;
        }
        return warns;
    }

    const mountClick = () =>
        mountPopover(
            `<div id="app"><div x-scope>
                <div x-define="tip"><span>内容</span></div>
                <button id="t" x-popover:tip x-popover-options="{trigger: 'click'}">点击</button>
            </div></div>`,
            {},
        );

    test("click 方式：宿主 click 打开；mouseenter 无反应", async () => {
        const { root } = mountClick();
        const host = root.querySelector("#t")!;
        enter(host);
        await nextTick();
        expect(panelOf("tip")).toBeNull(); // 悬浮监听被现读分流忽略
        click(host);
        await nextTick();
        expect(panelOf("tip")).not.toBeNull();
    });

    test("toggle：再点宿主关闭", async () => {
        const { root } = mountClick();
        const host = root.querySelector("#t")!;
        click(host);
        await nextTick();
        expect(panelOf("tip")).not.toBeNull();
        click(host);
        await nextTick();
        expect(panelOf("tip")).toBeNull();
    });

    test("外点关闭：点面板内不关，点面板外关", async () => {
        const { root } = mountClick();
        const host = root.querySelector("#t")!;
        click(host);
        await nextTick();
        const panel = panelOf("tip")!;
        click(panel.querySelector("span")!); // 面板内点击：不关（面板挂 body 容器，capture 可达）
        await nextTick();
        expect(panelOf("tip")).toBeTruthy();
        click(document.body); // 面板外点击：关（须派发到 connected 元素——detached root 传播不到 document）
        await nextTick();
        expect(panelOf("tip")).toBeNull();
    });

    test("ESC 关闭（打开栈继承）", async () => {
        const { root } = mountClick();
        click(root.querySelector("#t")!);
        await nextTick();
        expect(panelOf("tip")).not.toBeNull();
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        await nextTick();
        expect(panelOf("tip")).toBeNull();
    });

    test("delayShow/delayHide 静默不适用：click 立即开、鼠标移出面板不关", async () => {
        const { root } = mountPopover(
            `<div id="app"><div x-scope>
                <div x-define="tip"><span>x</span></div>
                <button id="t" x-popover:tip x-popover-options="{trigger: 'click', delayShow: 300, delayHide: 300}">点击</button>
            </div></div>`,
            {},
        );
        const host = root.querySelector("#t")!;
        click(host);
        await nextTick();
        expect(panelOf("tip")).not.toBeNull(); // 无悬浮意图延迟
        const panel = panelOf("tip")!;
        leave(panel, null); // mouseleave 被分流忽略
        await sleep(350); // 超过 delayHide 也不关
        expect(panelOf("tip")).toBeTruthy();
    });

    test("修饰符桥接：x-popover:tip.click 等价 trigger: 'click'", async () => {
        const { root } = mountPopover(
            `<div id="app"><div x-scope>
                <div x-define="tip"><span>x</span></div>
                <button id="t" x-popover:tip.click>点击</button>
            </div></div>`,
            {},
        );
        const host = root.querySelector("#t")!;
        enter(host);
        await nextTick();
        expect(panelOf("tip")).toBeNull(); // click 方式：悬浮无反应
        click(host);
        await nextTick();
        expect(panelOf("tip")).not.toBeNull();
    });

    test("修饰符与显式 trigger 同写：显式赢（hover 生效）", async () => {
        const { root } = mountPopover(
            `<div id="app"><div x-scope>
                <div x-define="tip"><span>x</span></div>
                <button id="t" x-popover:tip.click x-popover-options="{trigger: 'hover', delayShow: 0}">混合</button>
            </div></div>`,
            {},
        );
        const host = root.querySelector("#t")!;
        click(host);
        await nextTick();
        expect(panelOf("tip")).toBeNull(); // 显式 hover：click 被分流忽略
        enter(host);
        await nextTick();
        expect(panelOf("tip")).not.toBeNull();
    });

    test("非法值：触发时 warn 回退 hover", async () => {
        const m = mountPopover(
            `<div id="app"><div x-scope>
                <div x-define="tip"><span>x</span></div>
                <button id="t" x-popover:tip x-popover-options="{trigger: 'focus', delayShow: 0}">非法</button>
            </div></div>`,
            {},
        );
        const warns = catchRuntimeWarns(() => click(m.root.querySelector("#t")!));
        expect(warns.some((w) => w.includes("trigger 须为"))).toBe(true);
        await nextTick();
        expect(panelOf("tip")).toBeNull(); // 回退 hover：click 无反应
        enter(m.root.querySelector("#t")!);
        await nextTick();
        expect(panelOf("tip")).not.toBeNull(); // hover 照常
    });

    test("热切换（成员属性表达式）：打开中的面板不重估，切换自下一次触发生效", async () => {
        const { root, engine } = mountPopover(
            `<div id="app"><div x-scope>
                <div x-define="tip"><span>x</span></div>
                <button id="t" x-popover:tip x-popover-options.trigger="ui.mode" x-popover-options.delay-show="0" x-popover-options.delay-hide="0">切换</button>
            </div></div>`,
            { ui: { mode: "hover" } },
        );
        const host = root.querySelector("#t")!;
        enter(host);
        await nextTick();
        expect(panelOf("tip")).not.toBeNull();
        (engine.store.state as any).ui.mode = "click"; // hover → click
        await nextTick();
        expect(panelOf("tip")).not.toBeNull(); // 不重估不打断
        leave(host, null); // 旧 hover 语义不生效（若残留 delayHide=0 会立即关）
        await nextTick();
        expect(panelOf("tip")).not.toBeNull();
        click(host); // 新方式：toggle 关
        await nextTick();
        expect(panelOf("tip")).toBeNull();
    });

    test("嵌套混合：click 父 + hover 子——子正常悬浮，子关闭时父不被重估误关", async () => {
        const { root } = mountPopover(
            `<div id="app"><div x-scope>
                <button id="root" x-popover:menu x-popover-options="{trigger: 'click'}">菜单</button>
                <div x-define="menu">
                    <button id="child" x-popover:submenu x-popover-options="{delayShow: 0, delayHide: 0}">更多</button>
                </div>
                <div x-define="submenu"><span>子菜单</span></div>
            </div></div>`,
            {},
        );
        click(root.querySelector("#root")!);
        await nextTick();
        const menuPanel = panelOf("menu")!;
        enter(menuPanel.querySelector("#child")!); // 子为默认 hover：悬浮打开
        await nextTick();
        expect(panelOf("submenu")).not.toBeNull();
        // ESC 关子（栈顶）：父为 click——重估通知跳过，指针已在域外也不误关
        stubElementFromPoint(null, () => {
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        });
        await nextTick();
        expect(panelOf("submenu")).toBeNull();
        expect(panelOf("menu")).toBeTruthy(); // click 父不被重估误关
    });
});

describe("内容内边距（padding 选项）", () => {
    /** 挂载并打开面板，返回内容区元素（padding 应用在 shell 内容区 inline） */
    async function openWithPadding(options: string) {
        const { root } = mountPopover(
            `<div id="app"><div x-scope>
                <div x-define="tip"><span>x</span></div>
                <button id="t" x-popover:tip x-popover-options="{delayShow: 0, ${options}}">悬停</button>
            </div></div>`,
            {},
        );
        enter(root.querySelector("#t")!);
        await nextTick();
        return panelOf("tip")!.querySelector(".autospark-popover-content") as HTMLElement;
    }

    test("number → 内容区 inline px", async () => {
        const content = await openWithPadding("padding: 12");
        expect(content.style.padding).toBe("12px");
    });

    test("CSS 长度字符串直写（含多值，成员属性表达式形态）", async () => {
        const { root } = mountPopover(
            `<div id="app"><div x-scope>
                <div x-define="tip"><span>x</span></div>
                <button id="t" x-popover:tip x-popover-options.delay-show="0" x-popover-options.padding="'8px 16px'">悬停</button>
            </div></div>`,
            {},
        );
        enter(root.querySelector("#t")!);
        await nextTick();
        const content = panelOf("tip")!.querySelector(".autospark-popover-content") as HTMLElement;
        expect(content.style.padding).toBe("8px 16px");
    });

    test("默认 0：不写 inline（shell 样式表 0px 兜底）", async () => {
        const content = await openWithPadding("");
        expect(content.style.padding).toBe("");
    });

    test("负数：触发时 warn 回退默认（无 inline）", async () => {
        const content = await openWithPadding("padding: -5");
        expect(content.style.padding).toBe("");
    });
});
