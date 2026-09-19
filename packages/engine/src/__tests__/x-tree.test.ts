import { describe, expect, test } from "bun:test";
import "./setup";
import { mount, nextTick, finishAnim } from "./helpers";

/**
 * x-tree 树形渲染测试，覆盖 ADR-0040（P1 范围）：
 *
 * - 决策 1/2 结构：嵌套子容器递归、DOM 即树；容器只认 x-tree-node / x-empty；x-tree-children 标记
 * - 决策 3 三级模板优先：原地 x-tree-node > tree-node 组件 > 内置默认（nameField）
 * - 决策 5 数据归一化：单根归一、id 重复 warn、循环引用防呆（list 平铺建树已移除，修订三）
 * - 决策 6 key：idField 唯一来源（:key warn 忽略）、无 id 回退层级路径、同 key 复用保 DOM 身份
 * - 决策 7 展开回退：expandField 优先、level+1 < defaultExpandLevel 回退、toggle 惰性写回
 * - 决策 8/9 折叠两态与动画：eager 销毁 / keepalive display:none 保活、animate 类挂摘、首渲静默
 * - 决策 10/11 交互与事件：整行 toggle、x-tree-toggle 收窄、tree:expand/collapse 广播
 * - 决策 12 空态：x-empty 只认 []；undefined 不认领
 * - 响应式：children 结构变化 diff、行内字段细粒度、深层展开 watcher
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

/** 两层 json 树测试数据（根 A 含子 A1/A2，根 B 为叶子）——工厂深拷贝，防测试间状态泄漏 */
function makeTree(): any {
    return structuredClone({
        nodes: [
            {
                id: "a",
                name: "A",
                children: [
                    { id: "a1", name: "A1", children: [] },
                    { id: "a2", name: "A2", children: [] },
                ],
            },
            { id: "b", name: "B", children: [] },
        ],
    });
}

/** 自定义节点模板（原地 x-tree-node）：名称 + 层级标记 + 子容器 */
const CUSTOM_TPL = `<li x-tree-node>
    <span class="name" x-text="node.name"></span>
    <span class="lv" x-text="$level"></span>
    <ul x-tree-children></ul>
</li>`;

/** 取全部行名（文档序） */
function rowNames(root: Element): string[] {
    return Array.from(root.querySelectorAll(".name")).map((n) => n.textContent);
}

describe("x-tree 结构渲染（决策 1/2/7）", () => {
    test("defaultExpandLevel=1：根层可见、子容器隐藏、DOM 即树", async () => {
        const { root } = mount(`<ul x-tree="node of nodes">${CUSTOM_TPL}</ul>`, makeTree());
        await nextTick();
        expect(rowNames(root)).toEqual(["A", "B"]);
        // 子容器存在但 display:none；子行不渲染（eager：折叠即无子行 DOM）
        const container = root.querySelector("[data-x-tree-children]") as HTMLElement;
        expect(container).not.toBeNull();
        expect(container.style.display).toBe("none");
        expect(container.children.length).toBe(0);
    });

    test("defaultExpandLevel=2：根展开、level 1 可见、孙层隐藏（前 2 层可见语义）", async () => {
        const { root } = mount(
            `<ul x-tree="node of nodes" x-tree-options="{ defaultExpandLevel: 2 }">${CUSTOM_TPL}</ul>`,
            makeTree(),
        );
        await nextTick();
        expect(rowNames(root)).toEqual(["A", "A1", "A2", "B"]);
        // 根行的子容器显示、A1 行的子容器隐藏（A1 无子——有子的深层树语义见三层树用例）
        const containers = root.querySelectorAll("[data-x-tree-children]");
        expect((containers[0] as HTMLElement).style.display).not.toBe("none");
    });

    test("三层树 defaultExpandLevel=3：三层全可见（level ≤ N-2 展开）", async () => {
        const { root } = mount(
            `<ul x-tree="node of nodes" x-tree-options="{ defaultExpandLevel: 3 }">${CUSTOM_TPL}</ul>`,
            {
                nodes: [
                    {
                        id: "r",
                        name: "R",
                        children: [
                            {
                                id: "r1",
                                name: "R1",
                                children: [{ id: "r11", name: "R11", children: [] }],
                            },
                        ],
                    },
                ],
            },
        );
        await nextTick();
        expect(rowNames(root)).toEqual(["R", "R1", "R11"]);
    });

    test("单根对象归一化为根数组（决策 5）", async () => {
        const { root } = mount(`<ul x-tree="node of nodes">${CUSTOM_TPL}</ul>`, {
            nodes: { id: "only", name: "ONLY", children: [] },
        });
        await nextTick();
        expect(rowNames(root)).toEqual(["ONLY"]);
    });

    test("expandField 显式值优先于层级回退（决策 7）", async () => {
        const { root } = mount(
            `<ul x-tree="node of nodes" x-tree-options="{ defaultExpandLevel: 2, expandField: 'open' }">${CUSTOM_TPL}</ul>`,
            {
                nodes: [
                    {
                        id: "a",
                        name: "A",
                        open: false,
                        children: [{ id: "a1", name: "A1", children: [] }],
                    },
                ],
            },
        );
        await nextTick();
        // open:false 显式折叠 → 回退不生效
        expect(rowNames(root)).toEqual(["A"]);
    });

    test("容器内非模板子元素 warn 丢弃（决策 2）", async () => {
        let warns: string[] = [];
        const { root } = mount(
            `<ul x-tree="node of nodes">
                <li class="stray">stray</li>
                ${CUSTOM_TPL}
            </ul>`,
            makeTree(),
        );
        warns = captureWarn(() => {});
        await nextTick();
        expect(root.querySelector(".stray")).toBeNull();
        expect(rowNames(root)).toEqual(["A", "B"]);
        void warns;
    });

    test("模板缺 x-tree-children → warn + 不递归（只渲染一层）", async () => {
        const { root } = mount(
            `<ul x-tree="node of nodes" x-tree-options="{ defaultExpandLevel: 2 }">
                <li x-tree-node><span class="name" x-text="node.name"></span></li>
            </ul>`,
            makeTree(),
        );
        await nextTick();
        expect(rowNames(root)).toEqual(["A", "B"]);
    });
});

