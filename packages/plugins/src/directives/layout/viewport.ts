/**
 * viewport 指令插件（`autospark.layout.js`，ADR-0128 外移 / plugins ADR-0008）。
 *
 * 迁移形态（类重载指令的插件化范式，批次 1 x-tree 确立）：**类工厂**——基类经运行时
 * 命名空间解析（`autospark.AutoSparkDirectiveBase`），类定义延迟到 installPlugin 的
 * register 回调内（预加载队列场景下模块加载期 AutoSpark 不可达）。语义零漂移，类体、
 * 静态特性与生命周期全量平移自 engine src/directives/x-viewport.ts。
 */
import type {
    AutoSpark,
    ViewportTier,
    AutoSparkDirectiveBase,
} from "autospark";
import { injectStylesheet } from "../../utils/injectStylesheet";
import { VIEWPORT_TIERS } from "../../utils/viewportTiers";
import { installPlugin } from "@autospark/utils";


/**
 * x-viewport：视口档位显隐（ADR-0106）。
 *
 * `$.viewport`（ADR-0105 全局视口特性）的声明式显隐糖：`x-viewport="md"` 仅 md 档可见、
 * `x-viewport="xs,sm"` 多档可见、`x-viewport.hide="md"` 除 md 外可见（`.hide` 反向）。
 *
 * **显隐机制**：隐藏 = 挂 `autospark-viewport-hidden` 类（全局样式
 * `display:none !important`），可见 = 摘类——**完全不碰 inline display**（Bootstrap
 * `d-none` 同法）。与 x-show 同元素组合时**档位隐藏恒胜**：x-show 的显隐 / 动画 /
 * 用户 CSS 只在档位可见时有话语权；与 x-if（存在性）正交。v1 无动画（要动画用
 * `x-show="['md'].includes($.viewport)"` 表达式形态）。
 *
 * **值语法**：逗号分隔档名 + 空白容忍；空值 warn + 指令整体忽略；未知档名**静默跳过**
 * （不 warn）；全部无效整体忽略；档名按 `VIEWPORT_TIERS` 固定枚举校验（自定义
 * breakpoints 只改阈值不改枚举）。无 `x-viewport-options` 配置项。
 *
 * **失效语义**：`$.viewport` 为 undefined 或非法值（`options.viewport: false` /
 * 无 matchMedia / 用户违约写入）时静默短路——不做任何动作（正向/反向均恒可见，零告警）。
 */

/** 全局样式表 id（幂等；多 engine 共享、dispose 不移除——对齐 x-container 惯例） */
const VIEWPORT_STYLE_ID = "autospark-viewport-styles";

/** 档位隐藏类（!important——档位隐藏恒胜 x-show 的 inline display 与用户 CSS） */
export const VIEWPORT_HIDDEN_CLASS = "autospark-viewport-hidden";

/** 注入视口显隐全局样式（幂等） */
export function registerViewportStyles(): void {
    injectStylesheet(`.${VIEWPORT_HIDDEN_CLASS}{display:none !important;}`, {
        id: VIEWPORT_STYLE_ID,
    });
}

/** 值解析产物：目标档位集合 */
export interface ParsedViewportTiers {
    tiers: Set<ViewportTier>;
}

/**
 * 解析指令值 → 档位集合（纯函数，单测直击）：逗号分隔 + trim + 固定枚举校验，
 * 未知档名静默跳过。空值 / 全部无效返回 null（调用方 warn + 指令整体忽略）。
 */
export function parseViewportTiers(raw: unknown): ParsedViewportTiers | null {
    const source = String(raw ?? "").trim();
    if (source === "") return null;
    const tiers = new Set<ViewportTier>();
    for (const part of source.split(",")) {
        const name = part.trim();
        if ((VIEWPORT_TIERS as readonly string[]).includes(name)) {
            tiers.add(name as ViewportTier);
        }
    }
    return tiers.size > 0 ? { tiers } : null;
}

/**
 * x-viewport 指令（ADR-0106）：Compile kind、singleton、priority 80（显隐家族对齐
 * x-show）。订阅 `$.viewport` 切档位隐藏类，不碰 inline display。
 */

/**
 * viewport 指令类工厂：基类由调用方注入（命名空间可达时），返回可直接经
 * `$.directive("viewport", Cls)` 类重载安装的指令类。
 */
export function createViewportDirective(
    Base: typeof AutoSparkDirectiveBase,
): typeof AutoSparkDirectiveBase {
    class ViewportDirective extends Base {
        static override readonly priority = 80;
        static override readonly singleton = true;

        /** 类级初始化：注入视口显隐全局样式（幂等） */
        static override initialize(_engine: AutoSpark): void {
            registerViewportStyles();
        }

        /** 目标档位集合（null = 指令失效——空值/全无效，整体忽略不做动作） */
        private _tiers: Set<ViewportTier> | null = null;
        /** `.hide` 反向：列出档隐藏、其余可见 */
        private _hide = false;

        override created(): void {
            const parsed = parseViewportTiers(this.value);
            if (parsed == null) {
                this.warn(`x-viewport: 值 "${String(this.value ?? "")}" 为空或无有效档位，指令已忽略`);
                return;
            }
            this._tiers = parsed.tiers;
            // `.hide` 修饰符经 ADR-0007 并入指令选项（对齐 x-container.fluid 读取法）
            this._hide = this.getOption("hide") === true;
            // 订阅全局档位（ADR-0105）：初值即动作（x-show 同法）；undefined/非法档名静默短路
            this.binding.watch("$.viewport", ({ value }) => this._apply(value));
            this._apply(this.binding.read("$.viewport"));
        }

        /** 应用档位判定：非法值静默短路（不做任何动作，ADR-0106 决策 4）；合法值按正反向切隐藏类 */
        private _apply(tier: unknown): void {
            if (this._tiers == null) return;
            if (typeof tier !== "string" || !(VIEWPORT_TIERS as readonly string[]).includes(tier)) {
                return;
            }
            const inSet = this._tiers.has(tier as ViewportTier);
            this.el.classList.toggle(VIEWPORT_HIDDEN_CLASS, this._hide ? inSet : !inSet);
        }
    }
    return ViewportDirective;
}

/** 双路径自举（ADR-0114 单点 installPlugin）：register 内命名空间必已可达 */
export function bootstrapViewportDirective(): void {
    installPlugin((autospark) => {
        autospark.directive("viewport", createViewportDirective(autospark.AutoSparkDirectiveBase));
    });
}

// 模块加载即自举（对称 decorate 家族：置于模块尾部）
bootstrapViewportDirective();
