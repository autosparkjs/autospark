import { describe, expect, test } from "bun:test";
import "./setup";
import { mount, nextTick } from "./helpers";

/** 读取覆盖层根节点（宿主第一个子若为 overlay 则返回，否则 null） */
const overlayOf = (host: Element | null): HTMLElement | null =>
    (host?.querySelector(".x-loading-overlay") as HTMLElement) ?? null;

/** 等待指定毫秒（用于 delay 用例） */
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

describe("x-loading 快速绑定（整值即 value 表达式）", () => {
    test("true 挂载覆盖层，false 移除，true 重建", async () => {
        const { root, store } = mount(`<div id="h" x-loading="show"></div>`, { show: true });
        const h = root.querySelector("#h")!;
        // 初始 true：覆盖层已挂载
        expect(overlayOf(h)).not.toBeNull();
        store.state.show = false;
        await nextTick();
        expect(overlayOf(h)).toBeNull();
        store.state.show = true;
        await nextTick();
        expect(overlayOf(h)).not.toBeNull();
    });

    test("初始 false：覆盖层不挂载", async () => {
        const { root, store } = mount(`<div id="h" x-loading="show"></div>`, { show: false });
        const h = root.querySelector("#h")!;
        expect(overlayOf(h)).toBeNull();
        store.state.show = true;
        await nextTick();
        expect(overlayOf(h)).not.toBeNull();
    });

    test("falsy 值（false/0/空串/null）统一不挂载", () => {
        for (const flag of [false, 0, "", null]) {
            const { root } = mount(`<div id="h" x-loading="flag"></div>`, { flag });
            expect(overlayOf(root.querySelector("#h"))).toBeNull();
        }
    });

    test("表达式 value：a && !b 依赖多状态，切换任一即响应", async () => {
        const { root, store } = mount(`<div id="h" x-loading="a && !b"></div>`, {
            a: true,
            b: false,
        });
        const h = root.querySelector("#h")!;
        // true && !false → true：已挂载
        expect(overlayOf(h)).not.toBeNull();
        store.state.b = true;
        await nextTick();
        // true && !true → false：移除
        expect(overlayOf(h)).toBeNull();
        store.state.a = false;
        store.state.b = false;
        await nextTick();
        // false && !false → false：仍无
        expect(overlayOf(h)).toBeNull();
        store.state.a = true;
        await nextTick();
        // true && !false → true：重建
        expect(overlayOf(h)).not.toBeNull();
    });

    test("路径绑定 store 状态：order.isSubmit", async () => {
        const { root, store } = mount(`<div id="h" x-loading="order.isSubmit"></div>`, {
            order: { isSubmit: false },
        });
        const h = root.querySelector("#h")!;
        expect(overlayOf(h)).toBeNull();
        store.state.order.isSubmit = true;
        await nextTick();
        expect(overlayOf(h)).not.toBeNull();
    });
});

describe("x-loading 字面量与缺省（bare / true / false）", () => {
    test("裸 x-loading（无值）≡ x-loading='true'：默认显示", () => {
        const { root } = mount(`<div id="h" x-loading></div>`, {});
        expect(overlayOf(root.querySelector("#h"))).not.toBeNull();
    });

    test("x-loading='true'：字面量 true，静态显示（非状态路径）", () => {
        const { root } = mount(`<div id="h" x-loading="true"></div>`, {});
        expect(overlayOf(root.querySelector("#h"))).not.toBeNull();
    });

    test("x-loading='false'：字面量 false，静态隐藏（非状态路径）", () => {
        const { root } = mount(`<div id="h" x-loading="false"></div>`, {});
        expect(overlayOf(root.querySelector("#h"))).toBeNull();
    });

    test("字面量大小写不敏感：TRUE / False 同效", () => {
        const a = mount(`<div id="a" x-loading="TRUE"></div>`, {});
        expect(overlayOf(a.root.querySelector("#a"))).not.toBeNull();
        const b = mount(`<div id="b" x-loading="False"></div>`, {});
        expect(overlayOf(b.root.querySelector("#b"))).toBeNull();
    });

    test("字面量不订阅状态：store 变化不影响显隐", async () => {
        const { root, store } = mount(`<div id="h" x-loading="true"></div>`, { flag: false });
        const h = root.querySelector("#h")!;
        expect(overlayOf(h)).not.toBeNull();
        store.state.flag = true; // 字面量模式无订阅，不应触发任何变化
        await nextTick();
        expect(overlayOf(h)).not.toBeNull();
    });
});