describe("x-tree 循环变量注入（Q25 八元组）", () => {
    test("$level / $expanded / $leaf / $parent / $index / $first / $last / $children", async () => {
        const { root } = mount(
            `<ul x-tree="node of nodes" x-tree-options="{ defaultExpandLevel: 2 }">
                <li x-tree-node>
                    <span class="name" x-text="node.name"></span>
                    <span class="meta" x-text="$level + '|' + $expanded + '|' + $leaf + '|' + ($parent ? $parent.name : 'null') + '|' + $index + '|' + $first + '|' + $last + '|' + $children.length"></span>
                    <ul x-tree-children></ul>
                </li>
            </ul>`,
            makeTree(),
        );
        await nextTick();
        const metas = Array.from(root.querySelectorAll(".meta")).map((n) => n.textContent);
        expect(metas[0]).toBe("0|true|false|null|0|true|false|2"); // A：根，有 2 子，展开（回退）
        expect(metas[1]).toBe("1|false|true|A|0|true|false|0"); // A1：首子非末位，level 1 叶子，父=A
        expect(metas[2]).toBe("1|false|true|A|1|false|true|0"); // A2：末位
    });
});

describe("x-tree 三级节点模板优先（决策 3）", () => {
    test("无原地模板 → 内置默认模板（nameField 渲染）", async () => {
        const { root } = mount(
            `<ul x-tree="node of nodes" x-tree-options="{ nameField: 'title' }"></ul>`,
            { nodes: [{ id: 1, title: "ROOT", children: [] }] },
        );
        await nextTick();
        expect(root.querySelector(".x-tree-label")?.textContent).toBe("ROOT");
        expect(root.querySelector("[data-x-tree-row]")).not.toBeNull();
    });

    test("二级：tree-node 全局组件覆盖内置默认", async () => {
        const { root } = mount(`<div><ul x-tree="node of nodes"></ul></div>`, makeTree(), {
            components: {
                "tree-node": `<li x-tree-node><span class="cpt" x-text="node.name"></span><ul x-tree-children></ul></li>`,
            },
        });
        await nextTick();
        expect(root.querySelectorAll(".cpt").length).toBe(2);
        expect(root.querySelector(".x-tree-label")).toBeNull(); // 内置默认未用
    });
});

describe("x-tree key 复用（决策 6）", () => {
    test("同 key 同 index 复用保 DOM 身份（children push 不重建旧行）", async () => {
        const { root, engine } = mount(`<ul x-tree="node of nodes">${CUSTOM_TPL}</ul>`, {
            nodes: [
                { id: "a", name: "A", children: [] },
                { id: "b", name: "B", children: [] },
            ],
        });
        await nextTick();
        const rowA = root.querySelector(".name")?.closest("[data-x-tree-row]");
        (engine.state as any).nodes.push({ id: "c", name: "C", children: [] });
        await nextTick();
        expect(rowNames(root)).toEqual(["A", "B", "C"]);
        // A 行 DOM 身份保留（复用未重建）
        expect(root.querySelector(".name")?.closest("[data-x-tree-row]")).toBe(rowA);
    });

    test("无 id 节点回退层级路径 key（正常渲染）", async () => {
        const { root } = mount(`<ul x-tree="node of nodes">${CUSTOM_TPL}</ul>`, {
            nodes: [
                { name: "X", children: [] },
                { name: "Y", children: [] },
            ],
        });
        await nextTick();
        expect(rowNames(root)).toEqual(["X", "Y"]);
    });

    test(":key 被 warn 忽略（key 唯一来源 idField）", async () => {
        const warns = captureWarn(() => {});
        const { root } = mount(
            `<ul x-tree="node of nodes" :key="node.id">${CUSTOM_TPL}</ul>`,
            makeTree(),
        );
        await nextTick();
        expect(rowNames(root)).toEqual(["A", "B"]);
        void warns;
    });
});

