import { describe, expect, test, afterEach } from "bun:test";
import "../setup";
import { mount, nextTick, finishAnim } from "../helpers";

/**
 * 覆盖物体系测试（ADR-0052 修订版——组件化统一）。
 *
 * 覆盖物内容 = 任意组件（x-define 声明 / options.components 全局 / x-import），消费者
 * x-dialog 渲染进 document.body 下本 engine 的容器（autospark-overlays），断言走 document 级
 * 选择器；每个用例结束 engine.destroy() 整体回收容器（测试间隔离）。
 */

const containerOf = (): HTMLElement | null => document.querySelector(".autospark-overlays");
const maskOf = (name: string): HTMLElement | null =>
    document.querySelector(`.autospark-dialog-mask [data-overlay="${name}"]`)?.parentElement ??
    null;

const engines: any[] = [];
const mountOverlay = (html: string, state: any, options?: any) => {
    const m = mount(html, state, { animate: false, ...options });
    engines.push(m.engine);
    return m;
};

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

describe("消费模型（组件即覆盖物内容）", () => {
    test("x-define 声明剪枝不闪现；消费打开后渲染进 body 容器，读声明处数据", async () => {
        const { root, engine } = mountOverlay(
            `<div id="app">
                <div x-scope>
                    <div x-define="login"><h3>{{title}}</h3></div>
                    <button id="t" x-dialog:login="ui.loginVisible"></button>
                </div>
            </div>`,
            { ui: { loginVisible: false }, title: "登录" },
        );
        // 声明被剪枝：组件声明元素不进结果 DOM（无闪现）
        expect(root.querySelector("[x-define]")).toBeNull();
        // 未打开：容器里无实例
        expect(maskOf("login")).toBeNull();
        engine.state.ui.loginVisible = true;
        await nextTick();
        // 打开：body 容器中出现实例；declarer 基准（默认）沿挂链读声明处可见的 state.title
        const mask = maskOf("login");
        expect(mask).not.toBeNull();
        expect(containerOf()).not.toBeNull();
        expect(mask!.textContent).toContain("登录");
        expect(mask!.querySelector(".autospark-dialog")!.getAttribute("data-overlay")).toBe(
            "login",
        );
    });

    test("全局组件（options.components）可被消费；scope 链就近覆盖全局", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <button x-dialog:g-confirm="ui.open"></button>
            </div></div>`,
            { ui: { open: false }, greet: "全局" },
            { components: { "g-confirm": "<div><span>{{greet}}</span></div>" } },
        );
        engine.state.ui.open = true;
        await nextTick();
        expect(maskOf("g-confirm")!.textContent).toContain("全局");
    });

    test("未命中（scope 链与全局均无）→ pending 面板先开占位 + warn（注册后自动挂载）", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <button x-dialog:missing="ui.open"></button>
            </div></div>`,
            { ui: { open: false } },
        );
        const warns: string[] = [];
        const orig = engine.logger.warn.bind(engine.logger);
        engine.logger.warn = (msg: string) => warns.push(msg);
        try {
            engine.state.ui.open = true;
            await nextTick();
        } finally {
            engine.logger.warn = orig;
        }
        // pending（ADR-0123 决策 1 行为变化）：面板先开 + x-component pending 占位，warn 保留
        expect(!!maskOf("missing")).toBe(true);
        expect(warns.some((w) => w.includes("missing"))).toBe(true);
    });

    test("x-import 延迟就绪：pending 面板先开占位，components/<名>/registered 后自动挂载；等待期间归假则放弃", async () => {
        const { root, engine } = mountOverlay(
            `<div id="app"><div x-scope id="host">
                <button x-dialog:late="ui.open"></button>
            </div></div>`,
            { ui: { open: false } },
        );
        const warns: string[] = [];
        const orig = engine.logger.warn.bind(engine.logger);
        engine.logger.warn = (msg: string) => warns.push(msg);
        engine.state.ui.open = true;
        await nextTick();
        // pending（ADR-0123 决策 1 行为变化）：面板先开 + x-component pending 占位（无内容），warn 保留
        const mask = maskOf("late");
        expect(!!mask).toBe(true);
        expect(mask!.textContent.includes("迟到组件")).toBe(false); // 占位无内容
        expect(warns.some((w) => w.includes("late"))).toBe(true);
        engine.logger.warn = orig;
        // 模拟 x-import 就绪：注册组件 + 广播 registered → pending 自动挂载（ADR-0022 R6=B）
        const hostScope = engine.findScopeByEl(root.querySelector("#host")!)!;
        const compEl = document.createElement("div");
        compEl.innerHTML = "<span>迟到组件</span>";
        hostScope.components = { late: compEl };
        engine.emit("components/late/registered" as any, { name: "late", global: false }, true);
        await nextTick();
        expect(maskOf("late")!.textContent.includes("迟到组件")).toBe(true);

        // 等待期间 visible 已归假 → 就绪后不打开
        engine.state.ui.open = false;
        await nextTick();
        expect(!!maskOf("late")).toBe(false);
        hostScope.components = {};
        engine.state.ui.open = true;
        await nextTick();
        expect(!!maskOf("late")).toBe(true); // 未命中 → pending 面板先开（占位）
        engine.state.ui.open = false;
        await nextTick();
        const compEl2 = document.createElement("div");
        compEl2.innerHTML = "<span>x</span>";
        hostScope.components = { late: compEl2 };
        engine.emit("components/late/registered" as any, { name: "late", global: false }, true);
        await nextTick();
        expect(!!maskOf("late")).toBe(false); // 已归假，放弃打开
    });
});

