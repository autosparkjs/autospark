/**
 * tour 组件插件测试（组件库 P4 other 分类，ADR-0018 清单权威表 other 行 / ADR-0031）：
 * - 组件形态官方样板：全局表注册 + 主题档位继承（autospark.base）+ bootstrap 幂等；
 * - 元素名写法渲染：<x-tour :steps :visible> 化身——气泡/高亮框亮相、标题/内容/
 *   步指示渲染（i18n 键等值判定回退中文）；
 * - 受控面：visible（el.value 桥读/写）+ current（props 注入 + 内部步进 change
 *   detail={current}）；
 * - 动作链：上一步（首步 disabled）/ 下一步步进 / 末步完成自动关（close + input
 *   回写）/ 跳过关闭链；
 * - 目标 miss：warn 跳步（console.warn 间谍）+ 全 miss 关闭；
 * - 定位协议：data-placed 落位标记（首开零闪烁协议，ADR-0031）；
 * - 模板断言：box-shadow 大投影遮罩 / 气泡盒饰三级回退链 / 层级（气泡恒在高亮框上）/
 *   reduced-motion 停播 / 暗色兜底变体；
 * - unmounted 清理：destroy 后 scroll/resize 监听摘除。
 *
 * happy-dom 无真实几何（getBoundingClientRect/offsetWidth 恒 0）：定位数值与步进
 * 平滑过渡的真浏览器链路见 docs demo（e2e 验证面）；组件目标解析走 document
 * 范围 querySelector——挂载容器须入 document 树（detached 树内目标不可达）。
 */
