/**
 * pagination 组件插件测试（组件库 P2 导航件，ADR-0018 清单权威表 navigation 行）：
 * - 组件形态官方样板：全局表注册 + 主题档位继承（autospark.base）+ i18n 键表达式在场；
 * - 渲染：总条数文案（i18n 键等值回退硬编码中文）、页码窗口（<=7 全量 / >7 五宽窗口 +
 *   省略号折叠）、翻页边界禁用（首/上/下/末）；
 * - 值通道：点击翻页 change detail={page,pageSize} + input 回写、同值短路、越界钳位、
 *   props page 受控单向、el.value 劫持桥；
 * - 条数切换：pageSizes 选项渲染（原生 select x-for 克隆）+ 切换重置页码；
 * - 极简形态（simple）：窗口隐藏 + 3 / 20 文本；
 * - precompile 元素名变换：裸 page-sizes JSON 改道 data-page-sizes（字面量数组 props
 *   死环规避，P0 固化规避清单第 1 条）。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { PAGINATION_NAME, bootstrapPaginationPlugin } from "../../../components/navigation/pagination/index";

/** 组件模板字符串（空白归一化后断言——oxfmt 折行使逐字匹配假红） */
const tpl = () =>
    ((AutoSpark as { components: Record<string, string> }).components[PAGINATION_NAME] as string).replace(/\s+/g, " ");

/** 页码按钮组（窗口页码钮可见项——省略号槽位的隐藏钮过滤；排除首/上/下/末图标钮） */
const pageButtons = (root: Element) =>
    Array.from(root.querySelectorAll(".asc-pagination-pages .asc-pagination-item .asc-pagination-btn")).filter(
        (b) => (b as HTMLElement).style.display !== "none",
    );

describe("注册面（组件形态官方样板）", () => {
    test("模块加载即注册：插件全局组件表含 autospark.pagination 模板字符串 + 主题档位继承", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[PAGINATION_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${PAGINATION_NAME}"`);
        expect(template).toContain('x-define:inherit="autospark.base"'); // 主题档位继承（ADR-0134）
    });

    test("bootstrap 幂等：重复调用不覆盖（同键赋值幂等）", () => {
        const before = (AutoSpark as { components: Record<string, string> }).components[PAGINATION_NAME];
        bootstrapPaginationPlugin();
        expect((AutoSpark as { components: Record<string, string> }).components[PAGINATION_NAME]).toBe(before);
    });

    test("i18n 键表达式在场：total/prev/next/first/last/pageSize 六键 + 键等值回退中文（ADR-0018 决策 6 约定 1）", () => {
        const t = tpl();
        for (const key of ["pagination.total", "pagination.prev", "pagination.next", "pagination.first", "pagination.last", "pagination.pageSize"]) {
            expect(t).toContain(`t('${key}'`);
        }
        expect(t).toContain("'共 ' + total + ' 条'"); // 未装 i18n / 词典无键的硬编码回退
        expect(t).toContain("条/页");
    });

    test("省略号基样式不带 display:none（x-show 显示态清内联，样式表 none 恒胜——真浏览器隐形缺陷防回归）", () => {
        const rule = tpl().match(/\.asc-pagination-ellipsis \{[^}]*\}/)![0];
        expect(rule).not.toContain("display: none");
    });
});