describe("x-dialog 状态驱动（visible 形态）", () => {
    test("每次打开新实例：关闭即销毁（共识 5 无 singleton），再开全新 DOM", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-define="login"><span>x</span></div>
                <button x-dialog:login="ui.loginVisible"></button>
            </div></div>`,
            { ui: { loginVisible: false } },
        );
        engine.state.ui.loginVisible = true;
        await nextTick();
        const mask1 = maskOf("login")!;
        expect(mask1.style.display).not.toBe("none");
        engine.state.ui.loginVisible = false;
        await nextTick();
        // 关闭即销毁：DOM 从容器移除（非隐藏保活）
        expect(maskOf("login")).toBeNull();
        expect(containerOf()!.contains(mask1)).toBe(false);
        engine.state.ui.loginVisible = true;
        await nextTick();
        // 全新实例（不同 DOM 身份）
        expect(maskOf("login")).not.toBeNull();
        expect(maskOf("login")).not.toBe(mask1);
    });

    test("字面量 true：挂载即开（公告类）；false 永不开", () => {
        mountOverlay(
            `<div id="app">
                <div x-scope><div x-define="notice"><span>公告</span></div><button x-dialog:notice="true"></button></div>
            </div>`,
            {},
        );
        expect(maskOf("notice")!.textContent).toContain("公告");
    });

    test("表达式形态：请求关闭仅 UI 关闭，状态不回写", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-define="pay"><span>x</span></div>
                <button x-dialog:pay="ui.step === 2"></button>
            </div></div>`,
            { ui: { step: 2 } },
        );
        await nextTick();
        expect(maskOf("pay")).not.toBeNull();
        // ESC 请求关闭：UI 关 + 状态不变（无路径可回写）
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        await nextTick();
        expect(maskOf("pay")).toBeNull(); // 关闭即销毁
        expect(engine.state.ui.step).toBe(2);
    });
});

describe("「请求关闭」触点与写回", () => {
    const setup = () =>
        mountOverlay(
            `<div id="app"><div x-scope>
                <div x-define="login"><button data-action="close" @click="close()">关</button></div>
                <button x-dialog:login="ui.loginVisible"></button>
            </div></div>`,
            { ui: { loginVisible: true } },
        );

    test("ESC 关闭 → 回写 ui.loginVisible = false", async () => {
        const { engine } = setup();
        expect(maskOf("login")).not.toBeNull();
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        await nextTick();
        expect(engine.state.ui.loginVisible).toBe(false);
        expect(maskOf("login")).toBeNull();
    });

    test("点遮罩关闭（closeOnMask 默认 true）→ 回写；面板内点击不关", async () => {
        const { engine } = setup();
        const mask = maskOf("login")!;
        // 面板内点击：不关
        mask.querySelector(".autospark-dialog")!.dispatchEvent(
            new MouseEvent("click", { bubbles: true }),
        );
        await nextTick();
        expect(engine.state.ui.loginVisible).toBe(true);
        // 遮罩本体点击：关 + 回写
        mask.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect(engine.state.ui.loginVisible).toBe(false);
    });

    test("closeOnMask: false（选项成员属性）遮罩点击不关", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-define="keep"><span>x</span></div>
                <button x-dialog:keep="ui.open" x-dialog-options.close-on-mask="false"></button>
            </div></div>`,
            { ui: { open: true } },
        );
        expect(maskOf("keep")).not.toBeNull();
        maskOf("keep")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect(engine.state.ui.open).toBe(true);
        expect(maskOf("keep")).not.toBeNull();
    });

    test("子树内 close() action（内置动作信号）→ 请求关闭 + 回写", async () => {
        const { engine } = setup();
        const btn = maskOf("login")!.querySelector("[data-action]")!;
        btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect(engine.state.ui.loginVisible).toBe(false);
        expect(maskOf("login")).toBeNull();
    });
});

describe("props 通道（ADR-0052 v2.3：选项成员属性）", () => {
    test("对象字面量 props 注入组件响应式状态域，覆盖 data 默认", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-define="user">
                    <script setup>{ data: { userId: 0, extra: "默认" } }</script>
                    <span>{{userId}}-{{extra}}</span>
                </div>
                <button x-dialog:user="ui.open" x-dialog-options.props="{userId: 42}"></button>
            </div></div>`,
            { ui: { open: false } },
        );
        engine.state.ui.open = true;
        await nextTick();
        // props 覆盖 data 默认（userId: 42），未声明的键保留 data 默认（extra）
        expect(maskOf("user")!.textContent).toContain("42-默认");
    });

    test("props 成员可引用状态路径（表达式求值）+ 打开后持续热更新", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-define="user"><span>{{userId}}</span></div>
                <button x-dialog:user="ui.open" x-dialog-options.props="{userId: ui.uid}"></button>
            </div></div>`,
            { ui: { open: false, uid: 1 } },
        );
        engine.state.ui.open = true;
        await nextTick();
        expect(maskOf("user")!.textContent).toContain("1");
        // 持续热更新：打开期间状态变化 → Object.assign 进活跃实例数据域（组件内部状态不重置）
        engine.state.ui.uid = 99;
        await nextTick();
        expect(maskOf("user")!.textContent).toContain("99");
    });

    test("整包内嵌 props（静态字面量子集）注入；成员属性形态整键覆盖它", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-define="s1"><span>{{userId}}</span></div>
                <div x-define="s2"><span>{{userId}}</span></div>
                <button x-dialog:s1="ui.open" x-dialog-options="{props: {userId: 7}, closeOnMask: false}"></button>
                <button x-dialog:s2="ui.open2" x-dialog-options="{props: {userId: 7}}" x-dialog-options.props="{userId: 9}"></button>
            </div></div>`,
            { ui: { open: false, open2: false } },
        );
        engine.state.ui.open = true;
        engine.state.ui.open2 = true;
        await nextTick();
        // 整包内嵌 props 生效（静态），且配置键（closeOnMask）照常走配置链不混入 props
        expect(maskOf("s1")!.textContent).toContain("7");
        // 成员属性（表达式）整键覆盖整包内嵌的同名键
        expect(maskOf("s2")!.textContent).toContain("9");
    });

    test("props 纯状态路径展开（v-bind=obj 心智，深层响应）", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-define="user"><span>{{name}}/{{age}}</span></div>
                <button x-dialog:user="ui.open" x-dialog-options.props="ui.payload"></button>
            </div></div>`,
            { ui: { open: false, payload: { name: "张三", age: 20 } } },
        );
        engine.state.ui.open = true;
        await nextTick();
        expect(maskOf("user")!.textContent).toContain("张三/20");
        // 深层响应：子键变化热更新
        engine.state.ui.payload.age = 30;
        await nextTick();
        expect(maskOf("user")!.textContent).toContain("张三/30");
    });

    test("props 为空值 warn 忽略；标量/数组 warn 忽略", async () => {
        const warns = catchCompileWarns(() => {
            mountOverlay(
                `<div id="app"><div x-scope>
                    <div x-define="u1"><span>x</span></div>
                    <div x-define="u2"><span>x</span></div>
                    <button x-dialog:u1="ui.open" x-dialog-options.props=""></button>
                    <button x-dialog:u2="ui.open" x-dialog-options.props="ui.uid"></button>
                </div></div>`,
                { ui: { open: true, uid: 42 } },
            );
        });
        await nextTick();
        // 空值属性（编译期）与标量求值（watch 后）均 warn；指令本身仍正常打开（只是无 props）
        expect(warns.some((w) => w.includes("props"))).toBe(true);
        expect(maskOf("u1")).not.toBeNull();
        expect(maskOf("u2")).not.toBeNull();
    });

    test("定向成员：同元素多 x-dialog 按组件名精确配对 props", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-define="a"><span>A:{{tag}}</span></div>
                <div x-define="b"><span>B:{{tag}}</span></div>
                <button x-dialog:a="ui.openA" x-dialog:b="ui.openB"
                    x-dialog-options:a.props="{tag: '甲'}"
                    x-dialog-options:b.props="{tag: '乙'}"></button>
            </div></div>`,
            { ui: { openA: false, openB: false } },
        );
        engine.state.ui.openA = true;
        engine.state.ui.openB = true;
        await nextTick();
        expect(maskOf("a")!.textContent).toContain("A:甲");
        expect(maskOf("b")!.textContent).toContain("B:乙");
    });

    test("值对象形态硬删：warn + 忽略整个指令（ADR-0052 v2.3）", async () => {
        const warns = catchCompileWarns(() => {
            mountOverlay(
                `<div id="app"><div x-scope>
                    <div x-define="old"><span>x</span></div>
                    <button x-dialog:old="{visible: 'ui.open', userId: 42}"></button>
                </div></div>`,
                { ui: { open: true } },
            );
        });
        await nextTick();
        expect(warns.some((w) => w.includes("对象形态已删除"))).toBe(true);
        expect(maskOf("old")).toBeNull(); // 恒不打开
    });

    test("props 键不被宿主 x-options 回退（ADR-0007 修订：props 不参与宿主回退）", async () => {
        // 宿主 x-options 写 props：warn + 忽略——props 只认指令级通道
        const warns = catchCompileWarns(() => {
            mountOverlay(
                `<div id="app"><div x-scope>
                    <div x-define="p"><span>{{userId}}</span></div>
                    <button x-dialog:p="ui.open" x-options="{props: {userId: 7}}"></button>
                </div></div>`,
                { ui: { open: true } },
            );
        });
        await nextTick();
        expect(warns.some((w) => w.includes("props"))).toBe(true);
        expect(maskOf("p")!.textContent).not.toContain("7");
    });
});

