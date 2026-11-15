/**
 * countdown 组件插件测试（组件库 P4 other 分类，ADR-0018 清单权威表 other 行 /
 * ADR-0031）：
 * - 组件形态官方样板：全局表注册 + 主题档位继承（autospark.base）+ bootstrap 幂等；
 * - 元素名写法渲染：<x-countdown :time> 化身——数值文本 JS 直写（tabular-nums 排版）；
 * - format token：缺省 {h}:{m}:{s} / {d} 日（含 {d} 时 {h} 为日内余时、不含时为总
 *   小时）/ 自定义模板 / 补零两位；
 * - 计时引擎：绝对 deadline 真值（ceil 取整——剩 1.5s 显示 2s）+ finish 归零一次性
 *   派发（防重发）+ 归零渲染全零；
 * - time 变化重启新一轮；time=0 即刻归零 + finish；
 * - unmounted 清理：destroy 后定时器与 visibilitychange 监听摘除（finish 不再派发）；
 * - 模板断言：statistic 数值排版语言（tabular-nums + 1.5em）+ 三级回退链 + 暗色兜底。
 *
 * 走秒链路为真实定时器等待（总时长控制 < 1s/用例）；后台节流/visibilitychange 补
 * 触发的真浏览器链路见 docs demo（e2e 验证面）。
 */
