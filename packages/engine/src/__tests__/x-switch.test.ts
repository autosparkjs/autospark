import { describe, expect, test } from "bun:test";
import "./setup";
import { mount, nextTick, finishAnim } from "./helpers";

/**
 * x-switch 分支选择（x-case / x-default）测试，覆盖 ADR-0037 全部决策：
 *
 * - 决策 1 字面量：case 值是 relaxed-json 字面量（裸词=字符串/数字/布尔/多值数组），非表达式
 * - 决策 2 宿主形态：锚点占位式（宿主摘除 + 分支插宿主原位），与 x-if 分支链同构
 * - 决策 3 SameValueZero：NaN 可匹配（NaN 特判识别）；对象主值落 default
 * - 决策 4 default 位置无关：先扫 case 全不中才落 default（JS switch 心智）
 * - 决策 5 keepalive：eager 销毁重建 / 每分支独立保活（切回状态保留）
 * - 决策 6 防呆：非分支子元素 / 分支根结构指令 / 孤儿分支 / 空值 / 多 default / 带值 default
 * - 决策 7 冲突：eager 与 x-for 同元素抛错；keepalive 共存
 * - 决策 9 基建：委托 BranchHost 共享基建（x-if 回归见 x-if/x-else 测试）
 */

/** 拦截 console.warn 收集文案（用后还原） */
function captureWarn(fn: () => void): string[] {
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

describe("x-switch 分支选择：字面量匹配（决策 1/3）", () => {
    test("字符串 / 数字 / 布尔字面量分别命中对应分支", async () => {
        const { root, engine } = mount(
            `<div id="h" x-switch="v">
                <span x-case="a" class="s">STR</span>
                <span x-case="1" class="n">NUM</span>
                <span x-case="true" class="b">BOOL</span>
             </div>`,
            { v: "a" },
        );
        await nextTick();
        expect(root.querySelector(".s")?.textContent).toBe("STR");
        engine.state.v = 1; // 数字 1 === 字面量 1
        await nextTick();
        expect(root.querySelector(".n")?.textContent).toBe("NUM");
        engine.state.v = true; // 布尔 true
        await nextTick();
        expect(root.querySelector(".b")?.textContent).toBe("BOOL");
    });

    test('裸词 ≡ 引号串：x-case="\'a\'" 与 x-case="a" 同值', async () => {
        const { root } = mount(
            `<div x-switch="v">
                <span x-case="'a'" class="q">QUOTED</span>
             </div>`,
            { v: "a" },
        );
        await nextTick();
        expect(root.querySelector(".q")?.textContent).toBe("QUOTED");
    });

    test("多值数组：任一命中即中（含数字与字符串混排）", async () => {
        const { root, engine } = mount(
            `<div x-switch="level">
                <span x-case="[1, 2, 3]" class="lo">LOW</span>
                <span x-case="[vip, admin]" class="hi">HIGH</span>
             </div>`,
            { level: 2 },
        );
        await nextTick();
        expect(root.querySelector(".lo")?.textContent).toBe("LOW");
        engine.state.level = "vip";
        await nextTick();
        expect(root.querySelector(".hi")?.textContent).toBe("HIGH");
        engine.state.level = 9;
        await nextTick();
        expect(root.querySelector(".lo")).toBeNull();
        expect(root.querySelector(".hi")).toBeNull();
    });

    test('NaN 特判：x-case="NaN" 命中 NaN 主值（SameValueZero，决策 3）', async () => {
        const { root, engine } = mount(
            `<div x-switch="v">
                <span x-case="NaN" class="nan">IS_NAN</span>
                <span x-case="1" class="one">ONE</span>
             </div>`,
            { v: 0 },
        );
        await nextTick();
        expect(root.querySelector(".nan")).toBeNull();
        engine.state.v = NaN;
        await nextTick();
        expect(root.querySelector(".nan")?.textContent).toBe("IS_NAN");
    });

    test("null 字面量可显式匹配", async () => {
        const { root, engine } = mount(
            `<div x-switch="v">
                <span x-case="null" class="n">NULL</span>
             </div>`,
            { v: 0 },
        );
        await nextTick();
        expect(root.querySelector(".n")).toBeNull();
        engine.state.v = null;
        await nextTick();
        expect(root.querySelector(".n")?.textContent).toBe("NULL");
    });

    test("对象主值：字面量永不匹配（引用比较），静默落 default（决策 3 附注）", async () => {
        const { root } = mount(
            `<div x-switch="obj">
                <span x-case="1" class="one">ONE</span>
                <span x-default class="d">FALLBACK</span>
             </div>`,
            { obj: { a: 1 } },
        );
        await nextTick();
        expect(root.querySelector(".one")).toBeNull();
        expect(root.querySelector(".d")?.textContent).toBe("FALLBACK");
    });
});

describe("x-switch default 语义与空态（决策 4）", () => {
    test("default 兜底：全不中落 default；切换命中 case", async () => {
        const { root, engine } = mount(
            `<div x-switch="v">
                <span x-case="a" class="a">A</span>
                <span x-default class="d">D</span>
             </div>`,
            { v: "zzz" },
        );
        await nextTick();
        expect(root.querySelector(".d")?.textContent).toBe("D");
        engine.state.v = "a";
        await nextTick();
        expect(root.querySelector(".a")?.textContent).toBe("A");
        expect(root.querySelector(".d")).toBeNull();
    });

    test("default 位置无关：default 写在首位不遮蔽其后的 case", async () => {
        const { root, engine } = mount(
            `<div x-switch="v">
                <span x-default class="d">D</span>
                <span x-case="a" class="a">A</span>
             </div>`,
            { v: "a" },
        );
        await nextTick();
        // 先扫 case：a 命中，首位 default 不生效
        expect(root.querySelector(".a")?.textContent).toBe("A");
        expect(root.querySelector(".d")).toBeNull();
        engine.state.v = "other";
        await nextTick();
        // 全不中才落 default
        expect(root.querySelector(".d")?.textContent).toBe("D");
    });

    test("无匹配且无 default → 皆不渲染，仅锚点注释占位（宿主原位）", async () => {
        const { root } = mount(
            `<span class="before">前</span>
             <div id="h" x-switch="v">
                <span x-case="a" class="a">A</span>
             </div>
             <span class="after">后</span>`,
            { v: 0 },
        );
        await nextTick();
        expect(root.querySelector("#h")).toBeNull();
        expect(root.querySelector(".a")).toBeNull();
        // 前后兄弟之间：无元素渲染、恰一个锚点注释（模板换行的空白文本节点不计）
        const before = root.querySelector(".before")!;
        const after = root.querySelector(".after")!;
        let node: Node | null = before.nextSibling;
        let comments = 0;
        while (node && node !== after) {
            expect(node.nodeType).not.toBe(Node.ELEMENT_NODE);
            if (node.nodeType === Node.COMMENT_NODE) comments++;
            node = node.nextSibling;
        }
        expect(comments).toBe(1);
    });

    test("值切换链：case → 其他 case → default → 空态（eager 销毁重建，同一时刻至多一个）", async () => {
        const { root, engine } = mount(
            `<div x-switch="v">
                <span x-case="a" class="a">A</span>
                <span x-case="b" class="b">B</span>
                <span x-default class="d">D</span>
             </div>`,
            { v: "a" },
        );
        await nextTick();
        expect(root.querySelector(".a")).not.toBeNull();
        engine.state.v = "b";
        await nextTick();
        expect(root.querySelector(".a")).toBeNull();
        expect(root.querySelector(".b")).not.toBeNull();
        engine.state.v = "x";
        await nextTick();
        expect(root.querySelector(".b")).toBeNull();
        expect(root.querySelector(".d")).not.toBeNull();
        engine.state.v = "a";
        await nextTick();
        expect(root.querySelector(".d")).toBeNull();
        expect(root.querySelector(".a")).not.toBeNull();
    });

    test("分支内普通指令与插值随分支编译执行", async () => {
        const { root, engine } = mount(
            `<div x-switch="v">
                <span x-case="a" class="a" x-text="msg + '!'"></span>
             </div>`,
            { v: "a", msg: "hi" },
        );
        await nextTick();
        expect(root.querySelector(".a")?.textContent).toBe("hi!");
        // 分支存活期间持续响应
        engine.state.msg = "ok";
        await nextTick();
        expect(root.querySelector(".a")?.textContent).toBe("ok!");
    });
});

describe("x-switch 宿主形态：锚点占位式（决策 2）", () => {
    test("宿主摘除，命中分支作为独立元素插到宿主原位（前后兄弟夹击）", async () => {
        const { root } = mount(
            `<span class="before">前</span>
             <div id="h" x-switch="v">
                <div x-case="a" class="br">BRANCH</div>
             </div>
             <span class="after">后</span>`,
            { v: "a" },
        );
        await nextTick();
        expect(root.querySelector("#h")).toBeNull();
        const br = root.querySelector(".br")!;
        expect(br.textContent).toBe("BRANCH");
        expect(br.previousElementSibling?.classList.contains("before")).toBe(true);
        expect(br.nextElementSibling?.classList.contains("after")).toBe(true);
    });

    test("非分支子元素不渲染（随宿主离开 DOM）+ warn", async () => {
        let root: HTMLElement;
        const warns = captureWarn(() => {
            root = mount(
                `<div id="h" x-switch="v">
                    <span class="junk">误写内容</span>
                    <span x-case="a" class="a">A</span>
                 </div>`,
                { v: "a" },
            ).root;
        });
        await nextTick();
        expect(root!.querySelector(".junk")).toBeNull();
        expect(root!.querySelector(".a")?.textContent).toBe("A");
        expect(warns.some((w) => w.includes("非分支子元素"))).toBe(true);
    });

    test("嵌套归属：x-for 项内嵌 x-switch（相对表达式 item.status，就近归属）", async () => {
        const { root, engine } = mount(
            `<ul x-for="item of items" :key="item.id">
                <li><span x-switch="item.status">
                    <em x-case="on" class="on">ON</em>
                    <em x-default class="off">OFF</em>
                </span></li>
             </ul>`,
            {
                items: [
                    { id: 1, status: "on" },
                    { id: 2, status: "unknown" },
                ],
            },
        );
        await nextTick();
        const items = root.querySelectorAll("li");
        expect(items[0]?.querySelector(".on")?.textContent).toBe("ON");
        expect(items[1]?.querySelector(".off")?.textContent).toBe("OFF");
        // 项内状态变化 → 重取匹配
        engine.state.items[0].status = "whatever";
        await nextTick();
        const items2 = root.querySelectorAll("li");
        expect(items2[0]?.querySelector(".off")).not.toBeNull();
    });
});

describe("x-switch 两态：eager / keepalive（决策 5）", () => {
    test("eager（默认）：切走销毁、切回重建（输入状态丢失）", async () => {
        const { root, engine } = mount(
            `<div x-switch="tab">
                <div x-case="a" class="pa"><input id="inp" /></div>
                <div x-case="b" class="pb">B</div>
             </div>`,
            { tab: "a" },
        );
        await nextTick();
        (root.querySelector("#inp") as HTMLInputElement).value = "typed";
        engine.state.tab = "b";
        await nextTick();
        engine.state.tab = "a";
        await nextTick();
        // 重建：新 input，输入丢失
        expect((root.querySelector("#inp") as HTMLInputElement).value).toBe("");
    });

    test("keepalive：切走 detach 保活、切回 reattach（输入状态保留，同一元素）", async () => {
        const { root, engine } = mount(
            `<div x-switch.keepalive="tab">
                <div x-case="a" class="pa"><input id="inp" /></div>
                <div x-case="b" class="pb">B</div>
             </div>`,
            { tab: "a" },
        );
        await nextTick();
        const inp1 = root.querySelector("#inp") as HTMLInputElement;
        inp1.value = "typed";
        engine.state.tab = "b";
        await nextTick();
        expect(root.querySelector("#inp")).toBeNull(); // 保活 detach，不在 DOM
        engine.state.tab = "a";
        await nextTick();
        const inp2 = root.querySelector("#inp") as HTMLInputElement;
        expect(inp2).toBe(inp1); // reattach 同一元素（状态保留）
        expect(inp2.value).toBe("typed");
    });

    test('x-switch-options="{keepalive:true}" 与 .keepalive 修饰符等价（ADR-0007）', async () => {
        const { root, engine } = mount(
            `<div x-switch="tab" x-switch-options="{keepalive:true}">
                <div x-case="a" class="pa"><input id="inp" /></div>
             </div>`,
            { tab: "a" },
        );
        await nextTick();
        const inp1 = root.querySelector("#inp") as HTMLInputElement;
        inp1.value = "kept";
        engine.state.tab = "x";
        await nextTick();
        engine.state.tab = "a";
        await nextTick();
        expect((root.querySelector("#inp") as HTMLInputElement).value).toBe("kept");
    });
});

describe("x-switch 防呆（决策 6，编译期 warn + 运行时按既定语义）", () => {
    test("x-case 空值：warn + 按 x-default 兜底处理", async () => {
        const warns: string[] = [];
        const orig = console.warn;
        console.warn = (...args: any[]) => warns.push(String(args[0] ?? ""));
        try {
            const { root } = mount(
                `<div x-switch="v">
                    <span x-case="a" class="a">A</span>
                    <span x-case class="fb">FALLBACK</span>
                 </div>`,
                { v: "zzz" },
            );
            await nextTick();
            expect(root.querySelector(".fb")?.textContent).toBe("FALLBACK");
        } finally {
            console.warn = orig;
        }
        expect(warns.some((w) => w.includes("按 x-default 兜底"))).toBe(true);
    });

    test("多个兜底（x-default 重复）：warn + 取第一个", async () => {
        const warns: string[] = [];
        const orig = console.warn;
        console.warn = (...args: any[]) => warns.push(String(args[0] ?? ""));
        try {
            const { root } = mount(
                `<div x-switch="v">
                    <span x-default class="d1">FIRST</span>
                    <span x-default class="d2">SECOND</span>
                 </div>`,
                { v: "zzz" },
            );
            await nextTick();
            expect(root.querySelector(".d1")?.textContent).toBe("FIRST");
            expect(root.querySelector(".d2")).toBeNull();
        } finally {
            console.warn = orig;
        }
        expect(warns.some((w) => w.includes("重复的兜底"))).toBe(true);
    });

    test("x-default 带值：warn + 忽略值（仍为兜底）", async () => {
        const warns: string[] = [];
        const orig = console.warn;
        console.warn = (...args: any[]) => warns.push(String(args[0] ?? ""));
        try {
            const { root } = mount(
                `<div x-switch="v">
                    <span x-default="junk" class="d">D</span>
                 </div>`,
                { v: "zzz" },
            );
            await nextTick();
            expect(root.querySelector(".d")?.textContent).toBe("D");
        } finally {
            console.warn = orig;
        }
        expect(warns.some((w) => w.includes("被忽略"))).toBe(true);
    });

    test("同元素 x-case + x-default：warn + 按 x-case 处理", async () => {
        const warns: string[] = [];
        const orig = console.warn;
        console.warn = (...args: any[]) => warns.push(String(args[0] ?? ""));
        try {
            const { root } = mount(
                `<div x-switch="v">
                    <span x-case="a" x-default class="x">X</span>
                 </div>`,
                { v: "zzz" },
            );
            await nextTick();
            // 按 x-case 处理：v=zzz 不匹配 a，无兜底 → 皆不渲染
            expect(root.querySelector(".x")).toBeNull();
        } finally {
            console.warn = orig;
        }
        expect(warns.some((w) => w.includes("按 x-case 处理"))).toBe(true);
    });

    test("分支根含结构指令（ownsChildren 类）：warn + 跳过该分支", async () => {
        const warns: string[] = [];
        const orig = console.warn;
        console.warn = (...args: any[]) => warns.push(String(args[0] ?? ""));
        try {
            const { root, engine } = mount(
                `<div x-switch="v">
                    <ul x-case="a" x-for="i of list"><li x-text="i"></li></ul>
                    <span x-case="b" class="b">B</span>
                 </div>`,
                { v: "a", list: [1] },
            );
            await nextTick();
            // 结构指令分支被跳过：v=a 皆不渲染；切到 b 命中普通分支
            expect(root.querySelector("ul")).toBeNull();
            engine.state.v = "b";
            await nextTick();
            expect(root.querySelector(".b")?.textContent).toBe("B");
        } finally {
            console.warn = orig;
        }
        expect(warns.some((w) => w.includes("结构指令"))).toBe(true);
    });

    test("case 字面量非法（解析失败）：warn + 跳过该分支", async () => {
        const warns: string[] = [];
        const orig = console.warn;
        console.warn = (...args: any[]) => warns.push(String(args[0] ?? ""));
        try {
            const { root } = mount(
                `<div x-switch="v">
                    <span x-case="a b c" class="bad">BAD</span>
                    <span x-case="ok" class="ok">OK</span>
                 </div>`,
                { v: "a b c" },
            );
            await nextTick();
            // 非法分支跳过：即便主值恰好是串 "a b c" 也不命中；ok 分支照常
            expect(root.querySelector(".bad")).toBeNull();
            expect(root.querySelector(".ok")).toBeNull();
        } finally {
            console.warn = orig;
        }
        expect(warns.some((w) => w.includes("不是合法的 relaxed-json"))).toBe(true);
    });

    test("x-switch 空值：warn + no-op（不渲染任何分支）", async () => {
        const warns: string[] = [];
        const orig = console.warn;
        console.warn = (...args: any[]) => warns.push(String(args[0] ?? ""));
        try {
            const { root } = mount(
                `<div id="h" x-switch>
                    <span x-case="a" class="a">A</span>
                 </div>`,
                {},
            );
            await nextTick();
            expect(root.querySelector(".a")).toBeNull();
        } finally {
            console.warn = orig;
        }
        expect(warns.some((w) => w.includes("缺少匹配表达式"))).toBe(true);
    });

    test("孤儿分支：父元素无 x-switch → warn + 丢弃", async () => {
        const warns: string[] = [];
        const orig = console.warn;
        console.warn = (...args: any[]) => warns.push(String(args[0] ?? ""));
        try {
            const { root } = mount(`<div><span x-case="a" class="orphan">ORPHAN</span></div>`, {});
            await nextTick();
            expect(root.querySelector(".orphan")).toBeNull();
        } finally {
            console.warn = orig;
        }
        expect(warns.some((w) => w.includes("父元素未声明 x-switch"))).toBe(true);
    });

    test("误写在 x-if 宿主内的 x-case：静默丢弃（x-if 占子树，子级走 compileOneChild 剪枝）", async () => {
        const { root } = mount(
            `<div x-if="on">
                <span class="then">THEN</span>
                <span x-case="a" class="wrong">WRONG</span>
             </div>`,
            { on: true },
        );
        await nextTick();
        // then 正常渲染；x-case 非 x-if 分支标记、也不进 then 子树（compileOneChild 统一剪枝，
        // 静默——孤儿 warn 仅主 walk 的 transformer 路径发出，ADR-0034 同款语义）
        expect(root.querySelector(".then")?.textContent).toBe("THEN");
        expect(root.querySelector(".wrong")).toBeNull();
    });

    test("x-for 容器直接子级的 x-case：warn + 丢弃（不当项模板渲染）", async () => {
        const warns: string[] = [];
        const orig = console.warn;
        console.warn = (...args: any[]) => warns.push(String(args[0] ?? ""));
        try {
            const { root } = mount(
                `<ul x-for="item of items" :key="item.id">
                    <li x-text="item.name"></li>
                    <li x-case="a">ORPHAN</li>
                 </ul>`,
                { items: [{ id: 1, name: "a" }] },
            );
            await nextTick();
            expect(root.querySelectorAll("li").length).toBe(1);
            expect(root.textContent).not.toContain("ORPHAN");
        } finally {
            console.warn = orig;
        }
        expect(warns.some((w) => w.includes("x-case/x-default"))).toBe(true);
    });
});

describe("x-switch 冲突与共存（决策 7）", () => {
    test("x-for + eager x-switch 同元素：编译期抛错（动态冲突指令名）", () => {
        expect(() =>
            mount(
                `<ul x-for="item of items" :key="item.id" x-switch="mode">
                    <li x-text="item.name"></li>
                </ul>`,
                { mode: "a", items: [{ id: 1, name: "a" }] },
            ),
        ).toThrow(/结构指令冲突[\s\S]*x-for[\s\S]*x-switch/);
    });

    test("x-for + x-switch.keepalive 同元素：不冲突（keepalive 不占子树）", async () => {
        const { root, engine } = mount(
            `<ul id="t" x-for="item of items" :key="item.id" x-switch.keepalive="mode">
                <li x-text="item.name"></li>
             </ul>`,
            { mode: "a", items: [{ id: 1, name: "a" }] },
        );
        await nextTick();
        // keepalive 模式分支插宿主原位：宿主摘除、项随宿主离开
        expect(root.querySelector("#t")).toBeNull();
        // keepalive x-switch 无匹配分支时（mode 无 case）：宿主仍摘除（锚点占位）——
        // 与 x-if.keepalive 不同，x-switch 宿主永无 then 态
        const before = root.firstChild;
        expect(before?.nodeType).toBe(Node.COMMENT_NODE);
        engine.state.mode = "b";
        await nextTick();
        expect(root.querySelector("#t")).toBeNull();
    });

    test("keepalive 宿主（属性名带修饰符后缀）的分支不误报孤儿 warn（hasDirectiveAttr 修复）", async () => {
        // x-if.keepalive / x-switch.keepalive 宿主的属性名是 x-if.keepalive / x-switch.keepalive，
        // 孤儿判据精确匹配 hasAttribute("x-if") 曾误报（ADR-0034 遗留，hasDirectiveAttr 修复）
        const warns: string[] = [];
        const orig = console.warn;
        console.warn = (...args: any[]) => warns.push(String(args[0] ?? ""));
        try {
            const { root, engine } = mount(
                `<div id="a" x-if.keepalive="on"><span class="then">THEN</span>
                    <span x-else-if="off" class="eb">ELSE</span>
                 </div>
                 <div id="b" x-switch.keepalive="v">
                    <span x-case="a" class="cb">CASE</span>
                 </div>`,
                { on: true, off: false, v: "a" },
            );
            await nextTick();
            expect(root.querySelector(".then")?.textContent).toBe("THEN");
            expect(root.querySelector(".cb")?.textContent).toBe("CASE");
            engine.state.on = false;
            engine.state.off = true;
            await nextTick();
            expect(root.querySelector(".eb")?.textContent).toBe("ELSE");
        } finally {
            console.warn = orig;
        }
        expect(warns.filter((w) => w.includes("父元素未声明"))).toEqual([]);
    });
});

describe("x-switch 进出场动画（ADR-0039）", () => {
    // duration 拉长到 5000ms 使动画在断言窗口内稳定「在播」；结束由 finishAnim 手动驱动（确定性）
    const OPT = `{animate:{name:'fade',duration:5000}}`;

    test("首次渲染静默：初始命中分支不播进场（决策 6）", async () => {
        const { root } = mount(
            `<div x-switch="v" x-switch-options="${OPT}">
                <span x-case="a" class="ca">A</span>
             </div>`,
            { v: "a" },
        );
        await nextTick();
        expect(root.querySelector(".ca")!.className).toBe("ca");
    });

    test("分支切换共演：旧分支离场 + 新分支进场同处文档流（决策 8）", async () => {
        const { root, engine } = mount(
            `<div x-switch="v" x-switch-options="${OPT}">
                <span x-case="a" class="ca">A</span>
                <span x-case="b" class="cb">B</span>
             </div>`,
            { v: "a" },
        );
        await nextTick();
        engine.state.v = "b";
        await nextTick();
        const a = root.querySelector(".ca")!;
        const b = root.querySelector(".cb")!;
        // 新旧分支短暂共处：旧延迟移除、新已进场
        expect(root.contains(a)).toBe(true);
        expect(a.classList.contains("fade-leave-active")).toBe(true);
        expect(b.classList.contains("fade-enter-active")).toBe(true);
        finishAnim(a);
        finishAnim(b);
        expect(root.contains(a)).toBe(false);
        expect(root.contains(b)).toBe(true);
        expect(b.classList.contains("fade-enter-active")).toBe(false);
    });

    test("eager 切回：在播离场元素与新编译元素短暂共处（决策 7/8）", async () => {
        const { root, engine } = mount(
            `<div x-switch="v" x-switch-options="${OPT}">
                <span x-case="a" class="ca">A</span>
                <span x-case="b" class="cb">B</span>
             </div>`,
            { v: "a" },
        );
        await nextTick();
        engine.state.v = "b";
        await nextTick(); // a 在播离场
        engine.state.v = "a"; // 离场中切回 → 全新编译（非复用在播元素）
        await nextTick();
        const cas = root.querySelectorAll(".ca");
        expect(cas.length).toBe(2); // 旧（离场中）+ 新（进场中）
        expect(cas[0]!.classList.contains("fade-leave-active")).toBe(true);
        expect(cas[1]!.classList.contains("fade-enter-active")).toBe(true);
        finishAnim(cas[0]!);
        expect(root.querySelectorAll(".ca").length).toBe(1);
        finishAnim(root.querySelector(".ca")!);
        expect(root.querySelector(".ca")!.className).toBe("ca");
    });

    test("keepalive 切回抢占：同一元素取消在播离场后重挂播进场（决策 7/11）", async () => {
        const { root, engine } = mount(
            `<div x-switch.keepalive="v" x-switch-options="${OPT}">
                <span x-case="a" class="ca">A</span>
                <span x-case="b" class="cb">B</span>
             </div>`,
            { v: "a" },
        );
        await nextTick();
        const firstA = root.querySelector(".ca")!;
        engine.state.v = "b";
        await nextTick();
        expect(firstA.classList.contains("fade-leave-active")).toBe(true);
        engine.state.v = "a"; // 离场中切回
        await nextTick();
        // 同一元素（keepalive runtime 保留）：离场被抢占取消、重挂播进场
        expect(root.querySelector(".ca")).toBe(firstA);
        expect(firstA.classList.contains("fade-leave-active")).toBe(false);
        expect(firstA.classList.contains("fade-enter-active")).toBe(true);
        finishAnim(firstA);
        expect(firstA.className).toBe("ca");
    });
});
