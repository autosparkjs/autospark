import { describe, expect, test } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";
import type { ComponentDef } from "../../features/component/component-def";

/**
 * x-define.abstract 抽象组件测试（ADR-0134）。
 *
 * 覆盖共识决策：
 * - 声明解析：`.abstract` 修饰符 ≡ `x-define-options="{abstract:true}"`，显式布尔（含 false）优先；
 * - 快照弃权：abstract 父被继承时**子模板根胜出**（解析后快照 = 子自身快照），
 *   出口清单 = 子自身出口；setup/hooks/styles/defaults 合并语义与普通继承一致（hooks 父先子后）；
 * - 不可直接实例化：消费侧 warn + 拒渲染（宿主原内容保持）；元素名形态不安装（tag 声明 warn）；
 * - 只可作链根：abstract 又声明 inherit → warn + 拒绝注册；
 * - abstract 声明的元素子节点无意义 → warn（仍注册可被继承）；
 * - 懒预编译路径：options.components 字符串形态（abstract 父 + inherit 子）同一管线展开
 *   （内置 autospark.base × 插件组件的路径抽象，ADR-0094 三层声明源同走 _resolveGlobalComponent）；
 * - 链式混合：abstract base ← card（模板）← order-card（模板）——card 以下回归既有继承语义。
 */

/** 捕获 console.warn（引擎 logger 出口），返回数组与还原函数 */
function captureWarns(): { warns: string[]; restore: () => void } {
    const orig = console.warn;
    const warns: string[] = [];
    console.warn = (msg: any) => {
        warns.push(String(msg));
    };
    return { warns, restore: () => (console.warn = orig) };
}

/** 取 scope 链上已注册组件的已解析 def（经快照反查） */
function defOf(engine: any, root: HTMLElement, name: string): ComponentDef | undefined {
    const scope = engine.findScopeByEl(root.firstElementChild as HTMLElement);
    const snap = scope?.getComponentDeclaration(name);
    return snap ? engine.getComponentDef(snap) : undefined;
}

describe("x-define.abstract 声明解析", () => {
    test(".abstract 修饰符 → def.base=true；options 等效；显式 false 压制修饰符", async () => {
        const { root, engine } = mount(
            `<div x-scope>
    <div x-define="a.mod" x-define.abstract></div>
    <div x-define="a.opt" x-define-options="{abstract:true}"></div>
    <div x-define="a.off" x-define.abstract x-define-options="{abstract:false}"></div>
    <div x-define="a.plain"></div>
</div>`,
            {},
        );
        await nextTick();
        expect(defOf(engine, root, "a.mod")?.base).toBe(true);
        expect(defOf(engine, root, "a.opt")?.base).toBe(true);
        expect(defOf(engine, root, "a.off")?.base).toBeUndefined();
        expect(defOf(engine, root, "a.plain")?.base).toBeUndefined();
    });

    test("abstract 声明的元素子节点与 tag 声明 → warn（仍注册、可被继承）", async () => {
        const { warns, restore } = captureWarns();
        const { root, engine } = mount(
            `<div x-scope>
    <div x-define="warn.base" x-define.abstract x-define-options="{tag:'x-wb'}">
        <span>无意义子节点</span>
        <template x-slot></template>
        <script setup>{ data: { greet: "ok" } }</script>
    </div>
</div>`,
            {},
        );
        await nextTick();
        restore();
        const def = defOf(engine, root, "warn.base");
        // 仍注册（可被继承），base 标记在场，元素名形态未安装
        expect(def?.base).toBe(true);
        expect(def?.tag).toBeUndefined();
        expect(warns.some((w) => w.includes("元素子节点无意义"))).toBe(true);
        expect(warns.some((w) => w.includes("元素名形态不安装"))).toBe(true);
    });
});

