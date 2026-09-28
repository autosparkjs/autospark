import { describe, test, expect, afterEach } from "bun:test";
import { mount, nextTick } from "./helpers";
import "./setup";

/**
 * x-teleport 传送（ADR-0059）：一次性静态结构指令——ownsChildren 延迟编译 +
 * dataContext 基准 + 三类失败降级 + 组合矩阵。
 */

let warns: string[] = [];
const origWarn = console.warn;

/** 捕获 warn 日志（引擎 logger 走 console.warn） */
function captureWarn() {
    warns = [];
    console.warn = (msg?: any) => warns.push(String(msg));
}
function releaseWarn() {
    console.warn = origWarn;
}
function warnHits(keyword: string): boolean {
    return warns.some((w) => w.includes(keyword));
}

afterEach(() => {
    releaseWarn();
    // 清理挂到 body 的传送目标（测试间隔离）
    for (const el of Array.from(document.body.querySelectorAll("[data-tp-test]"))) {
        el.remove();
    }
});

/** 在 body 下创建全局传送目标（带 data-tp-test 标记供 afterEach 清理） */
function bodyTarget(id: string): HTMLElement {
    const el = document.createElement("div");
    el.id = id;
    el.setAttribute("data-tp-test", "");
    document.body.appendChild(el);
    return el;
}

describe("x-teleport 值解析与传送", () => {
    test("engine 内目标（../ 父级爬升）：宿主搬到目标下、原位留锚点注释、子树照常编译且响应式", async () => {
        const { root, engine } = mount(
            `<div class="target"></div>
             <div class="tp" x-teleport="../.target"><span x-text="msg"></span></div>`,
            { msg: "hi" },
        );
        await nextTick();
        const target = root.querySelector(".target")!;
        // 宿主已搬到目标下，子树编译生效
        expect(target.querySelector(".tp span")!.textContent).toBe("hi");
        // 原位留锚点注释（DOM 书签）
        const anchor = Array.from(root.childNodes).find((n) => n.nodeType === 8);
        expect(anchor).not.toBeUndefined();
        // 响应式仍工作（绑定已按声明处上下文编译）
        engine.state.msg = "changed";
        await nextTick();
        expect(target.querySelector(".tp span")!.textContent).toBe("changed");
    });

    test("全局目标（/ 前缀）：搬到 body 下元素并正常编译", async () => {
        bodyTarget("tp-global");
        const { root } = mount(
            `<div class="tp" x-teleport="/#tp-global"><span x-text="msg"></span></div>`,
            { msg: "global" },
        );
        await nextTick();
        // root 内宿主已离开
        expect(root.querySelector(".tp")).toBeNull();
        const hosted = document.querySelector("#tp-global .tp span")!;
        expect(hosted.textContent).toBe("global");
    });

    test("closest（^ 前缀）：以宿主祖先为目标——宿主移到祖先末尾", async () => {
        const { root } = mount(
            `<div class="wrap">
                <div class="tp" x-teleport="^.wrap"><span>move</span></div>
                <div class="sib"></div>
            </div>`,
            {},
        );
        await nextTick();
        const wrap = root.querySelector(".wrap")!;
        // 宿主被 append 到 .wrap 末尾（sib 之后），原位留锚点
        expect(wrap.lastElementChild!.classList.contains("tp")).toBe(true);
        expect(wrap.querySelector(".sib")).not.toBeNull();
    });

    test("嵌套传送：内层在外层子树编译后搬移，以内层为准", async () => {
        const { root } = mount(
            `<div class="outer-t"><div class="inner-t"></div></div>
             <div class="holder" x-teleport="../.outer-t">
                 <div class="tp" x-teleport="../../.inner-t"><span>nest</span></div>
             </div>`,
            {},
        );
        await nextTick();
        // 外层宿主在 .outer-t 下；内层宿主在内层的 .inner-t 下
        expect(root.querySelector(".outer-t .holder")).not.toBeNull();
        expect(root.querySelector(".outer-t .inner-t .tp span")!.textContent).toBe("nest");
    });
});