import "../../setup";
import { afterEach, describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import {
  COUNTDOWN_NAME,
  bootstrapCountdownPlugin,
} from "../../../components/other/countdown/index";

/** 组件模板字符串（空白归一化后断言） */
const tpl = () =>
  (
    (AutoSpark as { components: Record<string, string> }).components[COUNTDOWN_NAME] as string
  ).replace(/\s+/g, " ");

/** 真实等待（走秒链路） */
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** 挂载（detached 树即可——本件无 document 解析依赖）；返回清理器 */
const mountCountdown = async (html: string, state: any) => {
  const { root, engine } = mount(html, state);
  await nextTick();
  return {
    root,
    engine,
    cleanup: () => {
      engine.destroy();
    },
  };
};

/** 本文件所有挂载的统一回收 */
const cleanups: Array<() => void> = [];
afterEach(() => {
  while (cleanups.length) cleanups.pop()!();
});

describe("注册面（组件形态官方样板）", () => {
  test("模块加载即注册：插件全局组件表含 autospark.countdown 模板字符串 + 主题档位继承", () => {
    const template = (AutoSpark as { components: Record<string, string> }).components[
      COUNTDOWN_NAME
    ];
    expect(typeof template).toBe("string");
    expect(template).toContain(`x-define="${COUNTDOWN_NAME}"`);
    expect(template).toContain('x-define:inherit="autospark.base"'); // 主题档位继承（ADR-0134）
  });

  test("bootstrap 幂等：重复调用不覆盖（同键赋值幂等）", () => {
    const before = (AutoSpark as { components: Record<string, string> }).components[COUNTDOWN_NAME];
    bootstrapCountdownPlugin();
    expect((AutoSpark as { components: Record<string, string> }).components[COUNTDOWN_NAME]).toBe(
      before,
    );
  });
});

describe("format token 模板（ADR-0031 语域）", () => {
  test("缺省 {h}:{m}:{s}：时:分:秒观感（补零两位）", async () => {
    const { root, cleanup } = await mountCountdown(`<x-countdown :time="65000"></x-countdown>`, {});
    cleanups.push(cleanup);
    // 元素名写法 :time 响应式条目引擎折叠（数字字面量直入 props）
    expect(root.querySelector(".asc-countdown-value")!.textContent).toBe("00:01:05");
  });

  test("含 {d}：{h} 为日内余时（0-23）；不含 {d}：{h} 为总小时（可超 24）——antd 同款语义", async () => {
    const day = 24 * 3600 * 1000;
    const { root, cleanup } = await mountCountdown(
      `<div>
               <x-countdown :time="t1" format="{d} 天 {h}:{m}:{s}"></x-countdown>
               <x-countdown :time="t1" format="{h} 小时"></x-countdown>
             </div>`,
      { t1: day + 3661 * 1000 },
    );
    cleanups.push(cleanup);
    const values = root.querySelectorAll(".asc-countdown-value");
    expect(values[0].textContent).toBe("1 天 01:01:01");
    expect(values[1].textContent).toBe("25 小时"); // 24h + 1h 总小时（不折叠为日）
  });

  test("自定义模板：任意文本与 token 混排（{m} 为 0-59 分段）", async () => {
    const { root, cleanup } = await mountCountdown(
      `<x-countdown :time="3725000" format="{m} 分 {s} 秒"></x-countdown>`,
      {},
    );
    cleanups.push(cleanup);
    // 3725s = 1h02m05s——{m} 恒为分位段（0-59），总时长拆解经 {h}/{d} 表达
    expect(root.querySelector(".asc-countdown-value")!.textContent).toBe("02 分 05 秒");
  });

  test("ceil 取整语义：剩 1.5s 显示 2 秒（倒计时直觉）", async () => {
    const { root, cleanup } = await mountCountdown(
      `<x-countdown :time="1500" format="{s}"></x-countdown>`,
      {},
    );
    cleanups.push(cleanup);
    expect(root.querySelector(".asc-countdown-value")!.textContent).toBe("02");
  });
});

describe("计时引擎（绝对 deadline 真值 + finish 一次性）", () => {
  test("走秒：随时间衰减重排（真实定时器 2 跳）", async () => {
    const { root, cleanup } = await mountCountdown(
      `<x-countdown :time="2600" format="{s}"></x-countdown>`,
      {},
    );
    cleanups.push(cleanup);
    const el = root.querySelector(".asc-countdown-value")!;
    expect(el.textContent).toBe("03"); // ceil(2.6s)
    await sleep(1000);
    expect(Number(el.textContent)).toBeGreaterThan(0); // 走秒中（1-2 之间）
    await sleep(1700);
    expect(el.textContent).toBe("00"); // 归零
  });

  test("finish：归零一次性派发（detail 空）+ 归零渲染全零", async () => {
    const { root, engine, cleanup } = await mountCountdown(
      `<x-countdown :time="200" format="{h}:{m}:{s}"></x-countdown>`,
      {},
    );
    cleanups.push(cleanup);
    let fired = 0;
    root.addEventListener("finish", () => fired++);
    await sleep(400);
    expect(fired).toBe(1);
    expect(root.querySelector(".asc-countdown-value")!.textContent).toBe("00:00:00");
    await sleep(1200); // 二次到期窗口（防重发标志）
    expect(fired).toBe(1);
  });

  test("time=0 即刻归零 + finish（合法边界非错误；经状态驱动触发——挂载即 0 的派发早于监听注册）", async () => {
    const { root, engine, cleanup } = await mountCountdown(
      `<x-countdown :time="remain"></x-countdown>`,
      { remain: 100 },
    );
    cleanups.push(cleanup);
    let fired = 0;
    root.addEventListener("finish", () => fired++);
    engine.store.state.remain = 0; // watch time → start → ms=0 即刻归零
    await sleep(20);
    expect(fired).toBe(1);
    expect(root.querySelector(".asc-countdown-value")!.textContent).toBe("00:00:00");
  });

  test("time 变化重启新一轮：deadline 重算（watch 驱动）", async () => {
    const { root, engine, cleanup } = await mountCountdown(
      `<x-countdown :time="remain"></x-countdown>`,
      { remain: 100 },
    );
    cleanups.push(cleanup);
    await sleep(300); // 首轮归零
    expect(root.querySelector(".asc-countdown-value")!.textContent).toBe("00:00:00");
    engine.store.state.remain = 65000; // 重启新一轮（秒杀补货/验证码重发场景）
    await nextTick();
    expect(root.querySelector(".asc-countdown-value")!.textContent).toBe("00:01:05");
  });

  test("finish 后到期窗口无重发（finished 标志幂等——tick 与补触发双通道只发一次）", async () => {
    const { root, cleanup } = await mountCountdown(
      `<x-countdown :time="100" format="{s}"></x-countdown>`,
      {},
    );
    cleanups.push(cleanup);
    let fired = 0;
    root.addEventListener("finish", () => fired++);
    await sleep(250);
    expect(fired).toBe(1);
    await sleep(1200); // 防重发标志：远超到期窗口仍只发一次
    expect(fired).toBe(1);
  });
});

describe("unmounted 清理与样式", () => {
  test("多实例同页隔离：三实例各自 deadline 独立衰减（this expando 共享缺陷回归）", async () => {
    const { root, engine, cleanup } = await mountCountdown(
      `<div>
               <x-countdown :time="a" format="{s}"></x-countdown>
               <x-countdown :time="b" format="{s}"></x-countdown>
               <x-countdown :time="c" format="{s}"></x-countdown>
             </div>`,
      { a: 90000, b: 5000, c: 60000 },
    );
    cleanups.push(cleanup);
    const values = root.querySelectorAll(".asc-countdown-value");
    // {s} 位段语义：90s=01:30 → "30"、5s → "05"、60s=01:00 → "00"——三值各异即隔离成立
    expect(values[0].textContent).toBe("30");
    expect(values[1].textContent).toBe("05");
    expect(values[2].textContent).toBe("00");
    // 走 1.2s 后各值仍按自身 deadline 衰减（→29/04/59）——
    // 修复前三实例 deadline 串台（全部跟随最后挂载实例同值衰减）
    await sleep(1200);
    expect(values[0].textContent).toBe("29");
    expect(values[1].textContent).toBe("04");
    expect(values[2].textContent).toBe("59");
  });

  test("destroy 后定时器摘除：finish 不再派发（监听卫生）", async () => {
    const { root, engine, cleanup } = await mountCountdown(
      `<x-countdown :time="150"></x-countdown>`,
      {},
    );
    let fired = 0;
    root.addEventListener("finish", () => fired++);
    engine.destroy(); // 倒计时中途销毁
    cleanup();
    await sleep(400); // 原归零窗口
    expect(fired).toBe(0); // 定时器已清——不补派
  });

  test("样式规则（模板断言）：statistic 数值排版语言 + 三级回退链 + 暗色兜底", () => {
    const t = tpl();
    // tabular-nums 等宽数字（走秒不跳宽）+ 1.5em 大字重（statistic 排版语言复用）
    expect(t).toContain("font-variant-numeric: tabular-nums;");
    expect(t).toContain("font-size: 1.5em;");
    expect(t).toContain("font-weight: var(--x-font-weight-large, 600);");
    // 三级回退链（--auto-* 语义层为主入口）
    expect(t).toContain("color: var(--auto-color, var(--asc-countdown-value-color, #303030));");
    expect(t).toContain(
      "font-size: var(--auto-font-size, var(--asc-countdown-font-size, 0.875rem));",
    );
    // 暗色兜底变体在场（ADR-0129）
    expect(t).toContain("[dark] .asc-countdown-value,");
    expect(t).toContain("[data-dark] .asc-countdown-value {");
    // 绝对 deadline 真值 + ceil 取整语义在场（计时引擎声明锚点）
    expect(t).toContain("Math.ceil(remain / 1000)");
  });
});
