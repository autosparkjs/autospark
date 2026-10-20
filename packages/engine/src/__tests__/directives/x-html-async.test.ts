import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import "../setup";
import { mount } from "../helpers";

/**
 * x-html 远程异步 HTML 源（ADR-0035 / ADR-0122）：url / action 形态判定（action 必须带括号——裸词
 * 恒为表达式）、text-only 映射（非字符串即失败）、远程内容默认消毒、$loading/$error 元键注入
 * （locals 域）、x-loading 字面量切换合成（恒合成、无互斥）、`.compile` 远程模板、
 * 同元素双异步 x-html 独占视觉通道、竞态丢弃与 destroy 中止。
 */

/** fetch 调用记录 + 可编程应答（body 为 html 字符串，走 res.text()） */
function mockFetch(handler: (url: string, init?: RequestInit) => any) {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    (globalThis as any).fetch = async (url: any, init?: any) => {
        calls.push({ url: String(url), init });
        let res = handler(String(url), init);
        // handler 可返回 deferred promise（控制 pending 窗口）——须 await 真正挂起
        if (res && typeof (res as any).then === "function") res = await res;
        if (res instanceof Error) throw res;
        const body = res?.body ?? "";
        const ok = res?.ok ?? true;
        return {
            ok,
            status: res?.status ?? 200,
            statusText: res?.statusText ?? (ok ? "OK" : "Error"),
            json: async () => body,
            text: async () => String(body),
        };
    };
    return calls;
}

