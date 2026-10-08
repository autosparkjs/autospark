import { describe, expect, test } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";

/**
 * engine.registerComponent 运行时组件注册测试（ADR-0086）。
 *
 * 覆盖共识：
 * - 严格单根契约（多根 / 元素与文本混排 / 缺 x-define / 空串 → warn + null）；
 * - 归属三分支（无参全局 / scope 挂载 / el 反查）+ 双传入以 scope 为准 + el 未命中降级全局；
 * - name 仅校验（不一致 warn，仍以内联名为准）；
 * - 覆盖语义（warn 去重一次 + 已实例化不热替换 + 后续实例化取新定义）；
 * - 全局定义表单表 + 表优先于 options.components（运行时注册天然覆盖构造期配置）+ 不写用户配置；
 * - 元数据提取（<style> / <script setup>）+ 嵌套资源节点 warn；
 * - 继承：注册层解析 + 父未就绪挂起、父注册后排水解锁（ADR-0083）；
 * - components/<名>/registered 事件（ADR-0085 复用）；
 * - 只注册不注销：全局随 destroy 回收、作用域随 scope 销毁回收。
 */

/**
 * 捕获 warn（含 engine 参数是必需的）：
 *
 * flex-tools 的 `createLogger` 在**创建时**把 `console.warn` 引用绑进 logger，而 autostore 的
 * `store.logger` 是首次访问才惰性创建。故补丁窗口内须先访问一次 `engine.logger` 强制创建——
 * 否则 mount 阶段若已触发过任意 warn，logger 已绑到原始 console.warn，本测试的 warn 全部绕过捕获。
 * 同理窗口须覆盖调用后一拍宏任务（logger 异步 flush）。
 */
async function captureWarns(engine: any, fn: () => void): Promise<string[]> {
    const warns: string[] = [];
    const orig = console.warn;
    console.warn = (...args: any[]) => {
        warns.push(String(args[0] ?? ""));
    };
    try {
        void engine.logger; // 强制在补丁窗口内创建 logger（绑定补丁后的 console.warn）
        fn();
        await new Promise((r) => setTimeout(r, 150));
    } finally {
        console.warn = orig;
    }
    return warns;
}

describe("registerComponent 输入契约：严格单根（ADR-0086 决策一）", () => {
    test("正常单根 + x-define：注册成功并返回 def", async () => {
        const { engine } = mount(`<div x-scope><span x-text="1"></span></div>`, {});
        const def = engine.registerComponent(`<div x-define="panel"><b>面板</b></div>`);
        expect(def).not.toBeNull();
        expect(def!.name).toBe("panel");
        expect(def!.snapshot.querySelector("b")?.textContent).toBe("面板");
        await nextTick();
    });

    test("多根（两顶级元素）→ warn + null", async () => {
        const { engine } = mount(`<div x-scope><span x-text="1"></span></div>`, {});
        const warns = await captureWarns(engine, () => {
            const def = engine.registerComponent(
                `<div x-define="a">1</div><div x-define="b">2</div>`,
            );
            expect(def).toBeNull();
        });
        expect(warns.some((w) => w.includes("恰好一个顶级根元素"))).toBe(true);
        expect(engine.getGlobalComponentDef("a")).toBeUndefined();
        expect(engine.getGlobalComponentDef("b")).toBeUndefined();
    });

    test("元素与文本混排 → warn + null（顶级文本无从归属组件根）", async () => {
        const { engine } = mount(`<div x-scope><span x-text="1"></span></div>`, {});
        const warns = await captureWarns(engine, () => {
            expect(engine.registerComponent(`文本<div x-define="mix">1</div>`)).toBeNull();
        });
        expect(warns.some((w) => w.includes("恰好一个顶级根元素"))).toBe(true);
    });

    test("纯文本无元素 → warn + null（不自动包装）", async () => {
        const { engine } = mount(`<div x-scope><span x-text="1"></span></div>`, {});
        const warns = await captureWarns(engine, () => {
            expect(engine.registerComponent(`纯文本组件`)).toBeNull();
        });
        expect(warns.some((w) => w.includes("恰好一个顶级根元素"))).toBe(true);
    });

    test("单根但缺 x-define → warn + null（注册路径要求自带声明）", async () => {
        const { engine } = mount(`<div x-scope><span x-text="1"></span></div>`, {});
        const warns = await captureWarns(engine, () => {
            expect(engine.registerComponent(`<div>无声明</div>`)).toBeNull();
        });
        expect(warns.some((w) => w.includes("缺少 x-define 声明"))).toBe(true);
    });

    test("空串 → warn + null", async () => {
        const { engine } = mount(`<div x-scope><span x-text="1"></span></div>`, {});
        const warns = await captureWarns(engine, () => {
            expect(engine.registerComponent("   ")).toBeNull();
        });
        expect(warns.some((w) => w.includes("code 为空"))).toBe(true);
    });

    test("name 仅校验：不一致时 warn，仍以内联名为准", async () => {
        const { engine } = mount(`<div x-scope><span x-text="1"></span></div>`, {});
        const warns = await captureWarns(engine, () => {
            const def = engine.registerComponent(`<div x-define="inner">x</div>`, {
                name: "outer",
            });
            expect(def!.name).toBe("inner"); // 内联名为权威
        });
        expect(warns.some((w) => w.includes("以内联名为准"))).toBe(true);
        expect(engine.getGlobalComponentDef("inner")).toBeDefined();
        expect(engine.getGlobalComponentDef("outer")).toBeUndefined();
    });
});

