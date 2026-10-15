import { describe, expect, test } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";

/**
 * x-define.global 模板内联全局组件声明测试（ADR-0115）。
 *
 * 覆盖 ADR 实现注记测试清单：
 * - 两形态完全等价（.global 修饰符 ≡ x-define-options="{global:true}"，决策 2）；
 * - {global:false} 显式关闭 .global（options 显式布尔含 false 优先）+ 非布尔 warn 回落修饰符；
 * - 孤立（无任何祖先 scope）global 声明注册成功；非 global 孤立维持 warn + 丢弃（决策 3）；
 * - 全局兜底与就近遮蔽并存（决策 1/3）；
 * - 同名覆盖 warn 一次（per 名去重）+ 后者覆盖（决策 6）；
 * - 嵌套全局声明：外层首次实例化才懒注册（决策 7）、多实例重复注册幂等不刷屏（决策 6）；
 * - 继承：作用域父 fail-fast 拒绝注册；全局父未就绪挂起、注册后排水（决策 5）；
 * - `dataContext:'declarer'` 收集期 warn + 丢弃基准回退 host（决策 4）；
 * - registerComponent(code, {scope}) 遇声明自带 global 以声明为准 + warn 一次；
 *   入口本就全局时冗余标记静默（决策 8）；
 * - 允许全局 default 组件（决策 9）。
 */

/** 编译期 warn 捕获：mount（构造函数内同步编译）前打补丁，窗口覆盖 logger 异步 flush */
async function captureCompileWarns(run: () => void): Promise<string[]> {
    const orig = console.warn;
    const warns: string[] = [];
    console.warn = (msg: any) => {
        warns.push(String(msg));
    };
    try {
        run();
        await new Promise((r) => setTimeout(r, 150));
    } finally {
        console.warn = orig;
    }
    return warns;
}

/** 运行期 warn 捕获：engine.logger 首次访问才创建并绑定 console.warn，须在补丁窗口内强制创建 */
async function captureRuntimeWarns(engine: any, fn: () => void): Promise<string[]> {
    const orig = console.warn;
    const warns: string[] = [];
    console.warn = (...args: any[]) => {
        warns.push(String(args[0] ?? ""));
    };
    try {
        void engine.logger;
        fn();
        await new Promise((r) => setTimeout(r, 150));
    } finally {
        console.warn = orig;
    }
    return warns;
}

describe("x-define.global 两形态等价（ADR-0115 决策 2）", () => {
    test(".global 修饰符：入全局表 + declarerScope null + 跨 scope 可消费", async () => {
        let root: HTMLElement;
        let engine: any;
        await captureCompileWarns(() => {
            ({ root, engine } = mount(
                `<div id="a" x-scope>
                    <div x-define.global="g-card"><b>全局卡</b></div>
                    <div class="c1" x-component:g-card></div>
                </div>
                <div id="b" x-scope><div class="c2" x-component:g-card></div></div>`,
                {},
            ));
        });
        const def = engine.getGlobalComponentDef("g-card");
        expect(def).toBeDefined();
        expect(def.declarerScope).toBeNull(); // 全局即脱离声明位置（决策 4）
        expect(root.querySelector(".c1 b")?.textContent).toBe("全局卡");
        expect(root.querySelector(".c2 b")?.textContent).toBe("全局卡"); // 兄弟 scope 兜底可用
    });

    test('x-define-options="{global:true}" 与修饰符等价', async () => {
        let root: HTMLElement;
        let engine: any;
        await captureCompileWarns(() => {
            ({ root, engine } = mount(
                `<div id="a" x-scope>
                    <div x-define="g-card" x-define-options="{global:true}"><b>全局卡</b></div>
                    <div class="c1" x-component:g-card></div>
                </div>
                <div id="b" x-scope><div class="c2" x-component:g-card></div></div>`,
                {},
            ));
        });
        expect(engine.getGlobalComponentDef("g-card")).toBeDefined();
        expect(root.querySelector(".c1 b")?.textContent).toBe("全局卡");
        expect(root.querySelector(".c2 b")?.textContent).toBe("全局卡");
    });

    test("{global:false} 显式关闭 .global：options 显式布尔（含 false）压过修饰符", async () => {
        let root: HTMLElement;
        let engine: any;
        await captureCompileWarns(() => {
            ({ root, engine } = mount(
                `<div id="a" x-scope>
                    <div x-define.global="closed" x-define-options="{global:false}"><b>局部卡</b></div>
                    <div class="c" x-component:closed></div>
                </div>`,
                {},
            ));
        });
        expect(engine.getGlobalComponentDef("closed")).toBeUndefined(); // 未进全局表
        expect(root.querySelector(".c b")?.textContent).toBe("局部卡"); // 仍注册为 scope 局部组件
        const scope = engine.findScopeByEl(root.querySelector("#a"));
        expect(scope.getComponentDeclaration("closed")).toBeTruthy();
    });

    test("options.global 非布尔 → warn + 回落修饰符值", async () => {
        let root: HTMLElement;
        let engine: any;
        const warns = await captureCompileWarns(() => {
            ({ root, engine } = mount(
                `<div id="a" x-scope>
                    <div x-define.global="nb" x-define-options="{global:'yes'}"><b>N</b></div>
                    <div class="c" x-component:nb></div>
                </div>`,
                {},
            ));
        });
        expect(warns.some((w) => w.includes("须为布尔值"))).toBe(true);
        expect(engine.getGlobalComponentDef("nb")).toBeDefined(); // 回落修饰符 .global → 全局
        expect(root.querySelector(".c b")?.textContent).toBe("N");
    });
});

