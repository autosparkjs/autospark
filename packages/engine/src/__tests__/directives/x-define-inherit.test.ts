import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";
import type { ComponentDef } from "../../features/component/component-def";

/**
 * x-define:inherit 组件继承测试（ADR-0081）。
 *
 * 覆盖共识决策：
 * - 模板覆盖：子定义子节点按既有插槽分段规则收集（命名段 / 裸默认段 / 无出口丢弃 / 未提及保留父 fallback），
 *   覆盖 = 替换父快照出口的 fallback 子树（组件实例作用域求值）；
 * - 三层优先级：消费方内容 > 继承覆盖 > 父 fallback；
 * - setup 合并：[父, 子] 扁平合并（data/methods/locals 子同名胜、hooks 串行父先子后、无 super）；
 * - 链式继承递归展开；父快照不被变异（多子继承互不干扰）；
 * - 拒绝注册：父缺失 / 值空 / 指向自身 → warn + 不注册；未知属性参数 warn + 按独立组件注册；
 * - 其余 def 字段：styles 拼接、open/dataContext 子重声明胜否则继承、slots=父全量、根属性并入、声明族属性剥净。
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

/** 父组件 card：三出口（header/default/footer）+ data{count,step} + methods{inc} */
const CARD_DEF = `
<div x-define="card" class="card">
    <div class="hd" x-slot:header>默认标题</div>
    <div class="bd" x-slot>count={{ count }}</div>
    <div class="ft" x-slot:footer></div>
    <script setup>
        {
            data: { count: 0, step: 1 },
            methods: {
                inc() { this.data.count += this.data.step },
            },
        }
    </script>
</div>`;