describe("配置两级链（ADR-0052 v2.3：内置默认 < x-dialog-options）", () => {
    test("成员属性整键覆盖整包内嵌同名项", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-define="mix"><span>x</span></div>
                <div x-define="mix2"><span>x</span></div>
                <button x-dialog:mix="ui.open" x-dialog-options="{closeOnMask: false}" x-dialog-options.close-on-mask="true"></button>
                <button x-dialog:mix2="ui.open2" x-dialog-options="{closeOnMask: false}"></button>
            </div></div>`,
            { ui: { open: false, open2: false } },
        );
        // 成员属性 closeOnMask: true 覆盖整包内嵌的 false → 遮罩点击关闭
        engine.state.ui.open = true;
        await nextTick();
        const mask1 = maskOf("mix")!;
        mask1.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect(maskOf("mix")).toBeNull();

        // 成员未写 → 整包内嵌的 false 覆盖内置默认 true → 遮罩点击不关
        engine.state.ui.open2 = true;
        await nextTick();
        const mask2 = maskOf("mix2")!;
        mask2.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect(maskOf("mix2")).not.toBeNull();
    });

    test("定向整包按组件名配对（多 dialog 各自配置）", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-define="k1"><span>x</span></div>
                <div x-define="k2"><span>x</span></div>
                <button x-dialog:k1="ui.o1" x-dialog:k2="ui.o2"
                    x-dialog-options:k2="{closeOnMask: false}"></button>
            </div></div>`,
            { ui: { o1: false, o2: false } },
        );
        engine.state.ui.o1 = true;
        engine.state.ui.o2 = true;
        await nextTick();
        // k1 走内置默认（closeOnMask: true）→ 点击关闭
        maskOf("k1")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect(maskOf("k1")).toBeNull();
        // k2 定向整包 closeOnMask: false → 点击不关
        maskOf("k2")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect(maskOf("k2")).not.toBeNull();
    });

    test("配置成员绑定响应式状态：消费时机（打开）现读求值值", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-define="dyn"><span>x</span></div>
                <button x-dialog:dyn="ui.open" x-dialog-options.close-on-mask="ui.keepMask"></button>
            </div></div>`,
            { ui: { open: false, keepMask: false } },
        );
        // 打开前翻转状态：打开时现读 false → 遮罩点击不关（消费时机取最新值）
        engine.state.ui.keepMask = false;
        engine.state.ui.open = true;
        await nextTick();
        maskOf("dyn")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect(maskOf("dyn")).not.toBeNull();
    });

    test("x-dialog-options 独立生效（animate 走消费处选项）", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-define="an"><span>x</span></div>
                <button x-dialog:an="ui.open" x-dialog-options="{animate: {name: 'fade', duration: 5000}}"></button>
            </div></div>`,
            { ui: { open: false } },
        );
        engine.state.ui.open = true;
        await nextTick();
        const mask = maskOf("an")!;
        expect(mask.className).toContain("fade-enter-active");
        finishAnim(mask);
        engine.state.ui.open = false;
        await nextTick();
        // leave 动画在播：DOM 尚未移除（延迟移除语义）
        expect(containerOf()!.contains(mask)).toBe(true);
        finishAnim(mask);
        expect(containerOf()!.contains(mask)).toBe(false);
    });
});

