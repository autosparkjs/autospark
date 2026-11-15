/**
 * table 组件插件测试（组件库 P2 最重件，ADR-0018 清单权威表 display 行；接线 ADR-0023）：
 * - 组件形态官方样板：全局表注册 + 化身渲染 + columns/rows 状态引用注入（字面量数组
 *   死环规避，ADR-0019 后果 2）+ 行 × 列双 x-for 装配（列循环 template 形态挂行内——
 *   语义 <table> 在 happy-dom 下 <template> 子节点 content 丢失，普通分叉走 CSS
 *   display:table 全 div 结构，ADR-0023 决策 2）；
 * - 单元格自定义：col-<key> 动态名作用域插槽（{ name, params } 对象形态出口，ADR-0107
 *   ——双分叉同名出口绕开静态去重 ADR-0056）+ 形参 { row, rowIndex } 项作用域求值 +
 *   默认单元格 null 收敛 / 标量直出 / 对象 JSON 兜底；
 * - 排序：sortable 列三态轮转（升/降/取消）本地重排 + th data-sort 态 + sort-change
 *   事件（detail 标量投影）+ remoteSort 只发事件不动数据；
 * - 行选择：checkbox 列组合消费 autospark.checkbox（克隆体内组件实例 + props 值通道
 *   布尔）+ 全选/半选 + selection props 单向内同步 + selection-change 事件出口
 *   （happy-dom 点击不派发 change，手动派发——checkbox 测试同款惯例）；
 * - 空态（autospark.empty 组合 + empty 插槽重载，x-show 兄弟段）/ loading（引擎
 *   x-loading 绑定通道）/ 变体（bordered/striped）/ virtual 分叉（策略缺位退化全量）；
 * - 样式通道字符串断言（button 范式 ADR-0012）+ 元素名快速写法 <x-table>。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import "../../../components/display/empty/index"; // 空态兜底组合依赖（跨插件，测试在场注册）
import "../../../components/form/checkbox/index"; // 行选择 checkbox 列组合依赖（跨插件，测试在场注册）
import { TABLE_NAME, bootstrapTablePlugin } from "../../../components/display/table/index";

/** 通用列定义（多数用例复用） */
const columns = [
    { key: "name", title: "名称", sortable: true },
    { key: "age", title: "年龄", align: "right", sortable: true },
    { key: "city", title: "城市" },
];
const rows = [
    { id: 1, name: "张三", age: 30, city: "北京" },
    { id: 2, name: "李四", age: 24, city: "上海" },
    { id: 3, name: "王五", age: 28, city: "广州" },
];

/** 取第 N 数据行（.asc-table-row） */
const rowAt = (root: HTMLElement, i: number) =>
    root.querySelectorAll(".asc-table-row")[i] as HTMLElement;
/** 取第 N 行的全部数据单元格文本 */
const cellTexts = (row: Element) =>
    Array.from(row.querySelectorAll(".asc-table-td:not(.asc-table-td-sel) .asc-table-td-text")).map(
        (n) => n.textContent,
    );
/** 取列头单元格（非选择列） */
const headCells = (root: HTMLElement) =>
    Array.from(root.querySelectorAll(".asc-table-th:not(.asc-table-th-sel)")) as HTMLElement[];
/** 等待行 × 列双 x-for 渲染落定（嵌套列循环比行循环晚一跳，双跳等待） */
const settle = async () => {
    await nextTick();
    await nextTick();
};
/** 勾选指定 checkbox（happy-dom 点击不派发 change——设原生态后手动派发，checkbox 测试同款） */
const check = (input: HTMLInputElement, on: boolean) => {
    input.checked = on;
    input.dispatchEvent(new Event("change", { bubbles: true }));
};