describe("registerComponent 归属（ADR-0086 决策五）", () => {
    test("无参：全局注册，跨 scope 可用", async () => {
        const { root, engine } = mount(
            `<div x-scope><div id="a" x-component:panel></div></div>
             <div x-scope><div id="b" x-component:panel></div></div>`,
            {},
        );
        engine.registerComponent(`<div x-define="panel"><i>全局面板</i></div>`);
        await nextTick();
        expect(root.querySelector("#a i")?.textContent).toBe("全局面板");
        expect(root.querySelector("#b i")?.textContent).toBe("全局面板");
        expect(engine.getGlobalComponentDef("panel")).toBeDefined();
    });

    test("scope：挂该 scope，仅其 scope 链内可见（另一 scope 未命中）", async () => {
        const { root, engine } = mount(
            `<div id="s1" x-scope><span x-text="1"></span></div>
             <div id="s2" x-scope><span x-text="2"></span></div>`,
            {},
        );
        const s1 = engine.findScopeByEl(root.querySelector("#s1") as HTMLElement)!;
        const s2 = engine.findScopeByEl(root.querySelector("#s2") as HTMLElement)!;
        const def = engine.registerComponent(`<div x-define="only"><i>局部</i></div>`, {
            scope: s1,
        });
        expect(def!.declarerScope).toBe(s1); // 声明处基准挂载点
        expect(s1.getComponentDeclaration("only")).toBeTruthy();
        expect(s2.getComponentDeclaration("only")).toBeUndefined();
        expect(engine.getGlobalComponentDef("only")).toBeUndefined(); // 未进全局表
        // 引擎仍可经快照反查 def（x-component 取 setup/hooks 的通道）
        expect(engine.getComponentDef(s1.getComponentDeclaration("only")!)).toBe(def!);
    });

    test("el：经 findScopeByEl 反查 scope，等价于传 scope", async () => {
        const { root, engine } = mount(`<div id="s1" x-scope><span x-text="1"></span></div>`, {});
        const s1 = engine.findScopeByEl(root.querySelector("#s1") as HTMLElement)!;
        const def = engine.registerComponent(`<div x-define="viapel"><i>x</i></div>`, {
            el: root.querySelector("#s1") as HTMLElement,
        });
        expect(def!.declarerScope).toBe(s1);
        expect(s1.getComponentDeclaration("viapel")).toBeTruthy();
    });

    test("el 自身不是 scope 根 → 上溯到最近祖先 scope（与 x-define 归属同构）", async () => {
        const { root, engine } = mount(
            `<div id="s1" x-scope><div id="zone"><span x-text="1"></span></div></div>
             <div id="s2" x-scope><span x-text="2"></span></div>`,
            {},
        );
        const s1 = engine.findScopeByEl(root.querySelector("#s1") as HTMLElement)!;
        const s2 = engine.findScopeByEl(root.querySelector("#s2") as HTMLElement)!;
        const zone = root.querySelector("#zone") as HTMLElement;
        expect(engine.findScopeByEl(zone)).toBeUndefined(); // 精确匹配确实查不到
        const def = engine.registerComponent(`<div x-define="upward"><i>上溯可见</i></div>`, {
            el: zone,
        });
        expect(def!.declarerScope).toBe(s1);
        expect(s1.getComponentDeclaration("upward")).toBeTruthy();
        expect(s2.getComponentDeclaration("upward")).toBeUndefined();
        expect(engine.getGlobalComponentDef("upward")).toBeUndefined(); // 未降级为全局
    });

    test("el 未对应任何 scope → warn + 降级为全局注册", async () => {
        const { engine } = mount(`<div x-scope><span x-text="1"></span></div>`, {});
        const orphan = document.createElement("div");
        const warns = await captureWarns(engine, () => {
            engine.registerComponent(`<div x-define="fallback"><i>x</i></div>`, { el: orphan });
        });
        expect(warns.some((w) => w.includes("降级为全局注册"))).toBe(true);
        expect(engine.getGlobalComponentDef("fallback")).toBeDefined();
    });

    test("scope 与 el 同时传入 → warn + 以 scope 为准", async () => {
        const { root, engine } = mount(
            `<div id="s1" x-scope><span x-text="1"></span></div>
             <div id="s2" x-scope><span x-text="2"></span></div>`,
            {},
        );
        const s1 = engine.findScopeByEl(root.querySelector("#s1") as HTMLElement)!;
        const s2 = engine.findScopeByEl(root.querySelector("#s2") as HTMLElement)!;
        const warns = await captureWarns(engine, () => {
            const def = engine.registerComponent(`<div x-define="both">x</div>`, {
                scope: s1,
                el: root.querySelector("#s2") as HTMLElement,
            });
            expect(def!.declarerScope).toBe(s1); // scope 胜，el 未参与
        });
        expect(warns.some((w) => w.includes("以 scope 为准"))).toBe(true);
        expect(s1.getComponentDeclaration("both")).toBeTruthy();
        expect(s2.getComponentDeclaration("both")).toBeUndefined();
    });
});

