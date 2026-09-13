import { describe, expect, test } from "bun:test";
import "./setup";
import { mount, nextTick } from "./helpers";

/**
 * x-if 条件分支链（x-else-if / x-else）测试，覆盖 ADR-0034 全部决策：
 *
 * - Q1 短路链：文档顺序求值、首个真者胜；裸 x-else 恒真兜底
 * - Q2 结构：分支为 x-if 宿主直接子元素，编译期摘除（then 子树无分支）；
 *   命中分支作为独立元素插到宿主原位（锚点位）正常编译执行
 * - Q3 全不匹配：仅锚点占位（无分支、无宿主）
 * - Q4 两模式对称：eager 分支切换销毁重建；keepalive 每分支独立保活（切回状态保留）
 * - Q5 指令名：x-else-if（带值）+ x-else（裸兜底）
 * - Q6 识别范围：仅直接子元素；嵌套 x-if 链就近归属
 * - Q7 孤儿分支：父无 x-if → 编译期 warn + 摘除丢弃
 * - Q8 分支根指令：普通指令随分支编译执行；结构指令（ownsChildren 类）warn + 跳过该分支
 * - Q9 防呆：裸 x-else 非末位 → warn，运行时按短路语义（其后分支永不匹配）
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

describe("x-if 条件分支链：短路求值（Q1/Q3/Q5）", () => {
    test("x-if 真 → then 渲染，分支全部不进 DOM（剪枝）", async () => {
        const { root, store } = mount(
            `<div id="h" x-if="on"><span class="then">THEN</span>
                <div x-else-if="a">A</div>
                <div x-else-if="b">B</div>
                <div x-else>FALLBACK</div>
            </div>`,
            { on: true, a: true, b: false },
        );
        await nextTick();
        expect(root.querySelector(".then")?.textContent).toBe("THEN");
        // 分支是备选模板：即便 a 为真也不渲染（x-if 已真，链短路在 then）
        expect(root.querySelector("[x-else-if]")).toBeNull();
        expect(root.querySelector("[x-else]")).toBeNull();
        expect(root.textContent).not.toContain("A");
        expect(root.textContent).not.toContain("FALLBACK");
    });

    test("x-if 假 + 首个 elseif 真 → 命中分支渲染在宿主原位、then 不渲染", async () => {
        const { root } = mount(
            `<span class="before">前</span>
             <div id="h" x-if="on"><span class="then">THEN</span>
                <div x-else-if="a" class="br-a">A</div>
                <div x-else-if="b" class="br-b">B</div>
             </div>
             <span class="after">后</span>`,
            { on: false, a: true, b: true },
        );
        await nextTick();
        // 宿主摘除、then 不渲染
        expect(root.querySelector("#h")).toBeNull();
        expect(root.querySelector(".then")).toBeNull();
        // 首个真者胜：a、b 均真 → A
        expect(root.querySelector(".br-a")).not.toBeNull();
        expect(root.querySelector(".br-b")).toBeNull();
        // 分支插在宿主原位：前后兄弟夹着分支（宿主在 before/after 之间）
        const a = root.querySelector(".br-a")!;
        expect(a.previousElementSibling?.classList.contains("before")).toBe(true);
        expect(a.nextElementSibling?.classList.contains("after")).toBe(true);
    });

    test("链中段假、后段真 → 跳过假段命中后段", async () => {
        const { root } = mount(
            `<div id="h" x-if="on">
                <div x-else-if="a" class="br-a">A</div>
                <div x-else-if="b" class="br-b">B</div>
             </div>`,
            { on: false, a: false, b: true },
        );
        await nextTick();
        expect(root.querySelector(".br-a")).toBeNull();
        expect(root.querySelector(".br-b")?.textContent).toBe("B");
    });

    test("全假且有裸 x-else → 兜底渲染", async () => {
        const { root } = mount(
            `<div id="h" x-if="on">
                <div x-else-if="a">A</div>
                <div x-else class="fb">FALLBACK</div>
             </div>`,
            { on: false, a: false },
        );
        await nextTick();
        expect(root.querySelector(".fb")?.textContent).toBe("FALLBACK");
    });

    test("全假且无兜底 → 皆不渲染，仅锚点注释占位（Q3）", async () => {
        const { root } = mount(
            `<div id="h" x-if="on">
                <span class="then">THEN</span>
                <div x-else-if="a">A</div>
             </div>`,
            { on: false, a: false },
        );
        await nextTick();
        expect(root.querySelector("#h")).toBeNull();
        expect(root.querySelector(".then")).toBeNull();
        expect(root.querySelector(".br")).toBeNull();
        // 仅剩锚点注释（宿主原位占位）
        expect(root.childNodes.length).toBe(1);
        expect(root.firstChild?.nodeType).toBe(Node.COMMENT_NODE);
    });

    test("任一表达式变化 → 从头重算整链（分支间切换 + 回 then）", async () => {
        const { root, store } = mount(
            `<div id="h" x-if="on"><span class="then">THEN</span>
                <div x-else-if="a" class="br-a">A</div>
                <div x-else-if="b" class="br-b">B</div>
             </div>`,
            { on: false, a: true, b: false },
        );
        await nextTick();
        expect(root.querySelector(".br-a")).not.toBeNull();
        // a 变假 b 变真 → 切到 B
        store.state.a = false;
        store.state.b = true;
        await nextTick();
        expect(root.querySelector(".br-a")).toBeNull();
        expect(root.querySelector(".br-b")).not.toBeNull();
        // x-if 变真 → 分支移除、宿主回归 + then 编译
        store.state.on = true;
        await nextTick();
        expect(root.querySelector(".br-b")).toBeNull();
        expect(root.querySelector("#h")).not.toBeNull();
        expect(root.querySelector(".then")?.textContent).toBe("THEN");
        // 再变假 → 回到 B（b 仍真）
        store.state.on = false;
        await nextTick();
        expect(root.querySelector(".br-b")).not.toBeNull();
        expect(root.querySelector("#h")).toBeNull();
    });
});

describe("分支内容编译执行（Q2/Q8）", () => {
    test("分支内插值与指令正常编译、响应式更新", async () => {
        const { root, store } = mount(
            `<div id="h" x-if="on">
                <div x-else-if="a"><span class="msg" x-text="msg"></span>（{{ msg }}）</div>
             </div>`,
            { on: false, a: true, msg: "首版" },
        );
        await nextTick();
        expect(root.querySelector(".msg")?.textContent).toBe("首版");
        expect(root.textContent).toContain("（首版）");
        store.state.msg = "更新";
        await nextTick();
        expect(root.querySelector(".msg")?.textContent).toBe("更新");
        expect(root.textContent).toContain("（更新）");
    });

    test("分支根上的普通指令随分支编译执行（Q8：x-text / 属性绑定）", async () => {
        // 注：不以 :class 断言——happy-dom 对 compileChild 路径元素的 classList 存在
        // token/attribute/contains 三态分裂 quirk（真实浏览器按规范同步，无此问题），
        // 改用普通属性绑定（走 setAttribute，无 classList 参与）验证同一能力
        const { root, store } = mount(
            `<div id="h" x-if="on">
                <div x-else-if="a" class="br" :title="msg" :data-hot="hot ? 'on' : 'off'" x-text="msg"></div>
             </div>`,
            { on: false, a: true, hot: false, msg: "文案" },
        );
        await nextTick();
        const br = root.querySelector(".br")!;
        expect(br.textContent).toBe("文案");
        expect(br.getAttribute("title")).toBe("文案");
        expect(br.getAttribute("data-hot")).toBe("off");
        store.state.hot = true;
        await nextTick();
        expect(br.getAttribute("data-hot")).toBe("on");
    });

    test("分支表达式与 then 同求值上下文（x-for 项内的分支链）", async () => {
        // x-for 是容器语义（宿主即容器、子节点为复合项模板）；分支链按 A 形态写在项内
        // x-if 宿主的直接子级（item.big 在 item 局部变量上下文求值）
        const { root, store } = mount(
            `<ul><li x-for="item of items">
                <span x-if="item.big" class="host">{{ item.label }}-BIG
                    <span x-else class="small">{{ item.label }}-SMALL</span>
                </span>
            </li></ul>`,
            { items: [{ label: "x", big: true }, { label: "y", big: false }] },
        );
        await nextTick();
        await nextTick(); // x-for 首渲经 scheduler flush，须等两 tick
        const li = root.querySelector("li")!;
        // item.big 表达式在 x-for item 上下文求值（局部变量可见）：项1 命中 then、项2 命中兜底
        expect(li.querySelector(".host")?.textContent).toContain("x-BIG");
        expect(li.querySelector(".small")?.textContent).toContain("y-SMALL");
        // 响应式：翻转项1 的 big → 项1 从 then 切到兜底
        store.state.items[0].big = false;
        await nextTick();
        const hosts = li.querySelectorAll(".small");
        expect(hosts.length).toBe(2);
        expect(hosts[0]!.textContent).toContain("x-SMALL");
    });

    test("x-for 容器直接子级的分支标记 → warn + 丢弃（孤儿防呆扩展）", async () => {
        let root: HTMLElement | null = null;
        const warns = captureWarn(() => {
            const mounted = mount(
                `<ul><li x-for="item of items"><span>A</span>
                    <span x-else class="stray">STRAY</span>
                </li></ul>`,
                { items: [{}] },
            );
            root = mounted.root;
        });
        await nextTick();
        await nextTick();
        // 项成员采集跳过孤儿分支（父是 x-for 容器非 x-if 宿主）→ 不随项渲染
        expect(root!.querySelector(".stray")).toBeNull();
        expect(warns.some((w) => w.includes("该分支被丢弃"))).toBe(true);
    });

    test("嵌套链就近归属（Q6）：分支内再嵌 x-if + else 链归内层宿主", async () => {
        const { root, store } = mount(
            `<div id="h" x-if="outer">
                <div x-else-if="a" class="br-a">
                    <div x-if="inner" class="in-host"><span class="in-then">INNER-THEN</span>
                        <div x-else class="in-else">INNER-ELSE</div>
                    </div>
                </div>
             </div>`,
            { outer: false, a: true, inner: false },
        );
        await nextTick();
        expect(root.querySelector(".br-a")).not.toBeNull();
        // 内层 else 是内层 x-if 宿主的直接子元素 → 归内层链（inner 假 → 兜底渲染）
        expect(root.querySelector(".in-else")).not.toBeNull();
        expect(root.querySelector(".in-then")).toBeNull();
        store.state.inner = true;
        await nextTick();
        expect(root.querySelector(".in-then")).not.toBeNull();
        expect(root.querySelector(".in-else")).toBeNull();
    });

    test("非直接子元素（隔层）的分支标记按孤儿丢弃（Q6+Q7）", async () => {
        let root: HTMLElement | null = null;
        const warns = captureWarn(() => {
            const mounted = mount(
                `<div id="h" x-if="on">
                    <div class="wrap"><div x-else-if="a" class="nested">NESTED</div></div>
                 </div>`,
                { on: true, a: true },
            );
            root = mounted.root;
        });
        await nextTick();
        // wrap 是 then 内容照常渲染；隔层的 x-else-if 父非 x-if 宿主 → 孤儿 warn + 丢弃
        expect(root!.querySelector(".wrap")).not.toBeNull();
        expect(root!.querySelector(".nested")).toBeNull();
        expect(warns.some((w) => w.includes("分支被丢弃"))).toBe(true);
    });
});

describe("eager / keepalive 两模式（Q4）", () => {
    test("eager（默认）：分支切换销毁重建，状态不保留", async () => {
        const { root, store } = mount(
            `<div id="h" x-if="on">
                <div x-else-if="a" class="br-a"><input class="inp" /></div>
                <div x-else-if="b" class="br-b">B</div>
             </div>`,
            { on: false, a: true, b: false },
        );
        await nextTick();
        const inp = root.querySelector(".inp") as HTMLInputElement;
        inp.value = "用户输入";
        // 切到 B 再切回 A：eager 销毁重建，输入丢失
        store.state.a = false;
        store.state.b = true;
        await nextTick();
        expect(root.querySelector(".br-b")).not.toBeNull();
        store.state.a = true;
        store.state.b = false;
        await nextTick();
        const inp2 = root.querySelector(".inp") as HTMLInputElement;
        expect(inp2).not.toBe(inp); // 新编译的元素
        expect(inp2.value).toBe(""); // 状态已重置
    });

    test("keepalive：每分支独立保活，切回状态保留（Q4）", async () => {
        const { root, store } = mount(
            `<div id="h" x-if.keepalive="on">
                <div x-else-if="a" class="br-a"><input class="inp-a" /></div>
                <div x-else-if="b" class="br-b"><input class="inp-b" /></div>
             </div>`,
            { on: false, a: true, b: false },
        );
        await nextTick();
        const inpA = root.querySelector(".inp-a") as HTMLInputElement;
        inpA.value = "A 的输入";
        // 切到 B（A 分支保活 detach）
        store.state.a = false;
        store.state.b = true;
        await nextTick();
        expect(root.querySelector(".inp-a")).toBeNull(); // A 已 detach
        const inpB = root.querySelector(".inp-b") as HTMLInputElement;
        inpB.value = "B 的输入";
        // 切回 A：同元素 reattach，输入保留
        store.state.a = true;
        store.state.b = false;
        await nextTick();
        const inpA2 = root.querySelector(".inp-a") as HTMLInputElement;
        expect(inpA2).toBe(inpA); // keepalive：同元素身份
        expect(inpA2.value).toBe("A 的输入");
        // 再切 B：B 的输入也保留（每分支独立保活）
        store.state.a = false;
        store.state.b = true;
        await nextTick();
        const inpB2 = root.querySelector(".inp-b") as HTMLInputElement;
        expect(inpB2).toBe(inpB);
        expect(inpB2.value).toBe("B 的输入");
    });

    test("keepalive：then 分支保活与 else 分支对称（then ↔ 分支往返状态保留）", async () => {
        const { root, store } = mount(
            `<div id="h" x-if.keepalive="on"><input class="inp-then" />
                <div x-else-if="a" class="br-a">A</div>
             </div>`,
            { on: true, a: false },
        );
        await nextTick();
        const inpThen = root.querySelector(".inp-then") as HTMLInputElement;
        inpThen.value = "then 输入";
        // 切到分支 A（宿主 detach 保活）
        store.state.on = false;
        store.state.a = true;
        await nextTick();
        expect(root.querySelector(".br-a")).not.toBeNull();
        expect(root.querySelector(".inp-then")).toBeNull();
        // 切回 then：原宿主 reattach，输入保留（既有 keepalive 语义不回归）
        store.state.on = true;
        store.state.a = false;
        await nextTick();
        const inpThen2 = root.querySelector(".inp-then") as HTMLInputElement;
        expect(inpThen2).toBe(inpThen);
        expect(inpThen2.value).toBe("then 输入");
    });
});

describe("防呆与边界（Q7/Q8/Q9）", () => {
    test("孤儿分支：父无 x-if → warn + 摘除丢弃（Q7）", async () => {
        let root: HTMLElement | null = null;
        const warns = captureWarn(() => {
            const mounted = mount(
                `<div class="wrap">
                    <div x-else-if="a" class="orphan-if">ORPHAN-IF</div>
                    <div x-else class="orphan-else">ORPHAN-ELSE</div>
                 </div>`,
                { a: true },
            );
            root = mounted.root;
        });
        await nextTick();
        expect(warns.some((w) => w.includes("分支被丢弃"))).toBe(true);
        // 丢弃：不进结果 DOM
        expect(root!.querySelector(".orphan-if")).toBeNull();
        expect(root!.querySelector(".orphan-else")).toBeNull();
    });

    test("分支根含结构指令（x-for）→ warn + 跳过该分支（Q8）", async () => {
        const { root } = mount(
            `<div id="h" x-if="on">
                <div x-else-if="a" x-for="i in 3" class="bad">BAD</div>
                <div x-else-if="b" class="good">GOOD</div>
             </div>`,
            { on: false, a: true, b: true },
        );
        await nextTick();
        // x-for 分支被跳过（a 真也不渲染），链继续命中 b
        expect(root.querySelector(".bad")).toBeNull();
        expect(root.querySelector(".good")?.textContent).toBe("GOOD");
    });

    test("结构指令 warn 断言（Q8 配套）", () => {
        const warns = captureWarn(() => {
            mount(
                `<div x-if="on"><div x-else-if="a" x-for="i in 3">BAD</div></div>`,
                { on: true, a: false },
            );
        });
        expect(warns.some((w) => w.includes("结构指令"))).toBe(true);
    });

    test("裸 x-else 非末位 → warn；运行时按短路语义（其后分支永不匹配，Q9）", async () => {
        let root: HTMLElement | null = null;
        const warns = captureWarn(() => {
            const mounted = mount(
                `<div id="h" x-if="on">
                    <div x-else class="fb">FALLBACK</div>
                    <div x-else-if="a" class="after">AFTER</div>
                 </div>`,
                { on: false, a: true },
            );
            root = mounted.root;
        });
        await nextTick();
        expect(warns.some((w) => w.includes("永不匹配"))).toBe(true);
        // 短路：兜底先命中，其后的 elseif 即便真也不渲染
        expect(root!.querySelector(".fb")).not.toBeNull();
        expect(root!.querySelector(".after")).toBeNull();
    });

    test("同元素 x-else + x-else-if → warn，按 x-else-if 处理", async () => {
        let root: HTMLElement | null = null;
        const warns = captureWarn(() => {
            const mounted = mount(
                `<div x-if="on"><div x-else x-else-if="a" class="mix">MIX</div></div>`,
                { on: false, a: false },
            );
            root = mounted.root;
        });
        await nextTick();
        expect(warns.some((w) => w.includes("按 x-else-if 处理"))).toBe(true);
        // a 假且被当作 elseif（非兜底）→ 不渲染
        expect(root!.querySelector(".mix")).toBeNull();
    });

    test("x-else-if 空值 → warn，按裸兜底处理", async () => {
        let root: HTMLElement | null = null;
        const warns = captureWarn(() => {
            const mounted = mount(
                `<div x-if="on"><div x-else-if="" class="empty">EMPTY</div></div>`,
                { on: false },
            );
            root = mounted.root;
        });
        await nextTick();
        expect(warns.some((w) => w.includes("按 x-else 兜底处理"))).toBe(true);
        expect(root!.querySelector(".empty")?.textContent).toBe("EMPTY");
    });

    test("无分支纯 x-if 行为不变（回归锚点）", async () => {
        const { root, store } = mount(
            `<div id="h" x-if="on"><span>THEN</span></div>`,
            { on: true },
        );
        await nextTick();
        expect(root.querySelector("#h")).not.toBeNull();
        store.state.on = false;
        await nextTick();
        expect(root.querySelector("#h")).toBeNull();
        expect(root.firstChild?.nodeType).toBe(Node.COMMENT_NODE);
        store.state.on = true;
        await nextTick();
        expect(root.querySelector("#h")).not.toBeNull();
    });

    test("engine.destroy 后分支 DOM 一并清理（无孤儿节点）", async () => {
        const { root, engine } = mount(
            `<div id="h" x-if="on"><div x-else-if="a" class="br">A</div></div>`,
            { on: false, a: true },
        );
        await nextTick();
        expect(root.querySelector(".br")).not.toBeNull();
        engine.destroy();
        // 分支 DOM 在宿主外（锚点位），destroy 须显式移除
        expect(root.querySelector(".br")).toBeNull();
        expect(root.childNodes.length).toBe(0);
    });
});