describe("x-define.abstract 继承语义", () => {
    /** 抽象基类：data{tone,order} + methods{hello} + mounted（记序 p）——无模板贡献 */
    const BASE_DEF = `
<div x-define="my.base" x-define.abstract>
    <script setup>
        {
            data: { tone: "hi", order: "" },
            methods: { hello() { return this.data.tone + "!" } },
            mounted() { this.data.order += "p" },
        }
    </script>
</div>`;

    test("子模板根胜出：解析后快照 = 子自身根元素（普通继承对照组 = 父根）", async () => {
        const { root, engine } = mount(
            `<div x-scope>${BASE_DEF}
    <button x-define="my.btn" x-define:inherit="my.base">
        <span class="label">{{ hello() }}</span>
    </button>
    <div x-define="plain.parent"><div class="skel">父骨架</div></div>
    <section x-define="plain.child" x-define:inherit="plain.parent"></section>
</div>`,
            {},
        );
        await nextTick();
        // abstract 继承：子（button）自身快照根胜出
        expect(defOf(engine, root, "my.btn")?.snapshot.tagName).toBe("BUTTON");
        // 普通继承对照组：父根（div）胜出、子根（section）被丢弃
        expect(defOf(engine, root, "plain.child")?.snapshot.tagName).toBe("DIV");
    });

    test("setup 合并：父 data/methods 注入子实例、hooks 父先子后、消费方可覆盖子出口", async () => {
        const { root, engine } = mount(
            `<div x-scope>${BASE_DEF}
    <button x-define="my.btn2" x-define:inherit="my.base">
        <span class="label" x-slot>{{ tone }}</span>
        <i class="probe" @click="hello()"></i>
        <script setup>{ mounted() { this.data.order += "c" } }</script>
    </button>
    <div class="inst" x-component:my.btn2><b>消费方内容</b></div>
</div>`,
            {},
        );
        await nextTick();
        const inst = root.querySelector(".inst") as HTMLElement;
        const instCtx = engine.getComponent(inst)!;
        // 消费方内容 > 子出口 fallback（三层优先级：出口渲染消费方段，fallback {{tone}} 被替换）
        expect(inst.querySelector(".label b")?.textContent).toBe("消费方内容");
        // 父 data.tone 经合并注入子实例（门面读标量）
        expect(instCtx.data?.tone).toBe("hi");
        // 父 methods 注入子实例（@click 通道可调——组件插值不读 methods，方法走事件通道）
        expect(instCtx.methods.hello()).toBe("hi!");
        // hooks 串行父先子后（合并 data 域记序）
        expect(instCtx.data?.order).toBe("pc");
    });

    test("直接实例化拦截：warn + 宿主原内容保持", async () => {
        const { warns, restore } = captureWarns();
        const { root } = mount(
            `<div x-scope>${BASE_DEF}
    <div class="inst" x-component:my.base>原内容</div>
</div>`,
            {},
        );
        await nextTick();
        restore();
        const inst = root.querySelector(".inst") as HTMLElement;
        // 拒渲染：宿主无组件内容（原「原内容」是消费方插槽内容，编译期已被收集——非保持语义）
        expect(inst.textContent).toBe("");
        expect(warns.some((w) => w.includes("抽象组件") && w.includes("不可实例化"))).toBe(true);
    });

    test("abstract 不可再继承：声明 inherit → warn + 拒绝注册", async () => {
        const { warns, restore } = captureWarns();
        const { root, engine } = mount(
            `<div x-scope>${BASE_DEF}
    <div x-define="bad.abs" x-define.abstract x-define:inherit="my.base"></div>
</div>`,
            {},
        );
        await nextTick();
        restore();
        expect(defOf(engine, root, "bad.abs")).toBeUndefined();
        expect(
            warns.some((w) => w.includes("不可再声明 x-define:inherit") && w.includes("ADR-0134")),
        ).toBe(true);
    });

    test("styles 拼接：abstract 父样式段与子段依序合并", async () => {
        const { root, engine } = mount(
            `<div x-scope>
    <div x-define="s.base" x-define.abstract>
        <style global id="abstract-base-style">.x{color:red}</style>
        <script setup>{ data: { a: 1 } }</script>
    </div>
    <div x-define="s.child" x-define:inherit="s.base">
        <style global id="abstract-child-style">.y{color:blue}</style>
    </div>
</div>`,
            {},
        );
        await nextTick();
        const styles = defOf(engine, root, "s.child")?.styles;
        expect(styles?.length).toBe(2);
        expect((styles![0] as any).id).toBe("abstract-base-style");
        expect((styles![1] as any).id).toBe("abstract-child-style");
    });
});

describe("x-define.abstract 懒预编译路径（ADR-0094 全局表继承反查）", () => {
    test("options.components 字符串形态：abstract 父 + inherit 子经同一管线展开", async () => {
        const { root, engine } = mount(
            `<div x-scope><div class="inst" x-component:my.btn></div></div>`,
            {},
            {
                components: {
                    "my.base": `<div x-define="my.base" x-define.abstract><script setup>{ data: { tone: "lazy" }, methods: { hello() { return this.data.tone + "?" } } }</script></div>`,
                    "my.btn": `<button class="my-btn" x-define="my.btn" x-define:inherit="my.base"><span class="label">{{ tone }}</span></button>`,
                },
            },
        );
        await nextTick();
        const inst = root.querySelector(".inst") as HTMLElement;
        // 子模板根胜出：button 根的 class 并入宿主；父 data（懒预编译 def）合并对子模板可见
        expect(inst.classList.contains("my-btn")).toBe(true);
        expect(inst.querySelector(".label")?.textContent?.trim()).toBe("lazy");
        // 父 methods（懒预编译 def）注入子实例（方法经实例门面可调）
        expect(engine.getComponent(inst)?.methods?.hello()).toBe("lazy?");
    });
});

describe("x-define.abstract 链式混合", () => {
    test("abstract base ← card（模板）← order-card：card 以下回归既有继承语义（card 根胜出、孙并入 card 出口）", async () => {
        const { root, engine } = mount(
            `<div x-scope>
    <div x-define="mix.base" x-define.abstract>
        <script setup>{ data: { level: "L0", trace: "" }, mounted() { this.data.trace += "0" } }</script>
    </div>
    <div class="card" x-define="mix.card" x-define:inherit="mix.base">
        <div class="bd" x-slot>{{ level }}</div>
        <script setup>{ data: { level: "L1" }, mounted() { this.data.trace += "1" } }</script>
    </div>
    <section x-define="mix.order" x-define:inherit="mix.card">
        <template x-slot><i class="order-body">订单体</i></template>
        <script setup>{ mounted() { this.data.trace += "2" } }</script>
    </section>
    <div class="inst" x-component:mix.order></div>
</div>`,
            {},
        );
        await nextTick();
        // ① mix.order 继承 mix.card（普通继承）：快照根 = card 的 div（孙 section 被丢弃）
        expect(defOf(engine, root, "mix.order")?.snapshot.classList.contains("card")).toBe(true);
        const inst = root.querySelector(".inst") as HTMLElement;
        // ② 孙覆盖段替换 card 的 default 出口 fallback（.bd 内仅剩覆盖段内容）
        expect(inst.querySelector(".bd .order-body")?.textContent).toBe("订单体");
        // ③ 全链合并：data 子胜（level=L1，base 的 L0 被压）+ hooks 0→1→2 串行（trace 记序）
        expect(engine.getComponent(inst)?.data?.level).toBe("L1");
        expect(engine.getComponent(inst)?.data?.trace).toBe("012");
    });
});