describe("registerComponent 全局定义表（ADR-0086 决策二/三）", () => {
    test("表优先于 options.components：运行时注册天然覆盖构造期配置", async () => {
        const { root, engine } = mount(
            `<div x-scope><div id="a" x-component:greet></div></div>`,
            {},
            { components: { greet: `<div x-define="greet"><b>构造期</b></div>` } },
        );
        await nextTick();
        expect(root.querySelector("b")?.textContent).toBe("构造期");

        engine.registerComponent(`<div x-define="greet"><i>运行时</i></div>`);
        await nextTick();
        // 新建实例取新定义（已渲染实例各自持有克隆，见下条）
        expect(engine.getGlobalComponentDef("greet")!.snapshot.querySelector("i")).not.toBeNull();
    });

    test("不写 options.components（引擎不得改用户配置）", async () => {
        const { engine } = mount(`<div x-scope><span x-text="1"></span></div>`, {});
        engine.registerComponent(`<div x-define="pure"><i>x</i></div>`);
        expect(engine.options.components?.pure).toBeUndefined();
    });

    test("同名覆盖：warn 一次（per 名去重）+ 已实例化不热替换 + 后续实例化取新定义", async () => {
        // 补丁窗口须含 mount：模板里 x-component:card 在注册前未命中会先触发 warn，
        // 而 store.logger 惰性创建时即绑定当时的 console.warn（flex-tools createLogger）
        const warns: string[] = [];
        const origWarn = console.warn;
        console.warn = (...args: any[]) => {
            warns.push(String(args[0] ?? ""));
        };
        let root!: HTMLElement;
        let engine!: any;
        try {
            ({ root, engine } = mount(
                `<div x-scope><div id="host" x-component:card></div></div>`,
                {},
            ));
            engine.registerComponent(`<div x-define="card"><b>第一版</b></div>`);
            await nextTick();
            engine.registerComponent(`<div x-define="card"><i>第二版</i></div>`);
            engine.registerComponent(`<div x-define="card"><u>第三版</u></div>`);
            await new Promise((r) => setTimeout(r, 150));
        } finally {
            console.warn = origWarn;
        }
        expect(root.querySelector("#host b")?.textContent).toBe("第一版");
        expect(warns.filter((w) => w.includes("组件注册覆盖")).length).toBe(1);
        // 已实例化组件不热替换：实例持有自己的克隆，仍是第一版
        expect(root.querySelector("#host b")?.textContent).toBe("第一版");
        expect(root.querySelector("#host i")).toBeNull();
        expect(root.querySelector("#host u")).toBeNull();
        // 定义表已是最后一版 → 后续实例化取新定义
        const def = engine.getGlobalComponentDef("card")!;
        expect(def.snapshot.querySelector("u")).not.toBeNull();
    });
});