describe("x-define.global 归属（ADR-0115 决策 3）", () => {
    test("孤立声明（无任何祖先 scope）注册成功且不 warn", async () => {
        let root: HTMLElement;
        let engine: any;
        const warns = await captureCompileWarns(() => {
            ({ root, engine } = mount(
                `<div x-define.global="solo"><b>S</b></div>
                 <div x-scope><div class="c" x-component:solo></div></div>`,
                {},
            ));
        });
        expect(warns.some((w) => w.includes("未找到任何祖先 scope"))).toBe(false);
        expect(engine.getGlobalComponentDef("solo")).toBeDefined();
        expect(root.querySelector(".c b")?.textContent).toBe("S");
    });

    test("非 global 孤立声明维持现状：warn + 丢弃", async () => {
        let engine: any;
        const warns = await captureCompileWarns(() => {
            ({ engine } = mount(`<div x-define="orphan"><b>O</b></div>`, {}));
        });
        expect(warns.some((w) => w.includes("未找到任何祖先 scope"))).toBe(true);
        expect(engine.getGlobalComponentDef("orphan")).toBeUndefined();
    });
});

describe("全局兜底与就近遮蔽并存（ADR-0115 决策 1/3）", () => {
    test("无局部声明的 scope 消费全局兜底；有同名局部声明的 scope 就近遮蔽", async () => {
        let root: HTMLElement;
        let engine: any;
        await captureCompileWarns(() => {
            ({ root, engine } = mount(
                `<div id="a" x-scope>
                    <div x-define.global="card"><b>全局卡</b></div>
                    <div class="use-g" x-component:card></div>
                </div>
                <div id="b" x-scope>
                    <div x-define="card"><b>局部卡</b></div>
                    <div class="use-l" x-component:card></div>
                </div>`,
                {},
            ));
        });
        expect(engine.getGlobalComponentDef("card")).toBeDefined();
        expect(root.querySelector(".use-g b")?.textContent).toBe("全局卡"); // 全局兜底
        expect(root.querySelector(".use-l b")?.textContent).toBe("局部卡"); // 就近遮蔽
    });
});

describe("覆盖与幂等（ADR-0115 决策 6）", () => {
    test("同名模板全局声明：覆盖 warn 一次（per 名去重）+ 后者覆盖", async () => {
        let engine: any;
        const warns = await captureCompileWarns(() => {
            ({ engine } = mount(
                `<div x-scope><div x-define.global="dup"><b>一</b></div></div>
                 <div x-scope><div x-define.global="dup"><b>二</b></div></div>
                 <div x-scope><div x-define.global="dup"><b>三</b></div></div>`,
                {},
            ));
        });
        expect(warns.filter((w) => w.includes("组件注册覆盖")).length).toBe(1);
        expect(engine.getGlobalComponentDef("dup")!.snapshot.querySelector("b")?.textContent).toBe(
            "三",
        );
    });

    test("嵌套全局声明多实例重复注册幂等：内容覆盖 + warn 不刷屏", async () => {
        let engine: any;
        const warns = await captureCompileWarns(() => {
            ({ engine } = mount(
                `<div x-scope>
                    <div x-define.global="g-nested"><b>direct</b></div>
                    <div x-define="outer">
                        <div x-define.global="g-nested"><b>nested</b></div>
                        <span>o</span>
                    </div>
                    <div class="i1" x-component:outer></div>
                    <div class="i2" x-component:outer></div>
                    <div class="i3" x-component:outer></div>
                </div>`,
                {},
            ));
        });
        // 直接声明先入表（无 warn）；外层 3 次实例化各重注册一次，仅首次覆盖 warn
        expect(warns.filter((w) => w.includes("组件注册覆盖")).length).toBe(1);
        expect(engine.getGlobalComponentDef("g-nested")!.snapshot.querySelector("b")?.textContent).toBe(
            "nested",
        );
    });
});

describe("嵌套全局声明懒注册时序（ADR-0115 决策 7）", () => {
    test("外层仅注册未实例化 → 不入全局表；首次实例化 → 入表", async () => {
        const { root, engine } = mount(`<div x-scope><div class="c" x-component:outer></div></div>`, {});
        await nextTick();
        expect(engine.getGlobalComponentDef("g-nested")).toBeUndefined(); // outer 未注册，消费者 loading
        engine.registerComponent(
            `<div x-define="outer"><div x-define.global="g-nested"><b>n</b></div><span>o</span></div>`,
        );
        await nextTick(); // 注册事件排水 → outer 首次实例化 → 编译快照子树 → 嵌套全局声明入表
        expect(root.querySelector(".c span")?.textContent).toBe("o"); // outer 已实例化（嵌套声明被剪枝）
        expect(engine.getGlobalComponentDef("g-nested")).toBeDefined();
    });
});