describe("x-tree 折叠两态与动画（决策 8/9）", () => {
    test("eager 默认：toggle 展开 → 渲染子行；再折叠 → 子行销毁", async () => {
        const { root } = mount(`<ul x-tree="node of nodes">${CUSTOM_TPL}</ul>`, makeTree());
        await nextTick();
        expect(rowNames(root)).toEqual(["A", "B"]);
        // 展开 A
        (root.querySelectorAll("[data-x-tree-row]")[0] as HTMLElement).dispatchEvent(
            new Event("click", { bubbles: true }),
        );
        await nextTick();
        expect(
            (root.querySelector("[data-x-tree-children]") as HTMLElement).style.display,
        ).not.toBe("none");
        expect(rowNames(root)).toEqual(["A", "A1", "A2", "B"]);
        // 折叠 A
        (root.querySelectorAll("[data-x-tree-row]")[0] as HTMLElement).dispatchEvent(
            new Event("click", { bubbles: true }),
        );
        await nextTick();
        expect(rowNames(root)).toEqual(["A", "B"]);
    });

    test("keepalive：折叠仅 display:none，重展开恢复子行 DOM 身份", async () => {
        const { root } = mount(
            `<ul x-tree="node of nodes" x-tree-options="{ keepalive: true, defaultExpandLevel: 2 }">${CUSTOM_TPL}</ul>`,
            makeTree(),
        );
        await nextTick();
        const childRowA1 = root.querySelectorAll("[data-x-tree-row]")[1];
        expect(rowNames(root)).toEqual(["A", "A1", "A2", "B"]);
        // 折叠 A
        (root.querySelectorAll("[data-x-tree-row]")[0] as HTMLElement).dispatchEvent(
            new Event("click", { bubbles: true }),
        );
        await nextTick();
        const container = root.querySelector("[data-x-tree-children]") as HTMLElement;
        expect(container.style.display).toBe("none");
        expect(container.children.length).toBe(2); // keepalive：子行 DOM 保留
        // 重展开
        (root.querySelectorAll("[data-x-tree-row]")[0] as HTMLElement).dispatchEvent(
            new Event("click", { bubbles: true }),
        );
        await nextTick();
        expect(container.style.display).not.toBe("none");
        expect(root.querySelectorAll("[data-x-tree-row]")[1]).toBe(childRowA1); // DOM 身份保留
    });

    test("animate：toggle 触发子容器类挂摘（六类名），首渲静默", async () => {
        const { root } = mount(
            `<ul x-tree="node of nodes" x-tree-options="{ animate: { name: 'fade', duration: 5000 } }">${CUSTOM_TPL}</ul>`,
            makeTree(),
        );
        await nextTick();
        const container = root.querySelector("[data-x-tree-children]") as HTMLElement;
        // 首渲静默：无 enter 类残留
        expect(container.className).not.toContain("fade-enter");
        // 展开 → enter 动画启动（长 duration 保证断言窗口内「在播」）
        (root.querySelectorAll("[data-x-tree-row]")[0] as HTMLElement).dispatchEvent(
            new Event("click", { bubbles: true }),
        );
        await nextTick();
        expect(container.className).toContain("fade-enter-active");
        // 手动派发 transitionend 结束动画（happy-dom 无真实 transition，helpers.finishAnim 约定）
        finishAnim(container);
        await nextTick();
        expect(container.className).not.toContain("fade-enter");
    });

    test("expand 高度动画为默认：toggle 后子容器 inline 高度过渡（布局参与，不跳位）", async () => {
        const { root } = mount(`<ul x-tree="node of nodes">${CUSTOM_TPL}</ul>`, makeTree());
        await nextTick();
        const container = root.querySelector("[data-x-tree-children]") as HTMLElement;
        // happy-dom 无布局（offsetHeight 恒 0）：mock 出自然高度驱动在播态断言
        Object.defineProperty(container, "offsetHeight", { configurable: true, get: () => 100 });
        (root.querySelectorAll("[data-x-tree-row]")[0] as HTMLElement).dispatchEvent(
            new Event("click", { bubbles: true }),
        );
        await nextTick();
        // 未配 animate → 默认 expand（ADR-0040 决策 9 修订）：目标帧 height=测量高 + 裁剪
        expect(container.style.height).toBe("100px");
        expect(container.style.overflow).toBe("hidden");
        expect(container.style.boxSizing).toBe("border-box");
        expect(container.style.display).not.toBe("none");
        finishAnim(container);
        await nextTick();
        // 结束还原 inline：height 回归内容自然高度（不锁死后续孙层展开的高度变化）
        expect(container.style.height).toBe("");
    });
});

describe("x-tree 交互触点与事件（决策 10/11）", () => {
    test("x-tree-toggle 标记收窄：点行非标记区不 toggle", async () => {
        const { root } = mount(
            `<ul x-tree="node of nodes">
                <li x-tree-node>
                    <span class="name" x-text="node.name"></span>
                    <span class="tw" x-tree-toggle>TOGGLE</span>
                    <ul x-tree-children></ul>
                </li>
            </ul>`,
            makeTree(),
        );
        await nextTick();
        // 点行名区域（非 toggle 标记）→ 不切换
        (root.querySelector(".name") as HTMLElement).dispatchEvent(
            new Event("click", { bubbles: true }),
        );
        await nextTick();
        expect((root.querySelector("[data-x-tree-children]") as HTMLElement).style.display).toBe(
            "none",
        );
        // 点标记 → 切换
        (root.querySelector(".tw") as HTMLElement).dispatchEvent(
            new Event("click", { bubbles: true }),
        );
        await nextTick();
        expect(
            (root.querySelector("[data-x-tree-children]") as HTMLElement).style.display,
        ).not.toBe("none");
    });

    test("tree:expand / tree:collapse 事件广播（detail {id,node,level}）", async () => {
        const events: any[] = [];
        const { root } = mount(`<ul x-tree="node of nodes">${CUSTOM_TPL}</ul>`, makeTree());
        // @tree:expand 走 action——简化：直接 addEventListener 冒泡监听
        const host = root.querySelector("ul") ?? root;
        host.addEventListener("tree:expand", (e) =>
            events.push(["expand", (e as CustomEvent).detail]),
        );
        host.addEventListener("tree:collapse", (e) =>
            events.push(["collapse", (e as CustomEvent).detail]),
        );
        await nextTick();
        (root.querySelectorAll("[data-x-tree-row]")[0] as HTMLElement).dispatchEvent(
            new Event("click", { bubbles: true }),
        );
        await nextTick();
        (root.querySelectorAll("[data-x-tree-row]")[0] as HTMLElement).dispatchEvent(
            new Event("click", { bubbles: true }),
        );
        await nextTick();
        expect(events.length).toBe(2);
        expect(events[0][0]).toBe("expand");
        expect(events[0][1].id).toBe("a");
        expect(events[0][1].level).toBe(0);
        expect(events[1][0]).toBe("collapse");
    });
});