describe("x-loading 运行时通道（Runtime 指令 / observer）", () => {
    test("属性保留在结果 DOM 上（允许 DOM API 访问）", () => {
        const { root } = mount(`<div id="h" x-loading="l"></div>`, { l: true });
        // runtime 指令属性不被编译器剥除，留在结果元素上
        expect(root.querySelector("#h")!.hasAttribute("x-loading")).toBe(true);
    });

    test("动态插入带 x-loading 的元素：observer 自动挂载", async () => {
        const { root, store } = mount(`<div></div>`, { l: false });
        // 编译期无 x-loading 元素；运行时用原生 DOM API 插入
        const dynamic = document.createElement("div");
        dynamic.id = "d";
        dynamic.setAttribute("x-loading", "l");
        root.querySelector("div")!.appendChild(dynamic);
        await nextTick(); // 等 observer 投递
        expect(overlayOf(root.querySelector("#d"))).toBeNull(); // l=false 不挂载
        store.state.l = true;
        await nextTick();
        expect(overlayOf(root.querySelector("#d"))).not.toBeNull(); // 响应全局状态
    });

    test("setAttribute 改值 → attrChanged 重绑到新表达式", async () => {
        const { root, store } = mount(`<div id="h" x-loading="a"></div>`, { a: false, b: true });
        const h = root.querySelector("#h")!;
        expect(overlayOf(h)).toBeNull(); // a=false
        // 改绑到 b
        h.setAttribute("x-loading", "b");
        await nextTick();
        expect(overlayOf(h)).not.toBeNull(); // b=true → 挂载
        store.state.b = false;
        await nextTick();
        expect(overlayOf(h)).toBeNull(); // 现在订阅的是 b
    });

    test("removeAttribute 删除属性 → 卸载实例（覆盖层移除）", async () => {
        const { root, store } = mount(`<div id="h" x-loading="l"></div>`, { l: true });
        const h = root.querySelector("#h")!;
        expect(overlayOf(h)).not.toBeNull();
        h.removeAttribute("x-loading");
        await nextTick(); // observer 检测到属性删除 → unmount
        expect(overlayOf(h)).toBeNull();
        // 属性已删，后续状态变化不再影响
        store.state.l = false;
        await nextTick();
        expect(overlayOf(h)).toBeNull();
    });

    test("命令式 overlay 模式：对象配置无 value → 属性存在即显示（ADR-0008 决策 8，feedback 依赖）", async () => {
        // 初始 x-loading 对象配置省略 value → resolveLiteral("")===true → 静态显示 + 配置渲染。
        // feedback 的 loading 配置对象（命令式 setAttribute 注入「无 value 的配置」）复用此契约，故锁定。
        // 「移除即隐藏」由上条 removeAttribute 测试覆盖（属性删 → unmount → overlay 移除）。
        const { root } = mount(`<div id="h" x-loading="{ message:'保存中', color:'red' }"></div>`, {});
        const h = root.querySelector("#h")!;
        const overlay = overlayOf(h);
        expect(overlay).not.toBeNull();
        expect(overlay!.querySelector(".x-loading-message")!.textContent).toBe("保存中");
    });

    test("元素从 DOM 移除 → observer 自动卸载（无泄露）", async () => {
        const { root, store } = mount(`<div id="h" x-loading="l"></div>`, { l: true });
        const h = root.querySelector("#h")!;
        expect(overlayOf(h)).not.toBeNull();
        h.remove(); // 原生移除
        await nextTick();
        // 元素已不在；状态变化不应抛错（实例已 unmounted，watcher 已 off）
        expect(() => {
            store.state.l = false;
        }).not.toThrow();
    });

    test("engine.destroy 回收 observer：销毁后动态插入不再生效", async () => {
        const { root, engine } = mount(`<div></div>`, { l: true });
        engine.destroy();
        // destroy 后 observer 已断开，新插入的 x-loading 元素不会被接管
        const dynamic = document.createElement("div");
        dynamic.setAttribute("x-loading", "l");
        (root.querySelector("div") ?? root).appendChild(dynamic);
        await nextTick();
        expect(overlayOf(dynamic)).toBeNull();
    });
});