describe("table 组件插件（ADR-0018 P2 display / ADR-0023）", () => {
    test("模块加载即注册：插件全局组件表含 autospark.table 模板字符串", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[TABLE_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${TABLE_NAME}"`);
        expect(template).toContain(`x-define:inherit="autospark.base"`); // 主题档位继承（ADR-0134）
        expect(template).toContain('x-for="row, rowIndex of viewRows"'); // 行循环装配
        expect(template).toContain('x-for="column, colIndex of columns"'); // 列循环装配（template 形态挂行内）
        expect(template).toContain("{ virtual: true, itemHeight: 40 }"); // 虚拟行定高显式声明
    });

    test("化身渲染：columns/rows 状态引用注入 → 表头 + 行 × 列单元格（CSS display:table 结构）", async () => {
        const { root } = mount(
            `<div x-component:autospark.table="{ columns: cols, rows: list }"></div>`,
            { cols: columns, list: rows },
        );
        await settle();
        expect(root.querySelector(".asc-table-inner")).toBeTruthy();
        expect(root.querySelector(".asc-table-tablebox")!.getAttribute("role")).toBe("table"); // ARIA 语义承载
        // 表头：3 列（选择列缺省隐藏）
        const heads = headCells(root);
        expect(heads.length).toBe(3);
        expect(heads[0]!.textContent).toContain("名称");
        expect(heads[1]!.textContent).toContain("年龄");
        expect(heads[2]!.textContent).toContain("城市");
        // 数据行 × 单元格
        const tableRows = root.querySelectorAll(".asc-table-row");
        expect(tableRows.length).toBe(3);
        expect(cellTexts(tableRows[0]!)).toEqual(["张三", "30", "北京"]);
        expect(cellTexts(tableRows[2]!)).toEqual(["王五", "28", "广州"]);
    });

    test("列配置面：title 缺省回退 key / align 对齐变体 / width 字符串与数字两形态", async () => {
        const { root } = mount(
            `<div x-component:autospark.table="{ columns: cols, rows: list }"></div>`,
            {
                cols: [
                    { key: "name" }, // 无 title → key 直出
                    { key: "age", align: "right", width: "120px" }, // 字符串宽
                    { key: "city", align: "center", width: 80 }, // 数字宽 → px
                ],
                list: rows,
            },
        );
        await settle();
        const heads = headCells(root);
        expect(heads[0]!.textContent).toContain("name"); // title 回退
        expect(heads[1]!.getAttribute("data-align")).toBe("right");
        expect(heads[1]!.getAttribute("style")).toContain("120px");
        expect(heads[2]!.getAttribute("data-align")).toBe("center");
        expect(heads[2]!.getAttribute("style")).toContain("80px");
        // 单元格对齐变体同名通道
        const td = rowAt(root, 0).querySelectorAll(".asc-table-td:not(.asc-table-td-sel)")[1]!;
        expect(td.getAttribute("data-align")).toBe("right");
    });

    test("默认单元格文本：null/undefined 收敛空串 + 对象 JSON 序列化 + 标量直出", async () => {
        const { root } = mount(
            `<div x-component:autospark.table="{ columns: cols, rows: list }"></div>`,
            {
                cols: [{ key: "a" }, { key: "b" }, { key: "c" }],
                list: [{ a: null, b: { x: 1 }, c: 7 }],
            },
        );
        await settle();
        expect(cellTexts(rowAt(root, 0))).toEqual(["", '{"x":1}', "7"]);
    });

    test("col-<key> 作用域插槽：形参 { row, rowIndex } 解构 + 调用方作用域求值 + 默认让位", async () => {
        const { root } = mount(
            `<div x-component:autospark.table="{ columns: cols, rows: list }">` +
                `<template x-slot:col-name="{ row, rowIndex }">` +
                `<b class="cell-name" x-text="row.name"></b>` +
                `<span class="cell-idx" x-text="'#' + (rowIndex + 1)"></span>` +
                `<span class="cell-outer" x-text="prefix"></span>` +
                `</template>` +
                `</div>`,
            { cols: columns, list: rows, prefix: "调用方" },
        );
        await settle();
        const nameTd = rowAt(root, 0).querySelectorAll(".asc-table-td:not(.asc-table-td-sel)")[0]!;
        expect(nameTd.querySelector(".cell-name")!.textContent).toBe("张三"); // row 形参注入
        expect(nameTd.querySelector(".cell-idx")!.textContent).toBe("#1"); // rowIndex 形参
        expect(nameTd.querySelector(".cell-outer")!.textContent).toBe("调用方"); // 调用方作用域链回退
        expect(nameTd.querySelector(".asc-table-td-text")).toBeNull(); // 默认单元格让位
        // 未声明插槽的列保持默认渲染
        const cityTd = rowAt(root, 0).querySelectorAll(".asc-table-td:not(.asc-table-td-sel)")[2]!;
        expect(cityTd.querySelector(".asc-table-td-text")!.textContent).toBe("北京");
    });

    test("rows 响应式：整体替换驱动行数/内容变化（状态引用链路；原地 push 不触发为引擎跨域边界，文档披露）", async () => {
        const { root, engine } = mount(
            `<div x-component:autospark.table="{ columns: cols, rows: list }"></div>`,
            { cols: columns, list: [rows[0]] },
        );
        await settle();
        expect(root.querySelectorAll(".asc-table-row").length).toBe(1);
        engine.store.state.list = [...rows]; // 整体替换（增行）
        await nextTick();
        expect(root.querySelectorAll(".asc-table-row").length).toBe(3);
        engine.store.state.list = [{ id: 9, name: "新行", age: 1, city: "无" }];
        await nextTick();
        expect(root.querySelectorAll(".asc-table-row").length).toBe(1);
        expect(cellTexts(rowAt(root, 0))).toEqual(["新行", "1", "无"]);
    });

    test("columns 响应式：整体替换驱动表头与单元格重建", async () => {
        const { root, engine } = mount(
            `<div x-component:autospark.table="{ columns: cols, rows: list }"></div>`,
            { cols: columns, list: rows },
        );
        await settle();
        expect(headCells(root).length).toBe(3);
        engine.store.state.cols = [{ key: "name", title: "仅名称" }]; // 整体替换（减列）
        await nextTick();
        expect(headCells(root).length).toBe(1);
        expect(headCells(root)[0]!.textContent).toContain("仅名称");
        expect(cellTexts(rowAt(root, 0))).toEqual(["张三"]);
    });
});