describe("页码窗口渲染", () => {
    test("总页数 <= 7：全量直出无省略号；总条数文案回退中文", async () => {
        const { root } = mount(
            `<div x-component:autospark.pagination="{ total: 30, pageSize: 10, page: 1 }"></div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".asc-pagination-total")!.textContent).toContain("共 30 条");
        const pages = pageButtons(root);
        expect(pages.length).toBe(3);
        expect(pages.map((b) => b.textContent!.trim())).toEqual(["1", "2", "3"]);
        expect(root.querySelector(".asc-pagination-ellipsis")).toBeTruthy(); // 恒在场、x-show 隐藏（克隆体内禁 x-if）
        for (const e of Array.from(root.querySelectorAll(".asc-pagination-ellipsis"))) {
            expect((e as HTMLElement).style.display).toBe("none"); // 无省略号项渲染（x-show 全隐藏）
        }
        expect(pages[0]!.hasAttribute("data-active")).toBe(true); // 缺省激活第 1 页
    });

    test("总页数 > 7：首末页 + 五宽窗口 + 双省略号折叠", async () => {
        const { root } = mount(
            `<div x-component:autospark.pagination="{ total: 100, pageSize: 10, page: 5 }"></div>`,
            {},
        );
        await nextTick();
        const pages = pageButtons(root);
        // 窗口算法：1 + [省略号] + 3 4 5 6 7 + [省略号] + 10（当前页 5 居中 ±2）
        expect(pages.map((b) => b.textContent!.trim())).toEqual(["1", "3", "4", "5", "6", "7", "10"]);
        const visibleEllipsis = Array.from(root.querySelectorAll(".asc-pagination-ellipsis"))
            .filter((e) => (e as HTMLElement).style.display !== "none");
        expect(visibleEllipsis.length).toBe(2); // 双省略号（首末折叠区段）
        expect(pages[3]!.hasAttribute("data-active")).toBe(true); // 当前页 5 激活
    });

    test("窗口随翻页迁移：边缘窗口省略号单侧收缩", async () => {
        const { root } = mount(
            `<div x-component:autospark.pagination="{ total: 200, pageSize: 10, page: 1 }"></div>`,
            {},
        );
        await nextTick();
        // 当前页 1：1 2 3 ... 20（左侧无省略号——窗口贴首）
        expect(pageButtons(root).map((b) => b.textContent!.trim())).toEqual(["1", "2", "3", "20"]);
        const visible = () => Array.from(root.querySelectorAll(".asc-pagination-ellipsis"))
            .filter((e) => (e as HTMLElement).style.display !== "none").length;
        expect(visible()).toBe(1); // 仅右侧省略号
    });
});

describe("交互与值通道", () => {
    test("点击翻页：change 冒泡 detail={page,pageSize} + input 派发 + 激活态迁移 + el.value 桥", async () => {
        const changes: unknown[] = [];
        const { root, engine } = mount(
            `<div @change="changes.push($event.detail)">
                <div x-model="p" x-component:autospark.pagination="{ total: 50, pageSize: 10, page: 1 }"></div>
            </div>`,
            { p: 0, changes },
        );
        await nextTick();
        const host = root.querySelector(".asc-pagination")!;
        const pages = pageButtons(root);
        (pages[1] as HTMLElement).click(); // 翻到第 2 页
        await nextTick();
        expect(changes).toEqual([{ page: 2, pageSize: 10 }]); // change detail={page,pageSize}
        expect(engine.store.state.p).toBe(2); // input 派发 → x-model 回写
        expect(pageButtons(root)[1]!.hasAttribute("data-active")).toBe(true); // 激活迁移
        expect((host as unknown as { value: number }).value).toBe(2); // el.value 劫持桥读
    });

    test("同值点击短路：不派发 change/input（幂等）", async () => {
        const changes: unknown[] = [];
        const { root } = mount(
            `<div @change="changes.push($event.detail)">
                <div x-component:autospark.pagination="{ total: 50, pageSize: 10, page: 2 }"></div>
            </div>`,
            { changes },
        );
        await nextTick();
        (pageButtons(root)[1] as HTMLElement).click(); // 已在第 2 页再点第 2 页
        await nextTick();
        expect(changes).toEqual([]);
    });

    test("翻页边界：首/上页在 page=1 禁用；下/末页在末页禁用（原生 disabled）", async () => {
        const first = mount(
            `<div x-component:autospark.pagination="{ total: 50, pageSize: 10, page: 1 }"></div>`,
            {},
        );
        await nextTick();
        const btns = Array.from(first.root.querySelectorAll(".asc-pagination-pages > button")) as HTMLButtonElement[];
        expect(btns.length).toBe(4); // 首 / 上 / 下 / 末
        expect(btns[0]!.disabled).toBe(true); // 首
        expect(btns[1]!.disabled).toBe(true); // 上
        expect(btns[2]!.disabled).toBe(false); // 下
        expect(btns[3]!.disabled).toBe(false); // 末

        const last = mount(
            `<div x-component:autospark.pagination="{ total: 50, pageSize: 10, page: 5 }"></div>`,
            {},
        );
        await nextTick();
        const btns2 = Array.from(last.root.querySelectorAll(".asc-pagination-pages > button")) as HTMLButtonElement[];
        expect(btns2[0]!.disabled).toBe(false);
        expect(btns2[2]!.disabled).toBe(true); // 下
        expect(btns2[3]!.disabled).toBe(true); // 末
    });

    test("越界钳位：page > pageCount 归位末页；上/下页跨边界翻页安全夹取", async () => {
        const { root } = mount(
            `<div x-component:autospark.pagination="{ total: 50, pageSize: 10, page: 99 }"></div>`,
            {},
        );
        await nextTick();
        const pages = pageButtons(root);
        expect(pages[pages.length - 1]!.hasAttribute("data-active")).toBe(true); // 99 → 钳位第 5 页（末页）
    });

    test("props page 受控单向：state 变化 → 激活迁移 + 窗口重排（无点击不广播）", async () => {
        const changes: unknown[] = [];
        const { root, engine } = mount(
            `<div @change="changes.push($event.detail)">
                <div x-component:autospark.pagination="{ total: 200, pageSize: 10, page: p }"></div>
            </div>`,
            { p: 1, changes },
        );
        await nextTick();
        engine.store.state.p = 10;
        await nextTick();
        const pages = pageButtons(root);
        expect(pages[pages.length - 1]!.textContent!.trim()).toBe("20"); // 窗口末项 = 末页 20
        const active = pages.find((b) => b.hasAttribute("data-active"))!;
        expect(active.textContent!.trim()).toBe("10"); // 激活迁移到第 10 页（当前值）
        expect(changes).toEqual([]); // props 驱动不广播（防回环）
    });

    test("el.value 劫持桥：程序写值静默归位（受控 DOM 通道，不广播 change）", async () => {
        const changes: unknown[] = [];
        const { root } = mount(
            `<div @change="changes.push($event.detail)">
                <div x-component:autospark.pagination="{ total: 50, pageSize: 10, page: 1 }"></div>
            </div>`,
            { changes },
        );
        await nextTick();
        const host = root.querySelector(".asc-pagination") as unknown as { value: number };
        host.value = 3;
        await nextTick();
        expect(pageButtons(root)[2]!.hasAttribute("data-active")).toBe(true);
        expect(host.value).toBe(3);
        expect(changes).toEqual([]); // 桥写静默（受控语义，tabs 同款）
    });

    test("total=0 空态：单页直出、翻页全禁用、共 0 条", async () => {
        const { root } = mount(`<div x-component:autospark.pagination="{ total: 0, pageSize: 10 }"></div>`, {});
        await nextTick();
        const pages = pageButtons(root);
        expect(pages.map((b) => b.textContent!.trim())).toEqual(["1"]);
        const btns = Array.from(root.querySelectorAll(".asc-pagination-pages > button")) as HTMLButtonElement[];
        expect(btns.every((b) => b.disabled)).toBe(true);
        expect(root.querySelector(".asc-pagination-total")!.textContent).toContain("共 0 条");
    });
});

describe("条数切换（pageSizes）", () => {
    test("选项渲染：pageSizes 状态引用 → 原生 select 选项 + 当前值选中", async () => {
        const { root } = mount(
            `<div x-component:autospark.pagination="{ total: 100, pageSize: 20, page: 1, pageSizes: sizes }"></div>`,
            { sizes: [10, 20, 50] },
        );
        await nextTick();
        const select = root.querySelector(".asc-pagination-select") as HTMLSelectElement;
        expect(select).toBeTruthy();
        const options = Array.from(select.querySelectorAll("option"));
        expect(options.length).toBe(3);
        expect(options[0]!.textContent).toContain("10");
        expect(options[0]!.textContent).toContain("条/页"); // i18n 键等值回退中文
        expect(options[1]!.hasAttribute("selected")).toBe(true); // 当前 pageSize=20 选中
    });

    test("切换条数：页码重置 1 + change 携新对 {page:1,pageSize}", async () => {
        const changes: unknown[] = [];
        const { root } = mount(
            `<div @change="changes.push($event.detail)">
                <div x-component:autospark.pagination="{ total: 100, pageSize: 10, page: 5, pageSizes: sizes }"></div>
            </div>`,
            { sizes: [10, 50], changes },
        );
        await nextTick();
        const select = root.querySelector(".asc-pagination-select") as HTMLSelectElement;
        select.value = "50";
        select.dispatchEvent(new Event("change", { bubbles: true }));
        await nextTick();
        expect(changes).toEqual([{ page: 1, pageSize: 50 }]); // 页码归 1 + 新条数
        const pages = pageButtons(root);
        expect(pages.length).toBe(2); // 100/50 = 2 页（<=7 全量）
        expect(pages[0]!.hasAttribute("data-active")).toBe(true);
    });
});

describe("极简形态（simple）", () => {
    test("窗口/总数/条数切换隐藏 + 3 / 20 文本 + 翻页通道保留", async () => {
        const changes: unknown[] = [];
        const { root } = mount(
            `<div @change="changes.push($event.detail)">
                <div x-component:autospark.pagination="{ total: 200, pageSize: 10, page: 3, simple: true }"></div>
            </div>`,
            { changes },
        );
        await nextTick();
        expect(root.querySelector(".asc-pagination-body")!.getAttribute("data-simple")).toBe("true");
        expect((root.querySelector(".asc-pagination-total") as HTMLElement).style.display).toBe("none");
        expect((root.querySelector(".asc-pagination-pages") as HTMLElement).style.display).toBe("none");
        expect(root.querySelector(".asc-pagination-simple")!.textContent!.replace(/\s+/g, " ")).toContain("3 / 20");
        // 极简翻页钮：上一页/下一页
        const btns = Array.from(root.querySelectorAll(".asc-pagination-simple button")) as HTMLButtonElement[];
        expect(btns.length).toBe(2);
        (btns[1] as HTMLElement).click();
        await nextTick();
        expect(changes).toEqual([{ page: 4, pageSize: 10 }]);
        expect(root.querySelector(".asc-pagination-simple-text")!.textContent!.trim()).toBe("4 / 20");
    });
});

describe("元素名快速写法（precompile 改道）", () => {
    test("裸 page-sizes JSON 属性改道 data-page-sizes（不进 props 值对象——字面量数组死环规避）", async () => {
        const { root } = mount(
            `<div><x-pagination total="100" page-sizes="[10, 20, 50]"></x-pagination></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector(".asc-pagination")!;
        expect(host.hasAttribute("data-page-sizes")).toBe(false); // mounted 解析后摘除
        const options = Array.from(root.querySelectorAll(".asc-pagination-select option"));
        expect(options.length).toBe(3); // JSON 通道解析渲染
        expect(options[2]!.textContent).toContain("50");
    });

    test("变换落盘形态（autostart:false 断言）：page-sizes 移除、data-page-sizes 落盘", () => {
        const { root } = mount(
            `<div><x-pagination page="2" total="100" page-sizes="[10,20]"></x-pagination></div>`,
            {},
            { autostart: false },
        );
        const host = root.children[0]!.children[0]!;
        expect(host.hasAttribute("page-sizes")).toBe(false);
        expect(host.getAttribute("data-page-sizes")).toBe("[10,20]");
    });
});