describe("x-loading 配置绑定（对象语法）", () => {
    test("value 字段控制显隐", async () => {
        const { root, store } = mount(
            `<div id="h" x-loading="{ value:'flag' }"></div>`,
            { flag: false },
        );
        const h = root.querySelector("#h")!;
        expect(overlayOf(h)).toBeNull();
        store.state.flag = true;
        await nextTick();
        expect(overlayOf(h)).not.toBeNull();
    });

    test("缺 value：默认显示（裸属性≡true 语义延伸到配置缺省）", () => {
        const { root } = mount(`<div id="h" x-loading="{ message:'x' }"></div>`, {});
        // 未指定 value ≡ true：默认显示，message 正常渲染
        const h = root.querySelector("#h")!;
        expect(overlayOf(h)).not.toBeNull();
        expect(h.querySelector(".x-loading-message")?.textContent).toBe("x");
    });

    test("旧键 visible：warn 提示已更名 + 忽略不生效（缺失 value ≡ 裸属性恒显示）", () => {
        const warns: string[] = [];
        const origWarn = console.warn;
        console.warn = (...args: any[]) => {
            warns.push(String(args[0] ?? ""));
        };
        try {
            const { root } = mount(`<div id="h" x-loading="{ visible:'flag', message:'x' }"></div>`, {
                flag: false,
            });
            // visible 被忽略 → value 缺失 ≡ true → 恒显示（不按 flag 反应）
            expect(overlayOf(root.querySelector("#h"))).not.toBeNull();
        } finally {
            console.warn = origWarn;
        }
        expect(warns.some((w) => w.includes("已更名为"))).toBe(true);
    });

    test("color 注入 loader（currentColor 经 style.color）", () => {
        const { root } = mount(
            `<div id="h" x-loading="{ value:'l', color:'red' }"></div>`,
            { l: true },
        );
        const loader = root.querySelector("#h .x-loading-loader") as HTMLElement;
        expect(loader).not.toBeNull();
        // style.color 读值经 happy-dom 规范化；断言非空且含 red 或对应 rgb
        expect(loader.style.color.length).toBeGreaterThan(0);
    });

    test("bgColor + opacity 合成为 rgba 背景", () => {
        const { root } = mount(
            `<div id="h" x-loading="{ value:'l', bgColor:'white', opacity:0.5 }"></div>`,
            { l: true },
        );
        const ov = overlayOf(root.querySelector("#h"))!;
        // 背景应含 rgba（white,0.5 → 半透明白）
        const bg = ov.style.background || ov.style.backgroundColor;
        expect(bg).toMatch(/rgba?\(/);
    });

    test("message 渲染文本；不传则 message 元素文本为空", () => {
        // ADR-0021 决策 12：DEFAULT_BLOCK 的 message 经 x-text="message" 绑定。
        // message 元素恒存在（默认块模板写死），不传时 x-text 写空串（而非移除节点）
        const withMsg = mount(
            `<div id="h" x-loading="{ value:'l', message:'正在加载' }"></div>`,
            { l: true },
        );
        const msg1 = withMsg.root.querySelector("#h .x-loading-message");
        expect(msg1?.textContent).toBe("正在加载");

        const noMsg = mount(`<div id="h" x-loading="{ value:'l' }"></div>`, { l: true });
        const msgEl = noMsg.root.querySelector("#h .x-loading-message");
        expect(msgEl).not.toBeNull(); // 元素存在
        expect(msgEl?.textContent).toBe(""); // 但文本为空
    });
});

describe("x-loading selector 目标元素", () => {
    test("selector 命中宿主后代：覆盖层挂到目标而非宿主", () => {
        const { root } = mount(
            `<div id="h" x-loading="{ value:'l', selector:'#t' }"><div id="t"></div></div>`,
            { l: true },
        );
        const h = root.querySelector("#h")!;
        const t = root.querySelector("#t")!;
        const ov = h.querySelector(".x-loading-overlay") as HTMLElement;
        expect(ov).not.toBeNull();
        expect(ov.parentElement === t).toBe(true); // 挂在 #t 上，非宿主直接子
    });

    test("selector 以 @ 开头：覆盖层挂到 document 全局元素（宿主外）", () => {
        // 准备一个宿主外的全局目标
        const external = document.createElement("div");
        external.id = "external";
        document.body.appendChild(external);
        try {
            const { root, engine } = mount(
                `<div id="h" x-loading="{ value:'l', selector:'@#external' }"></div>`,
                { l: true },
            );
            // 覆盖层应在全局 #external 上，而非 detached 的 root 内
            expect(external.querySelector(".x-loading-overlay")).not.toBeNull();
            expect(root.querySelector(".x-loading-overlay")).toBeNull();
            engine.destroy();
        } finally {
            external.remove();
        }
    });

    test("selector 未命中：回退到宿主元素显示", () => {
        const { root } = mount(
            `<div id="h" x-loading="{ value:'l', selector:'#missing' }"></div>`,
            { l: true },
        );
        const h = root.querySelector("#h")!;
        const ov = h.querySelector(".x-loading-overlay") as HTMLElement;
        expect(ov).not.toBeNull();
        expect(ov.parentElement === h).toBe(true); // 回退宿主
    });

    test("selector 非法：回退到宿主元素显示（不抛错）", () => {
        const { root } = mount(
            `<div id="h" x-loading="{ value:'l', selector:'!!bad!!' }"></div>`,
            { l: true },
        );
        const h = root.querySelector("#h")!;
        const ov = h.querySelector(".x-loading-overlay") as HTMLElement;
        expect(ov).not.toBeNull();
        expect(ov.parentElement === h).toBe(true); // 非法选择器回退宿主
    });
});

describe("x-loading 修饰符", () => {
    test(".screen → 覆盖层 position:fixed（撑满视口）", () => {
        // ADR-0021 决策 12-b：壳样式走内联 style（position），不再追加 .x-loading-screen class
        const { root } = mount(`<div id="h" x-loading.screen="l"></div>`, { l: true });
        const ov = overlayOf(root.querySelector("#h"))!;
        expect(ov.style.position).toBe("fixed");
    });

    test("无 .screen → 覆盖层 position:absolute（撑满宿主）", () => {
        const { root } = mount(`<div id="h" x-loading="l"></div>`, { l: true });
        const ov = overlayOf(root.querySelector("#h"))!;
        expect(ov.style.position).toBe("absolute");
    });
});

describe("x-loading delay 防闪烁", () => {
    test("delay>0：true 后延迟到期才挂载", async () => {
        const { root } = mount(`<div id="h" x-loading="{ value:'l', delay:20 }"></div>`, {
            l: true,
        });
        const h = root.querySelector("#h")!;
        // created 时 initial=true 启动 timer，未到期：尚未挂载
        expect(overlayOf(h)).toBeNull();
        await wait(60);
        expect(overlayOf(h)).not.toBeNull();
    });

    test("延迟窗口内回 false：不挂载（防闪烁）", async () => {
        const { root, store } = mount(
            `<div id="h" x-loading="{ value:'l', delay:30 }"></div>`,
            { l: false },
        );
        const h = root.querySelector("#h")!;
        store.state.l = true;
        await nextTick();
        // 未到期，回 false
        store.state.l = false;
        await nextTick();
        await wait(80);
        expect(overlayOf(h)).toBeNull();
    });
});

describe("x-loading 反复切换无泄露", () => {
    test("多次 true↔false：覆盖层始终至多 1 个", async () => {
        const { root, store } = mount(`<div id="h" x-loading="l"></div>`, { l: true });
        const h = root.querySelector("#h")!;
        for (let i = 0; i < 5; i++) {
            store.state.l = false;
            await nextTick();
            store.state.l = true;
            await nextTick();
        }
        expect(h.querySelectorAll(".x-loading-overlay").length).toBe(1);
    });

    test("销毁后覆盖层移除（destroy 清理 DOM）", async () => {
        const { root, store } = mount(
            `<div id="outer" x-if="show"><div id="h" x-loading="l"></div></div>`,
            { show: true, l: true },
        );
        const h = root.querySelector("#h")!;
        expect(overlayOf(h)).not.toBeNull();
        // 外层 x-if 隐藏 → 销毁子 scope（含 x-loading）→ destroy 移除覆盖层
        store.state.show = false;
        await nextTick();
        // #h 被移除（子树销毁）
        expect(root.querySelector("#h")).toBeNull();
    });
});


describe("x-loading 动作按钮（ADR-0038）", () => {
    /** 拦截 console.warn 收集日志（logger.warn 底层走 console.warn） */
    function captureWarns<T>(fn: () => T): { warns: string[]; result: T } {
        const warns: string[] = [];
        const origWarn = console.warn;
        console.warn = (...args: any[]) => {
            warns.push(String(args[0] ?? ""));
        };
        try {
            return { warns, result: fn() };
        } finally {
            console.warn = origWarn;
        }
    }

    test("actions 渲染按钮行：title 取 ActionDesc.title，未注册显示 name 兜底", async () => {
        const { root } = mount(
            `<div id="h" x-loading="{ value:'l', actions:['close','retry'] }"></div>`,
            { l: true },
            { actions: { retry: { title: "重试", handle: () => {} } } },
        );
        // x-for 首渲染经 scheduler microtask flush，须等一拍
        await nextTick();
        const btns = root.querySelectorAll("#h .x-loading-action");
        // close 命中内置（title 关闭）；retry 命中用户注册（title 重试）
        expect(btns.length).toBe(2);
        expect(btns[0]!.textContent).toBe("关闭");
        expect(btns[0]!.getAttribute("data-action")).toBe("close");
        expect(btns[1]!.textContent).toBe("重试");
        expect(btns[1]!.getAttribute("data-action")).toBe("retry");
    });

    test("未注册 action 的 title 兜底为 name 本身", async () => {
        const { root } = mount(
            `<div id="h" x-loading="{ value:'l', actions:['refresh'] }"></div>`,
            { l: true },
        );
        await nextTick();
        const btn = root.querySelector("#h .x-loading-action")!;
        expect(btn).not.toBeNull();
        expect(btn.textContent).toBe("refresh");
    });

    test("无 actions 配置：不渲染任何按钮（常规 loading 不受影响）", async () => {
        const { root } = mount(`<div id="h" x-loading="l"></div>`, { l: true });
        await nextTick();
        expect(root.querySelector("#h .x-loading-action")).toBeNull();
        // 按钮行容器随 x-for 空数组保留但无子节点（CSS :empty 折叠为零占位）
        expect(root.querySelector("#h .x-loading-actions")!.children.length).toBe(0);
    });

    test("x-loading-options 入口声明 actions（inline 缺失才回退）", async () => {
        const { root } = mount(
            `<div id="h" x-loading="l" x-loading-options="{actions:['close']}"></div>`,
            { l: true },
        );
        await nextTick();
        const btn = root.querySelector("#h .x-loading-action")!;
        expect(btn).not.toBeNull();
        expect(btn.getAttribute("data-action")).toBe("close");
    });

    test("actions 非字符串元素 warn 剪枝；非数组整体忽略", async () => {
        const part = captureWarns(() =>
            mount(`<div id="h" x-loading="{ value:'l', actions:['ok', 1, null] }"></div>`, {
                l: true,
            }),
        );
        await nextTick();
        expect(part.result.root.querySelectorAll("#h .x-loading-action").length).toBe(1);
        expect(part.warns.some((w) => w.includes("已剪枝"))).toBe(true);

        const bad = captureWarns(() =>
            mount(`<div id="h" x-loading="{ value:'l', actions:'close' }"></div>`, { l: true }),
        );
        await nextTick();
        expect(bad.result.root.querySelector("#h .x-loading-action")).toBeNull();
        expect(bad.warns.some((w) => w.includes("须为字符串数组"))).toBe(true);
    });

    test("点击已注册 action：handle 调用（this.el=按钮）+ 双通道完整广播", async () => {
        const bus: string[] = [];
        let seenEl: HTMLElement | null = null;
        let domCount = 0;
        const { root, engine } = mount(
            `<div id="h" x-loading="{ value:'l', actions:['retry'] }"></div>`,
            { l: true },
            {
                actions: {
                    retry: {
                        title: "重试",
                        handle: function (this: any) {
                            seenEl = this.el;
                            return 42;
                        },
                    },
                },
            },
        );
        engine.on("actions/retry/pending", () => bus.push("pending"));
        engine.on("actions/retry/resolved", (m: any) => bus.push(`resolved:${m.payload.result}`));
        const h = root.querySelector("#h")!;
        h.addEventListener("action:retry", () => domCount++);
        await nextTick();
        root.querySelector("#h .x-loading-action")!.click();
        // handle 真实执行、this.el 是被点按钮
        expect(seenEl?.getAttribute("data-action")).toBe("retry");
        // 总线：pending + resolved(42)；DOM：同名事件各 dispatch 一次（detail.phase 区分）
        expect(bus).toEqual(["pending", "resolved:42"]);
        expect(domCount).toBe(2);
    });

    test("点击未注册 action：合成透传 descriptor，两通道照播", async () => {
        const bus: string[] = [];
        let domDetail: any = null;
        let domCount = 0;
        const { root, engine } = mount(
            `<div id="h" x-loading="{ value:'l', actions:['refresh'] }"></div>`,
            { l: true },
        );
        engine.on("actions/refresh/pending", () => bus.push("pending"));
        engine.on("actions/refresh/resolved", (m: any) => bus.push(`resolved:${m.payload.name}`));
        root.querySelector("#h")!.addEventListener("action:refresh", (e) => {
            domCount++;
            domDetail = (e as CustomEvent).detail;
        });
        await nextTick();
        root.querySelector("#h .x-loading-action")!.click();
        // 总线照播（合成 descriptor 的广播语义与内置信号型同构）
        expect(bus).toEqual(["pending", "resolved:refresh"]);
        // DOM 冒泡照发：pending + resolved 两次，detail 携带 name 与合成 descriptor
        expect(domCount).toBe(2);
        expect(domDetail?.name).toBe("refresh");
        expect(domDetail?.action?.name).toBe("refresh");
        expect(typeof domDetail?.action?.handle).toBe("function");
    });

    test("点击抛错的 action：广播 rejected 且仍自动隐藏（不向监听器抛出）", async () => {
        const bus: string[] = [];
        const { root, engine } = mount(
            `<div id="h" x-loading="{ value:'l', actions:['boom'] }"></div>`,
            { l: true },
            {
                actions: {
                    boom: {
                        handle: () => {
                            throw new Error("boom");
                        },
                    },
                },
            },
        );
        engine.on("actions/boom/rejected", () => bus.push("rejected"));
        const h = root.querySelector("#h")!;
        await nextTick();
        expect(() => root.querySelector("#h .x-loading-action")!.click()).not.toThrow();
        expect(bus).toEqual(["rejected"]);
        expect(overlayOf(h)).toBeNull();
    });

    test("默认自动隐藏：先完整广播（监听时覆盖层仍在）再纯 DOM 移除（不写状态）", async () => {
        let overlayAliveDuringBroadcast = false;
        const { root, store } = mount(
            `<div id="h" x-loading="{ value:'l', actions:['close'] }"></div>`,
            { l: true },
        );
        const h = root.querySelector("#h")!;
        h.addEventListener("action:close", () => {
            overlayAliveDuringBroadcast = !!h.querySelector(".x-loading-overlay");
        });
        await nextTick();
        root.querySelector("#h .x-loading-action")!.click();
        // 广播期间覆盖层尚未移除；广播后移除；value 仍为 true（引擎不写状态）
        expect(overlayAliveDuringBroadcast).toBe(true);
        expect(overlayOf(h)).toBeNull();
        expect(store.state.l).toBe(true);
        // 复苏：value 翻 false → true 后恢复正常驱动
        store.state.l = false;
        await nextTick();
        store.state.l = true;
        await nextTick();
        expect(overlayOf(h)).not.toBeNull();
    });

    test("async action：pending 即隐藏（不等待 resolved），总线 resolved 仍广播", async () => {
        const bus: string[] = [];
        const { root, engine } = mount(
            `<div id="h" x-loading="{ value:'l', actions:['reload'] }"></div>`,
            { l: true },
            {
                actions: {
                    reload: async () => {
                        await wait(20);
                        return "done";
                    },
                },
            },
        );
        engine.on("actions/reload/pending", () => bus.push("pending"));
        engine.on("actions/reload/resolved", () => bus.push("resolved"));
        const h = root.querySelector("#h")!;
        await nextTick();
        root.querySelector("#h .x-loading-action")!.click();
        expect(bus).toEqual(["pending"]);
        expect(overlayOf(h)).toBeNull(); // 未等 resolved 已隐藏
        await wait(40);
        expect(bus).toEqual(["pending", "resolved"]); // 总线 resolved 照播
    });

    test("hide:false 续显：ActionDesc 逐按钮关闭自动隐藏", async () => {
        const { root } = mount(
            `<div id="h" x-loading="{ value:'l', actions:['retry'] }"></div>`,
            { l: true },
            { actions: { retry: { title: "重试", hide: false, handle: () => {} } } },
        );
        const h = root.querySelector("#h")!;
        await nextTick();
        root.querySelector("#h .x-loading-action")!.click();
        expect(overlayOf(h)).not.toBeNull(); // hide:false 不隐藏
    });

    test("未注册名恒隐藏（合成 descriptor 无 hide 配置位）", async () => {
        const { root } = mount(
            `<div id="h" x-loading="{ value:'l', actions:['refresh'] }"></div>`,
            { l: true },
        );
        const h = root.querySelector("#h")!;
        await nextTick();
        root.querySelector("#h .x-loading-action")!.click();
        expect(overlayOf(h)).toBeNull();
    });

    test("自定义 loading 组件：actions 数据注入 + data-action 委托同享（渲染归块作者）", async () => {
        let domFired = false;
        const { root } = mount(
            `<div x-scope>
                <div x-component="loading">
                    <div class="my-loading">
                        <div class="my-title" x-text="message"></div>
                        <div class="my-actions" x-for="a of actions">
                            <a class="my-btn" :data-action="a.name" x-text="a.title"></a>
                        </div>
                    </div>
                </div>
                <div id="h" x-loading="{ value:'l', message:'自定义加载', actions:['close'] }">内容</div>
            </div>`,
            { l: true },
        );
        const h = root.querySelector("#h")!;
        await nextTick();
        // 自定义组件替换默认块：config 数据注入（message/actions 均可见）
        expect(root.querySelector(".my-title")?.textContent).toBe("自定义加载");
        const btn = root.querySelector(".my-btn") as HTMLElement;
        expect(btn).not.toBeNull();
        expect(btn.textContent).toBe("关闭");
        expect(btn.getAttribute("data-action")).toBe("close");
        // 委托对自定义块生效：点击 → action:close 广播 + 默认自动隐藏
        h.addEventListener("action:close", () => {
            domFired = true;
        });
        btn.click();
        expect(domFired).toBe(true);
        expect(root.querySelector(".my-loading")).toBeNull(); // overlay 已随 hide() 移除
    });
});