describe("排序（sortable 三态轮转，ADR-0023）", () => {
    test("点击 sortable 表头：升序重排 + data-sort 态 + 再点降序 + 三点取消复位", async () => {
        const { root } = mount(
            `<div x-component:autospark.table="{ columns: cols, rows: list }"></div>`,
            { cols: columns, list: rows },
        );
        await settle();
        const ageTh = headCells(root)[1]!; // age 列（sortable）
        // 初始无排序态
        expect(ageTh.hasAttribute("data-sort")).toBe(false);
        // 第一次点击：升序（24 / 28 / 30）
        ageTh.click();
        await settle();
        expect(ageTh.getAttribute("data-sort")).toBe("asc");
        expect(cellTexts(rowAt(root, 0))).toEqual(["李四", "24", "上海"]);
        expect(cellTexts(rowAt(root, 2))[1]).toBe("30");
        // 第二次点击：降序（30 / 28 / 24）
        ageTh.click();
        await settle();
        expect(ageTh.getAttribute("data-sort")).toBe("desc");
        expect(cellTexts(rowAt(root, 0))[1]).toBe("30");
        // 第三次点击：取消复位（原始序）
        ageTh.click();
        await settle();
        expect(ageTh.hasAttribute("data-sort")).toBe(false);
        expect(rowAt(root, 0).querySelector(".asc-table-td-text")!.textContent).toBe("张三");
    });

    test("非排序列点击无副作用 + sortable 态通道在场", async () => {
        const { root } = mount(
            `<div x-component:autospark.table="{ columns: cols, rows: list }"></div>`,
            { cols: columns, list: rows },
        );
        await settle();
        const nameTh = headCells(root)[0]!;
        const cityTh = headCells(root)[2]!;
        expect(nameTh.hasAttribute("data-sortable")).toBe(true); // sortable 列可点击
        expect(cityTh.hasAttribute("data-sortable")).toBe(false); // 普通列
        cityTh.click(); // 非排序列点击：无排序态、无重排
        await nextTick();
        expect(cityTh.hasAttribute("data-sort")).toBe(false);
        expect(rowAt(root, 0).querySelector(".asc-table-td-text")!.textContent).toBe("张三");
    });

    test("sort-change 事件：detail 标量投影 { key, order } 逐次外发（冒泡）", async () => {
        const fired: { key: string; order: string }[] = [];
        const { root } = mount(
            `<div x-component:autospark.table="{ columns: cols, rows: list }"></div>`,
            { cols: columns, list: rows },
        );
        // 监听挂组件宿主（engine 根元素 @事件 失效边界规避，ADR-0021 后果 7）
        root.querySelector(".asc-table")!.addEventListener("sort-change", (e) => {
            const d = (e as CustomEvent).detail;
            fired.push({ key: d.key, order: d.order });
        });
        await settle();
        headCells(root)[1]!.click(); // age 升序
        await nextTick();
        headCells(root)[1]!.click(); // age 降序
        await nextTick();
        expect(fired).toEqual([
            { key: "age", order: "asc" },
            { key: "age", order: "desc" },
        ]);
    });

    test("remoteSort=true：本地不重排 + sort-change 事件仍外发（远端排序交调用方）", async () => {
        const fired: string[] = [];
        const { root } = mount(
            `<div x-component:autospark.table="{ columns: cols, rows: list, remoteSort: true }"></div>`,
            { cols: columns, list: rows },
        );
        root.querySelector(".asc-table")!.addEventListener("sort-change", (e) => {
            fired.push((e as CustomEvent).detail.order);
        });
        await settle();
        const ageTh = headCells(root)[1]!;
        ageTh.click();
        await settle();
        expect(fired).toEqual(["asc"]); // 事件照发
        expect(ageTh.getAttribute("data-sort")).toBe("asc"); // 表头态照常呈现
        expect(rowAt(root, 0).querySelector(".asc-table-td-text")!.textContent).toBe("张三"); // 数据不动
    });
});