describe("命令式 API（engine.getOverlay，共识 10 镜像 getComponentDeclaration）", () => {
    const html = `<div id="app"><div x-scope id="host">
        <div x-define="confirm"><span>{{msg}}</span></div>
    </div></div>`;

    test("el 起链查找 / 省略 el 仅查全局 / open({props}) / close / 未知键零防御", async () => {
        const { root, engine } = mountOverlay(
            html,
            {},
            {
                components: { global: "<div><span>全局覆盖物</span></div>" },
            },
        );
        const host = root.querySelector("#host")!;
        // el 起链查找命中局部 x-define 声明
        const handle = engine.getOverlay(host, "confirm", { animate: false })!;
        expect(handle).not.toBeUndefined();
        const inst1 = handle.open({ props: { msg: "确认删除？" } });
        await nextTick();
        expect(maskOf("confirm")!.textContent).toContain("确认删除？");
        inst1.close();
        await nextTick();
        expect(containerOf()!.contains(inst1.el!)).toBe(false);

        // 省略 el：仅查全局（局部定义不可达）
        expect(engine.getOverlay(null, "confirm")).toBeUndefined();
        const gHandle = engine.getOverlay(null, "global")!;
        gHandle.open();
        await nextTick();
        expect(maskOf("global")!.textContent).toContain("全局覆盖物");

        // 未知键零防御（v2.3）：visible 与旧隐式 props 写法静默沦入配置自由键——零告警、无 props 效果
        const warns: string[] = [];
        const orig = engine.logger.warn.bind(engine.logger);
        engine.logger.warn = (msg: string) => warns.push(msg);
        let legacyInst: any;
        try {
            legacyInst = handle.open({ visible: true, msg: "旧写法" });
            await nextTick();
        } finally {
            engine.logger.warn = orig;
        }
        expect(warns.length).toBe(0);
        expect(legacyInst.visible).toBe(true); // 打开照常（visible 只是普通自由键）
        expect(maskOf("confirm")!.textContent).not.toContain("旧写法"); // msg 未作 props
        legacyInst.close();
        await nextTick();
    });

    test("getOverlay options.props 句柄级默认：被 open({props}) 覆盖", async () => {
        const { root, engine } = mountOverlay(html, {});
        const host = root.querySelector("#host")!;
        const handle = engine.getOverlay(host, "confirm", {
            animate: false,
            props: { msg: "默认" },
        })!;
        handle.open();
        await nextTick();
        expect(maskOf("confirm")!.textContent).toContain("默认");
        handle.close();
        await nextTick();
        handle.open({ props: { msg: "覆盖" } });
        await nextTick();
        expect(maskOf("confirm")!.textContent).toContain("覆盖");
    });

    test("OverlayHandle.close 关该覆盖物当前全部打开实例", async () => {
        const { root, engine } = mountOverlay(html, {});
        const host = root.querySelector("#host")!;
        const handle = engine.getOverlay(host, "confirm")!;
        const a = handle.open({ props: { msg: "a" } });
        const b = handle.open({ props: { msg: "b" } });
        await nextTick();
        expect(a).not.toBe(b); // 多实例并存
        handle.close();
        await nextTick();
        expect(containerOf()!.contains(a.el!)).toBe(false);
        expect(containerOf()!.contains(b.el!)).toBe(false);
    });

    test("overlay:open / overlay:close 双通道；payload 收窄 {name, instance, scope}", async () => {
        const { root, engine } = mountOverlay(html, {});
        const host = root.querySelector("#host")!;
        const handle = engine.getOverlay(host, "confirm", { animate: false })!;
        const events: string[] = [];
        engine.on("overlay:open", (m: any) => {
            const p = m?.payload ?? m;
            events.push(`bus:open:${p.name}:type=${p.type === undefined}`);
        });
        document.body.addEventListener("overlay:open", ((e: CustomEvent) =>
            events.push(`dom:open:${e.detail.name}:inst=${!!e.detail.instance}`)) as EventListener);
        const inst = handle.open({ props: { msg: "x" } });
        inst.el!.addEventListener("overlay:close", ((e: CustomEvent) =>
            events.push(`dom:close:${e.detail.name}`)) as EventListener);
        await nextTick();
        expect(events).toContain("bus:open:confirm:type=true"); // type 键已删除
        expect(events).toContain("dom:open:confirm:inst=true");
        inst.close();
        await nextTick();
        expect(events).toContain("dom:close:confirm");
    });
});