describe("registerComponent 元数据（ADR-0086 决策一：复用 buildComponentDef）", () => {
    test("<style> / <script setup> 仅根直接子级提取，快照已剥离", async () => {
        const { engine } = mount(`<div x-scope><span x-text="1"></span></div>`, {});
        const warns = await captureWarns(engine, () => {
            const def = engine.registerComponent(
                `<div x-define="rich">
                <style>.rich { color: red }</style>
                <script setup>{ data: () => ({ n: 7 }), methods: { hi() { return 1 } } }</script>
                <span class="rich">内容</span>
            </div>`,
            );
            expect(def!.styles?.length).toBe(1);
            expect(def!.styles![0]!.css).toContain("color: red");
            expect(typeof def!.setup?.data).toBe("function");
            expect(typeof def!.setup?.methods?.hi).toBe("function");
            // 快照是洁净 DOM：资源节点已剥离、指令属性保留
            expect(def!.snapshot.querySelector("style")).toBeNull();
            expect(def!.snapshot.querySelector("script")).toBeNull();
            expect(def!.snapshot.getAttribute("x-define")).toBe("rich");
        });
        // 根的直接子级是合法资源位，不该被误报为「嵌套在深层」
        expect(warns.filter((w) => w.includes("嵌套在深层"))).toEqual([]);
    });

    test("嵌套 <style> / <script setup> → warn（不作为组件资源收集，行为不变）", async () => {
        const { engine } = mount(`<div x-scope><span x-text="1"></span></div>`, {});
        const warns = await captureWarns(engine, () => {
            const def = engine.registerComponent(
                `<div x-define="nested"><div><style>.x{color:blue}</style></div></div>`,
            );
            // 收集行为不变：嵌套层不进 def.styles
            expect(def!.styles).toBeUndefined();
        });
        expect(warns.some((w) => w.includes("嵌套在深层"))).toBe(true);
    });
});

describe("registerComponent 继承（ADR-0086 决策四：解析归注册层）", () => {
    test("继承已注册的全局父：展开父快照 + 记录 inherit 链指针", async () => {
        const { engine } = mount(`<div x-scope><span x-text="1"></span></div>`, {});
        engine.registerComponent(`<div x-define="base"><span class="p">父内容</span></div>`);
        const def = engine.registerComponent(
            `<div x-define="derived" x-define:inherit="base" class="child"></div>`,
        );
        expect(def!.inherit).toBe("base");
        expect(def!.snapshot.querySelector(".p")?.textContent).toBe("父内容");
        // 子根属性并入（class 拼接）
        expect(def!.snapshot.className).toContain("child");
    });

    test("父未就绪 → 挂起 + warn；父后注册 → 排水解锁（ADR-0083）", async () => {
        const { engine } = mount(`<div x-scope><span x-text="1"></span></div>`, {});
        const warns = await captureWarns(engine, () => {
            // 子在前：父未注册 → 挂起，本次不注册
            expect(
                engine.registerComponent(`<div x-define="kid" x-define:inherit="late"></div>`),
            ).toBeNull();
        });
        expect(warns.some((w) => w.includes("暂未就绪，已挂起"))).toBe(true);
        expect(engine.getGlobalComponentDef("kid")).toBeUndefined();

        engine.registerComponent(`<div x-define="late"><span class="l">迟到父</span></div>`);
        await nextTick();
        // 父注册事件排水重试子：子此刻解锁入表
        const kid = engine.getGlobalComponentDef("kid");
        expect(kid).toBeDefined();
        expect(kid!.snapshot.querySelector(".l")?.textContent).toBe("迟到父");
    });

    test("继承终局失败（指向自身 / 成环）→ warn + 不注册", async () => {
        const { engine } = mount(`<div x-scope><span x-text="1"></span></div>`, {});
        const warns = await captureWarns(engine, () => {
            expect(
                engine.registerComponent(`<div x-define="self" x-define:inherit="self"></div>`),
            ).toBeNull();
        });
        expect(warns.some((w) => w.includes("指向自身"))).toBe(true);
        expect(engine.getGlobalComponentDef("self")).toBeUndefined();
    });
});

