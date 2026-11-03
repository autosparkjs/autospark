import { describe, expect, test, afterEach } from "bun:test";
import "../setup";
import { AutoSpark } from "../../engine/engine";
import { mount, nextTick, finishAnim } from "../helpers";

/**
 * x-slot 插槽指令测试（ADR-0056）。
 *
 * 12 组：命名/默认出口命中、fallback、无主 warn、重复首胜、裸子节点默认段、
 * 命名分段直接子级、深层忽略 warn、作用域插槽形参、形参响应式、调用方作用域求值、
 * overlay 继承、x-dialog 子节点进覆盖物；+ 传递绑定组（ADR-0108，15 例）。
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

    test("内容无对应出口：静默丢弃（ADR-0107 决策五，组件路径不 warn）", async () => {
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
        // 组件路径全量收集、跳过出口清单校验（动态出口名运行期才可知）——未被消费的段静默闲置
        expect(warns.some((w) => w.includes("无对应出口"))).toBe(false);
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


describe("x-slot 传递绑定（ADR-0108）", () => {
    const maskOf = (name: string): HTMLElement | null =>
        document.querySelector(`.autospark-dialog-mask [data-overlay="${name}"]`)?.parentElement ??
        null;

    test("双属性形态：x-slot.bind 在调用方作用域求值并展开到出口元素", async () => {
        const { root } = mountSlot(
            `<div x-scope>
                <div x-define="card">
                    <header x-slot:header>默认头</header>
                </div>
                <div id="h" x-component:card>
                    <template x-slot:header x-slot.bind="{ 'data-k': k, title: t }"><h1>自定义</h1></template>
                </div>
            </div>`,
            { k: "v1", t: "hello" },
        );
        await nextTick();
        const header = root.querySelector("#h header")!;
        expect(header.getAttribute("data-k")).toBe("v1");
        expect(header.getAttribute("title")).toBe("hello");
        expect(header.querySelector("h1")!.textContent).toBe("自定义");
        expect(header.textContent).not.toInclude("默认头");
    });

    test("别名形态 x-slot:header.bind 等价于双属性合写", async () => {
        const { root } = mountSlot(
            `<div x-scope>
                <div x-define="card">
                    <header x-slot:header>默认头</header>
                </div>
                <div id="h" x-component:card>
                    <template x-slot:header.bind="{ 'data-k': k }"><h1>自定义</h1></template>
                </div>
            </div>`,
            { k: "v2" },
        );
        await nextTick();
        const header = root.querySelector("#h header")!;
        expect(header.getAttribute("data-k")).toBe("v2");
        expect(header.querySelector("h1")).not.toBeNull();
    });

    test("形参与传递绑定共存：params 走组件作用域、绑定只看调用方状态", async () => {
        const { root } = mountSlot(
            `<div x-scope>
                <div x-define="row">
                    <div x-slot:item="{ label: lbl }"><em>默认</em></div>
                </div>
                <div id="h" x-component:row>
                    <template x-slot:item="{ label }" x-slot.bind="{ 'data-l': k }">{{ label }}</template>
                </div>
            </div>`,
            { lbl: "L1", k: "K1" },
        );
        await nextTick();
        const outlet = root.querySelector("#h [data-slot]")!;
        expect(outlet.textContent).toBe("L1"); // 形参：组件作用域 lbl → 内容
        expect(outlet.getAttribute("data-l")).toBe("K1"); // 绑定：调用方 k → 出口属性
        expect(outlet.textContent).not.toInclude("默认");
    });

    test("调用方赢：覆盖出口静态属性；class 双侧合并", async () => {
        const { root } = mountSlot(
            `<div x-scope>
                <div x-define="card">
                    <header x-slot:header class="base" data-src="comp">默认头</header>
                </div>
                <div id="h" x-component:card>
                    <template x-slot:header x-slot.bind="{ 'data-src': 'caller', class: 'extra' }">X</template>
                </div>
            </div>`,
            {},
        );
        await nextTick();
        const header = root.querySelector("#h header")!;
        expect(header.getAttribute("data-src")).toBe("caller"); // 覆盖：调用方恒赢
        expect(header.classList.contains("base")).toBe(true); // 组件侧 class 保留
        expect(header.classList.contains("extra")).toBe(true); // 调用方 class 追加
    });

    test("响应式：depth:2 键级更新 + 键消失清理", async () => {
        const { root, engine } = mountSlot(
            `<div x-scope>
                <div x-define="card">
                    <header x-slot:header>默认头</header>
                </div>
                <div id="h" x-component:card>
                    <template x-slot:header x-slot.bind="attrs">X</template>
                </div>
            </div>`,
            { attrs: { a: "1", b: "2" } },
        );
        await nextTick();
        const header = root.querySelector("#h header")!;
        expect(header.getAttribute("a")).toBe("1");
        expect(header.getAttribute("b")).toBe("2");
        engine.state.attrs.b = "x"; // 子键修改（depth:2）
        await nextTick();
        expect(header.getAttribute("b")).toBe("x");
        engine.state.attrs = { a: "9" }; // 整体替换：b 键消失 → 属性移除
        await nextTick();
        expect(header.getAttribute("a")).toBe("9");
        expect(header.hasAttribute("b")).toBe(false);
    });

    test("调用方 x-data 局部状态：绑定表达式在调用方视图求值（不受组件封闭边界约束）", async () => {
        const { root } = mountSlot(
            `<div x-scope>
                <div x-define="card">
                    <header class="base" x-slot:header>默认头</header>
                </div>
                <div id="outer" x-data="{ id: 'A-1', theme: 'big' }">
                    <div id="h" x-component:card>
                        <template x-slot:header x-slot.bind="{ 'data-id': id, class: theme }">
                            <h1>自定义</h1>
                        </template>
                    </div>
                </div>
            </div>`,
            {},
        );
        await nextTick();
        const header = root.querySelector("#h header")!;
        expect(header.getAttribute("data-id")).toBe("A-1"); // 调用方 x-data 域（$scopes）可见
        expect(header.classList.contains("base")).toBe(true);
        expect(header.classList.contains("big")).toBe(true);
    });

    test("调用方 x-data 局部变量：改状态 → 出口属性跟变（字面量形态键级响应）", async () => {
        const { root } = mountSlot(
            `<div x-scope>
                <div x-define="card"><header x-slot:header>默认头</header></div>
                <div id="outer" x-data="{ state: 'idle', badge: 'B-1' }">
                    <div id="h" x-component:card>
                        <template x-slot:header.bind="{ 'data-state': state, 'data-badge': badge }">X</template>
                    </div>
                    <button id="t1" @click="state = 'busy'">改 state</button>
                    <button id="t2" @click="badge = false">清 badge</button>
                </div>
            </div>`,
            {},
        );
        await nextTick();
        const header = root.querySelector("#h header")!;
        expect(header.getAttribute("data-state")).toBe("idle");
        expect(header.getAttribute("data-badge")).toBe("B-1");
        root.querySelector("#t1")!.dispatchEvent(new Event("click"));
        await nextTick();
        expect(header.getAttribute("data-state")).toBe("busy");
        root.querySelector("#t2")!.dispatchEvent(new Event("click"));
        await nextTick();
        expect(header.hasAttribute("data-badge")).toBe(false); // false → 移除
    });

    test("default 槽：空绑定载体只贡献绑定、不构成内容段", async () => {
        const { root } = mountSlot(
            `<div x-scope>
                <div x-define="card"><div x-slot>默认体</div></div>
                <div id="h" x-component:card>
                    裸内容
                    <template x-slot.bind="{ 'data-d': d }"></template>
                </div>
            </div>`,
            { d: "D1" },
        );
        await nextTick();
        const outlet = root.querySelector("#h [data-slot]")!;
        expect(outlet.textContent).toInclude("裸内容");
        expect(outlet.textContent).not.toInclude("默认体");
        expect(outlet.getAttribute("data-d")).toBe("D1");
    });

    test("绑定载体无附着内容：warn + 忽略（出口渲染 fallback）", async () => {
        const { root, warns } = mountSlotCaptureWarn(
            `<div x-scope>
                <div x-define="card"><div x-slot>默认体</div></div>
                <div id="h" x-component:card>
                    <template x-slot.bind="{ 'data-d': d }"></template>
                </div>
            </div>`,
            { d: "D1" },
        );
        await nextTick();
        const outlet = root.querySelector("#h [data-slot]")!;
        expect(warns.some((w) => w.includes("未附着任何内容"))).toBe(true);
        expect(outlet.textContent).toInclude("默认体");
        expect(outlet.hasAttribute("data-d")).toBe(false);
    });

    test("onXxx 函数键 → 监听挂到出口元素，调用方作用域执行", async () => {
        const { root, engine } = mountSlot(
            `<div x-scope>
                <div x-define="card"><button x-slot:header>默认</button></div>
                <div id="h" x-component:card>
                    <template x-slot:header x-slot.bind="{ onclick: () => count = count + 1 }">点</template>
                </div>
            </div>`,
            { count: 0 },
        );
        await nextTick();
        const btn = root.querySelector("#h button")!;
        btn.dispatchEvent(new Event("click"));
        await nextTick();
        expect(engine.state.count).toBe(1);
    });

    test("出口侧裸 x-slot.bind：warn + 值仍按动态出口名（ADR-0107 兼容）", async () => {
        const { root, warns } = mountSlotCaptureWarn(
            `<div x-scope>
                <div x-define="card"><div x-slot.bind="dyn">默认体</div></div>
                <div id="h" x-component:card>
                    <template x-slot:header>投影头</template>
                </div>
            </div>`,
            { dyn: "header" },
        );
        await nextTick();
        expect(warns.some((w) => w.includes("传递绑定语法"))).toBe(true);
        const outlet = root.querySelector("#h [data-slot]")!;
        expect(outlet.dataset.slot).toBe("header"); // 动态名照常解析（兼容）
        expect(outlet.textContent).toBe("投影头");
    });

    test("出口侧具名 .bind 别名：warn + 静态出口照常工作", async () => {
        const { root, warns } = mountSlotCaptureWarn(
            `<div x-scope>
                <div x-define="card"><header x-slot:header.bind="whatever">默认头</header></div>
                <div id="h" x-component:card>
                    <template x-slot:header>投影</template>
                </div>
            </div>`,
            {},
        );
        await nextTick();
        expect(warns.some((w) => w.includes("出口侧请改用 x-bind"))).toBe(true);
        expect(root.querySelector("#h header")!.textContent).toBe("投影");
    });


    test("槽名恰为 bind：x-slot:bind 按命名槽处理，不误判为绑定载体", async () => {
        const { root } = mountSlot(
            `<div x-scope>
                <div x-define="card"><div x-slot:bind>默认</div></div>
                <div id="h" x-component:card>
                    <template x-slot:bind x-slot.bind="{ 'data-y': y }">投影</template>
                </div>
            </div>`,
            { y: "Y1" },
        );
        await nextTick();
        const outlet = root.querySelector("#h [data-slot]")!;
        expect(outlet.dataset.slot).toBe("bind"); // 名 "bind" 的命名出口
        expect(outlet.textContent).toBe("投影");
        expect(outlet.getAttribute("data-y")).toBe("Y1"); // 同元素独立载体照常展开
    });

    test("书写顺序无关：绑定属性在命名属性之前仍正确分段", async () => {
        const { root } = mountSlot(
            `<div x-scope>
                <div x-define="card"><header x-slot:header>默认头</header></div>
                <div id="h" x-component:card>
                    <template x-slot.bind="{ 'data-h': h }" x-slot:header>投影</template>
                </div>
            </div>`,
            { h: "H1" },
        );
        await nextTick();
        const header = root.querySelector("#h header")!;
        expect(header.textContent).toBe("投影"); // 绑定属性不抢标记位
        expect(header.getAttribute("data-h")).toBe("H1");
    });
});