describe("x-teleport 失败降级（warn + 原地渲染）", () => {
    test("未命中：warn + 原地渲染 + 子树照常编译", async () => {
        captureWarn();
        const { root } = mount(
            `<div class="tp" x-teleport="../.nope"><span x-text="msg"></span></div>`,
            { msg: "stay" },
        );
        await nextTick();
        expect(warnHits("目标未命中")).toBe(true);
        // 原地：宿主留在 root 直下，子树正常编译
        expect(root.querySelector(".tp span")!.textContent).toBe("stay");
    });

    test("环（目标即宿主自身）：warn + 原地渲染", async () => {
        captureWarn();
        const { root } = mount(
            `<div class="tp" x-teleport="../.tp"><span>self</span></div>`,
            {},
        );
        await nextTick();
        expect(warnHits("DOM 环")).toBe(true);
        expect(root.querySelector(".tp span")!.textContent).toBe("self");
    });

    test("目标在搬移前被移除：warn（未命中）+ 原地渲染", async () => {
        captureWarn();
        // autostart 编译后同步 flushAll——_apply 在 mount() 内执行，摘除须发生在 mount 之前
        const t = document.createElement("div");
        t.id = "tp-orphan";
        document.body.appendChild(t);
        t.remove();
        const { root } = mount(`<div class="tp" x-teleport="/#tp-orphan"><span>keep</span></div>`, {});
        await nextTick();
        expect(warnHits("目标未命中")).toBe(true);
        expect(root.querySelector(".tp span")!.textContent).toBe("keep");
        expect(document.querySelector("#tp-orphan")).toBeNull();
    });

    test("空值：warn + 原地渲染", async () => {
        captureWarn();
        const { root } = mount(`<div class="tp" x-teleport=""><span>blank</span></div>`, {});
        await nextTick();
        expect(warnHits("缺少目标选择器")).toBe(true);
        expect(root.querySelector(".tp span")).not.toBeNull();
    });
});

