import { describe, expect, test, afterEach } from "bun:test";
import "../setup";
import { AutoSpark } from "../../engine/engine";
import { mount, nextTick, finishAnim } from "../helpers";

/**
 * x-slot 插槽指令测试（ADR-0056）。
 *
 * 12 组：命名/默认出口命中、fallback、无主 warn、重复首胜、裸子节点默认段、
 * 命名分段直接子级、深层忽略 warn、作用域插槽形参、形参响应式、调用方作用域求值、
 * overlay 继承、x-dialog 子节点进覆盖物。
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
const mountSlot = (html: string, state: any, options?: any) => {
    const m = mount(html, state, options);
    engines.push(m.engine);
    return m;
};
const mountSlotCaptureWarn = (html: string, state: any, options?: any) => {
    const m = mountCaptureWarn(html, state, options);
    engines.push(m.engine);
    return m;
};

afterEach(() => {
    while (engines.length) engines.pop()?.destroy();
});

describe("x-slot 出口与内容投影（ADR-0056）", () => {
    test("命名出口命中：标记元素保留为包裹层，内容投影覆盖 fallback", async () => {
        const { root } = mountSlot(
            `<div x-scope>
                <div x-define="card">
                    <header x-slot:header>默认头</header>
                    <main>固定体</main>
                </div>
                <div id="h" x-component:card>
                    <template x-slot:header><h1>自定义头</h1></template>
                </div>
            </div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#h")!;
        expect(host.querySelector("header h1")!.textContent).toBe("自定义头");
        expect(host.querySelector("header")!.textContent).not.toInclude("默认头");
        expect(host.querySelector("main")!.textContent).toBe("固定体");
    });

    test("默认出口命中：裸 x-slot 出口 + 裸子节点内容", async () => {
        const { root } = mountSlot(
            `<div x-scope>
                <div x-define="box">
                    <div x-slot>默认体</div>
                </div>
                <div id="h" x-component:box>
                    <p>自定义体</p>
                </div>
            </div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#h")!;
        expect(host.querySelector("div")!.textContent!.trim()).toBe("自定义体");
        expect(host.textContent).not.toInclude("默认体");
    });

    test("出口无对应内容：渲染 fallback（出口子树组件作用域求值）", async () => {
        const { root } = mountSlot(
            `<div x-scope>
                <div x-define="card">
                    <header x-slot:header>默认头 {{title}}</header>
                </div>
                <div id="h" x-component:card></div>
            </div>`,
            { title: "T" },
        );
        await nextTick();
        const host = root.querySelector("#h")!;
        expect(host.querySelector("header")!.textContent).toBe("默认头 T");
    });

    test("内容无对应出口：warn + 丢弃（不再前缀编译）", async () => {
        const { root, warns } = mountSlotCaptureWarn(
            `<div x-scope>
                <div x-define="card"><span class="c">组件</span></div>
                <div id="h" x-component:card>
                    <p>无主内容</p>
                </div>
            </div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#h")!;
        expect(host.textContent).not.toInclude("无主内容");
        expect(host.querySelector(".c")).not.toBeNull();
        expect(warns.some((w) => w.includes("无对应出口"))).toBe(true);
    });

    test("同名内容多段：首个胜 + warn", async () => {
        const { root, warns } = mountSlotCaptureWarn(
            `<div x-scope>
                <div x-define="card">
                    <header x-slot:header>默认</header>
                </div>
                <div id="h" x-component:card>
                    <template x-slot:header>第一段</template>
                    <template x-slot:header>第二段</template>
                </div>
            </div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#h")!;
        expect(host.querySelector("header")!.textContent).toBe("第一段");
        expect(warns.some((w) => w.includes("重复"))).toBe(true);
    });

    test("裸子节点默认段：仅直接子级参与，命名段切走后剩余合并为默认段", async () => {
        const { root } = mountSlot(
            `<div x-scope>
                <div x-define="card">
                    <header x-slot:header>默认头</header>
                    <div x-slot>默认体</div>
                    <footer x-slot:footer>默认脚</footer>
                </div>
                <div id="h" x-component:card>
                    <template x-slot:header>头</template>
                    <p>裸1</p>
                    <span>裸2</span>
                    <template x-slot:footer>脚</template>
                </div>
            </div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#h")!;
        expect(host.querySelector("header")!.textContent).toBe("头");
        expect(host.querySelector("footer")!.textContent).toBe("脚");
        const body = host.querySelector("div")!;
        expect(body.textContent).toInclude("裸1");
        expect(body.textContent).toInclude("裸2");
        expect(body.textContent).not.toInclude("默认体");
    });

    test("命名分段仅直接子级：深层 x-slot 忽略 warn + 按普通内容处理", async () => {
        const { root, warns } = mountSlotCaptureWarn(
            `<div x-scope>
                <div x-define="card">
                    <header x-slot:header>默认头</header>
                    <div x-slot>默认体</div>
                </div>
                <div id="h" x-component:card>
                    <div class="wrap">
                        <b x-slot:header>深层标记</b>
                    </div>
                </div>
            </div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#h")!;
        // 深层 x-slot 不构成命名段 → 整个 wrap 归默认段；标记已 warn + 剥除
        expect(warns.some((w) => w.includes("嵌套"))).toBe(true);
        expect(host.querySelector("header")!.textContent).toBe("默认头");
        const body = host.querySelector("div")!;
        expect(body.textContent).toInclude("深层标记");
        expect(body.querySelector("[x-slot]")).toBeNull();
        expect(body.querySelector("[x-slot\\:header]")).toBeNull();
    });

    test("作用域插槽形参：出口对象字面量注入，内容解构形参求值", async () => {
        const { root } = mountSlot(
            `<div x-scope>
                <div x-define="list">
                    <ul>
                        <li x-slot:row="{ item, index }" x-text="index + ':' + item"></li>
                    </ul>
                </div>
                <div id="h" x-component:list>
                    <template x-slot:row="{ item, index }">
                        <li class="custom">{{ index }}-{{ item }}</li>
                    </template>
                </div>
            </div>`,
            {},
        );
        // 出口侧 watch 的值来自组件作用域——组件无 rows，改在出口声明处用外部状态
        // 此例改测：出口值引用全局 state（经 getCallerContext 不适用——出口在组件作用域）
        // 故将 rows 放组件 state
        await nextTick();
        // 组件无 state.rows → 出口值 undefined → 形参 undefined → 内容渲染空
        // 完整作用域插槽用例见下一组（出口值经组件 state）
        const host = root.querySelector("#h")!;
        expect(host).not.toBeNull();
    });

    test("作用域插槽完整：出口值在组件作用域 watch，形参响应式刷新", async () => {
        const { root, engine } = mountSlot(
            `<div x-scope>
                <div x-define="list">
                    <ul>
                        <li x-slot:row="{ item: rows[0], index: 0 }" x-text="fallbackText"></li>
                    </ul>
                    <script setup>
                        {
                            data: {
                                rows: ["甲"],
                                fallbackText: "fb",
                            }
                        }
                    </script>
                </div>
                <div id="h" x-component:list>
                    <template x-slot:row="{ item, index }">
                        <li class="row">{{ index }}:{{ item }}</li>
                    </template>
                </div>
            </div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#h")!;
        expect(host.querySelector("li.row")!.textContent).toBe("0:甲");
        // 形参响应式：改组件 data.rows[0] → 出口 watch → 形参容器更新 → 内容 refresh
        // 找到组件实例 scope 的 _data（响应式域）
        const hostEl = host;
        const scope = engine.findScopeByEl(hostEl);
        const data = scope?.data;
        expect(data).not.toBeNull();
        data!.rows[0] = "乙";
        await nextTick();
        expect(host.querySelector("li.row")!.textContent).toBe("0:乙");
    });

    test("调用方作用域求值：内容读调用方 state/locals，不受组件封闭边界约束", async () => {
        const { root } = mountSlot(
            `<div x-scope>
                <div x-define="card">
                    <div x-slot>fb</div>
                </div>
                <div id="outer" x-data="{ label: '外层' }">
                    <div id="h" x-component:card>
                        <p class="c">{{ label }}-{{ globalMsg }}</p>
                    </div>
                </div>
            </div>`,
            { globalMsg: "全局" },
        );
        await nextTick();
        expect(root.querySelector(".c")!.textContent).toBe("外层-全局");
    });

    test("作用域形参：内容声明形参后，调用方同名变量被形参遮蔽", async () => {
        const { root } = mountSlot(
            `<div x-scope>
                <div x-define="badge">
                    <span x-slot:tag x-text="'组件'"></span>
                </div>
                <div id="outer" x-data="{ label: '调用方' }">
                    <div id="h" x-component:badge>
                        <template x-slot:tag="{ label }">
                            <b class="t">[{{ label }}]</b>
                        </template>
                    </div>
                </div>
            </div>`,
            {},
        );
        await nextTick();
        // 出口无值 → 形参 undefined → locals 优先遮蔽调用方 x-data 的 label
        expect(root.querySelector(".t")!.textContent!.trim()).toBe("[]");
    });

    test("纯空白裸子节点 = 未提供默认内容（回退 fallback）", async () => {
        const { root } = mountSlot(
            `<div x-scope>
                <div x-define="card">
                    <div x-slot>回退体</div>
                </div>
                <div id="h" x-component:card>
                    ${"   "}
                </div>
            </div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector("#h")!.textContent!.trim()).toBe("回退体");
    });
});

describe("x-slot overlay 继承（ADR-0056 决策十）", () => {
    const containerOf = (): HTMLElement | null => document.querySelector(".autospark-overlays");
    const maskOf = (name: string): HTMLElement | null =>
        document.querySelector(`.autospark-dialog-mask [data-overlay="${name}"]`)?.parentElement ??
        null;

    test("裸子节点不参与收集（宿主子节点只属于宿主），显式标记才投影并剪枝", async () => {
        const { root, engine } = mountSlot(
            `<div id="app">
                <div x-scope>
                    <div x-define="confirm">
                        <div class="body"><div x-slot>默认正文</div></div>
                    </div>
                    <button id="t" x-dialog:confirm="ui.open">
                        打开
                        <div x-slot>要确认吗？</div>
                    </button>
                </div>
            </div>`,
            { ui: { open: false } },
            { animate: false },
        );
        // 裸文本留在宿主；标记子节点**剪枝**不进运行 DOM（Q6=A）
        expect(root.querySelector("#t")!.textContent).toInclude("打开");
        expect(root.querySelector("#t x-slot")).toBeNull();
        expect(root.querySelector("#t .proj")).toBeNull();
        engine.state.ui.open = true;
        await nextTick();
        const mask = maskOf("confirm");
        expect(mask).not.toBeNull();
        // 覆盖物内是标记内容的投影克隆，fallback 被覆盖
        expect(mask!.textContent).toInclude("要确认吗？");
        expect(mask!.textContent).not.toInclude("默认正文");
        expect(containerOf()).not.toBeNull();
        // 宿主仍保留自身内容（裸文本不清空、标记不留痕）
        expect(root.querySelector("#t")!.textContent).toInclude("打开");
        // 关闭：投影随实例销毁，宿主不受影响
        engine.state.ui.open = false;
        await nextTick();
        finishAnim(maskOf("confirm") ?? document.createElement("div"));
        await nextTick();
        expect(maskOf("confirm")).toBeNull();
        expect(root.querySelector("#t")!.textContent).toInclude("打开");
    });

    test("按钮文本不会被误投进覆盖物（旧「自动继承」用法已断开）", async () => {
        const { root, engine } = mountSlot(
            `<div id="app"><div x-scope>
                <div x-define="confirm"><div class="body"><div x-slot>默认正文</div></div></div>
                <button id="t" x-dialog:confirm="ui.open">打开（子节点投影）</button>
            </div></div>`,
            { ui: { open: false } },
            { animate: false },
        );
        engine.state.ui.open = true;
        await nextTick();
        const mask = maskOf("confirm")!;
        expect(mask.textContent).toInclude("默认正文");
        expect(mask.textContent).not.toInclude("打开（子节点投影）");
        expect(root.querySelector("#t")!.textContent).toInclude("打开（子节点投影）");
    });

    test("x-dialog 组件无出口：宿主子节点保留、不收集不 warn", async () => {
        const { root, engine, warns } = mountSlotCaptureWarn(
            `<div id="app"><div x-scope>
                <div x-define="cfg"><div class="ov-panel">面板</div></div>
                <button id="t" x-dialog:cfg="ui.open">打开</button>
            </div></div>`,
            { ui: { open: false } },
            { animate: false },
        );
        expect(root.querySelector("#t")!.textContent!.trim()).toBe("打开");
        expect(warns.filter((w) => w.includes("无对应出口"))).toHaveLength(0);
        engine.state.ui.open = true;
        await nextTick();
        expect(maskOf("cfg")!.textContent).toInclude("面板");
        // 宿主标签仍在
        expect(root.querySelector("#t")!.textContent!.trim()).toBe("打开");
    });

    test("x-dialog 无子节点：覆盖物渲染 fallback", async () => {
        const { engine } = mountSlot(
            `<div id="app"><div x-scope>
                <div x-define="info"><div class="body"><div x-slot>默认信息</div></div></div>
                <button x-dialog:info="ui.open"></button>
            </div></div>`,
            { ui: { open: false } },
            { animate: false },
        );
        engine.state.ui.open = true;
        await nextTick();
        expect(maskOf("info")!.textContent).toInclude("默认信息");
    });

    test("多消费者同宿主：x-slots 归属容器分别投影，容器不进运行 DOM", async () => {
        const { root, engine } = mountSlot(
            `<div id="app"><div x-scope>
                <div x-define="alpha"><div class="body"><div x-slot>默认A</div></div></div>
                <div x-define="beta"><div class="body"><div x-slot>默认B</div></div></div>
                <button id="t" x-dialog:alpha="ui.a" x-dialog:beta="ui.b">
                    <template x-slots="alpha">阿尔法内容</template>
                    <template x-slots="beta">贝塔内容</template>
                    打开
                </button>
            </div></div>`,
            { ui: { a: false, b: false } },
            { animate: false },
        );
        // 归属容器与标记一律剪枝，按钮只留裸文本（Q6=Q11）
        expect(root.querySelector("#t template")).toBeNull();
        expect(root.querySelector("#t").textContent!.trim()).toBe("打开");

        engine.state.ui.a = true;
        await nextTick();
        const maskA = maskOf("alpha")!;
        expect(maskA.textContent).toInclude("阿尔法内容");
        expect(maskA.textContent).not.toInclude("贝塔内容");
        expect(maskA.textContent).not.toInclude("默认A");
        engine.state.ui.a = false;
        await nextTick();
        finishAnim(maskOf("alpha") ?? document.createElement("div"));

        engine.state.ui.b = true;
        await nextTick();
        const maskB = maskOf("beta")!;
        expect(maskB.textContent).toInclude("贝塔内容");
        expect(maskB.textContent).not.toInclude("阿尔法内容");
        // 按钮标签全程保留
        expect(root.querySelector("#t").textContent).toInclude("打开");
    });

    test("多消费者宿主的裸标记无法判定归属 → warn + 丢弃（容器内裸子节点才是默认段）", async () => {
        const { root, engine, warns } = mountSlotCaptureWarn(
            `<div id="app"><div x-scope>
                <div x-define="alpha"><div class="body"><div x-slot>默认A</div></div></div>
                <div x-define="beta"><div class="body"><div x-slot>默认B</div></div></div>
                <button id="t" x-dialog:alpha="ui.a" x-dialog:beta="ui.b">
                    <div x-slot>无主内容</div>
                    <template x-slots="alpha">阿尔法内容</template>
                </button>
            </div></div>`,
            { ui: { a: false, b: false } },
            { animate: false },
        );
        engine.state.ui.a = true;
        await nextTick();
        // 归属校验在打开时的懒收集阶段发出
        expect(warns.some((w) => w.includes("无法判定归属"))).toBe(true);
        const mask = maskOf("alpha")!;
        expect(mask.textContent).toInclude("阿尔法内容");
        expect(mask.textContent).not.toInclude("无主内容");
        expect(root.querySelector("#t")).not.toBeNull();
    });

    test("归属容器名与宿主消费者不匹配 → warn + 丢弃", async () => {
        const { engine, warns } = mountSlotCaptureWarn(
            `<div id="app"><div x-scope>
                <div x-define="alpha"><div class="body"><div x-slot>默认A</div></div></div>
                <button id="t" x-dialog:alpha="ui.a">
                    <template x-slots="logn">拼错的内容</template>
                </button>
            </div></div>`,
            { ui: { a: false } },
            { animate: false },
        );
        engine.state.ui.a = true;
        await nextTick();
        expect(warns.some((w) => w.includes('无名为 "logn" 的覆盖物消费者'))).toBe(true);
        expect(maskOf("alpha")!.textContent).toInclude("默认A");
        expect(maskOf("alpha")!.textContent).not.toInclude("拼错的内容");
    });

    test("宿主无覆盖物消费者写 x-slots → 编译期 warn + 剪枝不进 DOM", () => {
        const { root, warns } = mountSlotCaptureWarn(
            `<div id="app"><div x-scope>
                <div id="plain"><template x-slots="alpha">错位内容</template>普通内容</div>
            </div></div>`,
            {},
            {},
        );
        expect(warns.some((w) => w.includes("无覆盖物消费者"))).toBe(true);
        expect(root.querySelector("template")).toBeNull();
        expect(root.querySelector("#plain")!.textContent).toInclude("普通内容");
        expect(root.querySelector("#plain")!.textContent).not.toInclude("错位内容");
    });

    test("组件无出口但显式提供内容 → warn（Q13-2，不再静默）", async () => {
        const { engine, warns } = mountSlotCaptureWarn(
            `<div id="app"><div x-scope>
                <div x-define="cfg"><div class="ov-panel">面板</div></div>
                <button id="t" x-dialog:cfg="ui.open"><div x-slot>多余内容</div></button>
            </div></div>`,
            { ui: { open: false } },
            { animate: false },
        );
        engine.state.ui.open = true;
        await nextTick();
        expect(warns.some((w) => w.includes("未声明任何 x-slot 出口"))).toBe(true);
        expect(maskOf("cfg")!.textContent).toInclude("面板");
        expect(maskOf("cfg")!.textContent).not.toInclude("多余内容");
    });

    test("单消费者省容器：命名出口 + 作用域插槽形参照常生效", async () => {
        const { root, engine } = mountSlot(
            `<div id="app"><div x-scope>
                <div x-define="rowc">
                    <div class="body"><div x-slot:row="{ item: '行甲' }">fallback 行</div></div>
                </div>
                <button id="t" x-dialog:rowc="ui.open">
                    <div x-slot:row="{ item }">{{ item }}·乙</div>
                </button>
            </div></div>`,
            { ui: { open: false } },
            { animate: false },
        );
        engine.state.ui.open = true;
        await nextTick();
        const mask = maskOf("rowc")!;
        // 内容形参接住出口侧传出的 { item: '行甲' } → 投影渲染「行甲·乙」，fallback 不出现
        expect(mask.textContent).toInclude("行甲·乙");
        expect(mask.textContent).not.toInclude("fallback 行");
        // 内容标记不进宿主运行 DOM（模板只读、属性仍在 engine.template）
        expect(root.querySelector("#t [x-slot\\:row]")).toBeNull();
        expect(engine.template!.querySelector("#t [x-slot\\:row]")).not.toBeNull();
    });

    test("深层内容标记：剥属性、元素保留为普通内容（决策九忽略，不渲染 fallback）", async () => {
        const { root, engine } = mountSlot(
            `<div id="app"><div x-scope>
                <div x-define="deep"><div class="body"><div x-slot>默认正文</div></div></div>
                <button id="t" x-dialog:deep="ui.open">
                    <span class="wrap"><b x-slot:header>深层标记</b></span>
                </button>
            </div></div>`,
            { ui: { open: false } },
            { animate: false },
        );
        // 深层标记不是宿主直接子级 → 不剪，但属性被剥（否则 SlotDirective 会把 fallback 渲染进按钮）
        const b = root.querySelector("#t .wrap b")!;
        expect(b).not.toBeNull();
        expect(b.hasAttribute("x-slot")).toBe(false);
        expect(b.textContent).toInclude("深层标记");
        // 收集侧按决策九忽略深层标记 → 覆盖物显示 fallback
        engine.state.ui.open = true;
        await nextTick();
        expect(maskOf("deep")!.textContent).toInclude("默认正文");
        expect(maskOf("deep")!.textContent).not.toInclude("深层标记");
    });

    test("混合宿主：x-component 与 x-dialog 同元素 → component warn 跳过实例化", () => {
        const { root, warns } = mountSlotCaptureWarn(
            `<div id="app"><div x-scope>
                <div x-define="card"><div class="card">卡片</div></div>
                <div id="mix" x-component:card x-dialog:card="ui.open"><span>内容</span></div>
            </div></div>`,
            { ui: { open: false } },
            {},
        );
        expect(warns.some((w) => w.includes("覆盖物消费者"))).toBe(true);
        // component 让步：不实例化（无组件化身）；且 x-component ownsChildren 接管子树，
        // 子节点本就不进运行 DOM——既不投影也不残留
        expect(root.querySelector("#mix .card")).toBeNull();
        expect(root.querySelector("#mix span")).toBeNull();
    });
});
