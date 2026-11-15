import { describe, expect, test, afterEach } from "bun:test";
import "../setup";
import { AutoSpark } from "../../engine/engine";
import { mount, nextTick } from "../helpers";

/**
 * template 出口载体与出口注入测试（ADR-0137）。
 *
 * 四组：A 载体挂载与空/非空分流（无包裹层、可选出口、锚点、动态名）；
 * B 出口注入（静态/活注入/冲突合并/排除家族/纯文本丢弃/fallback 根注入）；
 * C 继承交互（可选性翻转、注入集整段替换）；D 元素出口零改动。
 */

const engines: any[] = [];
const mountOutlet = (html: string, state: any) => {
    const m = mount(html, state);
    engines.push(m.engine);
    return m;
};
/** 挂载并拦截 logger.warn */
const mountOutletCaptureWarn = (html: string, state: any) => {
    const root = document.createElement("div");
    root.innerHTML = html.trim();
    const engine = new AutoSpark(root, state, { autostart: false });
    const warns: string[] = [];
    (engine.logger as any).warn = (msg: any) => warns.push(String(msg));
    engine.compile();
    engines.push(engine);
    return { root, engine, warns };
};

afterEach(() => {
    while (engines.length) engines.pop()?.destroy();
});

describe("A. template 出口载体：挂载与空/非空分流（ADR-0137 决策一）", () => {
    test("有内容 + 未填充：渲染 fallback、无包裹层、fallback 根承接 data-slot", async () => {
        const { root } = mountOutlet(
            `<div x-scope>
                <div x-define="card">
                    <template x-slot:header><h1>默认头</h1></template>
                    <main>固定体</main>
                </div>
                <div id="h" x-component:card></div>
            </div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#h")!;
        const h1 = host.querySelector("h1")!;
        expect(h1.textContent).toBe("默认头");
        // 无包裹层：h1 的父级即组件根（main 的父级），中间没有 template/div 包裹
        expect(h1.parentElement).toBe(host.querySelector("main")!.parentElement);
        expect(host.querySelector("template")).toBeNull();
        expect(h1.getAttribute("data-slot")).toBe("header");
    });

    test("空载体：可选出口未填充整出口不渲染（无任何痕迹）", async () => {
        const { root } = mountOutlet(
            `<div x-scope>
                <div x-define="card">
                    <template x-slot:extra></template>
                    <main>固定体</main>
                </div>
                <div id="h" x-component:card></div>
            </div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#h")!;
        expect(host.textContent!.trim()).toBe("固定体");
        expect(host.querySelector("template")).toBeNull();
        expect(host.querySelector("[data-slot]")).toBeNull();
    });

    test("空载体 + 填充：照常渲染（可选与注入正交）", async () => {
        const { root } = mountOutlet(
            `<div x-scope>
                <div x-define="card">
                    <template class="x" x-slot:extra></template>
                </div>
                <div id="h" x-component:card>
                    <template x-slot:extra><p>附加内容</p></template>
                </div>
            </div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#h")!;
        const p = host.querySelector("p")!;
        expect(p.textContent).toBe("附加内容");
        // 可选出口带注入属性：填充时正常注入
        expect(p.getAttribute("class")).toBe("x");
        expect(p.getAttribute("data-slot")).toBe("extra");
    });

    test("填充为 template 载体：多根展开、每个元素根直接上位", async () => {
        const { root } = mountOutlet(
            `<div x-scope>
                <div x-define="card">
                    <template x-slot:body><span>默认</span></template>
                </div>
                <div id="h" x-component:card>
                    <template x-slot:body><h2>标题</h2><p>正文</p></template>
                </div>
            </div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#h")!;
        const h2 = host.querySelector("h2")!;
        const p = host.querySelector("p")!;
        expect(h2.textContent).toBe("标题");
        expect(p.textContent).toBe("正文");
        expect(h2.parentElement).toBe(p.parentElement); // 同层无包裹
        // data-slot 锚点仅首元素根承接（多根后续不带）
        expect(h2.getAttribute("data-slot")).toBe("body");
        expect(p.getAttribute("data-slot")).toBeNull();
    });

    test("填充为元素载体：载体保留为包裹层、data-slot 写载体", async () => {
        const { root } = mountOutlet(
            `<div x-scope>
                <div x-define="card">
                    <template x-slot:header><h1>默认头</h1></template>
                </div>
                <div id="h" x-component:card>
                    <span x-slot:header><h1>自定义头</h1></span>
                </div>
            </div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#h")!;
        const span = host.querySelector("span")!;
        expect(span.querySelector("h1")!.textContent).toBe("自定义头");
        expect(span.getAttribute("data-slot")).toBe("header");
    });

    test("fallback 在组件作用域求值（插值可用组件 data）", async () => {
        const { root } = mountOutlet(
            `<div x-scope>
                <div x-define="card">
                    <template x-slot:header><h1>{{ title }}</h1></template>
                    <script setup>{ data: { title: '组件标题' } }</script>
                </div>
                <div id="h" x-component:card></div>
            </div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector("#h h1")!.textContent).toBe("组件标题");
    });

    test("动态名 template 载体：值承名解析后同管线（含注入）", async () => {
        const { root } = mountOutlet(
            `<div x-scope>
                <div x-define="card">
                    <template class="x" x-slot="outletName"><i>默认</i></template>
                </div>
                <div id="h" x-component:card>
                    <template x-slot:header><b>自定义</b></template>
                </div>
            </div>`,
            { outletName: "header" },
        );
        await nextTick();
        const b = root.querySelector("#h b")!;
        expect(b.textContent).toBe("自定义");
        expect(b.getAttribute("class")).toBe("x");
        expect(b.getAttribute("data-slot")).toBe("header");
    });
});

describe("B. 出口注入（ADR-0137 决策二）", () => {
    test("静态属性注入每个元素根（含裸布尔属性原文）", async () => {
        const { root } = mountOutlet(
            `<div x-scope>
                <div x-define="card">
                    <template class="x" enable x-slot:header>默认</template>
                </div>
                <div id="h" x-component:card>
                    <template x-slot:header><h1>自定义</h1></template>
                </div>
            </div>`,
            {},
        );
        await nextTick();
        const h1 = root.querySelector("#h h1")!;
        expect(h1.getAttribute("class")).toBe("x");
        expect(h1.getAttribute("enable")).toBe("");
    });

    test("元素载体：注入载体元素自身", async () => {
        const { root } = mountOutlet(
            `<div x-scope>
                <div x-define="card">
                    <template class="x" x-slot:header>默认</template>
                </div>
                <div id="h" x-component:card>
                    <span x-slot:header><h1>自定义</h1></span>
                </div>
            </div>`,
            {},
        );
        await nextTick();
        const span = root.querySelector("#h span")!;
        const h1 = root.querySelector("#h h1")!;
        expect(span.getAttribute("class")).toBe("x");
        expect(h1.getAttribute("class")).toBeNull(); // 只注载体，不深入内容子级
    });

    test("fallback 根同样注入（防填充/未填充样式跳变）", async () => {
        const { root } = mountOutlet(
            `<div x-scope>
                <div x-define="card">
                    <template class="x" enable x-slot:header><h1>默认头</h1></template>
                </div>
                <div id="h" x-component:card></div>
            </div>`,
            {},
        );
        await nextTick();
        const h1 = root.querySelector("#h h1")!;
        expect(h1.textContent).toBe("默认头");
        expect(h1.getAttribute("class")).toBe("x");
        expect(h1.getAttribute("enable")).toBe("");
    });

    test("class token 合并：内容根已有 token 保留 + 声明侧追加去重", async () => {
        const { root } = mountOutlet(
            `<div x-scope>
                <div x-define="card">
                    <template class="b c" x-slot:header>默认</template>
                </div>
                <div id="h" x-component:card>
                    <template x-slot:header><h1 class="a b">自定义</h1></template>
                </div>
            </div>`,
            {},
        );
        await nextTick();
        const h1 = root.querySelector("#h h1")!;
        expect(h1.getAttribute("class")!.split(/\s+/).sort()).toEqual(["a", "b", "c"]);
    });

    test("style 声明级合并：同名属性内容根赢、声明侧仅补新属性", async () => {
        const { root } = mountOutlet(
            `<div x-scope>
                <div x-define="card">
                    <template style="color: blue; font-size: 12px" x-slot:header>默认</template>
                </div>
                <div id="h" x-component:card>
                    <template x-slot:header><h1 style="color: red">自定义</h1></template>
                </div>
            </div>`,
            {},
        );
        await nextTick();
        const style = root.querySelector("#h h1")!.getAttribute("style")!;
        expect(style).toInclude("color: red");
        expect(style).not.toInclude("blue");
        expect(style.toLowerCase()).toInclude("font-size: 12px");
    });

    test("同名普通属性调用方赢：内容根已有属性不被覆盖", async () => {
        const { root } = mountOutlet(
            `<div x-scope>
                <div x-define="card">
                    <template title="声明侧标题" x-slot:header>默认</template>
                </div>
                <div id="h" x-component:card>
                    <template x-slot:header><h1 title="内容侧标题">自定义</h1></template>
                </div>
            </div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector("#h h1")!.getAttribute("title")).toBe("内容侧标题");
    });

    test("活注入：`:class` 原文注入后在内容根作为 bind 生效（调用方作用域）", async () => {
        const { root, engine } = mountOutlet(
            `<div x-scope>
                <div x-define="card">
                    <template :class="cls" x-slot:header>默认</template>
                </div>
                <div id="h" x-component:card>
                    <template x-slot:header><h1>自定义</h1></template>
                </div>
            </div>`,
            { cls: "hot" },
        );
        await nextTick();
        const h1 = root.querySelector("#h h1")!;
        expect(h1.getAttribute("class")).toBe("hot");
        // 响应式：状态变化驱动内容根 class 更新（活注入非死属性）
        engine.state.cls = "cold";
        await nextTick();
        expect(h1.getAttribute("class")).toBe("cold");
    });

    test("宿主配置家族排除：x-options / x-slot-options 不注入", async () => {
        const { root } = mountOutlet(
            `<div x-scope>
                <div x-define="card">
                    <template class="x" x-options="{a:1}" x-slot-options="{b:2}" x-slot:header>默认</template>
                </div>
                <div id="h" x-component:card>
                    <template x-slot:header><h1>自定义</h1></template>
                </div>
            </div>`,
            {},
        );
        await nextTick();
        const h1 = root.querySelector("#h h1")!;
        expect(h1.getAttribute("class")).toBe("x");
        expect(h1.getAttribute("x-options")).toBeNull();
        expect(h1.getAttribute("x-slot-options")).toBeNull();
    });

    test("纯文本内容：渲染文本、注入属性 warn + 丢弃（不造包裹层）", async () => {
        const { root, warns } = mountOutletCaptureWarn(
            `<div x-scope>
                <div x-define="card">
                    <template class="x" x-slot:header>默认</template>
                </div>
                <div id="h" x-component:card>
                    <template x-slot:header>标题文字</template>
                </div>
            </div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#h")!;
        expect(host.textContent!.trim()).toBe("标题文字");
        expect(host.querySelector("[class]")).toBeNull();
        expect(warns.some((w) => w.includes("注入属性无处安放") && w.includes("ADR-0137"))).toBe(
            true,
        );
    });
});

describe("C. 继承交互（ADR-0137 决策三）", () => {
    test("覆盖段翻转可选性：父 fallback 出口被子空覆盖段翻转为可选", async () => {
        const { root } = mountOutlet(
            `<div x-scope>
                <div x-define="base">
                    <template class="x" x-slot:header><h1>父默认头</h1></template>
                    <main>固定体</main>
                </div>
                <div x-define:inherit="base" x-define="child">
                    <template x-slot:header></template>
                </div>
                <div id="h" x-component:child></div>
            </div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#h")!;
        expect(host.querySelector("h1")).toBeNull(); // 可选出口未消费：不渲染
        expect(host.textContent!.trim()).toBe("固定体");
    });

    test("覆盖段翻转 fallback：父可选出口被子覆盖段填上内容", async () => {
        const { root } = mountOutlet(
            `<div x-scope>
                <div x-define="base">
                    <template x-slot:header></template>
                    <main>固定体</main>
                </div>
                <div x-define:inherit="base" x-define="child">
                    <template x-slot:header><h1>子默认头</h1></template>
                </div>
                <div id="h" x-component:child></div>
            </div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector("#h h1")!.textContent).toBe("子默认头");
    });

    test("注入集整段替换：覆盖段没写的属性即不存在", async () => {
        const { root } = mountOutlet(
            `<div x-scope>
                <div x-define="base">
                    <template class="parent-x" enable x-slot:header><h1>父默认</h1></template>
                </div>
                <div x-define:inherit="base" x-define="subcard">
                    <template x-slot:header></template>
                </div>
                <div id="a" x-component:subcard>
                    <template x-slot:header><h1>消费方</h1></template>
                </div>
            </div>`,
            {},
        );
        await nextTick();
        const h1 = root.querySelector("#a h1")!;
        // 覆盖段为空载体（可选）且未写属性：注入集整段替换后为空——消费方内容根不获注入
        expect(h1.textContent).toBe("消费方");
        expect(h1.getAttribute("class")).toBeNull();
        expect(h1.getAttribute("enable")).toBeNull();
    });

    test("注入集整段替换：覆盖段自带属性成为新注入集", async () => {
        const { root } = mountOutlet(
            `<div x-scope>
                <div x-define="base">
                    <template class="parent-x" x-slot:header><h1>父默认</h1></template>
                </div>
                <div x-define:inherit="base" x-define="child">
                    <template class="child-y" x-slot:header><h1>子默认</h1></template>
                </div>
                <div id="h" x-component:child>
                    <template x-slot:header><h1>消费方</h1></template>
                </div>
            </div>`,
            {},
        );
        await nextTick();
        const h1 = root.querySelector("#h h1")!;
        expect(h1.textContent).toBe("消费方");
        expect(h1.getAttribute("class")).toBe("child-y"); // 子注入集生效
    });
});

describe("D. 元素出口零改动（ADR-0137 决策四）", () => {
    test("元素出口：包裹层保留、自身属性不注入内容根", async () => {
        const { root } = mountOutlet(
            `<div x-scope>
                <div x-define="card">
                    <div class="outlet-style" x-slot:header>默认头</div>
                </div>
                <div id="h" x-component:card>
                    <template x-slot:header><h1>自定义头</h1></template>
                </div>
            </div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#h")!;
        const outlet = host.querySelector("div")!;
        expect(outlet.getAttribute("class")).toBe("outlet-style"); // 自身样式留在出口元素
        expect(outlet.querySelector("h1")!.textContent).toBe("自定义头");
        expect(outlet.querySelector("h1")!.getAttribute("class")).toBeNull(); // 不注入
    });
});