describe("全局组件继承（ADR-0115 决策 5）", () => {
    test("继承作用域父：fail-fast warn + 拒绝注册（不进 pending）", async () => {
        let engine: any;
        const warns = await captureCompileWarns(() => {
            ({ engine } = mount(
                `<div x-scope>
                    <div x-define="base"><i>局部父</i></div>
                    <div x-define="g-child" x-define:inherit="base" x-define-options="{global:true}">
                        <b>子</b>
                    </div>
                </div>`,
                {},
            ));
        });
        expect(warns.some((w) => w.includes("全局组件不能继承作用域组件"))).toBe(true);
        expect(engine.getGlobalComponentDef("g-child")).toBeUndefined();
    });

    test("全局父未就绪 → 挂起；全局注册后排水入表", async () => {
        let engine: any;
        const warns = await captureCompileWarns(() => {
            ({ engine } = mount(
                `<div x-scope>
                    <div x-define="g-child" x-define:inherit="g-base" x-define-options="{global:true}">
                        <b>子</b>
                    </div>
                </div>`,
                {},
            ));
        });
        expect(warns.some((w) => w.includes("已挂起"))).toBe(true);
        expect(engine.getGlobalComponentDef("g-child")).toBeUndefined();
        await captureRuntimeWarns(engine, () => {
            engine.registerComponent(`<div x-define="g-base"><i>base</i></div>`);
        });
        await nextTick();
        expect(engine.getGlobalComponentDef("g-base")).toBeDefined();
        expect(engine.getGlobalComponentDef("g-child")).toBeDefined(); // 排水重试后注册
    });
});

describe("dataContext:'declarer' 收集期拒绝（ADR-0115 决策 4）", () => {
    test("global + open + declarer 基准：warn 一次 + 丢弃基准回退 host，实例化正常", async () => {
        let root: HTMLElement;
        let engine: any;
        const warns = await captureCompileWarns(() => {
            ({ root, engine } = mount(
                `<div x-scope>
                    <div x-define="g-dc" x-define-options='{ "global": true, "open": true, "dataContext": "declarer" }'>
                        <b>dc</b>
                    </div>
                    <div class="c" x-component:g-dc></div>
                </div>`,
                {},
            ));
        });
        expect(warns.some((w) => w.includes("全局组件不支持 dataContext:'declarer'"))).toBe(true);
        const def = engine.getGlobalComponentDef("g-dc");
        expect(def).toBeDefined();
        expect(def.dataContext).toBeUndefined(); // 基准已丢弃
        expect(root.querySelector(".c b")).not.toBeNull(); // 实例化正常（host 基准）
    });
});

describe("registerComponent 声明为准（ADR-0115 决策 8）", () => {
    test("code 自带 global + scope 入参：落全局表 + warn 一次，scope 目标被忽略", async () => {
        const { root, engine } = mount(`<div id="s1" x-scope><span>1</span></div>`, {});
        const s1 = engine.findScopeByEl(root.querySelector("#s1"));
        const warns = await captureRuntimeWarns(engine, () => {
            const def = engine.registerComponent(`<div x-define.global="rg"><b>R</b></div>`, {
                scope: s1,
            });
            expect(def!.declarerScope).toBeNull();
        });
        expect(warns.some((w) => w.includes("以声明为准"))).toBe(true);
        expect(engine.getGlobalComponentDef("rg")).toBeDefined();
        // scope 注册表未挂 rg（getComponentDeclaration 会兜底全局表，不能用它断言"未挂 scope"）
        expect(s1.components?.hasOwnProperty("rg") ?? false).toBe(false);
    });

    test("入口本就全局：声明内 global 属冗余标记，静默接受", async () => {
        const { engine } = mount(`<div x-scope><span>1</span></div>`, {});
        const warns = await captureRuntimeWarns(engine, () => {
            engine.registerComponent(`<div x-define.global="rg2"><b>R2</b></div>`);
        });
        expect(warns.some((w) => w.includes("rg2"))).toBe(false); // 冲突才 warn，冗余不 warn
        expect(engine.getGlobalComponentDef("rg2")).toBeDefined();
    });
});

describe("全局 default 组件（ADR-0115 决策 9）", () => {
    test("无值 x-define.global 注册为全局 default", async () => {
        let root: HTMLElement;
        let engine: any;
        await captureCompileWarns(() => {
            ({ root, engine } = mount(
                `<div x-define.global><b>D</b></div>
                 <div x-scope><div class="c" x-component:default></div></div>`,
                {},
            ));
        });
        expect(engine.getGlobalComponentDef("default")).toBeDefined();
        expect(root.querySelector(".c b")?.textContent).toBe("D");
    });
});