describe("x-define:inherit 模板覆盖", () => {
    test("基础继承：命名段替换出口 fallback、裸子节点替换默认出口、未提及出口保留父 fallback", async () => {
        const { root } = mount(
            `<div x-scope>${CARD_DEF}
    <div x-define="order-card" x-define:inherit="card">
        <template x-slot:header><h1>订单</h1></template>
        <div>{{ price }}</div>
        <script setup>{ data: { price: 100 } }</script>
    </div>
    <div class="inst" x-component:order-card></div>
</div>`,
            {},
        );
        await nextTick();
        const inst = root.querySelector(".inst")!;
        // header 出口：继承覆盖（template 段 content 子节点展开，无包裹层）
        expect(inst.querySelector(".hd h1")?.textContent).toBe("订单");
        // 默认出口：裸子节点段替换（{{price}} 在组件实例作用域求值——子 data 注入）
        expect(inst.querySelector(".bd")?.textContent?.trim()).toBe("100");
        // footer 出口：未提及 → 父 fallback（空）保留
        expect(inst.querySelector(".ft")?.textContent).toBe("");
    });

    test("覆盖段可见父子全部数据与方法（扁平合并、this.data.count 跨层访问）", async () => {
        const { root } = mount(
            `<div x-scope>${CARD_DEF}
    <div x-define="ext" x-define:inherit="card">
        <div>{{ price }}/{{ count }}<button @click="add">+</button></div>
        <script setup>
            {
                data: { price: 100 },
                methods: { add() { this.data.count += 1 } },
            }
        </script>
    </div>
    <div class="inst" x-component:ext></div>
</div>`,
            {},
        );
        await nextTick();
        const inst = root.querySelector(".inst")!;
        expect(inst.querySelector(".bd")?.textContent?.trim()).toBe("100/0+");
        // 子方法 add 写父 data 键 count（扁平合并同一数据域）
        (inst.querySelector("button") as HTMLElement).click();
        await nextTick();
        expect(inst.querySelector(".bd")?.textContent?.trim()).toBe("100/1+");
    });

    test("三层优先级：消费方内容 > 继承覆盖 > 父 fallback", async () => {
        const { root } = mount(
            `<div x-scope>${CARD_DEF}
    <div x-define="order-card" x-define:inherit="card">
        <template x-slot:header><h1>订单</h1></template>
        <script setup>{}</script>
    </div>
    <div class="a" x-component:order-card></div>
    <div class="b" x-component:order-card>
        <template x-slot:header><h2>消费方标题</h2></template>
    </div>
</div>`,
            {},
        );
        await nextTick();
        // a：无消费方内容 → 继承覆盖胜出
        expect(root.querySelector(".a .hd h1")?.textContent).toBe("订单");
        // b：消费方提供 header 内容 → 覆盖继承覆盖
        expect(root.querySelector(".b .hd h2")?.textContent).toBe("消费方标题");
    });

    test("无对应父出口的覆盖段 warn + 丢弃（组件照常注册）", async () => {
        const { warns, restore } = captureWarns();
        try {
            const { root } = mount(
                `<div x-scope>${CARD_DEF}
    <div x-define="ext" x-define:inherit="card">
        <template x-slot:extra><i>多余</i></template>
        <script setup>{}</script>
    </div>
    <div class="inst" x-component:ext></div>
</div>`,
                {},
            );
            await nextTick();
            expect(warns.some((w) => w.includes("无对应出口"))).toBe(true);
            // 组件仍注册且实例化正常（extra 内容不出现）
            expect(root.querySelector(".inst .hd")?.textContent).toBe("默认标题");
            expect(root.querySelector(".inst i")).toBeNull();
        } finally {
            restore();
        }
    });

    test("空命名段=显式抑制父 fallback（存在即提供）", async () => {
        const { root } = mount(
            `<div x-scope>${CARD_DEF}
    <div x-define="mute" x-define:inherit="card">
        <template x-slot:header></template>
        <script setup>{}</script>
    </div>
    <div class="inst" x-component:mute></div>
</div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".inst .hd")?.textContent).toBe("");
    });

    test("覆盖段声明作用域形参：warn + 忽略形参按普通覆盖编译", async () => {
        const { warns, restore } = captureWarns();
        try {
            const { root } = mount(
                `<div x-scope>${CARD_DEF}
    <div x-define="ext" x-define:inherit="card">
        <template x-slot:header="{ title }"><span>{{ title }}</span></template>
        <script setup>{}</script>
    </div>
    <div class="inst" x-component:ext></div>
</div>`,
                {},
            );
            await nextTick();
            expect(
                warns.some((w) => w.includes("作用域形参") || w.includes("形参")),
            ).toBe(true);
            // 形参被忽略：title 未定义 → 空串渲染，但覆盖本身生效（span 在场）
            expect(root.querySelector(".inst .hd span")).not.toBeNull();
        } finally {
            restore();
        }
    });
});

describe("x-define:inherit setup 合并", () => {
    test("data 合并：父键 + 子键全可见，同名键子胜", async () => {
        const { root } = mount(
            `<div x-scope>
    <div x-define="p">
        <div>{{ a }}-{{ b }}-{{ c }}</div>
        <script setup>{ data: { a: 1, b: 1, c: 1 } }</script>
    </div>
    <div x-define="c" x-define:inherit="p">
        <script setup>{ data: { b: 2, d: 9 } }</script>
    </div>
    <div class="inst" x-component:c></div>
</div>`,
            {},
        );
        await nextTick();
        // p 的默认出口 fallback 仍在（子未覆盖）：a/c 来自父、b 子胜、d 子新增（模板未引用不显示）
        expect(root.querySelector(".inst")?.textContent?.trim()).toBe("1-2-1");
    });

    test("methods 合并：父子并用，同名子整体覆盖", async () => {
        const { root } = mount(
            `<div x-scope>
    <div x-define="p">
        <span class="n">{{ n }}</span>
        <button class="f" @click="run"></button>
        <div class="zone" x-slot><i>默认</i></div>
        <script setup>
            {
                data: { n: 0 },
                methods: {
                    run() { this.data.n = 100 },
                    keep() { this.data.n = 7 },
                },
            }
        </script>
    </div>
    <div x-define="c" x-define:inherit="p">
        <button class="g" @click="keep"></button>
        <script setup>{ methods: { run() { this.data.n = 200 } } }</script>
    </div>
    <div class="inst" x-component:c></div>
</div>`,
            {},
        );
        await nextTick();
        const inst = root.querySelector(".inst")!;
        // 子覆盖默认出口：.g 就位、父默认 <i> 被替换；父模板出口外结构（.n/.f）保留
        expect(inst.querySelector(".zone i")).toBeNull();
        expect(inst.querySelector(".g")).not.toBeNull();
        // 同名 run：子覆盖（200）；父方法 keep 保留可用
        (inst.querySelector(".f") as HTMLElement).click();
        await nextTick();
        expect(inst.querySelector(".n")?.textContent).toBe("200");
        (inst.querySelector(".g") as HTMLElement).click();
        await nextTick();
        expect(inst.querySelector(".n")?.textContent).toBe("7");
    });

    test("hooks 串行：父先子后（created 顺序入 globalState）", async () => {
        const { root, engine } = mount(
            `<div x-scope>
    <div x-define="p">
        <script setup>{ created() { this.globalState.log.push("p") } }</script>
    </div>
    <div x-define="c" x-define:inherit="p">
        <script setup>{ created() { this.globalState.log.push("c") } }</script>
    </div>
    <div class="inst" x-component:c></div>
</div>`,
            { log: [] },
        );
        await nextTick();
        expect((engine.store.state as any).log).toEqual(["p", "c"]);
        // 组件注册在场（实例化成功）
        expect(root.querySelector(".inst")).not.toBeNull();
    });

    test("locals 合并与 data 工厂形态：父工厂 + 子字面量，子同名键胜", async () => {
        const { root } = mount(
            `<div x-scope>
    <div x-define="p">
        <div>{{ tag }}</div>
        <script setup>
            {
                data() { return { tag: "p", shared: 1 } },
                locals: { timer: 1 },
            }
        </script>
    </div>
    <div x-define="c" x-define:inherit="p">
        <script setup>
            {
                data: { shared: 2 },
                locals: { extra: 3 },
            }
        </script>
    </div>
    <div class="inst" x-component:c></div>
</div>`,
            {},
        );
        await nextTick();
        // 父 data 工厂 + 子对象字面量：归一化为每实例工厂，父先子后浅合并
        expect(root.querySelector(".inst")?.textContent?.trim()).toBe("p");
    });
});

describe("x-define:inherit 链式与隔离", () => {
    test("链式继承：base ← card ← order-card 递归展开到根", async () => {
        const { root } = mount(
            `<div x-scope>
    <div x-define="base">
        <div class="base-bd" x-slot>{{ baseMsg }}</div>
        <script setup>{ data: { baseMsg: "B" } }</script>
    </div>
    <div x-define="card" x-define:inherit="base">
        <div class="base-bd">{{ baseMsg }}/{{ cardMsg }}</div>
        <script setup>{ data: { cardMsg: "C" } }</script>
    </div>
    <div x-define="order-card" x-define:inherit="card">
        <div class="base-bd">{{ baseMsg }}/{{ cardMsg }}/{{ orderMsg }}</div>
        <script setup>{ data: { orderMsg: "O" } }</script>
    </div>
    <div class="inst" x-component:order-card></div>
</div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".inst .base-bd")?.textContent?.trim()).toBe("B/C/O");
    });

    test("父快照不被变异：子继承后父组件自身实例化仍显示原 fallback", async () => {
        const { root } = mount(
            `<div x-scope>${CARD_DEF}
    <div x-define="order-card" x-define:inherit="card">
        <template x-slot:header><h1>订单</h1></template>
        <script setup>{}</script>
    </div>
    <div class="child-inst" x-component:order-card></div>
    <div class="parent-inst" x-component:card></div>
</div>`,
            {},
        );
        await nextTick();
        // 子实例：header 被覆盖
        expect(root.querySelector(".child-inst .hd h1")?.textContent).toBe("订单");
        // 父实例：fallback 原封不动（深克隆、父不被变异）
        expect(root.querySelector(".parent-inst .hd")?.textContent).toBe("默认标题");
        expect(root.querySelector(".parent-inst .bd")?.textContent?.trim()).toBe("count=0");
    });

    test("多子继承同一父互不干扰", async () => {
        const { root } = mount(
            `<div x-scope>${CARD_DEF}
    <div x-define="a" x-define:inherit="card">
        <template x-slot:header"><b>A头</b></template>
        <script setup>{}</script>
    </div>
    <div x-define="b" x-define:inherit="card">
        <script setup>{}</script>
    </div>
    <div class="ia" x-component:a></div>
    <div class="ib" x-component:b></div>
</div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".ia .hd b")?.textContent).toBe("A头");
        expect(root.querySelector(".ib .hd")?.textContent).toBe("默认标题");
    });
});

describe("x-define:inherit 拒绝注册与声明校验", () => {
    test("父未就绪（无异步来源的 typo）：软 warn 挂起 + 不注册（ADR-0083）", async () => {
        const { warns, restore } = captureWarns();
        try {
            const { root, engine } = mount(
                `<div x-scope>
    <div x-define="orphan" x-define:inherit="nope">
        <script setup>{}</script>
    </div>
</div>`,
                {},
            );
            await nextTick();
            // 挂起期软提示（typo 与异步未归同形；终局诊断只剩使用处 loading 与 fetch 失败提示）
            expect(warns.some((w) => w.includes("暂未就绪") && w.includes("nope"))).toBe(true);
            // 不注册：scope 链上无该组件；声明元素照常剪枝（不进结果 DOM）
            const scope = engine.findScopeByEl(root.firstElementChild as HTMLElement);
            expect(scope?.getComponentDeclaration("orphan")).toBeUndefined();
            expect(root.querySelector("[x-define]")).toBeNull();
        } finally {
            restore();
        }
    });

    test("值空 / 指向自身：warn + 拒绝注册", async () => {
        const { warns, restore } = captureWarns();
        try {
            const { root } = mount(
                `<div x-scope>
    <div x-define="e1" x-define:inherit="">
        <script setup>{}</script>
    </div>
    <div x-define="e2" x-define:inherit="e2">
        <script setup>{}</script>
    </div>
</div>`,
                {},
            );
            await nextTick();
            expect(warns.some((w) => w.includes("值为空"))).toBe(true);
            expect(warns.some((w) => w.includes("指向自身"))).toBe(true);
            expect(root.querySelector("[x-define]")).toBeNull();
        } finally {
            restore();
        }
    });

    test("未知属性参数：warn + 按独立组件注册", async () => {
        const { warns, restore } = captureWarns();
        try {
            const { root, engine } = mount(
                `<div x-scope>
    <div x-define="solo" x-define:foo="x"><i>独立</i></div>
</div>`,
                {},
            );
            await nextTick();
            expect(warns.some((w) => w.includes("未知属性参数") && w.includes("foo"))).toBe(true);
            // 独立注册：快照为自身子树
            const scope = engine.findScopeByEl(root.firstElementChild as HTMLElement);
            const snap = scope?.getComponentDeclaration("solo");
            expect(snap).toBeDefined();
            expect(snap!.querySelector("i")?.textContent).toBe("独立");
        } finally {
            restore();
        }
    });
});

describe("super 引用（ADR-0082）", () => {
    test("基础：子覆盖方法内 this.super.方法() 调用父实现，this 同实例（同一合并 data 域）", async () => {
        const { root, engine } = mount(
            `<div x-scope>
    <div x-define="p">
        <span class="n">{{ n }}</span>
        <div class="zone" x-slot><i>默认</i></div>
        <script setup>
            {
                data: { n: 0 },
                methods: {
                    inc() { this.data.n += 1 },
                    describe() { return 'n=' + this.data.n },
                },
            }
        </script>
    </div>
    <div x-define="c" x-define:inherit="p">
        <button class="b" x-on:click="inc"></button>
        <script setup>
            {
                methods: {
                    inc() { this.super.inc(); this.data.n += 10 },
                    callDescribe() { return this.super.describe() },
                },
            }
        </script>
    </div>
    <div class="inst" x-component:c></div>
</div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector(".inst") as HTMLElement;
        // 模板 @click 路径（经包装器置层）：super.inc() 先 +1，再 +10 → 11
        (root.querySelector(".b") as HTMLElement).click();
        await nextTick();
        expect(root.querySelector(".n")?.textContent).toBe("11");
        // 父方法经 super 调用时 this 绑定同一实例：读到子实例的合并 data 域
        const inst = engine.getComponent(host)!;
        expect(inst.methods.callDescribe()).toBe("n=11");
    });

    test("精确词法链：三层同名覆盖各层 super 正确解析（mid 的 super 是 base，无无限递归）", async () => {
        const { root, engine } = mount(
            `<div x-scope>
    <div x-define="base">
        <script setup>{ methods: { log() { this.globalState.log.push('base') } } }</script>
    </div>
    <div x-define="mid" x-define:inherit="base">
        <script setup>
            {
                methods: {
                    log() {
                        this.globalState.log.push('mid-start');
                        this.super.log();
                        this.globalState.log.push('mid-end');
                    },
                },
            }
        </script>
    </div>
    <div x-define="leaf" x-define:inherit="mid">
        <script setup>{ methods: { log() { this.globalState.log.push('leaf'); this.super.log() } } }</script>
    </div>
    <div class="inst" x-component:leaf></div>
</div>`,
            { log: [] },
        );
        await nextTick();
        const host = root.querySelector(".inst") as HTMLElement;
        engine.getComponent(host)!.methods.log();
        // leaf → mid-start → base（mid 的 super 词法指向 base，不是 mid 自己）→ mid-end
        expect((engine.store.state as any).log).toEqual([
            "leaf",
            "mid-start",
            "base",
            "mid-end",
        ]);
    });

    test("非继承组件 this.super === undefined；父无 methods 时为空对象（成员 undefined）", async () => {
        const { root, engine } = mount(
            `<div x-scope>
    <div x-define="plain">
        <script setup>{ methods: { probe() { this.globalState.superVal = this.super } } }</script>
    </div>
    <div x-define="nomethod-parent"><i>x</i></div>
    <div x-define="child" x-define:inherit="nomethod-parent">
        <script setup>
            {
                methods: {
                    probe() {
                        this.globalState.childSuperType = typeof this.super;
                        this.globalState.childSuperFoo = this.super.foo;
                    },
                },
            }
        </script>
    </div>
    <div class="a" x-component:plain></div>
    <div class="b" x-component:child></div>
</div>`,
            {},
        );
        await nextTick();
        engine.getComponent(root.querySelector(".a") as HTMLElement)!.methods.probe();
        expect((engine.store.state as any).superVal).toBeUndefined();
        engine.getComponent(root.querySelector(".b") as HTMLElement)!.methods.probe();
        const st = engine.store.state as any;
        expect(st.childSuperType).toBe("object");
        expect(st.childSuperFoo).toBeUndefined();
    });

    test("hooks 内可用（执行栈外按实例层解析 → 直接父）；门面 super 对称", async () => {
        const { root, engine } = mount(
            `<div x-scope>
    <div x-define="p">
        <span class="n">{{ n }}</span>
        <script setup>
            {
                data: { n: 0 },
                methods: { inc() { this.data.n += 5 } },
            }
        </script>
    </div>
    <div x-define="c" x-define:inherit="p">
        <script setup>
            {
                methods: { inc() { this.super.inc(); this.data.n += 1 } },
                created() { this.globalState.superInHook = typeof this.super.inc },
            }
        </script>
    </div>
    <div class="inst" x-component:c></div>
</div>`,
            {},
        );
        await nextTick();
        // hooks 内：super 指直接父方法集
        expect((engine.store.state as any).superInHook).toBe("function");
        // 门面：inst.super.inc() 与组件内 this.super 同源（栈外按实例层 → 直接父）
        const host = root.querySelector(".inst") as HTMLElement;
        const inst = engine.getComponent(host)!;
        expect(typeof inst.super?.inc).toBe("function");
        inst.super.inc();
        await nextTick();
        expect(root.querySelector(".n")?.textContent).toBe("5");
    });

    test("super 是保留键：setup 顶层私有变量重名被忽略（this.super 仍走内置视图）", async () => {
        const { root, engine } = mount(
            `<div x-scope>
    <div x-define="p">
        <script setup>{ methods: { inc() {} } }</script>
    </div>
    <div x-define="c" x-define:inherit="p">
        <script setup>
            {
                super: 123,
                methods: {
                    probe() {
                        // 只记录形态（冻结视图对象不可写入响应式 state）
                        this.globalState.superType = typeof this.super;
                        this.globalState.superInc = typeof this.super?.inc;
                    },
                },
            }
        </script>
    </div>
    <div class="inst" x-component:c></div>
</div>`,
            {},
        );
        await nextTick();
        engine.getComponent(root.querySelector(".inst") as HTMLElement)!.methods.probe();
        const st = engine.store.state as any;
        // 内置优先：this.super 是视图对象（含 inc），不是顶层声明的 123（number）
        expect(st.superType).toBe("object");
        expect(st.superInc).toBe("function");
    });
});