describe("行选择（checkbox 列组合消费 autospark.checkbox，ADR-0023）", () => {
    test("selectable：选择列渲染（表头/数据行）+ checkbox 组件在场", async () => {
        const { root } = mount(
            `<div x-component:autospark.table="{ columns: cols, rows: list, selectable: true }"></div>`,
            { cols: columns, list: rows },
        );
        await settle();
        expect(root.querySelector(".asc-table-th-sel .asc-checkbox")).toBeTruthy(); // 表头全选
        const selTds = root.querySelectorAll(".asc-table-td-sel .asc-checkbox");
        expect(selTds.length).toBe(3); // 行 checkbox × 3
    });

    test("行勾选：selection-change detail={keys} 外发 + 勾选态呈现 + 再点取消", async () => {
        const fired: string[][] = [];
        const { root } = mount(
            `<div x-component:autospark.table="{ columns: cols, rows: list, selectable: true }"></div>`,
            { cols: columns, list: rows },
        );
        root.querySelector(".asc-table")!.addEventListener("selection-change", (e) => {
            fired.push([...(e as CustomEvent).detail.keys]);
        });
        await settle();
        const rowCheck = (i: number) =>
            rowAt(root, i).querySelector(".asc-table-td-sel .asc-checkbox-input") as HTMLInputElement;
        expect(rowCheck(0).checked).toBe(false);
        check(rowCheck(0), true); // 勾选首行（id=1）——happy-dom 点击不派发 change，手动派发
        await settle();
        expect(fired).toEqual([[1]]);
        expect(rowCheck(0).checked).toBe(true); // 勾选态回写呈现
        check(rowCheck(0), false); // 再点取消
        await settle();
        expect(fired).toEqual([[1], []]);
        expect(rowCheck(0).checked).toBe(false);
    });

    test("表头全选：全选 → 再点清空 + 行勾选态全量呈现", async () => {
        const fired: string[][] = [];
        const { root } = mount(
            `<div x-component:autospark.table="{ columns: cols, rows: list, selectable: true }"></div>`,
            { cols: columns, list: rows },
        );
        root.querySelector(".asc-table")!.addEventListener("selection-change", (e) => {
            fired.push([...(e as CustomEvent).detail.keys]);
        });
        await settle();
        const headCheck = root.querySelector(
            ".asc-table-th-sel .asc-checkbox-input",
        ) as HTMLInputElement;
        check(headCheck, true); // 全选
        await settle();
        expect(fired).toEqual([[1, 2, 3]]);
        const checks = Array.from(root.querySelectorAll(".asc-table-td-sel .asc-checkbox-input"));
        expect(checks.every((c) => c.checked)).toBe(true);
        check(headCheck, false); // 清空
        await settle();
        expect(fired).toEqual([[1, 2, 3], []]);
        expect(checks.every((c) => !c.checked)).toBe(true);
    });

    test("半选态：部分选中 → 表头 checkbox indeterminate（半选视觉通道）", async () => {
        const { root } = mount(
            `<div x-component:autospark.table="{ columns: cols, rows: list, selectable: true }"></div>`,
            { cols: columns, list: rows },
        );
        await settle();
        const headCheck = root.querySelector(
            ".asc-table-th-sel .asc-checkbox-input",
        ) as HTMLInputElement;
        check(
            rowAt(root, 1).querySelector(".asc-table-td-sel .asc-checkbox-input") as HTMLInputElement,
            true,
        );
        await settle();
        expect(headCheck.indeterminate).toBe(true); // 半选
        expect(headCheck.checked).toBe(false);
    });

    test("selection props 单向内同步：外部选中集注入 → 行勾选态呈现（受控初值）", async () => {
        const { root } = mount(
            `<div x-component:autospark.table="{ columns: cols, rows: list, selectable: true, selection: sel }"></div>`,
            { cols: columns, list: rows, sel: [2] },
        );
        await settle();
        const checks = Array.from(root.querySelectorAll(".asc-table-td-sel .asc-checkbox-input"));
        expect(checks.map((c) => c.checked)).toEqual([false, true, false]);
        const headCheck = root.querySelector(
            ".asc-table-th-sel .asc-checkbox-input",
        ) as HTMLInputElement;
        expect(headCheck.checked).toBe(false); // 部分选中：非全选
        expect(headCheck.indeterminate).toBe(true); // 半选
    });
});