describe("x-teleport dataContext 数据视图基准", () => {
    test("默认 declarer：传送后仍读声明处上下文（同名键遮蔽生效）", async () => {
        const { root } = mount(
            `<div x-data="{ who: '声明处' }">
                <div class="target" x-data="{ who: '目标处' }"></div>
                <div class="tp" x-teleport="../.target"><span x-text="who"></span></div>
             </div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".target .tp span")!.textContent).toBe("声明处");
    });

    test("dataContext:'host'：读目标所属 scope 上下文", async () => {
        const { root } = mount(
            `<div x-data="{ who: '声明处' }">
                <div class="target" x-data="{ who: '目标处' }"></div>
                <div class="tp" x-teleport="../.target" x-teleport-options="{dataContext:'host'}"><span x-text="who"></span></div>
             </div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".target .tp span")!.textContent).toBe("目标处");
    });

    test(".host 修饰符 ≡ dataContext:'host'", async () => {
        const { root } = mount(
            `<div x-data="{ who: '声明处' }">
                <div class="target" x-data="{ who: '目标处' }"></div>
                <div class="tp" x-teleport.host="../.target"><span x-text="who"></span></div>
             </div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".target .tp span")!.textContent).toBe("目标处");
    });

    test("host 基准 + engine 外目标（无所属 scope）：降级 rootless 全局视图", async () => {
        bodyTarget("tp-body-host");
        const { root } = mount(
            `<div x-data="{ who: '声明处' }">
                <div class="tp" x-teleport="/#tp-body-host" x-teleport-options="{dataContext:'host'}"><span x-text="who"></span></div>
             </div>`,
            { who: "全局" },
        );
        await nextTick();
        // dataBoundary：读不到声明处 x-data 域，读全局 state
        expect(document.querySelector("#tp-body-host .tp span")!.textContent).toBe("全局");
    });

    test("无效 dataContext 值：warn + 按默认 declarer", async () => {
        captureWarn();
        const { root } = mount(
            `<div x-data="{ who: '声明处' }">
                <div class="target" x-data="{ who: '目标处' }"></div>
                <div class="tp" x-teleport="../.target" x-teleport-options="{dataContext:'anywhere'}"><span x-text="who"></span></div>
             </div>`,
            {},
        );
        await nextTick();
        expect(warnHits("无效值")).toBe(true);
        expect(root.querySelector(".target .tp span")!.textContent).toBe("声明处");
    });
});

describe("x-teleport 组合矩阵", () => {
    test("x-show 同元素：传送成功，显隐在目标下照常切换", async () => {
        const { root, engine } = mount(
            `<div class="target"></div>
             <div class="tp" x-teleport="../.target" x-show="show"><span>v</span></div>`,
            { show: true },
        );
        await nextTick();
        const tp = root.querySelector(".target .tp") as HTMLElement;
        expect(tp).not.toBeNull();
        expect(tp.style.display).not.toBe("none");
        engine.state.show = false;
        await nextTick();
        expect(tp.style.display).toBe("none");
    });

    test("x-for 同元素：warn + 放弃传送，x-for 正常接管子树", async () => {
        captureWarn();
        const { root } = mount(
            `<div class="target"></div>
             <ul class="tp" x-teleport="../.target" x-for="item of items"><li x-text="item"></li></ul>`,
            { items: ["a", "b"] },
        );
        await nextTick();
        expect(warnHits("已放弃传送")).toBe(true);
        // x-for 原位渲染，宿主未搬移
        expect(root.querySelectorAll(".tp li").length).toBe(2);
        expect(root.querySelector(".target .tp")).toBeNull();
    });

    test("eager x-if 同元素：warn + 放弃传送，x-if 接管（条件销毁重建照常）", async () => {
        captureWarn();
        const { root, engine } = mount(
            `<div class="target"></div>
             <div class="tp" x-teleport="../.target" x-if="show">hi</div>`,
            { show: true },
        );
        await nextTick();
        expect(warnHits("已放弃传送")).toBe(true);
        expect(root.querySelector(".tp")!.textContent).toBe("hi");
        expect(root.querySelector(".target .tp")).toBeNull();
        // x-if 接管：切假摘宿主
        engine.state.show = false;
        await nextTick();
        expect(root.querySelector(".tp")).toBeNull();
    });

    test("keepalive x-if 同元素：warn + 拒绝传送（原地渲染，keepalive 插拔正常）", async () => {
        captureWarn();
        const { root, engine } = mount(
            `<div class="target"></div>
             <div class="tp" x-teleport="../.target" x-if.keepalive="show"><span x-text="msg"></span></div>`,
            { show: true, msg: "ka" },
        );
        await nextTick();
        expect(warnHits("已拒绝传送")).toBe(true);
        // 原地渲染（子树由 x-teleport 编译——keepalive 变体不占子树）
        expect(root.querySelector(".tp span")!.textContent).toBe("ka");
        expect(root.querySelector(".target .tp")).toBeNull();
        // keepalive 切换：摘除保活 → 切回原位（状态保留）
        engine.state.show = false;
        await nextTick();
        expect(root.querySelector(".tp")).toBeNull();
        engine.state.msg = "updated";
        engine.state.show = true;
        await nextTick();
        // keepalive：子树保活，切回后读到隐藏期间的更新
        expect(root.querySelector(".tp span")!.textContent).toBe("updated");
    });

    test("祖先链 keepalive：编译期 warn 但传送照常", async () => {
        captureWarn();
        const { root } = mount(
            `<div class="target"></div>
             <div x-if.keepalive="outer"><div class="tp" x-teleport="../../.target"><span>in</span></div></div>`,
            { outer: true },
        );
        await nextTick();
        expect(warnHits("祖先链含 keepalive")).toBe(true);
        // 传送照常执行
        expect(root.querySelector(".target .tp span")!.textContent).toBe("in");
    });

    test("x-component 同元素：组件实例化优先，x-teleport 对称让位", async () => {
        captureWarn();
        const { root } = mount(
            `<div x-scope>
                <div x-define="card"><span x-text="tip"></span></div>
                <div class="target"></div>
                <div class="tp" x-teleport="../.target" x-component:card="{tip:'P'}"></div>
             </div>`,
            {},
        );
        await nextTick();
        expect(warnHits("已放弃传送")).toBe(true);
        // 组件在原位实例化（宿主化身组件根），未传送
        expect(root.querySelector(".tp span")!.textContent).toBe("P");
        expect(root.querySelector(".target .tp")).toBeNull();
    });
});

describe("x-teleport 生命周期与守卫", () => {
    test("engine.destroy：传送 DOM 从目标下摘除，防残留", async () => {
        const { root, engine } = mount(
            `<div class="target"></div>
             <div class="tp" x-teleport="../.target">x</div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".target .tp")).not.toBeNull();
        engine.destroy();
        expect(root.querySelector(".target .tp")).toBeNull();
    });

    test("祖先 scope 级联销毁（外层 eager x-if 切假）：传送宿主一并摘除", async () => {
        const { root, engine } = mount(
            `<div class="target"></div>
             <div class="holder">
                 <div x-if="show"><div class="tp" x-teleport="../../../.target"><span>in</span></div></div>
             </div>`,
            { show: true },
        );
        await nextTick();
        expect(root.querySelector(".target .tp span")!.textContent).toBe("in");
        engine.state.show = false;
        await nextTick();
        // 外层 eager x-if 销毁子树 scope → x-teleport destroy → 宿主从目标下摘除
        expect(root.querySelector(".target .tp")).toBeNull();
    });

    test("engine.patch 动态区域守卫：传送宿主（ownsChildren）拒绝 patch", async () => {
        captureWarn();
        const { engine } = mount(
            `<div class="target"></div>
             <div class="tp" x-teleport="../.target"><span x-text="msg"></span></div>`,
            { msg: "a" },
        );
        await nextTick();
        // patch selector 对 engine.template 查询——模板中宿主仍在声明位，命中后
        // 经 _isInDynamicRegion（teleport ownsChildren）拒绝
        let called = false;
        engine.patch(".tp", () => {
            called = true;
        });
        expect(warnHits("动态区域")).toBe(true);
        expect(called).toBe(false);
    });
});
