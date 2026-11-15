/**
 * watermark 组件插件测试（组件库 P4 other 长尾件，ADR-0018 清单权威表 other 行 /
 * ADR-0030 affix 与 watermark 轻件对 ADR）：
 * - 组件形态官方样板：全局表注册 + 化身渲染 + 主题档位继承（autospark.base）；
 * - 容器形态：水印层存在 + 插槽内容透出 + 层归位组件树（absolute 覆盖）；
 * - fullPage 形态：层挂 body + fixed 定位 + unmounted body 残留收除；
 * - canvas 绘制管线：mock 上下文（happy-dom 原生 getContext 返回 null——实测）注入
 *   确定性 measureText/toDataURL，断言平铺背景写入与单元尺寸公式（旋转外接矩形）；
 * - props 透传：color/opacity/zIndex 内联；签名幂等（同值不重绘）；
 * - 多行 content：数组状态引用 / data-content JSON 标量通道；
 * - precompile 元素名变换：<x-watermark> → div 宿主 + props 折叠 + 数组面
 *   （content/gap 的 JSON 字符串）标量分流 data-* 通道 + 裸属性布尔糖。
 *
 * canvas mock 补丁挂 HTMLCanvasElement.prototype（全局）——afterEach 严格复原
 * （globalThis 动过必复原纪律）；真浏览器平铺目检见 docs demo（e2e 验证面）。
 */