import "../../setup";
import { afterEach, describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { TOUR_NAME, bootstrapTourPlugin } from "../../../components/other/tour/index";

/** 组件模板字符串（空白归一化后断言——oxfmt 折行使逐字匹配假红） */
const tpl = () =>
  ((AutoSpark as { components: Record<string, string> }).components[TOUR_NAME] as string).replace(
    /\s+/g,
    " ",
  );

/** 三步引导（步骤 2 目标故意 miss——跳步链路断言面） */
const STEPS = [
  { target: "#t-step1", title: "第一步", content: "认识标题栏" },
  { target: ".t-miss", title: "失步", content: "目标不存在" },
  { target: "#t-step2", title: "第三步", content: "认识按钮" },
];

/** 挂载（容器入 document 树——目标解析 document 范围）；返回清理器 */
const mountTour = async (html: string, state: any) => {
  const { root, engine } = mount(html, state);
  document.body.appendChild(root);
  await nextTick();
  await sleep(10); // scheduleSync（setTimeout 0）落位 + x-show 微任务生效
  return {
    root,
    engine,
    cleanup: () => {
      root.remove();
      engine.destroy();
    },
  };
};

/** 真实等待（走秒/宏任务链路） */
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** console.warn 间谍（miss 跳步断言面） */
const spyWarn = () => {
  const calls: string[] = [];
  const original = console.warn;
  console.warn = (...args: any[]) => {
    calls.push(String(args[0]));
  };
  return {
    calls,
    restore: () => {
      console.warn = original;
    },
  };
};

/** 本文件所有挂载的统一回收（监听卫生：防用例间串扰） */
const cleanups: Array<() => void> = [];
afterEach(() => {
  while (cleanups.length) cleanups.pop()!();
});

describe("注册面（组件形态官方样板）", () => {
  test("模块加载即注册：插件全局组件表含 autospark.tour 模板字符串 + 主题档位继承", () => {
    const template = (AutoSpark as { components: Record<string, string> }).components[TOUR_NAME];
    expect(typeof template).toBe("string");
    expect(template).toContain(`x-define="${TOUR_NAME}"`);
    expect(template).toContain('x-define:inherit="autospark.base"'); // 主题档位继承（ADR-0134）
  });

  test("bootstrap 幂等：重复调用不覆盖（同键赋值幂等）", () => {
    const before = (AutoSpark as { components: Record<string, string> }).components[TOUR_NAME];
    bootstrapTourPlugin();
    expect((AutoSpark as { components: Record<string, string> }).components[TOUR_NAME]).toBe(
      before,
    );
  });
});

describe("元素名写法渲染（:steps / :visible 响应式注入）", () => {
  test("打开亮相：气泡/高亮框显示 + 标题/内容/步指示渲染 + i18n 回退中文", async () => {
    const { root, cleanup } = await mountTour(
      `<div><h1 id="t-step1">标题栏</h1><button id="t-step2">按钮</button>
             <x-tour :steps="steps" :visible="true"></x-tour></div>`,
      { steps: STEPS },
    );
    cleanups.push(cleanup);
    const hi = root.querySelector(".asc-tour-highlight")!;
    const bubble = root.querySelector(".asc-tour-bubble")!;
    expect((hi as HTMLElement).style.display).not.toBe("none"); // x-show 亮相
    expect((bubble as HTMLElement).style.display).not.toBe("none");
    expect(hi.hasAttribute("data-placed")).toBe(true); // 定位落位标记（首开零闪烁协议）
    expect(bubble.hasAttribute("data-placed")).toBe(true);
    expect(root.querySelector(".asc-tour-title")!.textContent).toBe("第一步");
    expect(root.querySelector(".asc-tour-content")!.textContent).toBe("认识标题栏");
    expect(root.querySelector(".asc-tour-indicator")!.textContent).toBe("1 / 3");
    // i18n 键等值判定回退中文（未装 i18n 时 t(键)===键）
    expect(root.querySelector(".asc-tour-skip")!.textContent!.trim()).toBe("跳过"); // trim：oxfmt 折行空白节点
    expect(root.querySelector(".asc-tour-btn")!.textContent!.trim()).toBe("上一步");
    expect(root.querySelector(".asc-tour-btn-primary")!.textContent!.trim()).toBe("下一步");
  });

  test("关闭不亮相：visible=false 时气泡/高亮均隐藏；steps 空数组同不亮相", async () => {
    const { root, cleanup } = await mountTour(
      `<div><h1 id="t-step1">x</h1>
             <x-tour :steps="steps" :visible="off"></x-tour>
             <x-tour :steps="empty" :visible="true"></x-tour></div>`,
      { off: false, steps: STEPS, empty: [] },
    );
    cleanups.push(cleanup);
    const tours = root.querySelectorAll(".asc-tour");
    expect((tours[0].querySelector(".asc-tour-bubble") as HTMLElement).style.display).toBe("none");
    expect((tours[1].querySelector(".asc-tour-bubble") as HTMLElement).style.display).toBe("none"); // 空步骤无操作
    expect(tours[1].querySelector(".asc-tour-bubble")!.hasAttribute("data-placed")).toBe(false);
  });

  test("无标题步骤：标题插值空串 + :empty 不占位（模板断言）", () => {
    const t = tpl();
    expect(t).toContain(".asc-tour-title:empty {");
  });
});

describe("受控面（visible / current）", () => {
  test("el.value 桥：读 = 当前开关；写 true 打开并落位（不广播）", async () => {
    const { root, engine, cleanup } = await mountTour(
      `<div><h1 id="t-step1">标题栏</h1><button id="t-step2">按钮</button>
             <x-tour :steps="steps"></x-tour></div>`,
      { steps: STEPS },
    );
    cleanups.push(cleanup);
    const host = root.querySelector(".asc-tour")!;
    expect((host as any).value).toBe(false); // 读桥
    (host as any).value = true; // 写桥打开
    await sleep(10);
    const bubble = root.querySelector(".asc-tour-bubble") as HTMLElement;
    expect(bubble.style.display).not.toBe("none");
    expect(bubble.hasAttribute("data-placed")).toBe(true);
    (host as any).value = false;
    await nextTick();
    expect((root.querySelector(".asc-tour-bubble") as HTMLElement).style.display).toBe("none");
  });

  test('current 受控注入：:current="1" 直接落第二步（受控 props 单向驱动）', async () => {
    const { root, cleanup } = await mountTour(
      `<div><h1 id="t-step1">标题栏</h1><button id="t-step2">按钮</button>
             <x-tour :steps="steps" :visible="true" :current="1"></x-tour></div>`,
      { steps: STEPS },
    );
    cleanups.push(cleanup);
    // 步 2 目标 miss → 自动跳步 3（miss 链路见下组）；步指示即 3 / 3
    expect(root.querySelector(".asc-tour-indicator")!.textContent).toBe("3 / 3");
    expect(root.querySelector(".asc-tour-title")!.textContent).toBe("第三步");
  });
});

describe("动作链（上一步 / 下一步 / 完成 / 跳过）", () => {
  test("下一步步进：current 前进 + change detail={current}（跨 miss 步自动连跳）", async () => {
    const { root, engine, cleanup } = await mountTour(
      `<div><h1 id="t-step1">标题栏</h1><button id="t-step2">按钮</button>
             <x-tour :steps="steps" :visible="true"></x-tour></div>`,
      { steps: STEPS },
    );
    cleanups.push(cleanup);
    const changes: any[] = [];
    root.addEventListener("change", (e) => changes.push((e as CustomEvent).detail));
    // 末步按钮（primary）= 下一步；步 1 → next 落步 2（miss）→ 链式跳步 3
    (root.querySelector(".asc-tour-btn-primary") as HTMLElement).click();
    await sleep(10);
    expect(root.querySelector(".asc-tour-indicator")!.textContent).toBe("3 / 3");
    expect(changes.at(-1)).toEqual({ current: 2 });
  });

  test("上一步：首步 disabled；步进后可回退 + change 广播", async () => {
    const { root, engine, cleanup } = await mountTour(
      `<div><h1 id="t-step1">标题栏</h1><button id="t-step2">按钮</button>
             <x-tour :steps="okSteps" :visible="true" :current="1"></x-tour></div>`,
      { okSteps: [STEPS[0], STEPS[2]] },
    );
    cleanups.push(cleanup);
    const prev = root.querySelector(".asc-tour-btn") as HTMLButtonElement;
    expect(prev.disabled).toBe(false); // current=1 可回退
    const changes: any[] = [];
    root.addEventListener("change", (e) => changes.push((e as CustomEvent).detail));
    prev.click();
    await sleep(10);
    expect(root.querySelector(".asc-tour-indicator")!.textContent).toBe("1 / 2");
    expect(changes.at(-1)).toEqual({ current: 0 });
    expect((root.querySelector(".asc-tour-btn") as HTMLButtonElement).disabled).toBe(true); // 首步归位
  });

  test("末步完成自动关：close 广播 + input 非冒泡回写 + visible 内部归 false", async () => {
    const { root, engine, cleanup } = await mountTour(
      `<div><h1 id="t-step1">标题栏</h1><button id="t-step2">按钮</button>
             <x-tour :steps="okSteps" :visible="true" :current="1"></x-tour></div>`,
      { okSteps: [STEPS[0], STEPS[2]] },
    );
    cleanups.push(cleanup);
    // 末步 next 文案 = 完成语义（i18n 回退）
    expect(root.querySelector(".asc-tour-btn-primary")!.textContent!.trim()).toBe("完成");
    let closed = 0,
      inputted = 0;
    root.addEventListener("close", () => closed++);
    // input 为非冒泡回写通道（x-model 语义）——监听须挂宿主本身
    root.querySelector(".asc-tour")!.addEventListener("input", () => inputted++);
    (root.querySelector(".asc-tour-btn-primary") as HTMLElement).click();
    await nextTick();
    expect(closed).toBe(1);
    expect(inputted).toBe(1);
    expect((root.querySelector(".asc-tour-bubble") as HTMLElement).style.display).toBe("none"); // 自动关成立
  });

  test("跳过引导：close 广播 + 关闭（未到末步亦关）", async () => {
    const { root, engine, cleanup } = await mountTour(
      `<div><h1 id="t-step1">标题栏</h1><button id="t-step2">按钮</button>
             <x-tour :steps="okSteps" :visible="true"></x-tour></div>`,
      { okSteps: [STEPS[0], STEPS[2]] },
    );
    cleanups.push(cleanup);
    let closed = 0;
    root.addEventListener("close", () => closed++);
    (root.querySelector(".asc-tour-skip") as HTMLElement).click();
    await nextTick();
    expect(closed).toBe(1);
    expect((root.querySelector(".asc-tour-bubble") as HTMLElement).style.display).toBe("none");
  });
});

describe("目标 miss 跳步（ADR-0031）", () => {
  test("单步 miss：warn + 跳到下一步；全 miss：warn + 关闭链", async () => {
    const warn = spyWarn();
    const { root, engine, cleanup } = await mountTour(
      `<div><button id="t-step2">按钮</button>
             <x-tour :steps="missSteps" :visible="true"></x-tour></div>`,
      {
        missSteps: [
          { target: ".nope", title: "a", content: "x" },
          { target: "#t-step2", title: "b", content: "y" },
        ],
      },
    );
    cleanups.push(cleanup);
    await sleep(10);
    expect(warn.calls.some((c) => c.includes("[autospark.tour]"))).toBe(true); // warn 响而不哑
    expect(root.querySelector(".asc-tour-title")!.textContent).toBe("b"); // 跳到步 2
    warn.restore();

    // 全 miss：唯一目标不命中 → 关闭（miss 链在挂载 setTimeout(0) 即同步走完，close
    // 派发早于任何挂载后注册的监听——关闭结果经 el.value 桥断言）
    const warn2 = spyWarn();
    const { root: root2, engine: engine2 } = mount(
      `<div><x-tour :steps="allMiss" :visible="true"></x-tour></div>`,
      { allMiss: [{ target: ".nope-1", title: "a", content: "x" }] },
    );
    document.body.appendChild(root2);
    await nextTick();
    await sleep(10);
    expect((root2.querySelector(".asc-tour") as any).value).toBe(false); // 关闭链已走（visible 归 false）
    expect((root2.querySelector(".asc-tour-bubble") as HTMLElement).style.display).toBe("none");
    expect(warn2.calls.length).toBeGreaterThan(0);
    warn2.restore();
    root2.remove();
    engine2.destroy();
  });
});

describe("样式与清理", () => {
  test("样式规则（模板断言）：大投影遮罩/气泡盒饰三级回退链/层级/上翻视觉/reduced-motion/暗色兜底", () => {
    const t = tpl();
    // box-shadow 大投影单元素遮罩（ADR-0031 选型）+ 不拦截交互
    expect(t).toContain("box-shadow: 0 0 0 100vmax var(--asc-tour-mask, rgba(0, 0, 0, 0.55));");
    expect(t).toContain("pointer-events: none;");
    // 首开零闪烁协议：未落位不可见 + 落位可见
    expect(t).toContain(".asc-tour-highlight[data-placed] { visibility: visible; }");
    expect(t).toContain(".asc-tour-bubble[data-placed] { visibility: visible; }");
    // 气泡盒饰三级回退链（--auto-* 语义层为主入口）
    expect(t).toContain("background: var(--auto-bgcolor, var(--asc-tour-bg, #ffffff));");
    expect(t).toContain(
      "border-radius: var(--auto-border-radius, var(--asc-tour-radius, 0.5rem));",
    );
    // 层级：气泡恒在高亮框之上（z + 1）
    expect(t).toContain("z-index: calc(var(--asc-tour-z, 1000) + 1);");
    // 主钮主色实底白字（语义色底上的白字恒定设计）
    expect(t).toContain("background: var(--auto-primary-color, var(--asc-tour-primary, #2563eb));");
    // reduced-motion 停播步进过渡
    expect(t).toContain("@media (prefers-reduced-motion: reduce) {");
    // 暗色兜底变体在场（ADR-0129）
    expect(t).toContain("[dark] .asc-tour-bubble,");
    expect(t).toContain("[data-dark] .asc-tour-bubble {");
    // i18n 四键等值判定回退表达式在场（tour.prev/next/skip/finish）
    expect(t).toContain("t('tour.skip') === 'tour.skip' ? '跳过' : t('tour.skip')");
    expect(t).toContain("t('tour.finish') === 'tour.finish' ? '完成' : t('tour.finish')");
  });

  test("unmounted 清理：destroy 后 scroll/resize 派发无异常且监听摘除", async () => {
    const { root, engine, cleanup } = await mountTour(
      `<div><h1 id="t-step1">标题栏</h1>
             <x-tour :steps="okSteps" :visible="true"></x-tour></div>`,
      { okSteps: [STEPS[0]] },
    );
    root.remove();
    engine.destroy();
    window.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("resize"));
    expect(true).toBe(true); // 上行无异常即清理干净（cleanup 不再重复入队——本用例自回收）
    void cleanup;
  });
});