describe("空态与 loading（list 范式组合）", () => {
    test("rows 空数组：empty 组件兜底渲染（i18n 缺省文案「暂无数据」）+ 行不渲染", async () => {
        const { root } = mount(
            `<div x-component:autospark.table="{ columns: cols, rows: list }"></div>`,
            { cols: columns, list: [] },
        );
        await settle();
        expect(root.querySelector(".asc-table-row")).toBeNull();
        const emptyHost = root.querySelector(".asc-table-empty .asc-empty")!;
        expect(emptyHost).toBeTruthy(); // 组合消费 autospark.empty
        expect(emptyHost.querySelector(".asc-empty-desc")!.textContent).toBe("暂无数据");
    });

    test("empty 插槽整体重载：自定义空态替换 empty 组件兜底", async () => {
        const { root } = mount(
            `<div x-component:autospark.table="{ columns: cols, rows: list }">` +
                `<template x-slot:empty><div class="custom-empty">一行都没有</div></template>` +
                `</div>`,
            { cols: columns, list: [] },
        );
        await settle();
        expect(root.querySelector(".custom-empty")!.textContent).toBe("一行都没有");
        expect(root.querySelector(".asc-empty")).toBeNull(); // 兜底组件让位
    });

    test("loading=true：经绑定通道组合引擎 x-loading 覆盖层（铺满表格）", async () => {
        const { root } = mount(
            `<div x-component:autospark.table="{ columns: cols, rows: list, loading: busy }"></div>`,
            { cols: columns, list: rows, busy: true },
        );
        await settle();
        await nextTick(); // 绑定写字面量 → dispatcher 察觉属性 → overlay 挂载（跨微任务）
        expect(root.querySelector(".asc-table-inner > .x-loading-overlay")).toBeTruthy();
    });
});