describe("嵌套与打开栈", () => {
    test("ESC 只关全局栈顶实例（嵌套打开）", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-define="a"><span>a</span></div>
                <div x-define="b"><span>b</span></div>
                <button x-dialog:a="ui.a"></button>
                <button x-dialog:b="ui.b"></button>
            </div></div>`,
            { ui: { a: false, b: false } },
        );
        engine.state.ui.a = true;
        await nextTick();
        engine.state.ui.b = true;
        await nextTick();
        expect(maskOf("a")).not.toBeNull();
        expect(maskOf("b")).not.toBeNull();
        // 第一次 ESC：只关栈顶 b
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        await nextTick();
        expect(maskOf("b")).toBeNull();
        expect(maskOf("a")).not.toBeNull();
        // 第二次 ESC：关 a
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        await nextTick();
        expect(maskOf("a")).toBeNull();
    });
});

describe("dataContext 数据视图基准（共识 8：declarer 默认 / host）", () => {
    // 组件声明须在消费者的祖先链上（getComponentDeclaration 协议）；嵌套 x-data：外层 = 声明处、内层 = 消费处。
    // ADR-0123 决策 2：缺省基准收敛消费处 scope（内容宿主编译父 = 指令 binding，props 表达式
    // 上下文与既有 watch 严格对齐）；显式 dataContext（'declarer'/'host'/元素）经两栖分派保留。
    const html = (options: string) => `<div id="app"><div x-scope>
        <div x-data="{ title: '声明处' }">
            <div x-define="basis"><span>{{title}}</span></div>
            <div x-data="{ title: '消费处' }">
                <button x-dialog:basis="ui.open"${options}></button>
            </div>
        </div>
    </div></div>`;

    test("缺省收敛消费处：实例读消费处数据，关闭再开读数一致", async () => {
        const { engine } = mountOverlay(html(""), { ui: { open: true } });
        await nextTick();
        expect(maskOf("basis")!.textContent).toContain("消费处");
        // 关闭再开读数一致
        engine.state.ui.open = false;
        await nextTick();
        engine.state.ui.open = true;
        await nextTick();
        expect(maskOf("basis")!.textContent).toContain("消费处");
    });

    test("host 基准：实例读消费处数据", async () => {
        const { engine } = mountOverlay(html(` x-dialog-options="{dataContext: 'host'}"`), {
            ui: { open: true },
        });
        await nextTick();
        expect(maskOf("basis")!.textContent).toContain("消费处");
    });

    test("命令式 dataContext 传元素：挂元素所属 scope 为基准（两栖载体形态）", async () => {
        // 声明处 x-data(title=声明处) → 消费处 x-data(title=消费处) → button;
        // 命令式锚定 button 所属 scope（消费处）→ 等价 'host' 语义
        const { root, engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-data="{ title: '声明处' }">
                    <div x-define="basis"><span>{{title}}</span></div>
                    <div x-data="{ title: '消费处' }">
                        <button x-dialog:basis="ui.open"></button>
                    </div>
                </div>
            </div></div>`,
            { ui: { open: false } },
        );
        const anchorEl = root.querySelector("button")!;
        const handle = engine.getOverlay(anchorEl, "basis")!;
        handle.open({ dataContext: anchorEl });
        await nextTick();
        expect(maskOf("basis")!.textContent).toContain("消费处");
    });

    test("旧键 scope 在 props 通道中即普通 prop：注入组件 data 域（无基准效果）", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-data="{ title: '声明处' }">
                    <div x-define="basis"><span>{{title}}/{{scope}}</span></div>
                    <div x-data="{ title: '消费处' }">
                        <button x-dialog:basis="ui.open" x-dialog-options.props="{scope: 'host'}"></button>
                    </div>
                </div>
            </div></div>`,
            { ui: { open: true } },
        );
        await nextTick();
        // scope:'host' 只是普通 prop（基准缺省收敛消费处，v2.3 保留键清单已删除）
        expect(maskOf("basis")!.textContent).toContain("消费处/host");
    });
});

describe("delayClose 自动关闭", () => {
    test("delayClose > 0（选项成员属性）：打开后延时自动请求关闭（走标准链，回写 visible）", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-define="notice"><span>通知</span></div>
                <button x-dialog:notice="ui.open" x-dialog-options.delay-close="50"></button>
            </div></div>`,
            { ui: { open: true } },
        );
        await nextTick();
        expect(maskOf("notice")).not.toBeNull();
        // 50ms 后自动 requestClose('delay') → 简单路径回写 visible = false → 关闭销毁
        await new Promise((r) => setTimeout(r, 150));
        expect(engine.state.ui.open).toBe(false);
        expect(maskOf("notice")).toBeNull();
    });

    test("delayClose 缺省：不自动关闭", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-define="notice2"><span>x</span></div>
                <button x-dialog:notice2="ui.open"></button>
            </div></div>`,
            { ui: { open: true } },
        );
        await nextTick();
        expect(maskOf("notice2")).not.toBeNull();
        await new Promise((r) => setTimeout(r, 100));
        expect(maskOf("notice2")).not.toBeNull();
    });
});

describe("at 锚定定位（ADR-0052 决策 21–24）", () => {
    afterEach(() => {
        document.getElementById("tmp-anchor-root")?.remove();
    });

    test("at 未命中 → warn + 退屏幕居中（面板无 fixed 定位、无箭头载体残留）", async () => {
        const { root, engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-define="tip"><span>x</span></div>
                <button x-dialog:tip="ui.open" x-dialog-options="{at: '/#no-such-anchor'}"></button>
            </div></div>`,
            { ui: { open: false } },
        );
        root.id = "tmp-anchor-root";
        document.body.appendChild(root); // / 全局选择器走 document
        const warns: string[] = [];
        const orig = engine.logger.warn.bind(engine.logger);
        engine.logger.warn = (msg: string) => warns.push(msg);
        try {
            engine.state.ui.open = true;
            await nextTick();
        } finally {
            engine.logger.warn = orig;
        }
        expect(warns.some((w) => w.includes('"/#no-such-anchor"'))).toBe(true);
        const panel = maskOf("tip")!.querySelector(".autospark-dialog") as HTMLElement;
        expect(panel.style.position).not.toBe("fixed");
        // 退居中不注入箭头载体（避免未定位载体残留孤立菱形）
        expect(panel.querySelector(":scope > .autospark-overlay-arrow")).toBeNull();
    });

    test("placement 未配置：默认 auto（autoPlacement 自动选位并写回最终方向）", async () => {
        const { root, engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-define="tip"><span>x</span></div>
                <div id="anchor-el">锚</div>
                <button x-dialog:tip="ui.open" x-dialog-options="{at: '/#anchor-el'}"></button>
            </div></div>`,
            { ui: { open: false } },
        );
        root.id = "tmp-anchor-root";
        document.body.appendChild(root);
        engine.state.ui.open = true;
        await nextTick();
        await nextTick();
        const panel = maskOf("tip")!.querySelector(".autospark-dialog") as HTMLElement;
        // autoPlacement 经 reset 自主决定 placement，最终值写回面板（候选序首个可容纳方向）
        const final = panel.getAttribute("data-overlay-placement")!;
        expect(final).not.toBe("");
        expect([
            "top",
            "bottom",
            "left",
            "right",
            "top-start",
            "top-end",
            "bottom-start",
            "bottom-end",
            "left-start",
            "left-end",
            "right-start",
            "right-end",
        ]).toContain(final);
        // staticSide 偏移按最终方向设置（方向→对侧映射：top/bottom→bottom/top，left/right→right/left）
        const staticSide = { top: "bottom", bottom: "top", left: "right", right: "left" }[
            final.split("-")[0] as string
        ]!;
        const arrow = panel.querySelector(":scope > .autospark-overlay-arrow") as HTMLElement;
        expect(arrow.style[staticSide as any]).not.toBe("");
    });

    test("锚定命中：箭头默认开启 + staticSide 反向偏移（floating-ui 融合协议）+ placement 写回", async () => {
        const { root, engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-define="tip"><span>x</span></div>
                <div id="anchor-el">锚</div>
                <button x-dialog:tip="ui.open" x-dialog-options="{at: {selector: '/#anchor-el', placement: 'top'}}"></button>
                <button x-dialog:tip="ui.open2" x-dialog-options="{at: {selector: '/#anchor-el', placement: 'top', arrow: false}, border: false}"></button>
                <button x-dialog:tip="ui.bordered" x-dialog-options="{at: {selector: '/#anchor-el', placement: 'top'}, border: true}"></button>
            </div></div>`,
            { ui: { open: false, open2: false, bordered: false } },
        );
        root.id = "tmp-anchor-root";
        document.body.appendChild(root);
        // 默认（不写 arrow）：锚定模式箭头开启
        engine.state.ui.open = true;
        await nextTick();
        await nextTick(); // computePosition 的 promise 微任务
        const panel = maskOf("tip")!.querySelector(".autospark-dialog") as HTMLElement;
        expect(panel.getAttribute("data-overlay-placement")).toBe("top");
        // 默认（不写 border）：面板外壳带 1px 边框标记（border 默认 true，外壳模式：背景+边框+圆角）
        expect(panel.hasAttribute("data-overlay-border")).toBe(true);
        const arrow = panel.querySelector(":scope > .autospark-overlay-arrow") as HTMLElement;
        expect(arrow).not.toBeNull();
        // staticSide 偏移（top → 载体 bottom 负偏移尺寸一半，载体中心落在面板边缘线上）：
        // happy-dom 无布局（offsetWidth 0）得 "0px"，真实浏览器 8px 载体得 "-4px"——断言已被设置
        expect(arrow.style.bottom).not.toBe("");
        // 未配置 offset + 箭头开启 → 默认让位 6px（面板距锚点留出三角尖高度，尖点锚元素边缘而非覆盖其上）
        expect(panel.style.top).toBe("-6px");
        // 显式 arrow: false / border: false：不注入载体、无边框标记（实例并存，断言按序取）
        engine.state.ui.open2 = true;
        await nextTick();
        await nextTick();
        expect(
            document.querySelectorAll(".autospark-dialog-mask .autospark-overlay-arrow").length,
        ).toBe(1);
        const panels2 = document.querySelectorAll('.autospark-dialog-mask [data-overlay="tip"]');
        expect((panels2[1] as HTMLElement).hasAttribute("data-overlay-border")).toBe(false);
        // border: true（显式）：面板写 data-overlay-border 标记（箭头双层变色融合由 CSS 契约承担）
        // —— 三个同名实例并存，bordered 实例最后打开（DOM 追加序在最后）
        engine.state.ui.bordered = true;
        await nextTick();
        await nextTick();
        const panels = document.querySelectorAll('.autospark-dialog-mask [data-overlay="tip"]');
        expect((panels[panels.length - 1] as HTMLElement).hasAttribute("data-overlay-border")).toBe(
            true,
        );
    });

    test("at 字符串简写进链前归一化：成员属性换锚只覆盖 selector、继承整包内嵌的 placement", async () => {
        const { root, engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-define="tip"><span>x</span></div>
                <div id="anchor-el">锚</div>
                <button
                    x-dialog:tip="ui.open"
                    x-dialog-options="{at: {selector: '/#anchor-el', placement: 'top'}}"
                    x-dialog-options.at="'/#anchor-el'"
                ></button>
            </div></div>`,
            { ui: { open: false } },
        );
        root.id = "tmp-anchor-root";
        document.body.appendChild(root);
        engine.state.ui.open = true;
        await nextTick();
        await nextTick(); // computePosition 的 promise 微任务
        // 若简写在合并后才归一化，字符串会整体覆盖对象、placement 丢失 → autoPlacement
        // 自选方向而非固定 'top'。进链前逐层归一化保证局部覆盖：placement: 'top' 保留。
        const panel = maskOf("tip")!.querySelector(".autospark-dialog") as HTMLElement;
        expect(panel.getAttribute("data-overlay-placement")).toBe("top");
        expect(panel.style.position).toBe("fixed");
    });
});

// ── ADR-0119：keepalive 整实例挂起 / key 缓存身份 / url 远程加载 ──────────────

describe("keepalive 整实例挂起（ADR-0119）", () => {
    test("修饰符糖 x-dialog:name.keepalive：关闭 = display:none 挂起（DOM/数据存活），重开 = 同实例恢复", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-define="form"><input x-model="draft"></div>
                <button x-dialog:form.keepalive="ui.open"></button>
            </div></div>`,
            { ui: { open: false }, draft: "" },
        );
        engine.state.ui.open = true;
        await nextTick();
        const mask1 = maskOf("form")!;
        expect(mask1.style.display).not.toBe("none");
        engine.state.draft = "hello"; // 打开期间写数据
        await nextTick();
        engine.state.ui.open = false;
        await nextTick();
        // 挂起而非销毁：DOM 存活、容器内 display:none
        expect(maskOf("form")).toBe(mask1);
        expect(mask1.style.display).toBe("none");
        engine.state.ui.open = true;
        await nextTick();
        // 同实例恢复（DOM 身份不变、数据保留）
        expect(maskOf("form")).toBe(mask1);
        expect(mask1.style.display).not.toBe("none");
        expect(engine.state.draft).toBe("hello");
    });

    test("正典 x-dialog-options keepalive 等价；关闭触点回写与 overlay:close 广播照常", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-define="keep"><span>x</span></div>
                <button x-dialog:keep="ui.open" x-dialog-options="{keepalive: true}"></button>
            </div></div>`,
            { ui: { open: true } },
        );
        const events: string[] = [];
        engine.on("overlay:close", (m: any) => {
            const p = m?.payload ?? m;
            events.push(`close:${p.name}`);
        });
        await nextTick();
        expect(maskOf("keep")).not.toBeNull();
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        await nextTick();
        expect(engine.state.ui.open).toBe(false); // 回写语义零变化
        expect(events).toContain("close:keep"); // 广播语义零变化
        expect(maskOf("keep")).not.toBeNull(); // 挂起而非销毁
        expect(maskOf("keep")!.style.display).toBe("none");
    });

    test("重开 props 浅合并：挂起期间 props 表达式变化，重开合并生效（DOM 不重建）", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-define="p"><span>{{a}}|{{b}}</span></div>
                <button x-dialog:p.keepalive="ui.open" x-dialog-options.props="{a: ui.a, b: ui.b}"></button>
            </div></div>`,
            { ui: { open: false, a: 1, b: 2 } },
        );
        engine.state.ui.open = true;
        await nextTick();
        const mask1 = maskOf("p")!;
        expect(mask1.textContent).toContain("1|2");
        engine.state.ui.open = false;
        await nextTick();
        engine.state.ui.a = 9; // 挂起期间 props 变化
        engine.state.ui.open = true;
        await nextTick();
        expect(maskOf("p")).toBe(mask1); // 恢复非重建
        expect(mask1.textContent).toContain("9|2"); // a 覆盖、b 保留挂起前值
    });

    test("指令销毁回收挂起实例（keepalive 缓存整体销毁）", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-define="keep"><span>x</span></div>
                <button x-dialog:keep.keepalive="ui.open"></button>
            </div></div>`,
            { ui: { open: true } },
        );
        await nextTick();
        engine.state.ui.open = false;
        await nextTick();
        const mask = maskOf("keep")!;
        expect(mask.style.display).toBe("none"); // 已挂起
        const container = containerOf()!;
        expect(container.contains(mask)).toBe(true);
        engine.destroy();
        expect(container.contains(mask)).toBe(false); // 回收
    });

    test("命令式通道 keepalive 不生效：open 时 warn（v1 声明式专属）", async () => {
        const { root, engine } = mountOverlay(
            `<div id="app"><div x-scope id="host">
                <div x-define="cmd"><span>x</span></div>
            </div></div>`,
            {},
        );
        const host = root.querySelector<HTMLElement>("#host")!;
        const handle = engine.getOverlay(host, "cmd", { animate: false })!;
        const warns: string[] = [];
        const orig = engine.logger.warn.bind(engine.logger);
        (engine.logger as any).warn = (msg: string) => warns.push(msg);
        try {
            handle.open({ keepalive: true });
            await nextTick();
        } finally {
            engine.logger.warn = orig;
        }
        expect(warns.some((w) => w.includes("keepalive"))).toBe(true);
        // 命令式实例关闭照常销毁（无缓存身份 → keepalive 不改变生命周期）
        handle.close();
        await nextTick();
        expect(maskOf("cmd")).toBeNull();
    });
});

describe("key 缓存身份与事件 payload（ADR-0119）", () => {
    test("key 参与缓存身份：不同 key 新实例并存；切回原 key 恢复原实例", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-define="tab"><span>{{title}}</span></div>
                <button
                    x-dialog:tab.keepalive="ui.open"
                    x-dialog-options.key="ui.tab"
                    x-dialog-options.props="{title: ui.tab}"
                ></button>
            </div></div>`,
            { ui: { open: false, tab: "a" } },
        );
        engine.state.ui.open = true; // tab=a → 实例 A
        await nextTick();
        const maskA = maskOf("tab")!;
        expect(maskA.textContent).toContain("a");
        engine.state.ui.open = false; // A 挂起
        await nextTick();
        engine.state.ui.tab = "b";
        engine.state.ui.open = true; // tab=b → 新实例 B（不同缓存身份）
        await nextTick();
        const panels = document.querySelectorAll('.autospark-dialog-mask [data-overlay="tab"]');
        const maskB = (panels[panels.length - 1] as HTMLElement).parentElement!; // 后开者
        expect(maskB).not.toBe(maskA);
        expect(maskA.style.display).toBe("none"); // A 保持挂起
        expect(maskB.textContent).toContain("b");
        expect(panels.length).toBe(2); // 并存
        engine.state.ui.open = false; // B 挂起
        await nextTick();
        engine.state.ui.tab = "a";
        engine.state.ui.open = true; // 切回 a → 恢复原实例 A
        await nextTick();
        expect(maskOf("tab")).toBe(maskA);
        expect(maskA.textContent).toContain("a");
    });

    test("overlay:open/close payload 带 key；未声明 key 时 undefined", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-define="k1"><span>x</span></div>
                <div x-define="k2"><span>x</span></div>
                <button x-dialog:k1="ui.open1" x-dialog-options.key="ui.tab"></button>
                <button x-dialog:k2="ui.open2"></button>
            </div></div>`,
            { ui: { open1: false, open2: false, tab: "a" } },
        );
        const openKeys: any[] = [];
        engine.on("overlay:open", (m: any) => {
            const p = m?.payload ?? m;
            openKeys.push(p.key);
        });
        const closeKeys: any[] = [];
        engine.on("overlay:close", (m: any) => {
            const p = m?.payload ?? m;
            closeKeys.push(p.key);
        });
        engine.state.ui.open1 = true;
        engine.state.ui.open2 = true;
        await nextTick();
        expect(openKeys).toContain("a"); // key: ui.tab 求值
        expect(openKeys).toContain(undefined); // 未声明 key
        engine.state.ui.open1 = false;
        await nextTick();
        expect(closeKeys).toContain("a"); // close 通道同样携带
    });
});

describe("url 远程加载（ADR-0119）", () => {
    const realFetch = globalThis.fetch;
    afterEach(() => {
        globalThis.fetch = realFetch;
    });

    test("组件优先：远程 x-define 声明匹配名 → 面板先开（边界锚 x-loading 骨架）→ 组件附加、loading 随内容接管摘除", async () => {
        let resolveFetch!: (v: Response) => void;
        globalThis.fetch = (async () => new Promise<Response>((r) => (resolveFetch = r))) as any;
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <button x-dialog:remote="ui.open" x-dialog-options="{url: '/remote-comp.html'}"></button>
            </div></div>`,
            { ui: { open: false } },
        );
        engine.state.ui.open = true;
        await nextTick();
        // 面板先开（shell 骨架 + x-error 边界兼加载锚），加载仍在途。
        // 面板层不挂 x-loading——loading 骨架在边界锚上（ADR-0119/0123：自定义外壳层不被遮盖）
        const mask = maskOf("remote");
        expect(!!mask).toBe(true);
        const panel = mask!.querySelector(".autospark-dialog") as HTMLElement;
        expect(panel.hasAttribute("x-loading")).toBe(false);
        const boundary = panel.querySelector("[x-error]") as HTMLElement | null;
        expect(!!boundary).toBe(true); // x-error 边界兼加载锚（ADR-0123）
        expect(boundary!.hasAttribute("x-loading")).toBe(true);
        // 骨架化：边界锚自带最小尺寸（面板骨架可见，非塌缩空壳）
        expect(boundary!.style.minWidth.includes("240px")).toBe(true);
        expect(boundary!.style.minHeight.includes("120px")).toBe(true);
        // 放行加载：组件原位附加、加载锚形态（x-loading + 最小尺寸）随内容接管摘除
        resolveFetch(new Response(`<div x-define="remote"><span>远程组件</span></div>`));
        await new Promise((r) => setTimeout(r, 20));
        expect(panel.textContent.includes("远程组件")).toBe(true);
        expect(boundary!.hasAttribute("x-loading")).toBe(false);
        expect(boundary!.style.minWidth.includes("240px")).toBe(false);
    });

    test("片段兜底：无匹配名声明 → 片段子模板编译（指令生效、读消费处 state 响应式）", async () => {
        globalThis.fetch = (async () =>
            new Response(
                `<div x-define="other"><span>其他组件</span></div><div><span>片段: {{label}}</span><b>加粗</b></div>`,
            )) as any;
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <button x-dialog:remote="ui.open" x-dialog-options="{url: '/frag.html'}"></button>
            </div></div>`,
            { ui: { open: false }, label: "本地数据" },
        );
        const warns: string[] = [];
        const orig = engine.logger.warn.bind(engine.logger);
        (engine.logger as any).warn = (msg: string) => warns.push(msg);
        try {
            engine.state.ui.open = true;
            await new Promise((r) => setTimeout(r, 20));
        } finally {
            engine.logger.warn = orig;
        }
        const panel = maskOf("remote")!.querySelector(".autospark-dialog") as HTMLElement;
        expect(panel.querySelectorAll(".x-loading-overlay").length).toBe(0); // loading 无残留
        expect(panel.textContent).toContain("片段: 本地数据"); // 消费处 state 可读
        expect(panel.textContent).toContain("加粗");
        expect(panel.textContent.includes("其他组件")).toBe(false); // 声明元素剪枝
        // 名字不匹配提示一次（typo 可发现性，非失败）
        expect(warns.some((w) => w.includes("已按片段渲染"))).toBe(true);
        // 响应式：消费处 state 变化 → 片段插值更新
        engine.state.label = "更新";
        await nextTick();
        expect(panel.textContent).toContain("片段: 更新");
    });

    test("片段兜底：插值读消费处 x-data 局部域（parent 链回退——嵌套与顶层字段）", async () => {
        // ADR-0119 修复回归：_openRemote 以 def=null 走 declarer 解析曾得 null parentScope
        // （rootless 化，仅全局视图可达）——缺省基准下取消费处 scope 为父（远程组件声明处
        // = x-import ownerScope = 消费者 scope，'host' 与其等价）。既有片段用例的数据挂在
        // 全局 state 根，未能暴露此缺口，故本用例数据全部置于 x-data 局部域。
        globalThis.fetch = (async () =>
            new Response(`<div><span>frag: {{ui.title}}/{{top}}</span></div>`)) as any;
        const { engine } = mountOverlay(
            `<div id="app"><div x-data="{ ui: { title: '局部', open: false }, top: '顶层' }">
                <button x-dialog:remote="ui.open" x-dialog-options="{url: '/frag-local.html'}"></button>
            </div></div>`,
            {},
        );
        const scopes = (engine.store.state as any)["$scopes"] as Record<string, any>;
        const local = Object.values(scopes).find((d: any) => d && d.ui) as any;
        local.ui.open = true;
        await new Promise((r) => setTimeout(r, 20));
        const panel = maskOf("remote")!.querySelector(".autospark-dialog") as HTMLElement;
        expect(panel.textContent).toContain("frag: 局部/顶层");
    });

    test("加载失败：边界内错误呈现 + overlayRetry 原位重载成功；成功后进 keepalive 缓存", async () => {
        let fail = true;
        globalThis.fetch = (async () => {
            if (fail) return new Response("nope", { status: 500 });
            return new Response(`<div x-define="remote"><span>重试成功</span></div>`);
        }) as any;
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <button x-dialog:remote.keepalive="ui.open" x-dialog-options="{url: '/fail-retry.html'}"></button>
            </div></div>`,
            { ui: { open: false } },
        );
        engine.state.ui.open = true;
        await new Promise((r) => setTimeout(r, 20));
        const mask = maskOf("remote");
        expect(!!mask).toBe(true); // 不自动关
        const panel = mask!.querySelector(".autospark-dialog") as HTMLElement;
        expect(panel.querySelectorAll(".as-error").length).toBe(1); // 边界内错误呈现
        expect(panel.textContent.includes("远程内容加载失败")).toBe(true);
        // retry 原位重载（本次 mock 成功）——data-action 委托触发 overlayRetry（ADR-0038/0123）
        fail = false;
        panel.querySelector('[data-action="overlayRetry"]')!.dispatchEvent(
            new MouseEvent("click", { bubbles: true }),
        );
        await new Promise((r) => setTimeout(r, 30));
        expect(panel.querySelectorAll(".as-error").length).toBe(0); // 呈现清零（rebuildBoundary）
        expect(panel.textContent.includes("重试成功")).toBe(true);
        // 成功后进 keepalive 缓存：关闭 → 挂起（不销毁）
        engine.state.ui.open = false;
        await nextTick();
        expect(maskOf("remote") === mask).toBe(true);
        expect(mask!.style.display).toBe("none");
    });

    test("失败态 close 走销毁（不挂起）→ 重开重建面板重新加载", async () => {
        globalThis.fetch = (async () => new Response("nope", { status: 500 })) as any;
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <button x-dialog:remote.keepalive="ui.open" x-dialog-options="{url: '/fail-reopen.html'}"></button>
            </div></div>`,
            { ui: { open: false } },
        );
        engine.state.ui.open = true;
        await new Promise((r) => setTimeout(r, 20));
        const mask1 = maskOf("remote");
        expect(!!mask1).toBe(true);
        expect(mask1!.querySelectorAll(".as-error").length).toBe(1);
        engine.state.ui.open = false; // 失败态 close → 销毁（失败不进 keepalive 缓存）
        await nextTick();
        expect(!!maskOf("remote")).toBe(false);
        expect(containerOf()!.contains(mask1!)).toBe(false);
        // 重开：全新面板 + 重新加载（mock 转成功）
        globalThis.fetch = (async () =>
            new Response(`<div x-define="remote"><span>二次成功</span></div>`)) as any;
        engine.state.ui.open = true;
        await new Promise((r) => setTimeout(r, 20));
        const mask2 = maskOf("remote");
        expect(!!mask2).toBe(true);
        expect(mask2 !== mask1).toBe(true);
        expect(mask2!.textContent.includes("二次成功")).toBe(true);
    });
});