describe("x-import 异步父延迟解析（ADR-0083）", () => {
    /** fetch mock：以固定 HTML 应答任意 url */
    function mockFetch(html: string): () => void {
        const orig = globalThis.fetch;
        globalThis.fetch = (async () => new Response(html, { status: 200 })) as any;
        return () => {
            globalThis.fetch = orig;
        };
    }

    /** 等待异步链（fetch → 注册 → 排水 → 消费侧重实例化）全部落地 */
    const settle = () => new Promise<void>((r) => setTimeout(r, 20));

    const REMOTE_CARD = `<div x-define="card" class="card">
    <div class="hd" x-slot:header>默认标题</div>
    <div class="bd" x-slot>count={{ count }}</div>
    <script setup>{ data: { count: 7 }, methods: { inc() { this.data.count += 1 } } }</script>
</div>`;

    test("本地子 + x-import 异步父：挂起 → 父注册排水 → 子注册渲染", async () => {
        const restoreFetch = mockFetch(REMOTE_CARD);
        const { warns, restore } = captureWarns();
        try {
            const { root } = mount(
                `<div x-scope>
    <div x-import="/base.html"></div>
    <div x-define="order-card" x-define:inherit="card">
        <template x-slot:header><b>订单</b></template>
        <script setup>{ data: { price: 100 } }</script>
    </div>
    <div class="inst" x-component:order-card></div>
</div>`,
                {},
            );
            // 编译期：父未归 → 挂起软 warn
            expect(warns.some((w) => w.includes("暂未就绪") && w.includes("card"))).toBe(true);
            await settle();
            // 异步父注册 → 排水 → 子解析注册 → 消费侧脱离 loading 正常渲染（继承覆盖 + 合并 data）
            expect(root.querySelector(".inst .hd b")?.textContent).toBe("订单");
            expect(root.querySelector(".inst .bd")?.textContent?.trim()).toBe("count=7");
            expect(root.querySelector(".inst")?.hasAttribute("x-loading")).toBe(false);
        } finally {
            restore();
            restoreFetch();
        }
    });

    test("级联：本地孙等本地子、子等远程父——任意到达顺序逐级解锁（super 跨异步层正确）", async () => {
        const restoreFetch = mockFetch(REMOTE_CARD);
        try {
            const { root } = mount(
                `<div x-scope>
    <div x-import="/base.html"></div>
    <div x-define="order-card" x-define:inherit="card">
        <script setup>{ data: { price: 100 } }</script>
    </div>
    <div x-define="vip-card" x-define:inherit="order-card">
        <div>count={{ count }}<button class="inc" x-on:click="inc">+</button></div>
        <script setup>{ methods: { inc() { this.super.inc(); this.data.count += 10 } } }</script>
    </div>
    <div class="inst" x-component:vip-card></div>
</div>`,
                {},
            );
            await settle();
            // 三层链就位：card(远程) ← order-card(先挂起后排水) ← vip-card(再排水)
            const inst = root.querySelector(".inst") as HTMLElement;
            expect(inst.querySelector(".bd")?.textContent?.trim()).toBe("count=7+");
            // vip-card 覆盖 inc：super（= order-card 层的 inc，即 card 的实现）+1 后再 +10
            (inst.querySelector(".inc") as HTMLElement).click();
            await nextTick();
            expect(inst.querySelector(".bd")?.textContent?.trim()).toBe("count=18+");
        } finally {
            restoreFetch();
        }
    });

    test("同文件远程继承（父在子前）：同步解析直接注册，无挂起", async () => {
        const restoreFetch = mockFetch(
            `${REMOTE_CARD}
<div x-define="ext-card" x-define:inherit="card">
    <template x-slot:header"><b>远程子</b></template>
    <script setup>{}</script>
</div>`,
        );
        const { warns, restore } = captureWarns();
        try {
            const { root } = mount(
                `<div x-scope>
    <div x-import="/both.html"></div>
    <div class="inst" x-component:ext-card></div>
</div>`,
                {},
            );
            await settle();
            expect(root.querySelector(".inst .hd b")?.textContent).toBe("远程子");
            expect(root.querySelector(".inst .bd")?.textContent?.trim()).toBe("count=7");
            // 同文件内父先注册——不经过挂起路径
            expect(warns.some((w) => w.includes("暂未就绪"))).toBe(false);
        } finally {
            restore();
            restoreFetch();
        }
    });

    test("fetch 失败：提示仍未就绪的挂起父名（诊断补偿）", async () => {
        const orig = globalThis.fetch;
        globalThis.fetch = (async () => {
            throw new Error("网络炸了");
        }) as any;
        const { warns, restore } = captureWarns();
        try {
            mount(
                `<div x-scope>
    <div x-import="/base.html"></div>
    <div x-define="order-card" x-define:inherit="card">
        <script setup>{}</script>
    </div>
</div>`,
                {},
            );
            await settle();
            expect(warns.some((w) => w.includes("加载") && w.includes("失败"))).toBe(true);
            expect(
                warns.some((w) => w.includes("仍未就绪") && w.includes("card")),
            ).toBe(true);
        } finally {
            restore();
            globalThis.fetch = orig;
        }
    });
});