describe("变体与 virtual 分叉", () => {
    test("bordered 缺省有框 / striped 斑马纹数据通道（data 属性命中 inner）", async () => {
        const { root } = mount(
            `<div x-component:autospark.table="{ columns: cols, rows: list, striped: true }"></div>`,
            { cols: columns, list: rows },
        );
        await settle();
        expect(root.querySelector(".asc-table-inner")!.hasAttribute("data-borderless")).toBe(false);
        expect(root.querySelector(".asc-table-inner")!.getAttribute("data-striped")).toBe("true");
        expect(rowAt(root, 1).getAttribute("data-alt")).toBe("true"); // 偶数行斑马纹通道（$even）
        expect(rowAt(root, 0).hasAttribute("data-alt")).toBe(false); // 奇数行：假值属性移除
        const bare = mount(
            `<div x-component:autospark.table="{ columns: cols, rows: list, bordered: false }"></div>`,
            { cols: columns, list: rows },
        );
        await settle();
        expect(bare.root.querySelector(".asc-table-inner")!.getAttribute("data-borderless")).toBe("true");
    });

    test("virtual=true：网格分叉渲染 + 定高滚动容器在场（策略缺位退化全量，行/单元格仍正确）", async () => {
        const { root } = mount(
            `<div x-component:autospark.table="{ columns: cols, rows: list, virtual: true }"></div>`,
            { cols: columns, list: rows },
        );
        await settle();
        expect(root.querySelector(".asc-table-inner")!.getAttribute("data-virtual")).toBe("true");
        expect(root.querySelector(".asc-table-scroll")).toBeNull(); // 普通分叉不渲染
        expect(root.querySelector(".asc-table-vhead")).toBeTruthy(); // 表头恒渲染（外置网格）
        expect(root.querySelector(".asc-table-vbody")).toBeTruthy(); // 定高滚动容器（x-for 容器即滚动宿主）
        expect(root.querySelectorAll(".asc-table-vhead .asc-table-vh:not(.asc-table-vh-sel)").length).toBe(3);
        const vrows = root.querySelectorAll(".asc-table-vrow");
        expect(vrows.length).toBe(3); // 未加载 virtual 插件 → 策略缺位 warn 退化全量渲染（降级不失效）
        // 行内容序不可感断言（list 同款）：行序不是 table 的契约——virtual 插件在场时
        // （全量跑时 directives/x-for-virtual.test.ts 先加载注册策略）行序由引擎虚拟
        // 窗口机制决定（happy-dom 无布局退化全量但逆序渲染），缺席时退化全量按源序
        const rowTexts = Array.from(vrows)
            .map((r) =>
                Array.from(r.querySelectorAll(".asc-table-vtd:not(.asc-table-vtd-sel) .asc-table-td-text"))
                    .map((n) => n.textContent)
                    .join("|"),
            )
            .sort();
        expect(rowTexts).toEqual(["张三|30|北京", "李四|24|上海", "王五|28|广州"]);
    });

    test("virtual 分叉同样支持 col-<key> 插槽与空态（动态名出口双分叉共享调用方内容段）", async () => {
        const { root } = mount(
            `<div x-component:autospark.table="{ columns: cols, rows: emptyList, virtual: true }">` +
                `<template x-slot:col-name="{ row }"><b class="v-cell" x-text="row.name"></b></template>` +
                `</div>`,
            { cols: columns, emptyList: [] as typeof rows },
        );
        await settle();
        expect(root.querySelector(".asc-table-vrow")).toBeNull();
        expect(root.querySelector(".asc-table-vwrap .asc-table-empty .asc-empty-desc")).toBeTruthy(); // 分叉空态兜底
    });
});

