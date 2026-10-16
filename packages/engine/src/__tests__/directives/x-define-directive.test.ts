import { describe, expect, test, afterEach } from "bun:test";
import "../setup";
import { AutoSpark } from "../../engine/engine";
import { mount, nextTick } from "../helpers";
import {
    installAutoComponentDirective,
    isAutoComponentClass,
} from "../../features/component/auto-component";

/**
 * x-define-options.directive 元素名组件测试（ADR-0117）。
 *
 * 覆盖：directive: true 自动标签 / 自定义标签 / 静态+表达式 props（类型推断、保留属性、
 * 同名覆盖）/ @event + emit / options 通道优先级 / 缺省关闭 / 非法值 warn /
 * installAutoComponentDirective 撞名规则（幂等 / 撞预设跳过 / 元素名占用 / 换 tag 覆盖）/
 * registerComponent 运行时注册路径 / 继承透传（声明为准）。
 */

/** 挂载并拦截 logger.warn（编译期同步 warn 也可靠捕获） */
function mountCaptureWarn(html: string, state: any, options?: any) {
    const root = document.createElement("div");
    root.innerHTML = html.trim();
    const engine = new AutoSpark(root, state, { autostart: false, ...options });
    const warns: string[] = [];
    (engine.logger as any).warn = (msg: any) => warns.push(String(msg));
    engine.compile();
    return { root, engine, warns };
}

const engines: any[] = [];
const mountD = (html: string, state: any, options?: any) => {
    const m = mountCaptureWarn(html, state, options);
    engines.push(m.engine);
    return m;
};

afterEach(() => {
    while (engines.length) engines.pop()?.destroy();
});

