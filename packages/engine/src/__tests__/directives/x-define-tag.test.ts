import { describe, expect, test, afterEach } from "bun:test";
import "../setup";
import { AutoSpark } from "../../engine/engine";
import { mount, nextTick } from "../helpers";
import {
    installAutoComponentTag,
    isAutoComponentClass,
} from "../../features/component/auto-component";

/**
 * x-define-options.tag 元素名组件测试（ADR-0117，缺省开启；推导与撞名规则 ADR-0133 修订）。
 *
 * 覆盖：缺省自动标签 / tag: true 显式同义 / 自定义标签 / tag: false 显式关闭 /
 * 静态+表达式 props（类型推断、保留属性、同名覆盖）/ @event + emit / options 通道优先级 /
 * tag 值域（无连字符补 x- 前缀 / 无效字符 warn 回落） / installAutoComponentTag 撞名规则
 * （幂等 / 撞指令名 warn 跳过 / 组件撞标签合并候选就近遮蔽 / 标签撞指令元素名 error /
 * 换 tag 覆盖）/ registerComponent 运行时注册路径 / 继承透传（声明为准）。
 *
 * ADR-0133 专组：标签归一化（点号 / camelCase / 下划线折叠、同名异写归一） /
 * autospark. 前缀剥离 / 第三方命名空间完整转换 / 跨 scope 就近遮蔽 / 同 scope 后声明胜 /
 * 组件名撞指令名（组件可用标签不装） / 标签撞指令元素名 fail-fast /
 * 懒预编译时序缺口反查 / 反查 miss warn 一次。
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

describe("x-define-options.tag 元素名组件（ADR-0117）", () => {
    test("tag: true：自动注册 x-{组件名} 标签，宿主化身组件根", async () => {
        const { root, engine } = mountD(
            `<div x-scope>
                <div x-define="counter" x-define-options="{tag: true}">
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

    test("tag: 自定义标签（含连字符字符串）", async () => {
        const { root, engine } = mountD(
            `<div x-scope>
                <div x-define="counter" x-define-options="{tag: 'my-counter'}">
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
                <div x-define="counter" x-define-options="{tag: true}">
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
                <div x-define="counter" x-define-options="{tag: true}">
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
                <div x-define="counter" x-define-options="{tag: true}">
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
                <div x-define="counter" x-define-options="{tag: true}">
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

    test("缺省开启：未声明 tag 即自动注册 x-{组件名} 标签", async () => {
        const { root, engine } = mountD(
            `<div x-scope>
                <div x-define="counter">
                    <span x-text="count"></span>
                    <script setup>{ data: { count: 3 } }</script>
                </div>
                <x-counter id="h"></x-counter>
            </div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#h") as HTMLElement;
        expect(engine.directives.findByElementName("x-counter")).toBe("counter");
        expect(engine.getComponent(host)?.name).toBe("counter");
        expect(host.textContent).toInclude("3");
    });

    test("tag: false：显式关闭，元素保持素标签", async () => {
        const { root, engine } = mountD(
            `<div x-scope>
                <div x-define="off" x-define-options="{tag: false}"></div>
                <x-off id="h"></x-off>
            </div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#h") as HTMLElement;
        expect(host.childNodes.length).toBe(0); // 未实例化
        expect(engine.getComponent(host)).toBeUndefined();
        expect(engine.directives.findByElementName("x-off")).toBeUndefined();
    });

    test("tag 无连字符字符串：自动补 x- 前缀（ADR-0133，tag:'nolink' → <x-nolink>）", async () => {
        const { root, engine, warns } = mountD(
            `<div x-scope>
                <div x-define="nolink" x-define-options="{tag: 'nolink'}"><b>N</b></div>
                <x-nolink id="h"></x-nolink>
            </div>`,
            {},
        );
        await nextTick();
        // 无连字符不 warn 不回落：补前缀注册生效
        expect(warns.some((w) => w.includes("x-define-options.tag"))).toBe(false);
        expect(engine.directives.findByElementName("x-nolink")).toBe("nolink");
        expect(root.querySelector("#h")!.textContent).toInclude("N");
    });

    test("tag 无效字符（空格）：warn + 回落缺省推导", async () => {
        const { root, warns } = mountD(
            `<div x-scope>
                <div x-define="counter" x-define-options="{tag: 'my widget'}">
                    <span x-text="count"></span>
                    <script setup>{ data: { count: 4 } }</script>
                </div>
                <x-counter id="h"></x-counter>
            </div>`,
            {},
        );
        await nextTick();
        expect(warns.some((w) => w.includes("x-define-options.tag"))).toBe(true);
        // 无效值被忽略，按缺省推导处理：自动标签照常注册实例化
        expect(root.querySelector("#h")!.textContent).toInclude("4");
    });

    test("installAutoComponentTag（ADR-0133）：幂等 / 撞预设 error / 组件撞标签合并候选 / 换 tag 覆盖", () => {
        const engine = new AutoSpark(document.createElement("div"), {}, { autostart: false });
        engines.push(engine);
        const warns: string[] = [];
        (engine.logger as any).warn = (m: any) => warns.push(String(m));
        const mkDef = (name: string, tag: string) => ({ name, tag, declarerScope: null }) as any;

        // 幂等：同名同 tag 静默
        installAutoComponentTag(engine, mkDef("a", "x-elm-a"));
        const first = engine.directives.get("a");
        installAutoComponentTag(engine, mkDef("a", "x-elm-a"));
        expect(engine.directives.get("a")).toBe(first);

        // 撞预设指令名（注册键让位）：warn + 跳过标签安装（组件本身可用，ADR-0113/0133 收窄语义）
        installAutoComponentTag(engine, mkDef("for", "x-elm-for"));
        expect(warns.some((w) => w.includes("预设") && w.includes('"for"'))).toBe(true);
        expect(isAutoComponentClass(engine.directives.get("for")!)).toBe(false);

        // 标签撞非组件指令的元素名（如预设元素名指令 x-super）：CompileError fail-fast
        expect(() => installAutoComponentTag(engine, mkDef("c", "x-super"))).toThrow(
            /已被指令.*占用/,
        );

        // 不同组件撞同标签：并入候选（就近遮蔽，ADR-0133）——不跳过、两个注册名都指合并类
        installAutoComponentTag(engine, mkDef("b", "x-elm-a"));
        expect(engine.directives.get("b")).toBe(engine.directives.get("a"));
        expect((engine.directives.get("a") as any).autoComponentCandidates.length).toBe(2);

        // 同注册名 + tag 变化：warn + 覆盖（候选摘除，旧标签只剩 b）
        installAutoComponentTag(engine, mkDef("a", "x-elm-a2"));
        expect(warns.some((w) => w.includes("重声明元素名"))).toBe(true);
        expect(engine.directives.get("a")!.elementName).toBe("x-elm-a2");
        expect(engine.directives.findByElementName("x-elm-a")).toBe("b");
        const left = engine.directives.get("b") as any;
        expect(left.autoComponentCandidates.map((c: any) => c.name)).toEqual(["b"]);
    });

    test("registerComponent 运行时注册路径：元素名即时生效", async () => {
        const root = document.createElement("div");
        root.innerHTML = `<div x-scope><x-rc id="h"></x-rc></div>`;
        const engine = new AutoSpark(root, {}, { autostart: false });
        engines.push(engine);
        engine.registerComponent(
            `<div x-define="rc" x-define-options="{tag: true}"><b>RC内容</b></div>`,
            { name: "rc" },
        );
        expect(engine.directives.findByElementName("x-rc")).toBe("rc");
        engine.compile();
        await nextTick();
        const host = root.querySelector("#h") as HTMLElement;
        expect(engine.getComponent(host)?.name).toBe("rc");
        expect(host.textContent).toInclude("RC内容");
    });

    test("继承解析：tag 以子声明为准（父自定义标签不扩散，子缺省注册自动标签）", async () => {
        const { root, engine } = mountD(
            `<div x-scope>
                <div x-define="base" x-define-options="{tag: 'my-base'}"><span x-text="n"></span></div>
                <div x-define="leaf" x-define:inherit="base">
                    <b>LEAF</b>
                </div>
                <x-leaf id="h"></x-leaf>
                <my-leaf id="hm"></my-leaf>
                <my-base id="hb"></my-base>
            </div>`,
            { n: 3 },
        );
        await nextTick();
        const host = root.querySelector("#h") as HTMLElement;
        // 子缺省注册自身自动标签 x-leaf（不继承父的自定义标签 my-base）
        expect(engine.getComponent(host)?.name).toBe("leaf");
        // 子无插槽覆盖：渲染继承自父的模板（span x-text="n" → 3），证明实例化走继承 def
        expect(host.textContent).toInclude("3");
        // 父的自定义标签不扩散：my-leaf 未注册，保持素标签
        expect(engine.directives.findByElementName("my-leaf")).toBeUndefined();
        expect(root.querySelector("#hm")!.childNodes.length).toBe(0);
        // 父的自定义标签自身可用
        expect(root.querySelector("#hb")!.textContent).toInclude("3");
    });
});

describe("标签归一化与撞名就近遮蔽（ADR-0133）", () => {
    test("点号组件名归一化：order.counter → <x-order-counter>", async () => {
        const { root, engine } = mountD(
            `<div x-scope>
                <div x-define="order.counter"><b>ORDER-dot</b></div>
                <x-order-counter id="h"></x-order-counter>
            </div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#h") as HTMLElement;
        expect(engine.getComponent(host)?.name).toBe("order.counter");
        expect(host.textContent).toInclude("ORDER-dot");
    });

    test("camelCase 组件名归一化：orderCounter → <x-order-counter>（同名异写同标签）", async () => {
        const { root, engine } = mountD(
            `<div x-scope>
                <div x-define="orderCounter"><b>ORDER-camel</b></div>
                <x-order-counter id="h"></x-order-counter>
            </div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#h") as HTMLElement;
        expect(engine.getComponent(host)?.name).toBe("orderCounter");
        expect(host.textContent).toInclude("ORDER-camel");
    });

    test("连续无效字符折叠：order_counter → <x-order-counter>", async () => {
        const { root } = mountD(
            `<div x-scope>
                <div x-define="order_counter"><b>US</b></div>
                <x-order-counter id="h"></x-order-counter>
            </div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector("#h")!.textContent).toInclude("US");
    });

    test("autospark. 前缀剥离：autospark.counter → <x-counter>（官方通道）", async () => {
        const { root, engine } = mountD(
            `<div x-scope>
                <div x-define="autospark.counter"><b>OFFICIAL</b></div>
                <x-counter id="h"></x-counter>
            </div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#h") as HTMLElement;
        expect(engine.getComponent(host)?.name).toBe("autospark.counter");
        expect(host.textContent).toInclude("OFFICIAL");
    });

    test("第三方命名空间不剥离：mylib.counter → <x-mylib-counter>", async () => {
        const { root } = mountD(
            `<div x-scope>
                <div x-define="mylib.counter"><b>THIRD</b></div>
                <x-mylib-counter id="h"></x-mylib-counter>
            </div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector("#h")!.textContent).toInclude("THIRD");
    });

    test("跨 scope 就近遮蔽：内层 counter 胜外层 autospark.counter，互不影响", async () => {
        const { root, engine } = mountD(
            `<div x-scope>
                <div x-define="autospark.counter"><b>OUTER</b></div>
                <x-counter id="out"></x-counter>
                <div x-scope>
                    <div x-define="counter"><b>INNER</b></div>
                    <x-counter id="in"></x-counter>
                </div>
            </div>`,
            {},
        );
        await nextTick();
        // 外层使用处：解析到外层 autospark.counter
        expect(engine.getComponent(root.querySelector("#out") as HTMLElement)?.name).toBe(
            "autospark.counter",
        );
        expect(root.querySelector("#out")!.textContent).toInclude("OUTER");
        // 内层使用处：就近命中内层 counter（官方短标签被局部定义覆盖）
        expect(engine.getComponent(root.querySelector("#in") as HTMLElement)?.name).toBe("counter");
        expect(root.querySelector("#in")!.textContent).toInclude("INNER");
    });

    test("同 scope 撞名（就近失灵）：后声明胜 + warn", async () => {
        const { root, warns } = mountD(
            `<div x-scope>
                <div x-define="order.counter"><b>FIRST</b></div>
                <div x-define="orderCounter"><b>SECOND</b></div>
                <x-order-counter id="h"></x-order-counter>
            </div>`,
            {},
        );
        await nextTick();
        expect(warns.some((w) => w.includes("就近遮蔽失灵"))).toBe(true);
        expect(root.querySelector("#h")!.textContent).toInclude("SECOND");
    });

    test("组件名撞预设指令名：warn + 标签不注册，组件本身可用（x-component: 照常）", async () => {
        const { root, engine, warns } = mountD(
            `<div x-scope>
                <div x-define="text"><b id="t" x-text="1+1"></b></div>
                <div x-component:text id="h"></div>
                <x-text id="xt"></x-text>
            </div>`,
            {},
        );
        await nextTick();
        // 注册键让位：标签装不上（<x-text> 保持素标签），warn 给线索
        expect(warns.some((w) => w.includes("撞已注册预设指令名"))).toBe(true);
        expect(root.querySelector("#xt")!.textContent).toBe("");
        // 组件本身照常实例化
        expect(engine.getComponent(root.querySelector("#h") as HTMLElement)?.name).toBe("text");
        expect(root.querySelector("#h")!.querySelector("#t")!.textContent).toBe("2");
    });

    test("标签撞非组件指令的元素名：编译期 CompileError（fail-fast，ADR-0133）", () => {
        const engine = new AutoSpark(
            (() => {
                const root = document.createElement("div");
                root.innerHTML = `<div x-scope><div x-define="mine" x-define-options="{tag: 'x-super'}"><b>M</b></div></div>`;
                return root;
            })(),
            {},
            { autostart: false },
        );
        engines.push(engine);
        expect(() => engine.compile()).toThrow(/已被指令.*占用/);
    });

    test("懒预编译时序缺口修复：纯 <x-*> 标签首消费触发全局表反查（ADR-0133）", async () => {
        const { root, engine } = mountD(
            `<div x-scope><x-greet id="h" who="W"></x-greet></div>`,
            {},
            {
                components: {
                    "autospark.greet": `<div x-define="autospark.greet">HELLO <b x-text="props.who"></b></div>`,
                },
            },
        );
        await nextTick();
        const host = root.querySelector("#h") as HTMLElement;
        expect(engine.getComponent(host)?.name).toBe("autospark.greet");
        expect(host.textContent).toInclude("HELLO");
        // 静态属性照常折叠为 props（类型推断）
        expect(engine.getComponent(host)?.props.who).toBe("W");
    });

    test("反查 miss：未知 x-* 标签 warn 一次 + 按普通元素处理", async () => {
        const { root, engine, warns } = mountD(
            `<div x-scope>
                <x-typo id="h"></x-typo>
                <x-typo id="h2"></x-typo>
            </div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#h") as HTMLElement;
        expect(host.tagName.toLowerCase()).toBe("x-typo"); // 原样保留
        expect(engine.getComponent(host)).toBeUndefined();
        expect(warns.filter((w) => w.includes("不是已注册组件")).length).toBe(1); // 每标签一次
    });
});