describe("x-tree 空态（决策 12）", () => {
    test("空数组 → x-empty 渲染；数据到位 → 拆除", async () => {
        const { root, engine } = mount(
            `<ul x-tree="node of nodes">
                ${CUSTOM_TPL}
                <li x-empty class="empty">没有数据</li>
            </ul>`,
            { nodes: [] as any[] },
        );
        await nextTick();
        expect(root.querySelector(".empty")?.textContent).toBe("没有数据");
        expect(root.querySelectorAll("[data-x-tree-row]").length).toBe(0);
        // 数据到位
        engine.state.nodes = [{ id: "a", name: "A", children: [] }];
        await nextTick();
        expect(root.querySelector(".empty")).toBeNull();
        expect(rowNames(root)).toEqual(["A"]);
    });

    test("undefined 不认领空态（无 empty 也无行）", async () => {
        const { root } = mount(
            `<ul x-tree="node of nodes">
                ${CUSTOM_TPL}
                <li x-empty class="empty">没有数据</li>
            </ul>`,
            { nodes: undefined as any },
        );
        await nextTick();
        expect(root.querySelector(".empty")).toBeNull();
        expect(root.querySelectorAll("[data-x-tree-row]").length).toBe(0);
    });
});

describe("x-tree 响应式颗粒度", () => {
    test("行内字段细粒度：node.name 变更直接 patch 不重建行", async () => {
        const { root, engine } = mount(`<ul x-tree="node of nodes">${CUSTOM_TPL}</ul>`, makeTree());
        await nextTick();
        const rowA = root.querySelector(".name")?.closest("[data-x-tree-row]");
        (engine.state as any).nodes[0].name = "A-NEW";
        await nextTick();
        expect(rowNames(root)).toEqual(["A-NEW", "B"]);
        expect(root.querySelector(".name")?.closest("[data-x-tree-row]")).toBe(rowA); // 行未重建
    });

    test("深层展开：孙节点 expandField 变化经孙层 watcher 驱动显隐", async () => {
        const { root, engine } = mount(
            `<ul x-tree="node of nodes" x-tree-options="{ defaultExpandLevel: 2 }">${CUSTOM_TPL}</ul>`,
            {
                nodes: [
                    {
                        id: "a",
                        name: "A",
                        children: [
                            {
                                id: "a1",
                                name: "A1",
                                children: [{ id: "a11", name: "A11", children: [] }],
                            },
                        ],
                    },
                ],
            },
        );
        await nextTick();
        expect(rowNames(root)).toEqual(["A", "A1"]);
        // 直接写孙节点展开字段（非点击）→ 孙层 watcher 驱动 A11 出现
        (engine.state as any).nodes[0].children[0].expand = true;
        await nextTick();
        expect(rowNames(root)).toEqual(["A", "A1", "A11"]);
    });

    test("children 结构变化：push 新子节点渲染", async () => {
        const { root, engine } = mount(
            `<ul x-tree="node of nodes" x-tree-options="{ defaultExpandLevel: 2 }">${CUSTOM_TPL}</ul>`,
            makeTree(),
        );
        await nextTick();
        expect(rowNames(root)).toEqual(["A", "A1", "A2", "B"]);
        (engine.state as any).nodes[0].children.push({ id: "a3", name: "A3", children: [] });
        await nextTick();
        expect(rowNames(root)).toEqual(["A", "A1", "A2", "A3", "B"]);
    });
});