describe("x-define-options.directive 元素名组件（ADR-0117）", () => {
    test("directive: true：自动注册 x-{组件名} 标签，宿主化身组件根", async () => {
        const { root, engine } = mountD(
            `<div x-scope>
                <div x-define="counter" x-define-options="{directive: true}">
                    <span x-text="count"></span>
                    <script setup>{ data: { count: 5 } }</script>
                </div>
                <x-counter id="h"></x-counter>
            </div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#h") as HTMLElement;
        expect(host.tagName.toLowerCase()).toBe("x-counter");
        expect(host.textContent).toInclude("5"); // 组件内容渲染进宿主
        const inst = engine.getComponent(host);
        expect(inst?.name).toBe("counter");
        expect(inst?.el).toBe(host); // 宿主化身组件根
        expect(inst?.scope.isComponent).toBe(true);
    });

    test("directive: 自定义标签（含连字符字符串）", async () => {
        const { root, engine } = mountD(
            `<div x-scope>
                <div x-define="counter" x-define-options="{directive: 'my-counter'}">
                    <span x-text="count"></span>
                    <script setup>{ data: { count: 7 } }</script>
                </div>
                <my-counter id="h"></my-counter>
            </div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#h") as HTMLElement;
        expect(host.tagName.toLowerCase()).toBe("my-counter");
        expect(engine.getComponent(host)?.name).toBe("counter");
        expect(host.textContent).toInclude("7");
    });

    test("静态 props 类型推断 + 表达式 props 响应式 + 保留属性不折叠", async () => {
        const { root, engine } = mountD(
            `<div x-scope>
                <div x-define="counter" x-define-options="{directive: true}">
                    <span id="v" x-text="count"></span>
                    <button id="b" @click="inc()">+1</button>
                    <script setup>{ data: { count: 0 }, methods: { inc() { this.data.count += this.props.step ?? 1 } } }</script>
                </div>
                <x-counter id="h" count="100" :step="step" :data-info="step"></x-counter>
            </div>`,
            { step: 5 },
        );
        await nextTick();
        const host = root.querySelector("#h") as HTMLElement;
        // 折叠属性从宿主移除（静态与 :expr 均不留结果 DOM 残留）
        expect(host.hasAttribute("count")).toBe(false);
        expect(host.hasAttribute(":step")).toBe(false);
        const inst = engine.getComponent(host)!;
        expect(inst.props.count).toBe(100); // 静态推断 number
        expect(inst.props.step).toBe(5); // 表达式求值
        expect(inst.props.dataInfo).toBeUndefined(); // 保留属性不折叠
        expect(host.getAttribute("data-info")).toBe("5"); // 留走 bind 属性绑定
        // 交互：props 参与组件逻辑
        (host.querySelector("#b") as HTMLElement).click();
        await nextTick();
        expect(root.querySelector("#v")!.textContent).toBe("105");
        // 表达式 props 响应式：外层 step 变化 → props 更新（声明键覆盖，count 回 100）→ 新步长生效
        engine.state.step = 10;
        await nextTick();
        expect(inst.props.step).toBe(10);
        (host.querySelector("#b") as HTMLElement).click();
        await nextTick();
        expect(root.querySelector("#v")!.textContent).toBe("110");
    });

    test("同名键：:expr 覆盖静态属性（ADR-0117 优先级）", async () => {
        const { root, engine } = mountD(
            `<div x-scope>
                <div x-define="counter" x-define-options="{directive: true}">
                    <span x-text="count"></span>
                    <script setup>{ data: { count: 0 } }</script>
                </div>
                <x-counter id="h" count="1" :count="n"></x-counter>
            </div>`,
            { n: 9 },
        );
        await nextTick();
        const inst = engine.getComponent(root.querySelector("#h") as HTMLElement)!;
        expect(inst.props.count).toBe(9);
        expect(root.querySelector("#h")!.textContent).toInclude("9");
    });

    test("@event 监听组件 emit（CustomEvent detail 透传）", async () => {
        const { root, engine } = mountD(
            `<div x-scope>
                <div x-define="counter" x-define-options="{directive: true}">
                    <button id="b" @click="inc()">+1</button>
                    <script setup>{ data: { count: 0 }, methods: { inc() { this.data.count += 1; this.emit('bump', { count: this.data.count }) } } }</script>
                </div>
                <x-counter id="h" @bump="bumped.push($event.detail.count)"></x-counter>
            </div>`,
            { bumped: [] },
        );
        await nextTick();
        const host = root.querySelector("#h") as HTMLElement;
        const btn = host.querySelector("#b") as HTMLElement;
        btn.click();
        await nextTick();
        expect(engine.state.bumped).toEqual([1]);
        btn.click();
        await nextTick();
        expect(engine.state.bumped).toEqual([1, 2]);
    });

    test("x-{名}-options props 兜底：静态属性折叠（值通道）覆盖 options 通道", async () => {
        const { root, engine } = mountD(
            `<div x-scope>
                <div x-define="counter" x-define-options="{directive: true}">
                    <span x-text="count"></span>
                    <script setup>{ data: { count: 0 } }</script>
                </div>
                <x-counter id="h" count="1" x-counter-options='{props: {count: 55}}'></x-counter>
            </div>`,
            {},
        );
        await nextTick();
        const inst = engine.getComponent(root.querySelector("#h") as HTMLElement)!;
        expect(inst.props.count).toBe(1); // 值通道（折叠产物）胜出
        expect(root.querySelector("#h")!.textContent).toInclude("1");
    });

    test("directive: false / 未声明：不注册，元素保持素标签", async () => {
        const { root, engine } = mountD(
            `<div x-scope>
                <div x-define="counter"></div>
                <div x-define="off" x-define-options="{directive: false}"></div>
                <x-counter id="h"></x-counter>
            </div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#h") as HTMLElement;
        expect(host.childNodes.length).toBe(0); // 未实例化
        expect(engine.getComponent(host)).toBeUndefined();
        expect(engine.directives.findByElementName("x-counter")).toBeUndefined();
    });

    test("directive 非法值（无连字符字符串）：warn + 忽略", () => {
        const { root, engine, warns } = mountD(
            `<div x-scope>
                <div x-define="counter" x-define-options="{directive: 'nolink'}"></div>
                <x-counter id="h"></x-counter>
            </div>`,
            {},
        );
        expect(engine.directives.findByElementName("x-counter")).toBeUndefined();
        expect(root.querySelector("#h")!.childNodes.length).toBe(0);
        expect(warns.some((w) => w.includes("x-define-options.directive"))).toBe(true);
    });

    test("installAutoComponentDirective：幂等 / 撞预设跳过 / 元素名占用 / 换 tag 覆盖", () => {
        const engine = new AutoSpark(document.createElement("div"), {}, { autostart: false });
        engines.push(engine);
        const warns: string[] = [];
        (engine.logger as any).warn = (m: any) => warns.push(String(m));

        // 幂等：同名同 tag 静默
        installAutoComponentDirective(engine, "a", "x-elm-a");
        const first = engine.directives.get("a");
        installAutoComponentDirective(engine, "a", "x-elm-a");
        expect(engine.directives.get("a")).toBe(first);

        // 撞预设指令名：warn + 跳过（预设原类保留）
        installAutoComponentDirective(engine, "for", "x-elm-for");
        expect(warns.some((w) => w.includes("预设") && w.includes('"for"'))).toBe(true);
        expect(isAutoComponentClass(engine.directives.get("for")!)).toBe(false);

        // 元素名被其他指令占用：warn + 跳过
        installAutoComponentDirective(engine, "b", "x-elm-a");
        expect(warns.some((w) => w.includes("已被指令"))).toBe(true);
        expect(engine.directives.get("b")).toBeUndefined();

        // 同注册名 + tag 变化：warn + 覆盖
        installAutoComponentDirective(engine, "a", "x-elm-a2");
        expect(warns.some((w) => w.includes("重声明元素名"))).toBe(true);
        expect(engine.directives.get("a")!.elementName).toBe("x-elm-a2");
    });

    test("registerComponent 运行时注册路径：元素名即时生效", async () => {
        const root = document.createElement("div");
        root.innerHTML = `<div x-scope><x-rc id="h"></x-rc></div>`;
        const engine = new AutoSpark(root, {}, { autostart: false });
        engines.push(engine);
        engine.registerComponent(
            `<div x-define="rc" x-define-options="{directive: true}"><b>RC内容</b></div>`,
            { name: "rc" },
        );
        expect(engine.directives.findByElementName("x-rc")).toBe("rc");
        engine.compile();
        await nextTick();
        const host = root.querySelector("#h") as HTMLElement;
        expect(engine.getComponent(host)?.name).toBe("rc");
        expect(host.textContent).toInclude("RC内容");
    });

    test("继承解析：directiveTag 以子声明为准透传（父未声明不扩散）", async () => {
        const { root, engine } = mountD(
            `<div x-scope>
                <div x-define="base"><span x-text="n"></span></div>
                <div x-define="leaf" x-define:inherit="base" x-define-options="{directive: true}">
                    <b>LEAF</b>
                </div>
                <x-leaf id="h"></x-leaf>
                <x-base id="hb"></x-base>
            </div>`,
            { n: 3 },
        );
        await nextTick();
        const host = root.querySelector("#h") as HTMLElement;
        expect(engine.getComponent(host)?.name).toBe("leaf");
        // 子无插槽覆盖：渲染继承自父的模板（span x-text="n" → 3），证明实例化走继承 def
        expect(host.textContent).toInclude("3");
        // 父未声明：不默认扩散元素名注册
        expect(engine.directives.findByElementName("x-base")).toBeUndefined();
        expect(root.querySelector("#hb")!.childNodes.length).toBe(0);
    });
});
