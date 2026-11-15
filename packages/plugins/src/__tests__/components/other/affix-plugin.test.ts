/**
 * affix 组件插件测试（组件库 P4 other 长尾件，ADR-0018 清单权威表 other 行 /
 * ADR-0030 affix 与 watermark 轻件对 ADR）：
 * - 组件形态官方样板：全局表注册 + 化身渲染 + 主题档位继承（autospark.base）；
 * - 固钉切换：统一单线触发（scrollY >= offset）+ 脱流边沿几何快照（宿主 height
 *   占位撑高 / left·width CSS 变量下发）+ data-fixed 落标 + change 冒泡
 *   detail={fixed} + 同值短路；
 * - position 形态绑定落 body（T4=B）；
 * - resize 重校（fixed 态 left/width 漂移回写）；
 * - unmounted 清理：destroy 后 scroll 监听摘除（grid 的 matchMedia 先例）；
 * - precompile 元素名变换：<x-affix> → div 宿主 + props 折叠 + 裸属性布尔糖。
 *
 * happy-dom 无真实滚动：scrollY 经 window 补丁注入确定性值（Object.defineProperty），
 * 宿主原位几何经元素级 getBoundingClientRect 补丁注入，scroll/resize 经 window
 * 手动派发——真浏览器滚动链路见 docs demo（e2e 验证面）。
 */