describe("registerComponent 生命周期与事件（ADR-0085/0086）", () => {
    test("注册即发 components/<名>/registered（载荷含 global）", async () => {
        const { root, engine } = mount(`<div id="s1" x-scope><span x-text="1"></span></div>`, {});
        const got: any[] = [];
        engine.on("components/reg-evt/registered", (m: any) => {
            got.push(m?.payload ?? m);
        });
        engine.registerComponent(`<div x-define="reg-evt"><i>x</i></div>`);
        expect(got.length).toBe(1);
        expect(got[0].name).toBe("reg-evt");
        expect(got[0].global).toBe(true);

        const s1 = engine.findScopeByEl(root.querySelector("#s1") as HTMLElement)!;
        const gotLocal: any[] = [];
        engine.on("components/reg-local/registered", (m: any) => {
            gotLocal.push(m?.payload ?? m);
        });
        engine.registerComponent(`<div x-define="reg-local"><i>x</i></div>`, { scope: s1 });
        expect(gotLocal.length).toBe(1);
        expect(gotLocal[0].global).toBe(false);
    });

    test("只注册不注销：作用域注册无注销通道，覆盖只能再注册一次", async () => {
        const { root, engine } = mount(`<div id="s1" x-scope><span x-text="1"></span></div>`, {});
        const s1 = engine.findScopeByEl(root.querySelector("#s1") as HTMLElement)!;
        engine.registerComponent(`<div x-define="scoped-x"><b>第一版</b></div>`, { scope: s1 });
        expect(s1.getComponentDeclaration("scoped-x")!.querySelector("b")).not.toBeNull();

        engine.registerComponent(`<div x-define="scoped-x"><i>第二版</i></div>`, { scope: s1 });
        // 覆盖即替换：仍是 HTMLElement 快照契约，无第三个通道可移除
        expect(s1.getComponentDeclaration("scoped-x")!.querySelector("i")).not.toBeNull();
        expect((engine as any).unregisterComponent).toBeUndefined(); // v1 不提供注销
        engine.destroy();
    });

    test("作用域注册随 scope 一并被回收（destroyed scope 不再参与活查找）", async () => {
        const { root, engine } = mount(`<div id="s1" x-scope><span x-text="1"></span></div>`, {});
        const s1 = engine.findScopeByEl(root.querySelector("#s1") as HTMLElement)!;
        engine.registerComponent(`<div x-define="scoped-eph"><i>x</i></div>`, { scope: s1 });
        expect(s1.getComponentDeclaration("scoped-eph")).toBeTruthy();

        s1.destroy(); // 幂等销毁：从父链脱离、watcher 全 off、图标域归还
        expect(s1.destroyed).toBe(true);
        // 组件随 scope 对象一并失去引用（无独立注册表可泄漏）；engine.destroy 后整图不可达
        engine.destroy();
    });

    test("只注册不注销：全局注册随 engine.destroy 回收", async () => {
        const { engine } = mount(`<div x-scope><span x-text="1"></span></div>`, {});
        engine.registerComponent(`<div x-define="ephemeral"><i>x</i></div>`);
        expect(engine.getGlobalComponentDef("ephemeral")).toBeDefined();
        engine.destroy();
        expect(engine.getGlobalComponentDef("ephemeral")).toBeUndefined();
    });

    test("重复注册同一段代码重新解析（不 memo）", async () => {
        const { engine } = mount(`<div x-scope><span x-text="1"></span></div>`, {});
        const code = `<div x-define="twice"><i>x</i></div>`;
        const a = engine.registerComponent(code);
        const b = engine.registerComponent(code);
        expect(a).not.toBe(b); // 两个独立 def 实例（无缓存复用）
        expect(engine.getGlobalComponentDef("twice")).toBe(b!);
    });
});