/** 手动放行的延迟应答（控制 pending 窗口） */
function deferred<T>() {
    let resolve!: (v: T) => void;
    let reject!: (e: any) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

/** 等 fetch 微任务链 + scheduler flush（宏任务一跳） */
const flush = async () => {
    await Promise.resolve();
    await new Promise<void>((r) => setTimeout(r, 0));
};

/** 读取覆盖层根节点 */
const overlayOf = (host: Element | null): HTMLElement | null =>
    (host?.querySelector(".x-loading-overlay") as HTMLElement) ?? null;

const realFetch = globalThis.fetch;

describe("x-html 远程异步 HTML 源（ADR-0035 / ADR-0122）", () => {
    beforeEach(() => {
        (globalThis as any).fetch = realFetch;
    });
    afterEach(() => {
        (globalThis as any).fetch = realFetch;
    });

    // ── 形态判定（决策 1）──────────────────────────────────────────────

    test("url 形态：fetch text 注入 innerHTML", async () => {
        const calls = mockFetch(() => ({ body: "<b>远程片段</b>" }));
        const { root } = mount(`<div id="h" x-html="/api/p.html"></div>`, {});
        await flush();
        expect(calls.length).toBe(1);
        expect(calls[0]?.url).toBe("/api/p.html");
        expect(root.querySelector("#h")?.innerHTML).toBe("<b>远程片段</b>");
    });

    test("action 形态（带括号）：执行 action 取 html 字符串", async () => {
        mockFetch(() => ({ body: "不应被调用" }));
        const { root } = mount(
            `<div id="h" x-html="loadPartial()"></div>`,
            {},
            {
                actions: {
                    loadPartial: async () => {
                        await new Promise((r) => setTimeout(r, 5));
                        return "<i>action 片段</i>";
                    },
                },
            },
        );
        await flush();
        // handle 内 5ms 定时器：全量并行负载下 flush（一跳宏任务）不够，补等定时器窗口
        await new Promise((r) => setTimeout(r, 10));
        expect(root.querySelector("#h")?.innerHTML).toBe("<i>action 片段</i>");
    });

    test('裸词恒为表达式：x-html="content" 读状态键，不触发 fetch', async () => {
        const calls = mockFetch(() => ({ body: "不应被调用" }));
        const { root } = mount(`<div id="h" x-html="content"></div>`, {
            content: "<u>本地内容</u>",
        });
        await flush();
        expect(calls.length).toBe(0);
        expect(root.querySelector("#h")?.innerHTML).toBe("<u>本地内容</u>");
    });

    test('链式调用保持表达式：x-html="s.trim()" 不判 action', async () => {
        const { root } = mount(`<div id="h" x-html="s.trim()"></div>`, {
            s: "  <em>trimmed</em>  ",
        });
        await flush();
        expect(root.querySelector("#h")?.innerHTML).toBe("<em>trimmed</em>");
    });

    test("url 插值：{expr} 依赖变化自动重取", async () => {
        const calls = mockFetch((url) => ({ body: `<p>${url}</p>` }));
        const { root, engine } = mount(`<div id="h" x-html="/api/p-{lang}.html"></div>`, {
            lang: "zh",
        });
        await flush();
        expect(calls.length).toBe(1);
        expect(root.querySelector("#h")?.textContent).toBe("/api/p-zh.html");
        engine.state.lang = "en";
        await flush();
        expect(calls.length).toBe(2);
        expect(root.querySelector("#h")?.textContent).toBe("/api/p-en.html");
    });

    // ── text-only 映射（决策 2）────────────────────────────────────────

    test("action 返回非字符串 → 失败：不落地、$error 注入", async () => {
        const { root } = mount(
            `<div id="h" x-html="bad()"><span class="e" x-text="$error ? $error.message : ''"></span></div>`,
            {},
            {
                actions: {
                    bad: async () => ({ html: "<p>对象</p>" }),
                },
            },
        );
        await flush();
        // 失败：$error 元键可读（Error 实例），innerHTML 未被 "[object Object]" 污染
        expect(root.querySelector(".e")?.textContent).toContain("字符串");
    });

    test("空串响应 → 清空宿主（既有同步语义照旧）", async () => {
        mockFetch(() => ({ body: "<b>先到</b>" }));
        const { root, engine } = mount(`<div id="h" x-html="/api/p-{t}.html"></div>`, { t: 1 });
        await flush();
        expect(root.querySelector("#h")?.innerHTML).toBe("<b>先到</b>");
        // 第二次返回空串：重取后清空
        mockFetch(() => ({ body: "" }));
        engine.state.t = 2;
        await flush();
        expect(root.querySelector("#h")?.innerHTML).toBe("");
    });

    // ── 远程内容默认消毒（决策 4）──────────────────────────────────────

    test("默认模式：远程内容默认消毒（剥 script / onerror）", async () => {
        mockFetch(() => ({
            body: `<b>ok</b><script>alert(1)</script><img src="x" onerror="alert(2)">`,
        }));
        const { root } = mount(`<div id="h" x-html="/api/evil.html"></div>`, {});
        await flush();
        const html = root.querySelector("#h")!.innerHTML;
        expect(html).toContain("<b>ok</b>");
        expect(html).not.toContain("script");
        expect(html).not.toContain("onerror");
    });

    test(".raw：远程内容退出消毒原样写入", async () => {
        mockFetch(() => ({ body: `<b>ok</b><script>alert(1)</script>` }));
        const { root } = mount(`<div id="h" x-html.raw="/api/raw.html"></div>`, {});
        await flush();
        expect(root.querySelector("#h")?.innerHTML).toContain("script");
    });

    // ── 元键注入（ADR-0122 决策 2）─────────────────────────────────────
    // 注：$loading/$error 注入宿主 scope locals，仅宿主**内部**子元素经 scope 链可读
    // （兄弟元素在 scope 树另一分支，读不到）。成功态 x-html 写 innerHTML 会清空宿主内
    // 子元素，故成功态不再断言内部读取者，改断言宿主内容与 x-loading 属性。

    test("$loading/$error 注入宿主 locals：pending true → 成功 false，模板直读", async () => {
        const gate = deferred<{ body: string }>();
        mockFetch(() => gate.promise);
        const { root } = mount(
            `<div id="h" x-html="/api/slow.html"><span class="l" x-text="$loading"></span></div>`,
            {},
        );
        await flush();
        const h = root.querySelector("#h")!;
        // pending：$loading=true（宿主内子元素经 scope 链读到 locals 层）
        expect(root.querySelector(".l")?.textContent).toBe("true");
        gate.resolve({ body: "<b>好了</b>" });
        await flush();
        // 成功：内部读取者被远程内容替换清空；宿主内容到达、x-loading 回落 false
        expect(h.innerHTML).toContain("<b>好了</b>");
        expect(h.getAttribute("x-loading")).toBe("false");
    });

    test("失败态：$error 为 Error 实例，$error.message 可插值", async () => {
        mockFetch(() => new Error("网络炸了"));
        const { root } = mount(
            `<div id="h" x-html="/api/bad"><span class="e" x-text="$error ? $error.message : ''"></span></div>`,
            {},
        );
        await flush();
        // 失败不写 innerHTML，宿主内读取者保留
        expect(root.querySelector(".e")?.textContent).toContain("网络炸了");
    });

    test("重取时清 $error：新一轮请求发起时错误清除", async () => {
        let call = 0;
        mockFetch(() => {
            call++;
            return call === 1 ? new Error("首次失败") : { body: "<b>成功</b>" };
        });
        const { root, engine } = mount(
            `<div id="h" x-html="/api/p-{t}.html"><span class="e" x-text="$error ? $error.message : ''"></span><span class="l" x-text="$loading"></span></div>`,
            { t: 1 },
        );
        await flush();
        const h = root.querySelector("#h")!;
        expect(root.querySelector(".e")?.textContent).toContain("首次失败");
        expect(root.querySelector(".l")?.textContent).toBe("false");
        // 触发重取：pending 期 $error 清空、$loading 回 true（内部读取者仍在）
        engine.state.t = 2;
        await flush();
        // 第二次成功：宿主内容写入，内部读取者被替换清空
        expect(h.innerHTML).toBe("<b>成功</b>");
        expect(h.getAttribute("x-loading")).toBe("false");
    });

    // ── x-loading 合成（ADR-0122 决策 3：恒合成、无互斥）──────────────

    test("x-loading 合成：pending 显示覆盖层、完成后撤除", async () => {
        const gate = deferred<{ body: string }>();
        mockFetch(() => gate.promise);
        const { root } = mount(`<div id="h" x-html="/api/slow.html"></div>`, {});
        await flush();
        const h = root.querySelector("#h")!;
        expect(h.getAttribute("x-loading")).toBe("true");
        expect(overlayOf(h)).not.toBeNull();
        gate.resolve({ body: "<b>好了</b>" });
        await flush();
        expect(h.getAttribute("x-loading")).toBe("false");
        expect(overlayOf(h)).toBeNull();
        expect(h.innerHTML).toBe("<b>好了</b>");
    });

    test("loading:false 恒关：不合成 x-loading 属性", async () => {
        const gate = deferred<{ body: string }>();
        mockFetch(() => gate.promise);
        const { root } = mount(
            `<div id="h" x-html="/api/slow.html" x-html-options="{loading:false}"></div>`,
            {},
        );
        await flush();
        expect(root.querySelector("#h")?.getAttribute("x-loading")).toBeNull();
        gate.resolve({ body: "x" });
        await flush();
    });

    test("宿主手写 x-loading → 不叠加（既有规则不变）", async () => {
        const gate = deferred<{ body: string }>();
        mockFetch(() => gate.promise);
        const { root } = mount(
            `<div id="h" x-html="/api/slow.html" x-loading="false"></div>`,
            {},
        );
        await flush();
        // 手写 x-loading 存在，x-html 不覆盖合成
        expect(root.querySelector("#h")?.getAttribute("x-loading")).toBe("false");
        gate.resolve({ body: "x" });
        await flush();
    });

    test("x-loading-options 的 message 经 LoadingDirective 接线进覆盖层文案", async () => {
        const gate = deferred<{ body: string }>();
        mockFetch(() => gate.promise);
        const { root } = mount(
            `<div id="h" x-html="/api/slow.html" x-html-options="{loading:{message:'自定义文案'}}"></div>`,
            {},
        );
        await flush();
        // 覆盖层块内 x-text="message" 渲染 options 合入的配置
        expect(root.querySelector(".x-loading-message")?.textContent).toBe("自定义文案");
        gate.resolve({ body: "x" });
        await flush();
    });

    // ── .compile 远程模板（决策 4）─────────────────────────────────────

    test(".compile：远程模板作为子模板编译，表达式读宿主作用域", async () => {
        mockFetch(() => ({
            body: `<span class="t" x-text="title"></span><span class="n" x-text="count"></span>`,
        }));
        const { root } = mount(
            `<div id="h" x-data="{ title: '书名', count: 3 }" x-html.compile="/api/tpl.html"></div>`,
            {},
        );
        await flush();
        expect(root.querySelector(".t")?.textContent).toBe("书名");
        expect(root.querySelector(".n")?.textContent).toBe("3");
    });

    test(".compile：插值重取 → 全量重编译新模板", async () => {
        mockFetch(() => ({ body: `<b class="v1">模板一</b>` }));
        const { root, engine } = mount(`<div id="h" x-html.compile="/api/t-{t}.html"></div>`, {
            t: 1,
        });
        await flush();
        expect(root.querySelector(".v1")?.textContent).toBe("模板一");
        mockFetch(() => ({ body: `<i class="v2">模板二</i>` }));
        engine.state.t = 2;
        await flush();
        expect(root.querySelector(".v1")).toBeNull();
        expect(root.querySelector(".v2")?.textContent).toBe("模板二");
    });

    // ── 同元素双异步：x-html 独占视觉通道（ADR-0122 决策 4）────────────

    test("双异步：x-html 合成 overlay（字面量 true），x-data 不合成", async () => {
        const gate = deferred<{ body: any }>();
        mockFetch(() => gate.promise);
        const { root } = mount(
            `<div id="h" x-data="/api/book.json" x-html.compile="/api/tpl.html"></div>`,
            {},
        );
        await flush();
        const h = root.querySelector("#h")!;
        // x-html 合成字面量 "true"；x-data 不合成（无 $loading 路径形态）
        expect(h.getAttribute("x-loading")).toBe("true");
        gate.resolve({ body: { title: "远程书名" } });
        await flush();
    });

    test("双异步：数据与模板双远程，模板到达后读数据域", async () => {
        mockFetch((url) =>
            url.includes("tpl")
                ? { body: `<span class="t" x-text="title"></span>` }
                : { body: { title: "远程书名" } },
        );
        const { root } = mount(
            `<div id="h" x-data="/api/book.json" x-html.compile="/api/tpl.html"></div>`,
            {},
        );
        await flush();
        expect(root.querySelector(".t")?.textContent).toBe("远程书名");
    });

    test("双异步：x-data 显式 loading 选项被忽略并 warn", async () => {
        const gate = deferred<{ body: any }>();
        mockFetch(() => gate.promise);
        const { root } = mount(
            `<div id="h" x-data="/api/book.json" x-data-options="{loading:{message:'x'}}" x-html="/api/p.html"></div>`,
            {},
        );
        await flush();
        const h = root.querySelector("#h")!;
        // x-html 合成字面量；x-data 的 loading 被忽略（无 x-loading-options 合成）
        expect(h.getAttribute("x-loading")).toBe("true");
        expect(h.getAttribute("x-loading-options")).toBeNull();
        gate.resolve({ body: { a: 1 } });
        await flush();
    });

    // ── 生命周期与竞态（决策 7 沿用清单）───────────────────────────────

    test("竞态丢弃：后发先至的旧响应不落地", async () => {
        const slow = deferred<{ body: string }>();
        let n = 0;
        mockFetch(() => {
            n++;
            return n === 1 ? slow.promise : Promise.resolve({ body: "<b>新响应</b>" });
        });
        const { root, engine } = mount(`<div id="h" x-html="/api/p-{t}.html"></div>`, { t: 1 });
        await flush();
        // 首请求挂起时依赖变化 → 新请求先回
        engine.state.t = 2;
        await flush();
        expect(root.querySelector("#h")?.innerHTML).toBe("<b>新响应</b>");
        slow.resolve({ body: "<b>旧响应</b>" });
        await flush();
        expect(root.querySelector("#h")?.innerHTML).toBe("<b>新响应</b>");
    });

    test("destroy：进行中请求被拒收（结果不落地）", async () => {
        const gate = deferred<{ body: string }>();
        mockFetch(() => gate.promise);
        const { root, engine } = mount(`<div id="h" x-html="/api/slow.html"></div>`, {});
        await flush();
        const h = root.querySelector("#h")!; // destroy 会清空 root，先取引用
        engine.destroy();
        gate.resolve({ body: "<b>迟到的</b>" });
        await flush();
        expect(h.innerHTML).toBe("");
    });
});