import "../../setup";
import { afterEach, describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { AFFIX_NAME, bootstrapAffixPlugin } from "../../../components/other/affix/index";

/** 组件模板字符串（空白归一化后断言——oxfmt 折行使逐字匹配假红） */
const tpl = () =>
  ((AutoSpark as { components: Record<string, string> }).components[AFFIX_NAME] as string).replace(
    /\s+/g,
    " ",
  );

/** 挂载 + 落 document 树（computed/几何面可达）；返回清理器 */
const mountAffix = async (html: string, state: any) => {
  const { root, engine } = mount(html, state);
  document.body.appendChild(root);
  await nextTick();
  return {
    root,
    engine,
    cleanup: () => {
      engine.destroy();
      root.remove();
    },
  };
};

/** window.scrollY 补丁（确定性滚动位置注入——happy-dom 无真实滚动） */
const patchScrollY = (v: number) => {
  Object.defineProperty(window, "scrollY", { value: v, configurable: true });
};

/** 元素级 getBoundingClientRect 补丁（宿主原位几何确定性注入） */
const patchRect = (el: Element, { left = 40, width = 320, height = 64 }) => {
  (el as any).getBoundingClientRect = () =>
    ({
      top: 100,
      bottom: 100 + height,
      height,
      width,
      left,
      right: left + width,
      x: left,
      y: 100,
    }) as DOMRect;
};

const fireScroll = () => window.dispatchEvent(new Event("scroll"));
const fireResize = () => window.dispatchEvent(new Event("resize"));

/** 本文件所有挂载的统一回收（scroll 监听卫生：防用例间串扰） */
const cleanups: Array<() => void> = [];
afterEach(() => {
  while (cleanups.length) cleanups.pop()!();
  Object.defineProperty(window, "scrollY", { value: 0, configurable: true, writable: true });
});

describe("注册面（组件形态官方样板）", () => {
  test("模块加载即注册：插件全局组件表含 autospark.affix 模板字符串 + 主题档位继承", () => {
    const template = (AutoSpark as { components: Record<string, string> }).components[AFFIX_NAME];
    expect(typeof template).toBe("string");
    expect(template).toContain(`x-define="${AFFIX_NAME}"`);
    expect(template).toContain('x-define:inherit="autospark.base"'); // 主题档位继承（ADR-0134）
  });

  test("bootstrap 幂等：重复调用不覆盖（同键赋值幂等）", () => {
    const before = (AutoSpark as { components: Record<string, string> }).components[AFFIX_NAME];
    bootstrapAffixPlugin();
    expect((AutoSpark as { components: Record<string, string> }).components[AFFIX_NAME]).toBe(
      before,
    );
  });
});

describe("固钉切换（单线触发 + 边沿几何快照）", () => {
  test("越线吸附：data-fixed 落标 + 宿主占位撑高 + left/width 变量下发 + change detail={fixed:true}", async () => {
    const changes: any[] = [];
    patchScrollY(0);
    const { root, cleanup } = await mountAffix(
      `<div @change="changes.push($event.detail.fixed)">
                <div x-component:autospark.affix="{ offset: 120 }"><span>吸顶条</span></div>
            </div>`,
      { changes },
    );
    cleanups.push(cleanup);
    const host = root.querySelector(".asc-affix")!;
    patchRect(host, { left: 40, width: 320, height: 64 });
    expect(host.hasAttribute("data-fixed")).toBe(false); // 未达线（scrollY 0 < 120）

    patchScrollY(150); // 越线（150 >= 120）
    fireScroll();
    await nextTick();
    expect(host.hasAttribute("data-fixed")).toBe(true);
    expect(host.style.height).toBe("64px"); // 占位撑高（内容脱流防跳动）
    expect(host.style.getPropertyValue("--asc-affix-left")).toBe("40px"); // CSS 变量下发
    expect(host.style.getPropertyValue("--asc-affix-width")).toBe("320px");
    expect(host.style.getPropertyValue("--asc-affix-off")).toBe("120px"); // 吸附偏移 = 触发线值
    expect(changes).toEqual([true]);

    patchScrollY(50); // 回落脱钉
    fireScroll();
    await nextTick();
    expect(host.hasAttribute("data-fixed")).toBe(false);
    expect(host.style.height).toBe(""); // 占位撤除
    expect(host.style.getPropertyValue("--asc-affix-left")).toBe("");
    expect(changes).toEqual([true, false]);
  });

  test("缺省 offset=0：mount 首跳即吸附（scrollY 0 >= 0）+ 插槽内容透出", async () => {
    const changes: any[] = [];
    patchScrollY(0);
    const { root, cleanup } = await mountAffix(
      `<div @change="changes.push($event.detail.fixed)">
                <div x-component:autospark.affix="{}"><span>顶部固定</span></div>
            </div>`,
      { changes },
    );
    cleanups.push(cleanup);
    const host = root.querySelector(".asc-affix")!;
    patchRect(host, { left: 8, width: 200, height: 32 });
    expect(host.hasAttribute("data-fixed")).toBe(true); // 初始一跳（mounted setTimeout）
    expect(changes).toEqual([true]);
    expect(host.querySelector(".asc-affix-inner span")!.textContent).toBe("顶部固定"); // 默认插槽出口
  });

  test("同值短路：连续 scroll 无状态翻转不重复派发 change", async () => {
    const changes: any[] = [];
    patchScrollY(0);
    const { root, cleanup } = await mountAffix(
      `<div @change="changes.push($event.detail.fixed)">
                <div x-component:autospark.affix="{ offset: 100 }"></div>
            </div>`,
      { changes },
    );
    cleanups.push(cleanup);
    patchRect(root.querySelector(".asc-affix")!, {});
    patchScrollY(300);
    fireScroll();
    fireScroll();
    fireScroll();
    await nextTick();
    expect(changes).toEqual([true]); // 翻转一次，后续同值短路
  });

  test("offset 运行时变化：触发线与吸附偏移同步迁移（watch 通道）", async () => {
    const changes: any[] = [];
    patchScrollY(150);
    const { root, engine, cleanup } = await mountAffix(
      `<div @change="changes.push($event.detail.fixed)">
                <div x-component:autospark.affix="{ offset: off }"></div>
            </div>`,
      { changes, off: 100 },
    );
    cleanups.push(cleanup);
    const host = root.querySelector(".asc-affix")!;
    patchRect(host, {});
    expect(host.hasAttribute("data-fixed")).toBe(true); // 150 >= 100
    engine.store.state.off = 400; // 触发线上移（150 < 400 → 脱钉）
    await nextTick();
    expect(host.hasAttribute("data-fixed")).toBe(false);
    expect(host.style.getPropertyValue("--asc-affix-off")).toBe("400px"); // 吸附偏移跟随
    expect(changes).toEqual([true, false]);
  });
});

describe("position 形态与模板样式", () => {
  test("position 绑定落 body（T4=B：根上动态绑定不求值）：缺省 top / bottom 落 data-position", async () => {
    patchScrollY(0);
    const a = await mountAffix(`<div x-component:autospark.affix="{}"></div>`, {});
    cleanups.push(a.cleanup);
    expect(a.root.querySelector(".asc-affix-body")!.getAttribute("data-position")).toBe("top");

    const b = await mountAffix(
      `<div x-component:autospark.affix="{ position: 'bottom' }"></div>`,
      {},
    );
    cleanups.push(b.cleanup);
    expect(b.root.querySelector(".asc-affix-body")!.getAttribute("data-position")).toBe("bottom");
  });

  test("样式规则（模板断言）：固钉 fixed 块 + 吸附边分支 + 层级覆盖通道", () => {
    const t = tpl();
    // 固钉态：内容层 fixed + 几何/层级经宿主 CSS 变量下发
    expect(t).toContain(".asc-affix[data-fixed] > .asc-affix-body {");
    expect(t).toContain("position: fixed;");
    expect(t).toContain("z-index: var(--asc-affix-z, 100);");
    // 吸附边分支：top/bottom 经 data-position 纯 CSS 分派、偏移走 --asc-affix-off
    expect(t).toContain('.asc-affix-body[data-position="top"] {');
    expect(t).toContain('.asc-affix-body[data-position="bottom"] {');
    expect(t).toContain("top: var(--asc-affix-off, 0px);");
    expect(t).toContain("bottom: var(--asc-affix-off, 0px);");
  });
});

describe("resize 重校", () => {
  test("fixed 态 resize：left/width 重快照回写（视口漂移校正）", async () => {
    patchScrollY(500);
    const { root, cleanup } = await mountAffix(
      `<div x-component:autospark.affix="{ offset: 100 }"></div>`,
      {},
    );
    cleanups.push(cleanup);
    const host = root.querySelector(".asc-affix")!;
    expect(host.hasAttribute("data-fixed")).toBe(true); // 初始一跳即吸附（500 >= 100，快照默认几何）
    expect(host.style.getPropertyValue("--asc-affix-left")).toBe("0px");

    patchRect(host, { left: 90, width: 260, height: 64 }); // 视口/布局变化（fixed 态重读占位盒）
    fireResize();
    await nextTick();
    expect(host.style.getPropertyValue("--asc-affix-left")).toBe("90px");
    expect(host.style.getPropertyValue("--asc-affix-width")).toBe("260px");
  });
});

describe("unmounted 清理（grid 的 matchMedia 先例）", () => {
  test("destroy 后 scroll 监听摘除：越线滚动不再吸附（无泄漏）", async () => {
    const changes: any[] = [];
    patchScrollY(0);
    const { root, engine } = await mountAffix(
      `<div @change="changes.push($event.detail.fixed)">
                <div x-component:autospark.affix="{ offset: 100 }"></div>
            </div>`,
      { changes },
    );
    const host = root.querySelector(".asc-affix")!;
    patchRect(host, {});
    engine.destroy();
    root.remove();
    await nextTick(); // destroy 的组件 unmounted 在微任务收尾（监听摘除须等一跳再验证）
    patchScrollY(300);
    fireScroll();
    await nextTick();
    expect(changes).toEqual([]); // destroy 后监听已摘，无翻转无派发
    expect(host.hasAttribute("data-fixed")).toBe(false);
  });
});

describe("元素名快速写法（precompile 变换）", () => {
  test("<x-affix> 替换为 div 宿主 + 静态属性折叠 props（autostart:false 断言变换产物）", () => {
    const { root } = mount(
      `<div><x-affix offset="80" position="bottom"><span>吸底条</span></x-affix></div>`,
      {},
      { autostart: false },
    );
    const host = root.children[0]!.children[0]!;
    expect(host.tagName).toBe("DIV");
    const attrOf = (el: Element, name: string): string | undefined =>
      [...el.attributes].find((a) => a.name === name)?.value;
    const props = attrOf(host, "x-component:autospark.affix")!;
    expect(props).toContain("offset: 80"); // 数字类型推断
    expect(props).toContain('position: "bottom"'); // 字符串原样
    expect(host.querySelector("span")!.textContent).toBe("吸底条"); // 子内容随迁（默认插槽）
  });

  test(":offset 响应式项以原始表达式拼进值对象 + 裸属性布尔糖归一 true", () => {
    const { root } = mount(
      `<div><x-affix :offset="line"><span>内容</span></x-affix></div>`,
      { line: 100 },
      { autostart: false },
    );
    const host = root.children[0]!.children[0]!;
    const props = [...host.attributes].find((a) => a.name === "x-component:autospark.affix")!.value;
    expect(props).toContain("offset: (line)"); // 表达式原样（引用注入）

    const bare = mount(`<div><x-affix some-flag></x-affix></div>`, {}, { autostart: false });
    const bareHost = bare.root.children[0]!.children[0]!;
    const bareProps = [...bareHost.attributes].find(
      (a) => a.name === "x-component:autospark.affix",
    )!.value;
    expect(bareProps).toContain("someFlag: true"); // 裸属性 HTML 语义归一（kebab → camel）
    expect(bareHost.hasAttribute("some-flag")).toBe(false); // 裸属性不残留宿主
  });
});