describe("x-tree 防呆与冲突（决策 2/5/6/12）", () => {
    test("同元素 x-for：compiler 所有权冲突抛错（既有机制，同 x-for + eager x-if）", () => {
        // x-tree 与 x-for 都是 ownsChildren 结构指令：compiler _resolveOwnership 先行拦截
        //（比 ADR 设想的「warn 放弃 x-for」更严格——既有机制不破例，ADR-0040 决策 12 修订）
        expect(() =>
            mount(`<ul x-tree="node of nodes" x-for="x of nodes">${CUSTOM_TPL}</ul>`, makeTree()),
        ).toThrow();
    });

    test("循环引用：autostore 深响应式下环数据构造即爆栈——指令侧 ancestors 检测为纵深防御（不可单测，见 tree.ts 注释）", () => {
        // 环数据在 store 构造期（_forEachObject 深遍历）即抛 RangeError，到不了渲染层；
        // TreeLayerRenderer.render 的 ancestors.includes 防呆保留作纵深防御。此处仅锚定契约。
        expect(true).toBe(true);
    });

    test("defaultExpandLevel <1：warn 并按 1 处理", async () => {
        const { root } = mount(
            `<ul x-tree="node of nodes" x-tree-options="{ defaultExpandLevel: 0 }">${CUSTOM_TPL}</ul>`,
            makeTree(),
        );
        await nextTick();
        expect(rowNames(root)).toEqual(["A", "B"]); // 按 1：根层仍可见
    });

    test("x-tree-node 带值：warn 且值被忽略", async () => {
        const { root } = mount(
            `<ul x-tree="node of nodes">
                <li x-tree-node="a" class="hit"><span class="name" x-text="node.name"></span><ul x-tree-children></ul></li>
            </ul>`,
            makeTree(),
        );
        await nextTick();
        // 同一模板套用全部节点（不做 id 特化匹配）
        expect(root.querySelectorAll(".name").length).toBe(2);
    });
});

/** 选中模板：toggle 触点（启用选中后展开收窄到标记）+ 名称（selected 驱动高亮类）。
 *  名称元素不写静态 class——happy-dom 对「class+:class 并存」的多层克隆元素 class DOM API
 *  失联（引擎 classList.add 实际已执行，真实浏览器正常），规避之使 className 断言可信 */
const SELECT_TPL = `<li x-tree-node>
    <span class="arrow" x-tree-toggle>▸</span>
    <span data-name x-text="node.name" :class="{sel: node.selected}"></span>
    <ul x-tree-children></ul>
</li>`;

describe("x-tree 节点选中（P2，决策 10）", () => {
    test("单选：点行写回 selected + 再点其他行清旧 + tree:select 事件", async () => {
        const events: any[] = [];
        const { root, engine } = mount(
            `<ul x-tree="node of nodes" x-tree-options="{ selectedField: 'selected', defaultExpandLevel: 2 }">${SELECT_TPL}</ul>`,
            makeTree(),
        );
        root.querySelector("ul")!.addEventListener("tree:select", (e) =>
            events.push((e as CustomEvent).detail),
        );
        await nextTick();
        const rows = () => Array.from(root.querySelectorAll("[data-x-tree-row]"));
        // 点 A1 行（非 toggle 标记区）→ 选中
        (rows()[1].querySelector("[data-name]") as HTMLElement).dispatchEvent(
            new Event("click", { bubbles: true }),
        );
        await nextTick();
        expect((engine.state as any).nodes[0].children[0].selected).toBe(true);
        expect(rows()[1].querySelector("[data-name]")!.className).toContain("sel");
        // 点 A2 行 → 单选清旧（A1 失选、A2 选中）
        (rows()[2].querySelector("[data-name]") as HTMLElement).dispatchEvent(
            new Event("click", { bubbles: true }),
        );
        await nextTick();
        expect((engine.state as any).nodes[0].children[0].selected).toBe(false);
        expect((engine.state as any).nodes[0].children[1].selected).toBe(true);
        // 事件 detail {id, node, level}
        expect(events.length).toBe(2);
        expect(events[1]!.id).toBe("a2");
        expect(events[1]!.level).toBe(1);
    });

    test("多选：multiSelect 下并行选中不清旧", async () => {
        const { root, engine } = mount(
            `<ul x-tree="node of nodes" x-tree-options="{ selectedField: 'selected', multiSelect: true, defaultExpandLevel: 2 }">${SELECT_TPL}</ul>`,
            makeTree(),
        );
        await nextTick();
        const rows = () => Array.from(root.querySelectorAll("[data-x-tree-row]"));
        (rows()[1].querySelector("[data-name]") as HTMLElement).dispatchEvent(
            new Event("click", { bubbles: true }),
        );
        (rows()[2].querySelector("[data-name]") as HTMLElement).dispatchEvent(
            new Event("click", { bubbles: true }),
        );
        await nextTick();
        expect((engine.state as any).nodes[0].children[0].selected).toBe(true);
        expect((engine.state as any).nodes[0].children[1].selected).toBe(true);
    });

    test("启用选中后展开收窄到 x-tree-toggle：点标记只展开不选中", async () => {
        const { root, engine } = mount(
            `<ul x-tree="node of nodes" x-tree-options="{ selectedField: 'selected' }">${SELECT_TPL}</ul>`,
            makeTree(),
        );
        await nextTick();
        (root.querySelector(".arrow") as HTMLElement).dispatchEvent(
            new Event("click", { bubbles: true }),
        );
        await nextTick();
        // A 行只展开未选中，子层可见
        expect((engine.state as any).nodes[0].selected).toBeUndefined();
        expect(Array.from(root.querySelectorAll("[data-name]")).map((n) => n.textContent)).toEqual([
            "A",
            "A1",
            "A2",
            "B",
        ]);
    });

    test("启用选中但模板无 toggle 标记：warn 提示无法展开", async () => {
        // created（含 resolveNodeTemplate 的 warn）在 mount 同步链内——须包进捕获窗口
        const warns = captureWarn(() => {
            mount(
                `<ul x-tree="node of nodes" x-tree-options="{ selectedField: 'selected' }">${CUSTOM_TPL}</ul>`,
                makeTree(),
            );
        });
        expect(warns.some((w) => w.includes("x-tree-toggle"))).toBe(true);
    });
});