describe("x-define:extends 别名（ADR-0081 修订）", () => {
    test("别名等价：x-define:extends 与 inherit 解析行为一致", async () => {
        const { root, engine } = mount(
            `<div x-scope>${CARD_DEF}
    <div x-define="order-card" x-define:extends="card">
        <template x-slot:header><b>订单</b></template>
        <script setup>{}</script>
    </div>
    <div class="inst" x-component:order-card></div>
</div>`,
            {},
        );
        await nextTick();
        // 覆盖生效 + def.inherit 记录父名（与 inherit 关键字一致）
        expect(root.querySelector(".inst .hd b")?.textContent).toBe("订单");
        expect(defOf(engine, root, "order-card")?.inherit).toBe("card");
    });

    test("双别名同元素并写：文档序首个胜 + warn", async () => {
        const { warns, restore } = captureWarns();
        try {
            const { root, engine } = mount(
                `<div x-scope>${CARD_DEF}
    <div x-define="e1" x-define:inherit="card" x-define:extends="nope">
        <script setup>{}</script>
    </div>
</div>`,
                {},
            );
            await nextTick();
            expect(warns.some((w) => w.includes("同时声明"))).toBe(true);
            // 首个（inherit="card"）生效——若误用 nope 会因父缺失拒绝注册
            expect(defOf(engine, root, "e1")?.inherit).toBe("card");
        } finally {
            restore();
        }
    });
});

