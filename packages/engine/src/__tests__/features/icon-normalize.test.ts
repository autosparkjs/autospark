import { describe, expect, test, beforeEach } from "bun:test";
import "../setup";
import { iconRegistry } from "../../features/icons/registry";
import { normalizeSvgSpec, normalizeIconSvg } from "../../features/icons/symbol";
import { specFromResolved } from "../../features/icons/iconify";
import { SVG_BEGIN, SVG_END, icon_svgdatas } from "../../icons";

/**
 * 图标归一化核心测试（ADR-0130）：类型判定 / 四件套补齐（只补缺失）/ 颜色规约（唯一色值
 * 才换）/ 网格计算 / data-raw 逃逸 / 幂等 / 内置反例回归。经 normalizeSvgSpec（本地串
 * 管道）与 specFromResolved（远程管道）两条真实入口验证。
 */

/** 快捷构造：viewBox + 根属性 + 内容 */
const svgOf = (rootAttrs: string, inner: string, viewBox = "0 0 24 24") =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" ${rootAttrs}>${inner}</svg>`;

/** 归一化 attrs 快照（规格断言用；值为字符串的普通对象，非重型对象） */
const attrsOf = (svg: string) => normalizeSvgSpec(svg)!.attrs;

beforeEach(() => {
    for (const name of [...iconRegistry]) iconRegistry.delete(name);
    iconRegistry.options = {};
});

describe("类型判定（ADR-0130 决策 2）", () => {
    test("根 stroke≠none → stroke 型：四件套只补缺失（linecap/linejoin）", () => {
        const attrs = attrsOf(svgOf('fill="none" stroke="currentColor"', "<path d=\"M1\"/>"));
        expect(attrs["stroke-linecap"]).toBe("round");
        expect(attrs["stroke-linejoin"]).toBe("round");
        expect(attrs.fill).toBe("none");
        expect(attrs.stroke).toBe("currentColor");
    });

    test("内容级 stroke（Figma 导出形态：根干净）→ stroke 型：补齐全部四件", () => {
        const attrs = attrsOf(svgOf("", '<path d="M1" stroke="currentColor" fill="none"/>'));
        expect(attrs.fill).toBe("none");
        expect(attrs.stroke).toBe("currentColor");
        expect(attrs["stroke-linecap"]).toBe("round");
        expect(attrs["stroke-linejoin"]).toBe("round");
    });

    test("根 fill=none 且内容无显式 fill → stroke 型（旧规则收紧后的保留面）", () => {
        const attrs = attrsOf(svgOf('fill="none"', "<path d=\"M1\"/>"));
        expect(attrs.stroke).toBe("currentColor");
        expect(attrs["stroke-linecap"]).toBe("round");
    });

    test("根 fill=none + 内容各自显式 fill（Q12 误伤修复）→ fill 型：不补 stroke/线帽", () => {
        const attrs = attrsOf(svgOf('fill="none"', '<path d="M1" fill="currentColor"/><path d="M2" fill="currentColor"/>'));
        expect(attrs.stroke).toBeUndefined();
        expect(attrs["stroke-linecap"]).toBeUndefined();
    });

    test("bare path（无任何 stroke/fill 声明）→ fill 型不动", () => {
        const attrs = attrsOf(svgOf("", "<path d=\"M1\"/>"));
        expect(attrs.stroke).toBeUndefined();
        expect(attrs["stroke-linecap"]).toBeUndefined();
    });

    test("根 stroke=\"none\" → 不构成 stroke 型", () => {
        const attrs = attrsOf(svgOf('stroke="none"', "<path d=\"M1\"/>"));
        expect(attrs["stroke-linecap"]).toBeUndefined();
    });
});

describe("四件套只补缺失、不覆盖显式（ADR-0130 决策 3）", () => {
    test("显式 stroke-linecap=\"butt\" 保持不动", () => {
        const attrs = attrsOf(svgOf('fill="none" stroke="currentColor" stroke-linecap="butt"', "<path d=\"M1\"/>"));
        expect(attrs["stroke-linecap"]).toBe("butt");
        expect(attrs["stroke-linejoin"]).toBe("round"); // 未声明的仍补
    });

    test("显式 fill（stroke 型）保持不动（url() 引用非色值，四件套与颜色规约均不碰）", () => {
        const attrs = attrsOf(svgOf('fill="url(#bg)" stroke="currentColor"', "<path d=\"M1\"/>"));
        expect(attrs.fill).toBe("url(#bg)");
    });
});