import "../../setup";
import { afterEach, describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import {
  WATERMARK_NAME,
  bootstrapWatermarkPlugin,
} from "../../../components/other/watermark/index";

/** 组件模板字符串（空白归一化后断言——oxfmt 折行使逐字匹配假红） */
const tpl = () =>
  (
    (AutoSpark as { components: Record<string, string> }).components[WATERMARK_NAME] as string
  ).replace(/\s+/g, " ");

/** 挂载 + 落 document 树（computed 色值面可达）；返回清理器 */
const mountWatermark = async (html: string, state: any) => {
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

/** canvas 2D 上下文 mock：measureText 按字符数定宽（每字符 15px——确定性）、
 *  toDataURL 返回计数化伪 dataURL（重绘次数断言面）、绘制原语记录调用序 */
const patchCanvas = () => {
  const urls: string[] = [];
  const fills: string[] = [];
  const origGetContext = HTMLCanvasElement.prototype.getContext;
  const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.getContext = function () {
    return {
      font: "",
      textAlign: "",
      textBaseline: "",
      fillStyle: "",
      measureText: (t: string) => ({ width: [...String(t)].length * 15 }),
      fillText: (t: string) => {
        fills.push(String(t));
      },
      translate: () => {},
      rotate: () => {},
    } as any;
  };
  HTMLCanvasElement.prototype.toDataURL = function () {
    const u = `data:image/png;base64,FAKE${urls.length}`;
    urls.push(u);
    return u;
  };
  return {
    urls,
    fills,
    restore: () => {
      HTMLCanvasElement.prototype.getContext = origGetContext;
      HTMLCanvasElement.prototype.toDataURL = origToDataURL;
    },
  };
};

/** 单元尺寸公式（实现同款）：textW × lines 行文本块旋转 rad 度的外接矩形 + 8px 余量 */
const expectedTile = (
  textW: number,
  lines: number,
  fs: number,
  rotDeg: number,
): [number, number] => {
  const lineH = Math.ceil(fs * 1.3);
  const textH = lineH * lines;
  const rad = (rotDeg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  return [Math.ceil(textW * cos + textH * sin) + 8, Math.ceil(textW * sin + textH * cos) + 8];
};

/** 本文件所有挂载/补丁的统一回收（body 残留层 + prototype 复原卫生） */
const cleanups: Array<() => void> = [];
afterEach(() => {
  while (cleanups.length) cleanups.pop()!();
  document.querySelectorAll("body > .asc-watermark-layer").forEach((e) => e.remove()); // body 残留兜底
});

describe("注册面（组件形态官方样板）", () => {
  test("模块加载即注册：插件全局组件表含 autospark.watermark 模板字符串 + 主题档位继承", () => {
    const template = (AutoSpark as { components: Record<string, string> }).components[
      WATERMARK_NAME
    ];
    expect(typeof template).toBe("string");
    expect(template).toContain(`x-define="${WATERMARK_NAME}"`);
    expect(template).toContain('x-define:inherit="autospark.base"'); // 主题档位继承（ADR-0134）
  });

  test("bootstrap 幂等：重复调用不覆盖（同键赋值幂等）", () => {
    const before = (AutoSpark as { components: Record<string, string> }).components[WATERMARK_NAME];
    bootstrapWatermarkPlugin();
    expect((AutoSpark as { components: Record<string, string> }).components[WATERMARK_NAME]).toBe(
      before,
    );
  });
});

describe("容器形态（缺省）", () => {
  test("水印层存在 + 插槽内容透出 + 层归位组件树内", async () => {
    const canvas = patchCanvas();
    const { root, cleanup } = await mountWatermark(
      `<div x-component:autospark.watermark="{ content: '机密文档' }">
                <div class="inner-doc">被保护内容</div>
            </div>`,
      {},
    );
    cleanups.push(() => {
      cleanup();
      canvas.restore();
    });
    const layer = root.querySelector(".asc-watermark-layer")!;
    expect(layer).toBeTruthy(); // 水印层在场
    expect(layer.parentElement!.classList.contains("asc-watermark")).toBe(true); // 归位组件树（absolute 覆盖）
    expect(root.querySelector(".asc-watermark-content .inner-doc")).toBeTruthy(); // 默认插槽出口透出
    expect(layer.style.position).toBe(""); // 缺省容器形态：CSS 缺省 absolute（无内联覆写）
  });

  test("无 canvas 2D 上下文环境静默降级：不炸、层无平铺背景（happy-dom 原生即 null）", async () => {
    const { root, cleanup } = await mountWatermark(
      `<div x-component:autospark.watermark="{ content: '降级文案' }"></div>`,
      {},
    );
    cleanups.push(cleanup);
    const layer = root.querySelector(".asc-watermark-layer")!;
    expect(layer).toBeTruthy(); // 不炸（ctx null 防御分支）
    expect(layer.style.backgroundImage).toBe(""); // 降级：无平铺背景
  });
});

describe("canvas 绘制管线（mock 上下文注入）", () => {
  test("单行平铺：backgroundImage dataURL + 单元尺寸 = 旋转外接矩形 + gap（缺省 [100,100]）", async () => {
    const canvas = patchCanvas();
    const { root, cleanup } = await mountWatermark(
      `<div x-component:autospark.watermark="{ content: 'AutoSpark' }"></div>`,
      {},
    );
    cleanups.push(() => {
      cleanup();
      canvas.restore();
    });
    const layer = root.querySelector(".asc-watermark-layer")!;
    expect(layer.style.backgroundImage).toContain("data:image/png;base64,FAKE0"); // 首绘一次（CSSOM 序列化引号形态不锁死）
    expect(layer.style.backgroundRepeat).toBe("repeat");
    // 文案 9 字符（"AutoSpark"）× 15px = 135 宽；fontSize 缺省 16；rotate 缺省 -22°
    const [w, h] = expectedTile(135, 1, 16, -22);
    expect(layer.style.backgroundSize).toBe(`${w + 100}px ${h + 100}px`); // gap 缺省 [100, 100]
    expect(canvas.fills).toEqual(["AutoSpark"]); // 单行一次 fillText
  });

  test("多行 content（数组状态引用）：逐行 fillText + 行高参与单元尺寸", async () => {
    const canvas = patchCanvas();
    const { root, cleanup } = await mountWatermark(
      `<div x-component:autospark.watermark="{ content: lines }"></div>`,
      { lines: ["第一行水印", "第二行水印"] },
    );
    cleanups.push(() => {
      cleanup();
      canvas.restore();
    });
    const layer = root.querySelector(".asc-watermark-layer")!;
    // 行宽 5 字符 × 15px = 75；两行
    const [w, h] = expectedTile(75, 2, 16, -22);
    expect(layer.style.backgroundSize).toBe(`${w + 100}px ${h + 100}px`);
    expect(canvas.fills).toEqual(["第一行水印", "第二行水印"]); // 逐行绘制
  });

  test("gap 数字等两轴 + rotate/fontSize/opacity/zIndex 透传", async () => {
    const canvas = patchCanvas();
    const { root, cleanup } = await mountWatermark(
      `<div x-component:autospark.watermark="{ content: 'AB', gap: 40, rotate: -45, fontSize: 20, opacity: 0.5, zIndex: 99 }"></div>`,
      {},
    );
    cleanups.push(() => {
      cleanup();
      canvas.restore();
    });
    const layer = root.querySelector(".asc-watermark-layer")!;
    const [w, h] = expectedTile(30, 1, 20, -45); // 2 字符 × 15px
    expect(layer.style.backgroundSize).toBe(`${w + 40}px ${h + 40}px`); // gap 40 等两轴
    expect(layer.style.opacity).toBe("0.5");
    expect(layer.style.zIndex).toBe("99");
  });

  test("签名幂等：同值 watch 触发不重绘（toDataURL 调用计数不增）", async () => {
    const canvas = patchCanvas();
    const { root, engine, cleanup } = await mountWatermark(
      `<div x-component:autospark.watermark="{ content: wm }"></div>`,
      { wm: "初始文案" },
    );
    cleanups.push(() => {
      cleanup();
      canvas.restore();
    });
    expect(canvas.urls.length).toBe(1); // 首绘一次
    engine.store.state.wm = "新文案"; // 值变化 → 重绘
    await nextTick();
    expect(canvas.urls.length).toBe(2);
    engine.store.state.wm = "新文案"; // 同值再写 → 签名短路
    await nextTick();
    expect(canvas.urls.length).toBe(2); // 不重绘
  });
});

describe("fullPage 形态", () => {
  test("层挂 body + fixed 定位 + 宿主不占布局（data-full-page）+ unmounted 收除", async () => {
    const canvas = patchCanvas();
    const { root, engine, cleanup } = await mountWatermark(
      `<div x-component:autospark.watermark="{ content: '全页水印', fullPage: true }"></div>`,
      {},
    );
    cleanups.push(() => {
      canvas.restore();
    }); // cleanup 由本用例手动接管（destroy 时机即断言面）
    const host = root.querySelector(".asc-watermark")!;
    const body = root.querySelector(".asc-watermark-body")!;
    // fullPage 形态层已挪挂 body（root 子树外）——从 body 直取
    const layer = (root.querySelector(".asc-watermark-layer") ??
      document.body.querySelector(":scope > .asc-watermark-layer")) as HTMLElement;
    expect(body.hasAttribute("data-full-page")).toBe(true); // T4=B：形态绑定落 body 层
    expect(layer.parentElement).toBe(document.body); // 层挪挂 body
    expect(layer.style.position).toBe("fixed"); // 全页 fixed 铺满
    expect(getComputedStyle(host).display).toBe("contents"); // 宿主不占布局（happy-dom 支持 display:contents 计算）

    engine.destroy(); // 卸载：body 残留层收除
    root.remove();
    expect(document.body.querySelector(".asc-watermark-layer")).toBe(null);
  });

  test("运行时切换 fullPage：层在 body 与组件树间迁移", async () => {
    const canvas = patchCanvas();
    const { root, engine, cleanup } = await mountWatermark(
      `<div x-component:autospark.watermark="{ content: '迁移', fullPage: fp }"></div>`,
      { fp: false },
    );
    cleanups.push(() => {
      cleanup();
      canvas.restore();
    });
    const host = root.querySelector(".asc-watermark")!;
    const layer = root.querySelector(".asc-watermark-layer") as HTMLElement;
    expect(layer.parentElement).toBe(host); // 容器形态归位组件树

    engine.store.state.fp = true; // 切全页
    await nextTick();
    expect(layer.parentElement).toBe(document.body);
    expect(layer.style.position).toBe("fixed");

    engine.store.state.fp = false; // 切回容器
    await nextTick();
    expect(layer.parentElement).toBe(host);
    expect(layer.style.position).toBe(""); // position 内联撤除（CSS 声明的 absolute 接管）
  });
});

describe("元素名快速写法（precompile 变换）", () => {
  test("<x-watermark> 替换为 div 宿主 + 静态属性折叠 props（autostart:false 断言变换产物）", () => {
    const { root } = mount(
      `<div><x-watermark content="静态文案" z-index="20"><span>内容</span></x-watermark></div>`,
      {},
      { autostart: false },
    );
    const host = root.children[0]!.children[0]!;
    expect(host.tagName).toBe("DIV");
    const props = [...host.attributes].find(
      (a) => a.name === "x-component:autospark.watermark",
    )!.value;
    expect(props).toContain('content: "静态文案"'); // 字符串标量直接折叠
    expect(props).toContain("zIndex: 20"); // kebab → camel + 数字类型推断
    expect(host.querySelector("span")!.textContent).toBe("内容"); // 子内容随迁（默认插槽）
  });

  test("数组面标量分流：content/gap 的 JSON 字符串走 data-* 通道（不进 props 值对象）", () => {
    const { root } = mount(
      `<div><x-watermark content='["行一","行二"]' gap="[100, 60]"></x-watermark></div>`,
      {},
      { autostart: false },
    );
    const host = root.children[0]!.children[0]!;
    const props = [...host.attributes].find(
      (a) => a.name === "x-component:autospark.watermark",
    )!.value;
    expect(props).not.toContain("content"); // 数组面不折进 props（死环规避）
    expect(props).not.toContain("gap");
    expect(host.getAttribute("data-content")).toBe('["行一","行二"]'); // 标量通道落盘
    expect(host.getAttribute("data-gap")).toBe("[100, 60]");
  });

  test("分流通道渲染还原：mounted 解析 data-content/data-gap 写 data 响应重绘", async () => {
    const canvas = patchCanvas();
    const { root, cleanup } = await mountWatermark(
      `<div><x-watermark content='["声明行一","声明行二"]' gap="30"></x-watermark></div>`,
      {},
    );
    cleanups.push(() => {
      cleanup();
      canvas.restore();
    });
    const host = root.querySelector(".asc-watermark")!;
    expect(host.hasAttribute("data-content")).toBe(false); // 声明属性消费后摘除
    expect(host.hasAttribute("data-gap")).toBe(false);
    const layer = root.querySelector(".asc-watermark-layer")!;
    const [w, h] = expectedTile(60, 2, 16, -22); // 行宽 4 字符 × 15px（"声明行一"）、两行
    expect(layer.style.backgroundSize).toBe(`${w + 30}px ${h + 30}px`); // gap 30 等两轴
    expect(canvas.fills).toEqual(["声明行一", "声明行二"]);
  });

  test("裸属性布尔糖：<x-watermark full-page> 折叠为 fullPage: true", () => {
    const { root } = mount(
      `<div><x-watermark full-page></x-watermark></div>`,
      {},
      { autostart: false },
    );
    const host = root.children[0]!.children[0]!;
    const props = [...host.attributes].find(
      (a) => a.name === "x-component:autospark.watermark",
    )!.value;
    expect(props).toContain("fullPage: true"); // kebab → camel + HTML 裸属性语义
    expect(host.hasAttribute("full-page")).toBe(false); // 裸属性不残留宿主
  });
});

describe("模板样式（三级回退 + 暗色兜底）", () => {
  test("取色源走 --auto-secondary-color 三级回退链 + pointer-events 不拦交互 + 暗色兜底在场", () => {
    const t = tpl();
    expect(t).toContain(
      "color: var(--auto-secondary-color, var(--asc-watermark-color, rgba(0, 0, 0, 0.15)));",
    );
    expect(t).toContain("font-family: var(--auto-font-family,"); // 字体族主题对齐
    expect(t).toContain("pointer-events: none;"); // 水印恒不拦交互（内容保护 v1 不做）
    expect(t).toContain("[dark] .asc-watermark-layer,");
    expect(t).toContain("[data-dark] .asc-watermark-layer {"); // 暗色兜底变体（ADR-0129）
    expect(t).toContain(".asc-watermark:has(> .asc-watermark-body[data-full-page]) {"); // fullPage :has() 驱动
  });
});