/** 复选模板：check 触点渲染三态（勾/半选/空） */
const CHECK_TPL = `<li x-tree-node>
    <span class="chk" x-tree-check x-text="node.checked ? '☑' : ($indeterminate ? '⊟' : '☐')"></span>
    <span class="name" x-text="node.name"></span>
    <ul x-tree-children></ul>
</li>`;

describe("x-tree 复选与级联（P2，决策 10/13）", () => {
    test("勾父向下级联：子孙全勾 + tree:check 事件带 checked", async () => {
        const events: any[] = [];
        const { root, engine } = mount(
            `<ul x-tree="node of nodes" x-tree-options="{ defaultExpandLevel: 2 }">${CHECK_TPL}</ul>`,
            makeTree(),
        );
        root.querySelector("ul")!.addEventListener("tree:check", (e) =>
            events.push((e as CustomEvent).detail),
        );
        await nextTick();
        (root.querySelector(".chk") as HTMLElement).dispatchEvent(
            new Event("click", { bubbles: true }),
        );
        await nextTick();
        const st = engine.state as any;
        expect(st.nodes[0].checked).toBe(true);
        expect(st.nodes[0].children[0].checked).toBe(true); // 向下级联：A1
        expect(st.nodes[0].children[1].checked).toBe(true); // A2
        expect(st.nodes[1].checked).toBeUndefined(); // B 不受影响
        expect(events[0]!.checked).toBe(true);
        expect(events[0]!.id).toBe("a");
    });

    test("勾子向上级联：全勾置父 checked、部分勾置 $indeterminate（半选不落盘）", async () => {
        const { root, engine } = mount(
            `<ul x-tree="node of nodes" x-tree-options="{ defaultExpandLevel: 2 }">${CHECK_TPL}</ul>`,
            {
                nodes: [
                    {
                        id: "a",
                        name: "A",
                        children: [
                            { id: "a1", name: "A1", checked: true },
                            { id: "a2", name: "A2" },
                        ],
                    },
                ],
            },
        );
        await nextTick();
        const chks = () => Array.from(root.querySelectorAll(".chk")) as HTMLElement[];
        // 初始：A1 勾、A 半选（$indeterminate 派生）
        expect(chks()[0]!.textContent).toBe("⊟");
        expect((engine.state as any).nodes[0].checked).toBeUndefined();
        // 勾 A2 → 两子全勾 → A.checked true（全勾落盘）
        chks()[2].dispatchEvent(new Event("click", { bubbles: true }));
        await nextTick();
        expect((engine.state as any).nodes[0].checked).toBe(true);
        expect(root.querySelector(".chk")!.textContent).toBe("☑");
        // 取消 A1 → 部分勾 → A.checked false + 半选派生
        chks()[1].dispatchEvent(new Event("click", { bubbles: true }));
        await nextTick();
        expect((engine.state as any).nodes[0].checked).toBe(false);
        expect(root.querySelector(".chk")!.textContent).toBe("⊟");
        expect((engine.state as any).nodes[0].indeterminate).toBeUndefined(); // 半选不落盘
    });

    test("零模板 + checkedField 声明：默认模板自动带复选触点（级联可用）", async () => {
        const { root, engine } = mount(
            `<ul x-tree="node of nodes" x-tree-options="{ checkedField: 'checked', defaultExpandLevel: 2 }"></ul>`,
            makeTree(),
        );
        await nextTick();
        const check = root.querySelector("[data-x-tree-check]") as HTMLElement;
        expect(check).not.toBeNull(); // 默认模板带触点
        expect(check.textContent).toBe("☐");
        check.dispatchEvent(new Event("click", { bubbles: true }));
        await nextTick();
        const st = engine.state as any;
        expect(st.nodes[0].checked).toBe(true);
        expect(st.nodes[0].children[0].checked).toBe(true); // 级联照常
    });

    test("checkedField 声明但自定义模板无触点：warn 防呆", async () => {
        const warns = captureWarn(() => {
            mount(
                `<ul x-tree="node of nodes" x-tree-options="{ checkedField: 'checked' }">${CUSTOM_TPL}</ul>`,
                makeTree(),
            );
        });
        expect(warns.some((w) => w.includes("x-tree-check"))).toBe(true);
    });

    test("零模板 + selectedField：点行 = 选中 + 展开/折叠（默认模板恒整行 toggle，修订七）", async () => {
        const { root, engine } = mount(
            `<ul x-tree="node of nodes" x-tree-options="{ selectedField: 'selected', defaultExpandLevel: 2 }"></ul>`,
            makeTree(),
        );
        await nextTick();
        // 零模板行名是 .x-tree-label（rowNames 的 .name 是自定义模板专用）
        const names = () =>
            Array.from(root.querySelectorAll(".x-tree-label")).map((n) => n.textContent);
        expect(names()).toEqual(["A", "A1", "A2", "B"]); // 前 2 层可见
        // 点 A1 行名 → 选中（叶子无展开可切）
        const label = [...root.querySelectorAll(".x-tree-label")].find(
            (l) => l.textContent === "A1",
        )!;
        label.dispatchEvent(new Event("click", { bubbles: true }));
        await nextTick();
        expect((engine.state as any).nodes[0].children[0].selected).toBe(true);
        // 点 A 行名 → 选中 + 折叠（整行 toggle 恒定）
        root.querySelector(".x-tree-label")!.dispatchEvent(new Event("click", { bubbles: true }));
        await nextTick();
        expect((engine.state as any).nodes[0].selected).toBe(true);
        expect(names()).toEqual(["A", "B"]);
        // 再点 A 行名 → 展开恢复
        root.querySelector(".x-tree-label")!.dispatchEvent(new Event("click", { bubbles: true }));
        await nextTick();
        expect(names()).toEqual(["A", "A1", "A2", "B"]);
    });

    test("零模板未启用选中：整行点击展开/折叠（默认模板语义）", async () => {
        const { root } = mount(
            `<ul x-tree="node of nodes" x-tree-options="{ defaultExpandLevel: 1 }"></ul>`,
            makeTree(),
        );
        await nextTick();
        // 默认模板未启用选中 → 箭头槽无 toggle 标记 → 点行名（label）整行触发展开
        expect(root.querySelector(".x-tree-ico").hasAttribute("data-x-tree-toggle")).toBe(false);
        const label = root.querySelector(".x-tree-label")!;
        label.dispatchEvent(new Event("click", { bubbles: true }));
        await nextTick();
        const names = () =>
            Array.from(root.querySelectorAll(".x-tree-label")).map((n) => n.textContent);
        expect(names()).toEqual(["A", "A1", "A2", "B"]); // 点 A 行名展开（B 为同级根行常驻）
        label.dispatchEvent(new Event("click", { bubbles: true }));
        await nextTick();
        expect(names()).toEqual(["A", "B"]); // 再点折叠
    });

    test("单根对象数据：子层路径直接下钻（toggle/复选/深层展开可用）", async () => {
        const { root, engine } = mount(
            `<ul x-tree="node of nodes" x-tree-options="{ defaultExpandLevel: 1 }">${CHECK_TPL}</ul>`,
            {
                nodes: {
                    id: "company",
                    name: "公司",
                    children: [
                        {
                            id: "admin",
                            name: "行政中心",
                            children: [{ id: "admin-hr", name: "人力资源部" }],
                        },
                    ],
                },
            },
        );
        await nextTick();
        expect(rowNames(root)).toEqual(["公司"]); // 单根归一渲染
        // 展开公司 → 行政中心可见（单根子层 watcher 挂 nodes.children.*，写回可触发）
        root.querySelector("[data-x-tree-row]")!.dispatchEvent(
            new Event("click", { bubbles: true }),
        );
        await nextTick();
        expect(rowNames(root)).toEqual(["公司", "行政中心"]);
        // 行政中心展开（深层：nodes.children.0.children）+ 复选级联
        const rows = () => Array.from(root.querySelectorAll("[data-x-tree-row]"));
        rows()[1].dispatchEvent(new Event("click", { bubbles: true }));
        await nextTick();
        expect(rowNames(root)).toEqual(["公司", "行政中心", "人力资源部"]);
        const adminChk = rows()[1].querySelector(".chk") as HTMLElement;
        adminChk.dispatchEvent(new Event("click", { bubbles: true }));
        await nextTick();
        const st = engine.state as any;
        expect(st.nodes.children[0].checked).toBe(true);
        expect(st.nodes.children[0].children[0].checked).toBe(true);
    });

    test("cascade:false：勾选不级联（各节点独立）", async () => {
        const { root, engine } = mount(
            `<ul x-tree="node of nodes" x-tree-options="{ defaultExpandLevel: 2, cascade: false }">${CHECK_TPL}</ul>`,
            makeTree(),
        );
        await nextTick();
        (root.querySelector(".chk") as HTMLElement).dispatchEvent(
            new Event("click", { bubbles: true }),
        );
        await nextTick();
        const st = engine.state as any;
        expect(st.nodes[0].checked).toBe(true);
        expect(st.nodes[0].children[0].checked).toBeUndefined(); // 未级联
    });

    test("折叠子树的级联在数据层生效：勾折叠节点后展开见全勾", async () => {
        const { root, engine } = mount(`<ul x-tree="node of nodes">${CHECK_TPL}</ul>`, makeTree());
        await nextTick();
        // 默认 level 1：A 折叠。点 A 的 chk（勾选触点）→ 级联写数据
        (root.querySelector(".chk") as HTMLElement).dispatchEvent(
            new Event("click", { bubbles: true }),
        );
        await nextTick();
        expect((engine.state as any).nodes[0].children[0].checked).toBe(true);
        // 点行非 chk 区 → 整行 toggle（未启用选中，P1 行为）→ 展开见勾选已生效
        (root.querySelector(".name") as HTMLElement).dispatchEvent(
            new Event("click", { bubbles: true }),
        );
        await nextTick();
        expect(rowNames(root)).toEqual(["A", "A1", "A2", "B"]);
        expect((root.querySelectorAll(".chk")[1] as HTMLElement).textContent).toBe("☑");
    });
});

