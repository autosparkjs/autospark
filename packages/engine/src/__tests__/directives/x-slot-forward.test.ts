import { describe, expect, test, afterEach } from "bun:test";
import "../setup";
import { AutoSpark } from "../../engine/engine";
import { mount, nextTick } from "../helpers";

/**
 * 插槽转发 slots 测试（ADR-0125）。
 *
 * 24 组：单级直通、重命名（成员属性/整包两通道）、`*` 通配、混写显式优先、
 * 全转发快捷方式（布尔 true / 字符串 "true" / `.slots` 修饰符——含大小写不敏感
 * 与显式值压制）、多级接力（c→b→a）、清单模式双渲染 warn、`*` 模式交集 warn、
 * 语法非法逐项忽略、default 转发、非字符串值忽略、未声明名阻断防穿透、
 * 转发段调用方求值基准、并存降级（决策六：消费者胜过直供 / 无消费者直供渲染 /
 * 未声明名直供恒优先 / 多级并存最外层赢 / 重命名按译名命中）。
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
const mountForward = (html: string, state: any = {}, options?: any) => {
    const m = mount(html, state, options);
    engines.push(m.engine);
    return m;
};
const mountForwardCaptureWarn = (html: string, state: any = {}, options?: any) => {
    const m = mountCaptureWarn(html, state, options);
    engines.push(m.engine);
    return m;
};

afterEach(() => {
    while (engines.length) engines.pop()?.destroy();
});

describe("插槽转发 slots（ADR-0125）", () => {
    test("单级直通：裸名清单，包装组件的消费者段落入内层出口", async () => {
        const { root } = mountForward(
            `<div x-scope>
                <div x-define="inner">
                    <footer x-slot:footer>[inner默认脚]</footer>
                </div>
                <div x-define="wrapper">
                    <div x-component:inner x-component-options.slots="footer"></div>
                </div>
                <div id="h" x-component:wrapper>
                    <template x-slot:footer><b>消费者脚</b></template>
                </div>
            </div>`,
        );
        await nextTick();
        const host = root.querySelector("#h")!;
        expect(host.querySelector("footer b")!.textContent).toBe("消费者脚");
        expect(host.querySelector("footer")!.textContent).not.toInclude("inner默认脚");
    });

    test("重命名：出口名:对外名（成员属性原文），消费者写对外名落进内层出口", async () => {
        const { root } = mountForward(
            `<div x-scope>
                <div x-define="inner">
                    <header x-slot:header>[inner默认头]</header>
                </div>
                <div x-define="wrapper">
                    <div x-component:inner x-component-options.slots="header:card-header"></div>
                </div>
                <div id="h" x-component:wrapper>
                    <template x-slot:card-header><b>卡片头</b></template>
                </div>
            </div>`,
        );
        await nextTick();
        const host = root.querySelector("#h")!;
        expect(host.querySelector("header b")!.textContent).toBe("卡片头");
    });

    test("重命名：整包静态形态 x-component-options={slots:'…'} 同效", async () => {
        const { root } = mountForward(
            `<div x-scope>
                <div x-define="inner">
                    <header x-slot:header>[inner默认头]</header>
                </div>
                <div x-define="wrapper">
                    <div x-component:inner x-component-options="{slots:'header:card-header'}"></div>
                </div>
                <div id="h" x-component:wrapper>
                    <template x-slot:card-header><b>卡片头</b></template>
                </div>
            </div>`,
        );
        await nextTick();
        const host = root.querySelector("#h")!;
        expect(host.querySelector("header b")!.textContent).toBe("卡片头");
    });

    test("`*` 通配：多段原名上溯，无出口的闲置段静默忽略", async () => {
        const { root } = mountForward(
            `<div x-scope>
                <div x-define="inner">
                    <header x-slot:header>[inner默认头]</header>
                    <footer x-slot:footer>[inner默认脚]</footer>
                </div>
                <div x-define="wrapper">
                    <div x-component:inner x-component-options.slots="*"></div>
                </div>
                <div id="h" x-component:wrapper>
                    <template x-slot:header><b>外层头</b></template>
                    <template x-slot:footer><b>外层脚</b></template>
                    <template x-slot:extra><i>闲置段</i></template>
                </div>
            </div>`,
        );
        await nextTick();
        const host = root.querySelector("#h")!;
        expect(host.querySelector("header b")!.textContent).toBe("外层头");
        expect(host.querySelector("footer b")!.textContent).toBe("外层脚");
        expect(host.querySelector("i")).toBeNull();
    });

    test("混写显式优先：`*, footer:card-footer` 显式映射胜出、其余原名通配", async () => {
        const { root } = mountForward(
            `<div x-scope>
                <div x-define="inner">
                    <header x-slot:header>[inner默认头]</header>
                    <footer x-slot:footer>[inner默认脚]</footer>
                </div>
                <div x-define="wrapper">
                    <div x-component:inner x-component-options.slots="*, footer:card-footer"></div>
                </div>
                <div id="h" x-component:wrapper>
                    <template x-slot:header><b>外层头</b></template>
                    <template x-slot:card-footer><b>卡片脚</b></template>
                </div>
            </div>`,
        );
        await nextTick();
        const host = root.querySelector("#h")!;
        // header：通配原名上溯命中；footer：显式映射为 card-footer 后命中
        expect(host.querySelector("header b")!.textContent).toBe("外层头");
        expect(host.querySelector("footer b")!.textContent).toBe("卡片脚");
    });

    // 快捷方式用例统一在内层元素上放一个直供段：持有者内容集非空 → 非透明（预存怪癖
    // 「空持有者对查找链透明」被排除），同名段能否上溯完全取决于转发是否激活——严格证明。
    test("布尔快捷方式：整包 {slots: true} ≡ `*` 全转发", async () => {
        const { root } = mountForward(
            `<div x-scope>
                <div x-define="inner">
                    <header x-slot:header>[inner默认头]</header>
                    <footer x-slot:footer>[inner默认脚]</footer>
                </div>
                <div x-define="wrapper">
                    <div x-component:inner x-component-options="{slots: true}">
                        <template x-slot:extra>直供杂段（无出口，静默闲置）</template>
                    </div>
                </div>
                <div id="h" x-component:wrapper>
                    <template x-slot:header><b>外层头</b></template>
                    <template x-slot:footer><b>外层脚</b></template>
                </div>
            </div>`,
        );
        await nextTick();
        const host = root.querySelector("#h")!;
        expect(host.querySelector("header b")!.textContent).toBe("外层头");
        expect(host.querySelector("footer b")!.textContent).toBe("外层脚");
    });

    test("布尔快捷方式：成员属性字符串 \"true\" ≡ `*` 全转发", async () => {
        const { root } = mountForward(
            `<div x-scope>
                <div x-define="inner">
                    <header x-slot:header>[inner默认头]</header>
                    <footer x-slot:footer>[inner默认脚]</footer>
                </div>
                <div x-define="wrapper">
                    <div x-component:inner x-component-options.slots="true">
                        <template x-slot:extra>直供杂段</template>
                    </div>
                </div>
                <div id="h" x-component:wrapper>
                    <template x-slot:header><b>外层头</b></template>
                    <template x-slot:footer><b>外层脚</b></template>
                </div>
            </div>`,
        );
        await nextTick();
        const host = root.querySelector("#h")!;
        expect(host.querySelector("header b")!.textContent).toBe("外层头");
        expect(host.querySelector("footer b")!.textContent).toBe("外层脚");
    });

    test("修饰符快捷方式：x-component:inner.slots ≡ 全转发", async () => {
        const { root } = mountForward(
            `<div x-scope>
                <div x-define="inner">
                    <header x-slot:header>[inner默认头]</header>
                    <footer x-slot:footer>[inner默认脚]</footer>
                </div>
                <div x-define="wrapper">
                    <div x-component:inner.slots>
                        <template x-slot:extra>直供杂段</template>
                    </div>
                </div>
                <div id="h" x-component:wrapper>
                    <template x-slot:header><b>外层头</b></template>
                    <template x-slot:footer><b>外层脚</b></template>
                </div>
            </div>`,
        );
        await nextTick();
        const host = root.querySelector("#h")!;
        expect(host.querySelector("header b")!.textContent).toBe("外层头");
        expect(host.querySelector("footer b")!.textContent).toBe("外层脚");
    });

    test("修饰符大小写不敏感：大写书写经 DOM 小写化后仍生效", async () => {
        const { root } = mountForward(
            `<div x-scope>
                <div x-define="inner">
                    <header x-slot:header>[inner默认头]</header>
                </div>
                <div x-define="wrapper">
                    <div x-component:inner.Slots>
                        <template x-slot:extra>直供杂段</template>
                    </div>
                </div>
                <div id="h" x-component:wrapper>
                    <template x-slot:header><b>外层头</b></template>
                </div>
            </div>`,
        );
        await nextTick();
        expect(root.querySelector("#h header b")!.textContent).toBe("外层头");
    });

    test("显式清单压制修饰符：成员属性在场时 .slots 开关失效", async () => {
        const { root } = mountForward(
            `<div x-scope>
                <div x-define="inner">
                    <header x-slot:header>[inner默认头]</header>
                    <footer x-slot:footer>[inner默认脚]</footer>
                </div>
                <div x-define="wrapper">
                    <div x-component:inner.slots x-component-options.slots="footer"></div>
                </div>
                <div id="h" x-component:wrapper>
                    <template x-slot:header><b>外层头</b></template>
                    <template x-slot:footer><b>外层脚</b></template>
                </div>
            </div>`,
        );
        await nextTick();
        const host = root.querySelector("#h")!;
        // footer：显式清单照常转发；header：显式优先，通配开关被压制 → 内层 fallback
        expect(host.querySelector("footer b")!.textContent).toBe("外层脚");
        expect(host.querySelector("header")!.textContent).toBe("[inner默认头]");
    });

    test("显式 false 压制修饰符：{slots: false} 显式关闭转发", async () => {
        const { root } = mountForward(
            `<div x-scope>
                <div x-define="inner">
                    <header x-slot:header>[inner默认头]</header>
                </div>
                <div x-define="wrapper">
                    <!-- 直供段使内层持有者非透明：转发关闭时上溯在此阻断 -->
                    <div x-component:inner.slots x-component-options="{slots: false}">
                        <template x-slot:extra>直供杂段</template>
                    </div>
                </div>
                <div id="h" x-component:wrapper>
                    <template x-slot:header><b>外层头</b></template>
                </div>
            </div>`,
        );
        await nextTick();
        // 显式 false 胜过修饰符开关——非透明持有者边界阻断上溯，出口渲染内层 fallback
        expect(root.querySelector("#h header")!.textContent).toBe("[inner默认头]");
        expect(root.querySelector("#h")!.textContent).not.toInclude("外层头");
    });

    test("多级接力：c→b→a 每级声明逐级上溯，最外层消费者段直达最内层出口", async () => {
        const { root } = mountForward(
            `<div x-scope>
                <div x-define="a"><p class="deep" x-slot:body>[a默认体]</p></div>
                <div x-define="b">
                    <div x-component:a x-component-options.slots="body"></div>
                </div>
                <div x-define="c">
                    <div x-component:b x-component-options.slots="body"></div>
                </div>
                <div id="h" x-component:c>
                    <template x-slot:body>接力内容</template>
                </div>
            </div>`,
        );
        await nextTick();
        expect(root.querySelector(".deep")!.textContent).toBe("接力内容");
    });

    test("清单模式双渲染 warn：转发名与包装组件自身出口同名（编译期一次）", async () => {
        const { root, warns } = mountForwardCaptureWarn(
            `<div x-scope>
                <div x-define="inner">
                    <footer x-slot:footer>[inner默认脚]</footer>
                </div>
                <div x-define="wrapper">
                    <p x-slot:footer>[wrapper自身脚出口]</p>
                    <div x-component:inner x-component-options.slots="footer"></div>
                </div>
                <div id="h" x-component:wrapper>
                    <template x-slot:footer>消费段</template>
                </div>
            </div>`,
        );
        await nextTick();
        // 双渲染：包装组件自身出口与内层转发出口各渲染一次
        const texts = Array.from(root.querySelectorAll("footer, p")).map((n) => n.textContent);
        expect(texts.filter((t) => t === "消费段").length).toBe(2);
        expect(warns.filter((w) => w.includes("双渲染") && w.includes("footer")).length).toBe(1);
    });

    test("`*` 模式交集 warn：包装组件自身出口 ∩ 内层组件出口", async () => {
        const { warns } = mountForwardCaptureWarn(
            `<div x-scope>
                <div x-define="inner">
                    <footer x-slot:footer>[inner默认脚]</footer>
                </div>
                <div x-define="wrapper">
                    <p x-slot:footer>[wrapper自身脚出口]</p>
                    <div x-component:inner x-component-options.slots="*"></div>
                </div>
                <div id="h" x-component:wrapper>
                    <template x-slot:footer>消费段</template>
                </div>
            </div>`,
        );
        await nextTick();
        expect(warns.some((w) => w.includes("通配转发") && w.includes("footer"))).toBe(true);
    });

    test("语法非法项逐项 warn 忽略：合法项不受拖累", async () => {
        const { root, warns } = mountForwardCaptureWarn(
            `<div x-scope>
                <div x-define="inner">
                    <footer x-slot:footer>[inner默认脚]</footer>
                </div>
                <div x-define="wrapper">
                    <div x-component:inner x-component-options.slots="footer, a:b:c, x y"></div>
                </div>
                <div id="h" x-component:wrapper>
                    <template x-slot:footer><b>消费者脚</b></template>
                </div>
            </div>`,
        );
        await nextTick();
        // 合法项 footer 照常转发
        expect(root.querySelector("#h footer b")!.textContent).toBe("消费者脚");
        // a:b:c（多冒号）与 x y（含空白）逐项 warn
        expect(warns.filter((w) => w.includes("非法清单项")).length).toBe(2);
    });

    test("default 出口转发：消费者裸子节点段落入内层默认出口", async () => {
        const { root } = mountForward(
            `<div x-scope>
                <div x-define="inner">
                    <div x-slot>[inner默认体]</div>
                </div>
                <div x-define="wrapper">
                    <div x-component:inner x-component-options.slots="default"></div>
                </div>
                <div id="h" x-component:wrapper>
                    <p>裸内容段</p>
                </div>
            </div>`,
        );
        await nextTick();
        const host = root.querySelector("#h")!;
        expect(host.textContent).toInclude("裸内容段");
        expect(host.textContent).not.toInclude("inner默认体");
    });

    test("非字符串值 warn + 忽略：出口渲染 fallback", async () => {
        const { root, warns } = mountForwardCaptureWarn(
            `<div x-scope>
                <div x-define="inner">
                    <footer x-slot:footer>[inner默认脚]</footer>
                </div>
                <div x-define="wrapper">
                    <div x-component:inner x-component-options="{slots: 123}"></div>
                </div>
                <div id="h" x-component:wrapper>
                    <template x-slot:card-footer>消费者脚</template>
                </div>
            </div>`,
        );
        await nextTick();
        expect(warns.some((w) => w.includes("x-component-options.slots"))).toBe(true);
        // 声明被忽略——重命名段（card-footer）既无直供也无转发，出口渲染 fallback
        expect(root.querySelector("#h footer")!.textContent).toBe("[inner默认脚]");
        expect(root.querySelector("#h")!.textContent).not.toInclude("消费者脚");
    });

    test("未声明名字在声明落点被阻断：不穿透到上一级持有者（渲染 fallback）", async () => {
        const { root } = mountForward(
            `<div x-scope>
                <div x-define="inner">
                    <p x-slot:other>[inner-other默认]</p>
                </div>
                <div x-define="wrapper">
                    <div x-component:inner x-component-options.slots="footer"></div>
                </div>
                <div id="h" x-component:wrapper>
                    <template x-slot:other>外层other段</template>
                </div>
            </div>`,
        );
        await nextTick();
        // other 未入转发清单——声明落点持有者构成边界，出口渲染自身 fallback
        expect(root.querySelector("#h p")!.textContent).toBe("[inner-other默认]");
        expect(root.querySelector("#h")!.textContent).not.toInclude("外层other段");
    });

    test("转发段求值基准 = 调用方作用域（与上层组件自身出口消费同段逐位一致）", async () => {
        const { root } = mountForward(
            `<div x-scope>
                <div x-define="inner">
                    <p class="body" x-slot:body>[inner默认体]</p>
                </div>
                <div x-define="wrapper">
                    <div x-data="{ inner: 'wrapper内部' }">
                        <div x-component:inner x-component-options.slots="body"></div>
                    </div>
                </div>
                <div id="outer" x-data="{ label: '外层标签' }">
                    <div id="h" x-component:wrapper>
                        <template x-slot:body>{{ label }}</template>
                    </div>
                </div>
            </div>`,
            { label: "全局标签" },
        );
        await nextTick();
        // 段内表达式读消费者（#outer x-data）作用域，非 wrapper 模板作用域
        expect(root.querySelector(".body")!.textContent).toBe("外层标签");
    });

    // === 并存降级（ADR-0125 决策六）：声明转发的持有者其直供段降级为回退候选 ===
    test("并存降级：消费者段胜过声明转发持有者的直供段", async () => {
        const { root } = mountForward(
            `<div x-scope>
                <div x-define="inner">
                    <footer x-slot:footer>[inner默认脚]</footer>
                </div>
                <div x-define="wrapper">
                    <div x-component:inner x-component-options.slots="footer">
                        <template x-slot:footer>直供段</template>
                    </div>
                </div>
                <div id="h" x-component:wrapper>
                    <template x-slot:footer>消费者脚</template>
                </div>
            </div>`,
        );
        await nextTick();
        // wrapper 对 footer 声明转发 → 直供段降级为候选；消费者段在外层持有者终局命中
        expect(root.querySelector("#h footer")!.textContent).toBe("消费者脚");
    });

    test("并存降级：无消费者段时直供段作为回退候选仍渲染", async () => {
        const { root } = mountForward(
            `<div x-scope>
                <div x-define="inner">
                    <footer x-slot:footer>[inner默认脚]</footer>
                </div>
                <div x-define="wrapper">
                    <div x-component:inner x-component-options.slots="footer">
                        <template x-slot:footer>直供段</template>
                    </div>
                </div>
                <div id="h" x-component:wrapper>
                    <template x-slot:other>无关段</template>
                </div>
            </div>`,
        );
        await nextTick();
        // 链走尽无终局命中 → 最后候选（直供段）兜底，内层 fallback 不渲染
        expect(root.querySelector("#h footer")!.textContent).toBe("直供段");
    });

    test("并存降级：未声明转发名的直供段恒优先（不被消费者越过）", async () => {
        const { root } = mountForward(
            `<div x-scope>
                <div x-define="inner">
                    <header x-slot:header>[inner默认头]</header>
                    <footer x-slot:footer>[inner默认脚]</footer>
                </div>
                <div x-define="wrapper">
                    <div x-component:inner x-component-options.slots="footer">
                        <template x-slot:header>直供头</template>
                        <template x-slot:footer>直供脚</template>
                    </div>
                </div>
                <div id="h" x-component:wrapper>
                    <template x-slot:header>消费者头</template>
                    <template x-slot:footer>消费者脚</template>
                </div>
            </div>`,
        );
        await nextTick();
        // footer 已声明转发 → 直供脚降级，消费者脚胜；header 未声明 → 直供头终局即胜
        expect(root.querySelector("#h header")!.textContent).toBe("直供头");
        expect(root.querySelector("#h footer")!.textContent).toBe("消费者脚");
    });

    test("并存降级：多级并存最外层候选赢（b、c 各有直供段，无消费者时取 c 段）", async () => {
        const { root } = mountForward(
            `<div x-scope>
                <div x-define="a"><p class="deep" x-slot:body>[a默认体]</p></div>
                <div x-define="b">
                    <div x-component:a x-component-options.slots="body">
                        <template x-slot:body>b直供体</template>
                    </div>
                </div>
                <div x-define="c">
                    <div x-component:b x-component-options.slots="body">
                        <template x-slot:body>c直供体</template>
                    </div>
                </div>
                <div id="h" x-component:c>
                    <template x-slot:other>无关段</template>
                </div>
            </div>`,
        );
        await nextTick();
        // 链上两级候选：b 直供体 → 被 c 直供体覆盖（更外层）→ 走尽后 c 直供体兜底
        expect(root.querySelector(".deep")!.textContent).toBe("c直供体");
    });

    test("并存降级：重命名+并存——候选按译名接力，消费者对外名段胜出", async () => {
        const { root } = mountForward(
            `<div x-scope>
                <div x-define="inner">
                    <header x-slot:header>[inner默认头]</header>
                </div>
                <div x-define="wrapper">
                    <div x-component:inner x-component-options.slots="header:card-header">
                        <template x-slot:header>直供头</template>
                    </div>
                </div>
                <div id="h" x-component:wrapper>
                    <template x-slot:card-header>消费者卡片头</template>
                </div>
            </div>`,
        );
        await nextTick();
        // 直供头降级为候选后按译名 card-header 接力上溯，消费者对外名段终局命中
        expect(root.querySelector("#h header")!.textContent).toBe("消费者卡片头");
    });
});