describe("颜色规约：唯一色值才换（ADR-0130 决策 4）", () => {
    test("根唯一色值 → currentColor", () => {
        const attrs = attrsOf(svgOf('fill="none" stroke="#333"', "<path d=\"M1\"/>"));
        expect(attrs.stroke).toBe("currentColor");
    });

    test("内容级多元素同色 → 全部替换", () => {
        const spec = normalizeSvgSpec(svgOf("", '<path d="M1" fill="#555"/><path d="M2" fill="#555"/>'))!;
        expect(spec.content).not.toContain("#555");
        expect(spec.content.match(/fill="currentColor"/g)!.length).toBe(2);
    });

    test("黑白也换（硬编码黑不跟随暗色主题）", () => {
        const attrs = attrsOf(svgOf("", '<path d="M1" fill="#000000"/>'));
        // fill 型只换色不补 stroke；断言内容已换
        const spec = normalizeSvgSpec(svgOf("", '<path d="M1" fill="#000000"/>'))!;
        expect(spec.content).toContain('fill="currentColor"');
        expect(attrs.stroke).toBeUndefined();
    });

    test("双色保留（作者有意多色）", () => {
        const spec = normalizeSvgSpec(svgOf('fill="none" stroke="#333"', '<path d="M1" fill="#555"/>'))!;
        expect(spec.attrs.stroke).toBe("#333");
        expect(spec.content).toContain('fill="#555"');
    });

    test("url() 引用保留", () => {
        const spec = normalizeSvgSpec(svgOf("", '<path d="M1" fill="url(#grad)"/>'))!;
        expect(spec.content).toContain("url(#grad)");
    });

    test("stroke 与 fill 同色同值 → 一并替换", () => {
        const spec = normalizeSvgSpec(svgOf('stroke="#0a0"', 'fill="#0a0"', "0 0 24 24"))!;
        expect(spec.attrs.stroke).toBe("currentColor");
    });

    test("仅 currentColor（无字面色值）→ 零变换", () => {
        const spec = normalizeSvgSpec(svgOf('fill="none" stroke="currentColor"', '<path d="M1" stroke="currentColor"/>'))!;
        expect(spec.content).toContain('stroke="currentColor"');
        expect(spec.attrs.stroke).toBe("currentColor");
    });
});

describe("网格计算（ADR-0130 决策 5）", () => {
    test("24 网格 → 24；16 网格 → 16；非方形取 max(宽,高)", () => {
        expect(normalizeSvgSpec(svgOf("", "<path d=\"M1\"/>", "0 0 24 24"))!.grid).toBe(24);
        expect(normalizeSvgSpec(svgOf("", "<path d=\"M1\"/>", "0 0 16 16"))!.grid).toBe(16);
        expect(normalizeSvgSpec(svgOf("", "<path d=\"M1\"/>", "0 0 20 24"))!.grid).toBe(24);
        expect(normalizeSvgSpec(svgOf("", "<path d=\"M1\"/>", "0 0 24 20"))!.grid).toBe(24);
    });

    test("viewBox 缺失 / 畸形 / 非正数 → null（不补偿）", () => {
        expect(normalizeSvgSpec(svgOf("", "<path d=\"M1\"/>", ""))!.grid).toBeNull();
        expect(normalizeSvgSpec('<svg><path d="M1"/></svg>')!.grid).toBeNull();
        expect(normalizeSvgSpec(svgOf("", "<path d=\"M1\"/>", "0 0 0 0"))!.grid).toBeNull();
    });

    test("fill 型同样计算（几何事实，与风格变换无耦合）", () => {
        expect(normalizeSvgSpec(svgOf("", '<path d="M1" fill="currentColor"/>', "0 0 16 16"))!.grid).toBe(16);
    });
});

describe("data-raw 逃逸阀（ADR-0130 决策 6）", () => {
    test("跳过四件套与颜色，不豁免 stroke-width 剥离，grid 记 null", () => {
        const raw = '<svg viewBox="0 0 16 16" data-raw fill="none" stroke="#333"><path stroke-width="2" d="M1"/></svg>';
        const spec = normalizeSvgSpec(raw)!;
        expect(spec.attrs.stroke).toBe("#333"); // 颜色不动
        expect(spec.attrs["stroke-linecap"]).toBeUndefined(); // 四件套不补
        expect(spec.grid).toBeNull(); // 补偿随逃逸阀失效
        expect(spec.content).not.toContain("stroke-width"); // 剥离照旧（渲染参数化地基）
        expect(spec.attrs["data-raw"]).toBeUndefined(); // 标志不落 symbol
    });

    test("data-raw=\"\" 序列化形态同效", () => {
        const spec = normalizeSvgSpec('<svg viewBox="0 0 24 24" data-raw="" fill="none"><path d="M1"/></svg>')!;
        expect(spec.attrs["stroke-linecap"]).toBeUndefined();
    });
});

