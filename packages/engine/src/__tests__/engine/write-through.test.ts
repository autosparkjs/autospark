import { describe, expect, test, afterEach } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";

/**
 * 写回落点对称性测试（ADR-0075）：x-model 的写回快通道经
 * `scope.writeThrough`（getContext 聚合视图透传）——x-data 域字段落域、
 * 全链未命中落 store 根，与读方向（scope.watch 表达式支路）同源。
 *
 * 背景：旧实现写方向 setVal 直写 store 根，域内绑定「读局部、写全局」静默分裂
 * （x-model.md「绑定局部数据」曾以 set 表达式为约定解法，ADR-0075 后简单路径即对称）。x-splitter / x-resize 的写回落点维持原状（splitter 直写根、resize 已有落点解析）。
 */

const engines: any[] = [];
const roots: HTMLElement[] = [];
const mountWith = (html: string, state: any = {}) => {
    const m = mount(html, state);
    document.body.appendChild(m.root);
    roots.push(m.root);
    engines.push(m.engine);
    return m;
};

afterEach(() => {
    while (engines.length) engines.pop()?.destroy();
    while (roots.length) roots.pop()?.remove();
});

// ── x-model ───────────────────────────────────────────────────────────

describe("x-model 写回落点", () => {
    test("x-data 域内简单路径：写入落域（$scopes[id]），插值同步", async () => {
        const m = mountWith(
            `<div id="app"><div x-data="{ count: 0 }">
                <input id="t" x-model="count" />
                <div id="out">{{ count }}</div>
            </div></div>`,
            {},
        );
        await nextTick();
        const state: any = m.engine.store.state;
        const domain = (key: string) => {
            const scopes = state.$scopes ?? {};
            const k = Object.keys(scopes).find((id) => key in scopes[id]);
            if (k == null) throw new Error(`域 ${key} 未找到（keys: ${Object.keys(scopes)}）`);
            return scopes[k];
        };
        const t = m.root.querySelector("#t") as HTMLInputElement;
        t.value = "5";
        t.dispatchEvent(new Event("input", { bubbles: true }));
        await nextTick();
        expect(domain("count").count).toBe("5");
        expect(state.count).toBeUndefined(); // 根不受污染
        expect(m.root.querySelector("#out")!.textContent).toBe("5");
    });

    test("x-data 域内多段路径：写入留域内成员对象", async () => {
        const m = mountWith(
            `<div id="app"><div x-data="{ order: { price: 1 } }">
                <input id="t" x-model="order.price" />
                <div id="out">{{ order.price }}</div>
            </div></div>`,
            {},
        );
        await nextTick();
        const state: any = m.engine.store.state;
        const domain = (key: string) => {
            const scopes = state.$scopes ?? {};
            const k = Object.keys(scopes).find((id) => key in scopes[id]);
            if (k == null) throw new Error(`域 ${key} 未找到（keys: ${Object.keys(scopes)}）`);
            return scopes[k];
        };
        const t = m.root.querySelector("#t") as HTMLInputElement;
        t.value = "9";
        t.dispatchEvent(new Event("input", { bubbles: true }));
        await nextTick();
        expect(domain("order").order.price).toBe("9");
        expect(m.root.querySelector("#out")!.textContent).toBe("9");
    });

    test("radio + x-splitter direction（direction demo 场景）：域写回驱动换轴", async () => {
        const m = mountWith(
            `<div id="app"><div x-data="{ dir: 'horizontal' }">
                <label><input id="r-v" type="radio" value="vertical" x-model="dir" /> 上下</label>
                <div id="host" x-splitter="dir">
                    <div id="p1" data-size="140px"><span>a</span></div>
                    <div id="p2"><span>b</span></div>
                </div>
            </div></div>`,
            {},
        );
        await nextTick();
        const host = m.root.querySelector("#host")!;
        const radio = m.root.querySelector("#r-v") as HTMLInputElement;
        radio.checked = true;
        radio.dispatchEvent(new Event("input", { bubbles: true }));
        await nextTick();
        expect(host.getAttribute("data-direction")).toBe("vertical");
        // 定容尺寸同值换轴重写（width 清、height 140px）
        expect((m.root.querySelector("#p1") as HTMLElement).style.width).toBe("");
        expect((m.root.querySelector("#p1") as HTMLElement).style.height).toBe("140px");
    });

    test("嵌套域就近命中：子层输入写子层、父层不受牵连", async () => {
        const m = mountWith(
            `<div id="app"><div x-data="{ user: '张三' }">
                <input id="p" x-model="user" />
                <div x-data="{ user: '李四' }">
                    <input id="c" x-model="user" />
                </div>
            </div></div>`,
            {},
        );
        await nextTick();
        const state: any = m.engine.store.state;
        const domain = (key: string) => {
            const scopes = state.$scopes ?? {};
            const k = Object.keys(scopes).find((id) => key in scopes[id]);
            if (k == null) throw new Error(`域 ${key} 未找到（keys: ${Object.keys(scopes)}）`);
            return scopes[k];
        };
        const child = m.root.querySelector("#c") as HTMLInputElement;
        child.value = "王五";
        child.dispatchEvent(new Event("input", { bubbles: true }));
        await nextTick();
        // 就近命中：写打在子层域，父层域不受牵连——两域值互异即证明未写穿
        const userDomains = Object.values(state.$scopes ?? {})
            .filter((d: any) => "user" in d)
            .map((d: any) => d.user);
        expect(userDomains.length).toBe(2);
        expect(userDomains.sort()).toEqual(["张三", "王五"]);
    });

    test("无 x-data：写回落 store 根（旧行为兼容）", async () => {
        const m = mountWith(
            `<div id="app">
                <input id="t" x-model="name" />
            </div></div>`,
            { name: "a" },
        );
        await nextTick();
        const state: any = m.engine.store.state;
        const domain = (key: string) => {
            const scopes = state.$scopes ?? {};
            const k = Object.keys(scopes).find((id) => key in scopes[id]);
            if (k == null) throw new Error(`域 ${key} 未找到（keys: ${Object.keys(scopes)}）`);
            return scopes[k];
        };
        const t = m.root.querySelector("#t") as HTMLInputElement;
        t.value = "b";
        t.dispatchEvent(new Event("input", { bubbles: true }));
        await nextTick();
        expect(state.name).toBe("b");
    });
});