describe("x-define:inherit def 字段继承", () => {
    test("def 元数据：inherit 记录父名、slots=父全量、声明族属性剥净", async () => {
        const { root, engine } = mount(
            `<div x-scope>${CARD_DEF}
    <div x-define="order-card" class="order" x-define:inherit="card">
        <template x-slot:header><h1>订单</h1></template>
        <script setup>{}</script>
    </div>
</div>`,
            {},
        );
        await nextTick();
        const def = defOf(engine, root, "order-card");
        expect(def).toBeDefined();
        expect(def!.inherit).toBe("card");
        expect(def!.slots).toEqual(["header", "default", "footer"]);
        // 解析后快照根：声明族属性剥净 + 子根属性并入（class 拼接父在前子在后）
        expect(def!.snapshot.hasAttribute("x-define")).toBe(false);
        expect(def!.snapshot.hasAttribute("x-define:inherit")).toBe(false);
        expect(def!.snapshot.getAttribute("class")).toBe("card order");
    });

    test("styles / styleBinds：父子拼接（子在后）", async () => {
        const { root, engine } = mount(
            `<div x-scope>
    <div x-define="p">
        <div>p</div>
        <style>.p { color: red }</style>
    </div>
    <div x-define="c" x-define:inherit="p">
        <style>.c { color: blue }</style>
    </div>
</div>`,
            {},
        );
        await nextTick();
        const def = defOf(engine, root, "c");
        expect(def!.styles).toEqual([{ css: ".p { color: red }" }, { css: ".c { color: blue }" }]);
    });

    test("open / dataContext：子未重声明则继承父，子显式关闭胜", async () => {
        const { root, engine } = mount(
            `<div x-scope>
    <div x-define="p" x-define-options="{open:true,dataContext:'declarer'}">
        <div x-slot>p</div>
    </div>
    <div x-define="keep" x-define:inherit="p"><div>k</div></div>
    <div x-define="closed" x-define:inherit="p" x-define-options="{open:false}"><div>x</div></div>
</div>`,
            {},
        );
        await nextTick();
        // 未重声明：整体继承
        const keep = defOf(engine, root, "keep");
        expect(keep!.open).toBe(true);
        expect(keep!.dataContext).toBe("declarer");
        // 子显式 false：关闭胜
        const closed = defOf(engine, root, "closed");
        expect(closed!.open).toBe(false);
        expect(closed!.dataContext).toBeUndefined();
    });

    test("根属性并入：实例化后宿主 class 合并父根与子根", async () => {
        const { root } = mount(
            `<div x-scope>${CARD_DEF}
    <div x-define="order-card" class="order" data-kind="order" x-define:inherit="card">
        <script setup>{}</script>
    </div>
    <div class="host" x-component:order-card></div>
</div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector(".host")!;
        // 宿主 class + 解析后组件根 class（card order）合并；子根普通属性补充
        expect(host.classList.contains("host")).toBe(true);
        expect(host.classList.contains("card")).toBe(true);
        expect(host.classList.contains("order")).toBe(true);
        expect(host.getAttribute("data-kind")).toBe("order");
    });
});