describe("全局开关（ADR-0130 决策 7）", () => {
    test("options.normalize=false → 零变换、grid null、getSvg 保持原始串", () => {
        const raw = svgOf('fill="none" stroke="#333"', "<path d=\"M1\"/>", "0 0 16 16");
        iconRegistry.options = { normalize: false };
        iconRegistry.add("off", raw);
        expect(iconRegistry.getGrid("off")).toBeNull();
        expect(iconRegistry.getSvg("off")).toBe(raw); // 声明与产物分离
        const sym = document.getElementById("as-off")!;
        expect(sym.getAttribute("stroke")).toBe("#333");
        expect(sym.getAttribute("stroke-linecap")).toBeNull();
    });

    test("默认开启：add 经归一化 + grid 入库 + delete 同步清理", () => {
        iconRegistry.add("on", svgOf("", '<path d="M1" stroke="currentColor" fill="none"/>', "0 0 16 16"));
        expect(iconRegistry.getGrid("on")).toBe(16);
        const sym = document.getElementById("as-on")!;
        expect(sym.getAttribute("stroke-linecap")).toBe("round");
        iconRegistry.delete("on");
        expect(iconRegistry.getGrid("on")).toBeUndefined();
    });
});

describe("远程管道（specFromResolved，ADR-0130 修订 ADR-0058 决策 10）", () => {
    test("lucide 形态 body（逐元素携带 stroke 系属性）→ 内容级判定接住，补齐线帽", () => {
        const spec = specFromResolved({
            viewBox: "0 0 24 24",
            content: '<path d="M1" fill="none" stroke="currentColor" stroke-width="2"/>',
        });
        expect(spec.attrs["stroke-linecap"]).toBe("round");
        expect(spec.attrs["stroke-linejoin"]).toBe("round");
        expect(spec.grid).toBe(24);
    });

    test("bare path 的 fill 集（material 形态）→ 类型判定承载豁免，零接触", () => {
        const spec = specFromResolved({ viewBox: "0 0 24 24", content: '<path d="M1"/>' });
        expect(Object.keys(spec.attrs)).toEqual([]);
        expect(spec.grid).toBe(24);
    });

    test("normalize 关闭 → specFromResolved 零变换", () => {
        const spec = specFromResolved(
            { viewBox: "0 0 24 24", content: '<path d="M1" stroke="currentColor"/>' },
            { normalize: false },
        );
        expect(Object.keys(spec.attrs)).toEqual([]);
        expect(spec.grid).toBeNull();
    });
});

describe("公开工具 normalizeIconSvg（ADR-0130 决策 1）", () => {
    test("归一化串产物（构建期预处理同语义）", () => {
        const out = normalizeIconSvg(svgOf('fill="none" stroke="#333"', "<path d=\"M1\"/>", "0 0 16 16"));
        expect(out).toContain('stroke="currentColor"');
        expect(out).toContain('stroke-linecap="round"');
        expect(out).toContain('viewBox="0 0 16 16"');
    });

    test("data-raw 在产物中保留（预处理不吞逃逸声明）", () => {
        const out = normalizeIconSvg('<svg viewBox="0 0 24 24" data-raw fill="none"><path d="M1"/></svg>');
        expect(out).toContain("data-raw");
        expect(out).not.toContain("stroke-linecap");
    });

    test("无效输入返回 null", () => {
        expect(normalizeIconSvg("<div>not svg</div>")).toBeNull();
    });
});

describe("幂等（模板克隆重收集安全，ADR-0130 决策 7）", () => {
    test("归一化产物再过管道 === 原产物（attrs/content 双稳定）", () => {
        const raw = svgOf('fill="none" stroke="#333"', '<path d="M1" stroke-width="2" fill="none"/>', "0 0 16 16");
        const once = normalizeSvgSpec(raw)!;
        const twice = normalizeSvgSpec(normalizeIconSvg(raw)!)!;
        expect(twice.attrs).toEqual(once.attrs);
        expect(twice.content.replace(/\s+/g, " ")).toBe(once.content.replace(/\s+/g, " "));
        expect(twice.grid).toBe(once.grid);
    });
});

describe("内置图标反例回归（ADR-0130 后果面：内容级覆盖不可破坏）", () => {
    test("全部内置条目经注册管道：grid 恒 24，内容级 currentColor/opacity 覆盖原样保留", () => {
        for (const [name, fragment] of icon_svgdatas) {
            const spec = normalizeSvgSpec(`${SVG_BEGIN}${fragment}${SVG_END}`, { name })!;
            expect(spec.grid).toBe(24); // 内置规约：全 24 网格
            const content = spec.content.replace(/\s+/g, " ");
            switch (name) {
                case "more": // 圆点实心填充（fill=currentColor）不被动
                    expect(content).toContain('fill="currentColor"');
                    break;
                case "semi-checked": // 实心内矩形（fill=currentColor + stroke=none）
                    expect(content).toContain('stroke="none"');
                    break;
                case "loading2": // 底圈 0.2 透明度保留，双 stroke 均 currentColor
                    expect(content).toContain('stroke-opacity="0.2"');
                    expect(content).not.toMatch(/stroke="#/);
                    break;
                default:
                    break;
            }
        }
    });
});