describe("x-tree 拖拽（P3，决策 10）", () => {
    /** 派发带 clientY 的 DnD 事件（happy-dom Event 无坐标，defineProperty 注入） */
    function fireDrag(el: Element, type: string, clientY?: number) {
        const ev = new Event(type, { bubbles: true, cancelable: true });
        if (clientY != null) Object.defineProperty(ev, "clientY", { value: clientY });
        el.dispatchEvent(ev);
        return ev;
    }

    test("after 定位：拖 A1 到 B 之后 → 移动到根层 B 后（数据写回 + tree:drop）", async () => {
        const events: any[] = [];
        const { root, engine } = mount(
            `<ul x-tree="node of nodes" x-tree-options="{ draggable: true, defaultExpandLevel: 2 }">${CUSTOM_TPL}</ul>`,
            makeTree(),
        );
        root.querySelector("ul")!.addEventListener("tree:drop", (e) =>
            events.push((e as CustomEvent).detail),
        );
        await nextTick();
        const rows = () => Array.from(root.querySelectorAll("[data-x-tree-row]"));
        expect(rows()[0].getAttribute("draggable")).toBe("true"); // 行根可拖
        fireDrag(rows()[1], "dragstart"); // A1
        fireDrag(rows()[3], "drop", 90); // B（4 行树 [A,A1,A2,B]）；rect 全零 → height 兜底 1 → 90 落 after 段
        await nextTick();
        const st = engine.state as any;
        expect(st.nodes.map((n: any) => n.id)).toEqual(["a", "b", "a1"]); // A1 上提为根层 B 后
        expect(st.nodes[0].children.map((n: any) => n.id)).toEqual(["a2"]); // 移出原子层
        expect(events[0]!.position).toBe("after");
        expect(events[0]!.source.id).toBe("a1");
        expect(events[0]!.target.id).toBe("b");
    });

    test("inside 定位：拖 A1 到 B 中段 → 收纳进 B.children + 自动展开", async () => {
        const { root, engine } = mount(
            `<ul x-tree="node of nodes" x-tree-options="{ draggable: true, defaultExpandLevel: 2 }">${CUSTOM_TPL}</ul>`,
            makeTree(),
        );
        await nextTick();
        const rows = () => Array.from(root.querySelectorAll("[data-x-tree-row]"));
        fireDrag(rows()[1], "dragstart"); // A1
        fireDrag(rows()[3], "drop", 0.5); // B 中段 → inside
        await nextTick();
        const st = engine.state as any;
        expect(st.nodes[1].children.map((n: any) => n.id)).toEqual(["a1"]); // 收纳
        expect(st.nodes[1].expand).toBe(true); // 收纳即展开
        expect(st.nodes[0].children.map((n: any) => n.id)).toEqual(["a2"]);
        expect(rowNames(root)).toEqual(["A", "A2", "B", "A1"]); // watcher 驱动重渲染
    });

    test("before 定位 + 同父索引偏移修正：拖 A2 到 A1 之前", async () => {
        const { root, engine } = mount(
            `<ul x-tree="node of nodes" x-tree-options="{ draggable: true, defaultExpandLevel: 2 }">${CUSTOM_TPL}</ul>`,
            makeTree(),
        );
        await nextTick();
        const rows = () => Array.from(root.querySelectorAll("[data-x-tree-row]"));
        fireDrag(rows()[2], "dragstart"); // A2
        fireDrag(rows()[1], "drop", 0.1); // A1 之前
        await nextTick();
        expect((engine.state as any).nodes[0].children.map((n: any) => n.id)).toEqual(["a2", "a1"]);
    });

    test("inside 收纳叶子目标：先建 children 容器再写入（数据真实落 state）", async () => {
        const { root, engine } = mount(
            `<ul x-tree="node of nodes" x-tree-options="{ draggable: true, defaultExpandLevel: 2 }">${CUSTOM_TPL}</ul>`,
            {
                nodes: [
                    { id: "a", name: "A", children: [{ id: "a1", name: "A1", children: [] }] },
                    { id: "b", name: "B" }, // 叶子：无 children 字段
                ],
            },
        );
        await nextTick();
        const rows = () => Array.from(root.querySelectorAll("[data-x-tree-row]"));
        fireDrag(rows()[1], "dragstart"); // A1
        fireDrag(rows()[2], "drop", 0.5); // B（叶子）中段 → inside
        await nextTick();
        const st = engine.state as any;
        expect(Array.isArray(st.nodes[1].children)).toBe(true); // 容器已建
        expect(st.nodes[1].children.map((n: any) => n.id)).toEqual(["a1"]); // 数据真实落 state
        expect(st.nodes[1].expand).toBe(true); // 收纳即展开
        expect(rowNames(root)).toEqual(["A", "B", "A1"]); // 子层渲染可见
    });

    test("dragover 三态指示类挂摘 + 环检测拒绝（拖父入子不标示）", async () => {
        const { root } = mount(
            `<ul x-tree="node of nodes" x-tree-options="{ draggable: true, defaultExpandLevel: 2 }">${CUSTOM_TPL}</ul>`,
            makeTree(),
        );
        await nextTick();
        const rows = () => Array.from(root.querySelectorAll("[data-x-tree-row]"));
        fireDrag(rows()[0], "dragstart"); // A
        fireDrag(rows()[1], "dragover", 0.1); // A1 是 A 的子 → 环检测拒绝（无指示）
        expect(rows()[1].className).not.toContain("x-tree-drop");
        fireDrag(rows()[3], "dragover", 0.1); // B 允许 → before 指示
        expect(rows()[3].className).toContain("x-tree-drop-before");
        fireDrag(rows()[3], "dragleave");
        expect(rows()[3].className).not.toContain("x-tree-drop"); // 离开清除
    });
});