describe("样式通道（button 范式 ADR-0012）", () => {
    test("三级回退链 + 斑马纹/悬停语义色 + 虚拟定高 + 暗色兜底（ADR-0129）", () => {
        const t = ((AutoSpark as { components: Record<string, string> }).components[TABLE_NAME] as string)
            .replace(/\s+/g, " "); // ?raw CSS 断言空白归一化（oxfmt 折行防假红）
        expect(t).toContain("font-size: var(--auto-font-size, var(--asc-table-font-size, 0.875rem));");
        expect(t).toContain("background: var(--auto-bgcolor, var(--asc-table-bg, #ffffff));");
        expect(t).toContain('.asc-table-inner[data-borderless="true"] { --asc-line: transparent; }');
        // 视觉对齐基线（card/alert 定型）：内距 --asc-pad 中转 calc 派生 + 选中行 --asc-tone 中转 color-mix
        expect(t).toContain("--asc-pad: var(--auto-padding, var(--asc-table-padding, 0.8rem));");
        expect(t).toContain("padding: calc(var(--asc-pad, 0.8rem) * 0.65) calc(var(--asc-pad, 0.8rem) * 1.1);");
        expect(t).toContain("--asc-tone: var(--auto-primary-color, var(--asc-table-primary, #009aff));");
        expect(t).toContain("background: color-mix(in srgb, var(--asc-tone) 8%, transparent);");
        expect(t).toContain('.asc-table-inner[data-striped="true"] .asc-table-row[data-alt],');
        expect(t).toContain("background: var(--auto-secondary-bgcolor, var(--asc-table-stripe-bg, rgba(245, 245, 245, 0.45)));");
        expect(t).toContain("background: var(--auto-hover-bgcolor, var(--asc-table-row-hover-bg, rgba(0, 0, 0, 0.045)));");
        expect(t).toContain("height: var(--asc-table-virtual-height, 20em);");
        expect(t).toContain('[dark] .asc-table-inner, [data-dark] .asc-table-inner {');
        expect(t).toContain("background: var(--auto-bgcolor, var(--asc-table-bg, #3a3a3a));");
    });
});

describe("元素名快速写法（ADR-0117 自动组件 / ADR-0133 反查）", () => {
    test("<x-table> 静态属性折叠 props + :expr 动态 props 折叠值通道", async () => {
        const { root } = mount(
            `<div><x-table :columns="cols" :rows="list" striped="true"></x-table></div>`,
            { cols: columns, list: [rows[0]] },
        );
        await settle();
        const host = root.querySelector(".asc-table")!;
        expect(host).toBeTruthy();
        expect(root.querySelector(".asc-table-inner")!.getAttribute("data-striped")).toBe("true");
        expect(host.hasAttribute("striped")).toBe(false); // 静态属性已折叠进 props
        expect(root.querySelectorAll(".asc-table-row").length).toBe(1); // :expr props 值通道注入
    });
});

describe("installPlugin 自举（ADR-0003）", () => {
    test("bootstrapTablePlugin 幂等：重复调用不覆盖（同键赋值幂等）", () => {
        const before = (AutoSpark as { components: Record<string, string> }).components[TABLE_NAME];
        bootstrapTablePlugin();
        expect((AutoSpark as { components: Record<string, string> }).components[TABLE_NAME]).toBe(before);
    });
});
