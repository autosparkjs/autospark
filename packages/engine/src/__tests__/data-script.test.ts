import { describe, expect, test, beforeEach } from "bun:test";
import "./setup";
import { mount, nextTick } from "./helpers";

/**
 * 数据脚本 `<script type="autospark/data">`（ADR-0032）
 *
 * 覆盖：基本等效 x-data / 独立成立 / 多脚本文档序深合并（数组替换、undefined 不覆盖）/
 * x-data 最后合并优先 / 求值注入 computed·configurable·watch / 裸函数即 computed /
 * options 挂载与父元素权威 / 位置无关首渲 / 错误姿态 / 剪枝 / 嵌套子域（直接父而非最近祖先）/
 * x-for item 每实例独立 / 组件快照消费期生效 / 结构指令宿主直接子级 warn 放弃 / $merge 撞名保护。
 */

/** watch 侦听体的全局捕获槽（script 在 new Function 全局作用域求值，无法闭包测试变量） */
const spy = globalThis as any;

describe("数据脚本 <script type=\"autospark/data\">（ADR-0032）", () => {
    beforeEach(() => {
        spy.__dsWatchLog = undefined;
    });

    test("基本等效 x-data：数据注入父元素私有域，子树读取；script 剪枝不进渲染 DOM", () => {
        const { root } = mount(
            `<div id="host">
  <script type="autospark/data">{ msg: '你好', times: 1 }</script>
  <span x-text="msg + times"></span>
</div>`,
            {},
        );
        expect(root).toEqualHTML(`<div>
  <div id="host">
    <span>你好1</span>
  </div>
</div>`);
    });

    test("独立成立：父元素无任何指令属性（无 x-data），仅凭脚本建数据域", () => {
        const { root } = mount(
            `<div id="host">
  <script type="autospark/data">{ msg: 'hi' }</script>
  <span x-text="msg"></span>
</div>`,
            {},
        );
        expect(root.querySelector("span")?.textContent).toBe("hi");
    });

    test("文本插值直读：{{msg}} 经 getContext 聚合读取脚本数据", () => {
        const { root } = mount(
            `<div id="host">
  <script type="autospark/data">{ msg: '插值' }</script>
  <p>{{ msg }}</p>
</div>`,
            {},
        );
        expect(root.querySelector("p")?.textContent).toBe("插值");
    });

    test("位置无关（desugar 预扫）：script 写在使用数据的元素之后，首渲仍正确", () => {
        const { root } = mount(
            `<div id="host">
  <span x-text="base"></span>
  <script type="autospark/data">{ base: 7 }</script>
</div>`,
            {},
        );
        // 无需 nextTick：数据在父元素指令求值前已合成注入
        expect(root.querySelector("span")?.textContent).toBe("7");
    });

    test("多脚本文档序深合并：嵌套对象递归合并、数组替换、后者覆盖前者", () => {
        const { root } = mount(
            `<div id="host">
  <script type="autospark/data">{ cfg: { size: 'M', deep: { a: 1 } }, list: [3], v: 'first' }</script>
  <script type="autospark/data">{ cfg: { deep: { b: 2 } }, list: [1, 2, 3], v: 'second' }</script>
  <span
    x-text="cfg.size + ',' + cfg.deep.a + ',' + cfg.deep.b + ',' + list.length + ',' + v"></span>
</div>`,
            {},
        );
        // cfg.size='M' 保留（第二脚本未声明）；deep 两层合并 a=1,b=2；list 整体替换为 [1,2,3]；v 后者覆盖
        expect(root.querySelector("span")?.textContent).toBe("M,1,2,3,second");
    });

    test("undefined 不覆盖：后脚本的 undefined 值不抹掉已有键（flex-tools $ignoreUndefined 默认）", () => {
        const { root } = mount(
            `<div id="host">
  <script type="autospark/data">{ cfg: { deep: 1, keep: 2 } }</script>
  <script type="autospark/data">{ cfg: undefined, other: 3 }</script>
  <span x-text="JSON.stringify(cfg) + '|' + other"></span>
</div>`,
            {},
        );
        expect(root.querySelector("span")?.textContent).toBe('{"deep":1,"keep":2}|3');
    });

    test("x-data 最后合并、优先级最高：脚本装基底、属性微调覆盖", () => {
        const { root } = mount(
            `<div id="host" x-data="{ config: { size: 'L', list: [1, 2] }, extra: false }">
  <script type="autospark/data">{ config: { size: 'M', tip: '脚本', list: [3] }, extra: true }</script>
  <span
    x-text="config.size + ',' + config.tip + ',' + config.list.length + ',' + extra"></span>
</div>`,
            {},
        );
        // size 被 x-data 的 L 覆盖；tip 仅脚本有（保留）；config.list 被 x-data [1,2] 替换；extra 被 false 覆盖
        expect(root.querySelector("span")?.textContent).toBe("L,脚本,2,false");
    });

    test("$merge 撞名保护：用户数据含 $merge 键不被 deepMerge 当指令键吞掉", () => {
        const { root } = mount(
            `<div id="host" x-data="{ m: 2 }">
  <script type="autospark/data">{ $merge: 'x', n: 1 }</script>
  <span x-text="$merge + n + m"></span>
</div>`,
            {},
        );
        expect(root.querySelector("span")?.textContent).toBe("x12");
    });

    test("求值注入 computed：依赖变更自动重算（computed((s)=>s.base*2)）", async () => {
        const { root, engine } = mount(
            `<div id="host">
  <script type="autospark/data">
  {
    base: 2,
    double: computed((s) => s.base * 2)
  }
  </script>
  <span class="d" x-text="double"></span>
  <button @click="bump">+</button>
</div>`,
            {},
            {
                actions: {
                    bump: function (this: any) {
                        this.data.base++;
                    },
                },
            },
        );
        expect(root.querySelector(".d")?.textContent).toBe("4");
        (root.querySelector("button") as HTMLButtonElement).click();
        await nextTick();
        expect(root.querySelector(".d")?.textContent).toBe("6");
        expect(engine).toBeTruthy();
    });

    test("裸函数即 computed 简写（AutoStore 见函数值就求值）", async () => {
        const { root } = mount(
            `<div id="host">
  <script type="autospark/data">
  {
    base: 3,
    triple: (s) => s.base * 3
  }
  </script>
  <span x-text="triple"></span>
</div>`,
            {},
        );
        expect(root.querySelector("span")?.textContent).toBe("9");
    });

    test("求值注入 configurable（= schema 别名）：初值读取 + 可写回", async () => {
        const { root } = mount(
            `<div id="host">
  <script type="autospark/data">
  {
    price: configurable(5, { widget: 'InputNumber', title: '价格' })
  }
  </script>
  <span x-text="price"></span>
  <button @click="set9">改价</button>
</div>`,
            {},
            {
                actions: {
                    set9: function (this: any) {
                        this.data.price = 9;
                    },
                },
            },
        );
        expect(root.querySelector("span")?.textContent).toBe("5");
        (root.querySelector("button") as HTMLButtonElement).click();
        await nextTick();
        expect(root.querySelector("span")?.textContent).toBe("9");
    });

    test("求值注入 watch：注入后强制首读激活，依赖变更触发侦听体", async () => {
        spy.__dsWatchLog = [];
        const { root } = mount(
            `<div id="host">
  <script type="autospark/data">
  {
    base: 1,
    spy: watch((sc) => { globalThis.__dsWatchLog.push(sc.value) })
  }
  </script>
  <span x-text="base"></span>
  <button @click="bump">+</button>
</div>`,
            {},
            {
                actions: {
                    bump: function (this: any) {
                        this.data.base++;
                    },
                },
            },
        );
        expect(root.querySelector("span")?.textContent).toBe("1");
        (root.querySelector("button") as HTMLButtonElement).click();
        (root.querySelector("button") as HTMLButtonElement).click();
        await nextTick();
        expect(spy.__dsWatchLog).toEqual([2, 3]);
    });

    test("options 属性挂载：数据挂到 state.x.y，全树路径可读", () => {
        const { root, engine } = mount(
            `<div id="host">
  <script type="autospark/data" options="{mount:'ui.panel'}">{ count: 1 }</script>
  <span x-text="count"></span>
</div>
<span class="outer" x-text="ui.panel.count"></span>`,
            {},
        );
        expect(root.querySelector("#host span")?.textContent).toBe("1");
        expect(root.querySelector(".outer")?.textContent).toBe("1");
        expect((engine.state as any).ui.panel.count).toBe(1);
    });

    test("options 冲突裁决：父元素 x-data-options 权威，脚本 options 被忽略", () => {
        const { root, engine } = mount(
            `<div id="host" x-data="{}" x-data-options="{mount:'a.b'}">
  <script type="autospark/data" options="{mount:'x.y'}">{ count: 2 }</script>
  <span x-text="count"></span>
</div>`,
            {},
        );
        // 落点是 a.b（父元素权威），不是 x.y
        expect(root.querySelector("span")?.textContent).toBe("2");
        expect((engine.state as any).a.b.count).toBe(2);
        expect((engine.state as any).x).toBeUndefined();
    });

    test("多脚本 options 同键后者覆盖（无 x-data 时合成挂载配置）", () => {
        const { engine } = mount(
            `<div id="host">
  <script type="autospark/data" options="{mount:'p1'}">{ a: 1 }</script>
  <script type="autospark/data" options="{mount:'p2'}">{ b: 2 }</script>
</div>`,
            {},
        );
        expect((engine.state as any).p1).toBeUndefined();
        expect((engine.state as any).p2).toEqual({ a: 1, b: 2 });
    });

    test("错误姿态：求值失败的脚本视为 {} 继续编译，其余脚本数据仍生效", () => {
        const { root } = mount(
            `<div id="host">
  <script type="autospark/data">{ bad: (</script>
  <script type="autospark/data">{ good: 1 }</script>
  <span x-text="good"></span>
</div>`,
            {},
        );
        expect(root.querySelector("span")?.textContent).toBe("1");
    });

    test("错误姿态：内容非对象（返回标量）→ 忽略该脚本", () => {
        const { root } = mount(
            `<div id="host">
  <script type="autospark/data">5</script>
  <script type="autospark/data">{ good: 2 }</script>
  <span x-text="good"></span>
</div>`,
            {},
        );
        expect(root.querySelector("span")?.textContent).toBe("2");
    });

    test("嵌套子域：深层 script 只作用于其直接父元素，不作用于外层（直接父 ≠ 最近祖先）", () => {
        const { root } = mount(
            `<div id="outer">
  <span class="o" x-text="msg"></span>
  <div id="inner">
    <script type="autospark/data">{ msg: 'inner' }</script>
    <span class="i" x-text="msg"></span>
  </div>
</div>`,
            {},
        );
        // outer 未获数据（msg 不是它的）：渲染空串；inner 读到 'inner'
        expect(root.querySelector(".o")?.textContent).toBe("");
        expect(root.querySelector(".i")?.textContent).toBe("inner");
    });

    test("x-for item 模板内脚本：每实例独立数据域（互不污染）", async () => {
        const { root } = mount(
            `<ul x-for="item of items">
  <li>
    <div class="cell">
      <script type="autospark/data">{ note: 'n' }</script>
      <span class="t" x-text="note"></span>
      <button class="mark" @click="mark">mark</button>
    </div>
  </li>
</ul>`,
            { items: ["a", "b"] },
            {
                actions: {
                    mark: function (this: any) {
                        this.data.note = this.data.note + "!";
                    },
                },
            },
        );
        await nextTick();
        const cells = root.querySelectorAll(".cell .t");
        expect(cells.length).toBe(2);
        // 点第一项两次：仅第一项的 note 变化（每实例独立数据对象）
        (root.querySelectorAll(".mark")[0] as HTMLButtonElement).click();
        (root.querySelectorAll(".mark")[0] as HTMLButtonElement).click();
        await nextTick();
        expect(root.querySelectorAll(".cell .t")[0]?.textContent).toBe("n!!");
        expect(root.querySelectorAll(".cell .t")[1]?.textContent).toBe("n");
    });

    test("x-component 快照内脚本：消费实例化时生效（组件私有数据）", async () => {
        const { root } = mount(
            `<div x-scope>
  <div id="host" x-use="card"></div>
  <div x-component="card">
    <div class="body">
      <script type="autospark/data">{ msg: '组件数据' }</script>
      <span class="m" x-text="msg"></span>
    </div>
  </div>
</div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".m")?.textContent).toBe("组件数据");
    });

    test("结构指令宿主直接子级：warn 放弃注入，列表渲染不受影响", async () => {
        const { root } = mount(
            `<ul x-for="item of items">
  <script type="autospark/data">{ x: 1 }</script>
  <li x-text="item"></li>
</ul>`,
            { items: ["a", "b"] },
        );
        await nextTick();
        const lis = root.querySelectorAll("li");
        expect(lis.length).toBe(2);
        expect(lis[0]?.textContent).toBe("a");
        // 脚本被剪枝，不进渲染 DOM
        expect(root.querySelectorAll("script").length).toBe(0);
    });

    test("回收同权：engine.destroy 后私有域条目回收", () => {
        const { root, engine } = mount(
            `<div id="host">
  <script type="autospark/data">{ msg: 'hi' }</script>
  <span x-text="msg"></span>
</div>`,
            {},
        );
        expect(root.querySelector("span")?.textContent).toBe("hi");
        const scopes = (engine.state as any)._scopes as Record<string, any>;
        expect(Object.keys(scopes).length).toBeGreaterThan(0);
        engine.destroy();
        expect(Object.keys(scopes).length).toBe(0);
    });
});
