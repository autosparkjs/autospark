/**
 * x-for `.virtual` 虚拟列表渲染策略插件（`autospark.virtual.js`，ADR-0128 决策 3 /
 * plugins ADR-0008 批次 5）：只渲染可见项 + overscan 缓冲，解决大数据集（10000+ 项）
 * 性能瓶颈。语义全量平移自 engine x-for virtual 段（ADR-0041 及后续修订）——几何
 * 状态（窗口/项高/滚动监听/data-index 双向）自持于策略实例，DOM 事务（复用/重绑/
 * 窗口外销毁/垫片归位）经 ForStrategyHost 回流指令核心。
 *
 * 键面（x-for-options）：`itemHeight`（px；缺省首项实测自动检测）、`overscan`
 * （缓冲项数，默认 5）。`:data-index` 绑定 = 声明式滚动位置控制（滚动写状态 /
 * 状态写滚动，rAF 节流）。退化：itemHeight 无效/无法确定 → warn + fallbackToFull
 * （降级而非失效，ADR-0041 决策 15）。
 */
import type { ForRenderStrategy, ForStrategyHost, ForStrategyInstance } from "autospark";
import { installPlugin } from "@autospark/utils";

/** 虚拟列表容器属性名（标记 + 滚动条样式选择器） */
const VIRTUAL_ATTR = "autospark-virtual";
/** 默认滚动条样式 <style> id（幂等注入） */
const VIRTUAL_STYLES_ID = "x-for-virtual-styles";

/** 滚动条样式注入（幂等；多 engine 共享 document）——策略首装配时执行 */
function ensureScrollbarStyles(): void {
    if (typeof document === "undefined" || document.getElementById(VIRTUAL_STYLES_ID)) return;
    const style = document.createElement("style");
    style.id = VIRTUAL_STYLES_ID;
    style.textContent = `
/* x-for 虚拟列表默认滚动条样式 */
[${VIRTUAL_ATTR}] {
  scrollbar-width: thin;
  scrollbar-color: var(--autospark-scrollbar-color, rgba(96, 96, 96, 0.55)) transparent;
}
[${VIRTUAL_ATTR}]::-webkit-scrollbar { width: 6px; height: 6px; }
[${VIRTUAL_ATTR}]::-webkit-scrollbar-thumb {
  background: var(--autospark-scrollbar-color, rgba(96, 96, 96, 0.55));
  border-radius: 3px;
}
[${VIRTUAL_ATTR}]::-webkit-scrollbar-track { background: transparent; }
/* 暗色兜底变体（ADR-0129）：滚动条色属非映射声明（保持两级），兜底按 theme 校准切换 */
[dark] [${VIRTUAL_ATTR}], [data-dark] [${VIRTUAL_ATTR}] {
  scrollbar-color: var(--autospark-scrollbar-color, rgba(250, 250, 250, 0.55)) transparent;
}
[dark] [${VIRTUAL_ATTR}]::-webkit-scrollbar-thumb, [data-dark] [${VIRTUAL_ATTR}]::-webkit-scrollbar-thumb {
  background: var(--autospark-scrollbar-color, rgba(250, 250, 250, 0.55));
}`;
    document.head.appendChild(style);
}

/** 虚拟滚动策略实例（几何状态自持；DOM 事务经 host） */
class VirtualScrollInstance implements ForStrategyInstance {
    private readonly host: ForStrategyHost;
    /** 用户声明的项高（0 = 自动检测） */
    private readonly declaredHeight: number;
    /** 自动检测的项高 */
    private autoHeight = 0;
    private readonly overscan: number;
    private firstVisible = 0;
    private rafId: number | null = null;
    private resizeObserver: ResizeObserver | null = null;
    /** :data-index 绑定的状态路径（容器模板属性检测） */
    private dataIndexBinding: string | null = null;
    private scrollingToIndex = false;
    private updatingDataIndex = false;
    private dataIndexObserver: MutationObserver | null = null;
    private readonly onScroll = () => {
        if (this.scrollingToIndex) return;
        if (this.rafId !== null) return;
        this.rafId = requestAnimationFrame(() => {
            this.rafId = null;
            this.handleScroll();
        });
    };

    constructor(host: ForStrategyHost, itemHeight: number, overscan: number) {
        this.host = host;
        this.declaredHeight = itemHeight;
        this.overscan = overscan;
    }

    /** 装配（setup 尾段）：标记/样式/监听/观察——宿主容器就绪后调用 */
    attach(): void {
        const { container } = this.host;
        container.setAttribute(VIRTUAL_ATTR, "");
        ensureScrollbarStyles();
        this.detectDataIndexBinding();
        container.addEventListener("scroll", this.onScroll, { passive: true });
        if (typeof ResizeObserver !== "undefined") {
            this.resizeObserver = new ResizeObserver(() => this.recalc());
            this.resizeObserver.observe(container);
        }
        if (typeof MutationObserver !== "undefined" && this.dataIndexBinding) {
            // 程序化滚动通道：外部写 data-index 属性 → 滚动到对应项
            this.dataIndexObserver = new MutationObserver(() => this.scrollToDataIndex());
            this.dataIndexObserver.observe(container, { attributes: true, attributeFilter: ["data-index"] });
        }
    }

    /** 检测 :data-index 绑定（容器模板原始属性——经 host.templateAttr 读编译剥除前的声明源） */
    private detectDataIndexBinding(): void {
        const bind = this.host.templateAttr(":data-index") ?? this.host.templateAttr("x-bind:data-index");
        this.dataIndexBinding = bind ? bind.trim() : null;
    }

    /** 当前生效项高（声明优先，否则自动检测值） */
    private itemHeight(): number {
        if (this.declaredHeight > 0) return this.declaredHeight;
        if (this.autoHeight > 0) return this.autoHeight;
        return 0;
    }

    /** 首项实测自动检测项高（假设项等高，ADR-0041 决策 2） */
    private autoDetect(): void {
        if (this.declaredHeight > 0 || this.autoHeight > 0) return;
        const first = this.host.container.firstElementChild;
        if (first) {
            const h = first.getBoundingClientRect().height;
            if (h > 0) this.autoHeight = h;
        }
    }

    /** 数据变化：重算窗口（含首渲染——核心装配后立即调用） */
    onSourceChange(): void {
        if (this.host.specialActive()) return;
        this.renderWindow();
    }

    /** 滚动：重算首可见索引，变化则重渲窗口 */
    private handleScroll(): void {
        if (this.host.specialActive()) return;
        const items = this.host.items();
        if (items.length === 0) return;
        const h = this.itemHeight();
        if (h <= 0) return;
        const first = Math.max(0, Math.min(Math.floor(this.host.container.scrollTop / h), items.length - 1));
        if (first !== this.firstVisible) {
            this.firstVisible = first;
            this.renderWindow();
        }
    }

    /** 容器尺寸变化：重算可见项数 */
    private recalc(): void {
        if (this.host.specialActive()) return;
        this.renderWindow();
    }

    /** 窗口计算 + 垫片声明 + 渲染委托（核心事务经 host.renderRange） */
    private renderWindow(): void {
        const items = this.host.items();
        this.autoDetect();
        const h = this.itemHeight();
        if (h <= 0) {
            this.host.warn("x-for.virtual: 无法确定 itemHeight（容器无子元素或高度为 0），退化为全量渲染");
            this.host.fallbackToFull();
            return;
        }
        const viewport = this.host.container.clientHeight;
        const count = Math.ceil(viewport / h) + this.overscan * 2;
        const start = Math.max(0, this.firstVisible - this.overscan);
        const end = Math.min(items.length, start + count);
        // 垫片：顶部推位 + 底部撑高（滚动条长度正确）
        this.host.setSpacers(start * h, Math.max(0, items.length - end) * h);
        this.host.renderRange(start, end);
        this.updateDataIndex(this.firstVisible);
    }

    /** 更新 data-index 反射属性 + 绑定状态（:data-index 通道的读侧） */
    private updateDataIndex(index: number): void {
        this.updatingDataIndex = true;
        try {
            this.host.container.setAttribute("data-index", String(index));
            const binding = this.dataIndexBindingOf();
            if (binding) this.host.writeState(binding, index);
        } finally {
            this.updatingDataIndex = false;
        }
    }

    /** 绑定路径（装配期检测缓存） */
    private dataIndexBindingOf(): string | null {
        return this.dataIndexBinding;
    }

    /** 程序化滚动：data-index 属性被外部改写 → 滚动到对应项（写侧） */
    private scrollToDataIndex(): void {
        if (this.updatingDataIndex) return;
        const h = this.itemHeight();
        if (h <= 0) return;
        const raw = Number(this.host.container.getAttribute("data-index"));
        if (!Number.isFinite(raw) || raw < 0) return;
        this.scrollingToIndex = true;
        this.host.container.scrollTop = raw * h;
        requestAnimationFrame(() => {
            this.scrollingToIndex = false;
        });
    }

    destroy(): void {
        this.host.container.removeEventListener("scroll", this.onScroll);
        if (this.rafId !== null) cancelAnimationFrame(this.rafId);
        this.rafId = null;
        this.resizeObserver?.disconnect();
        this.resizeObserver = null;
        this.dataIndexObserver?.disconnect();
        this.dataIndexObserver = null;
        this.host.container.removeAttribute(VIRTUAL_ATTR);
    }
}

/** 虚拟列表策略：setup 校验配置 → 装配实例（null = 配置无效退化全量） */
export const virtualStrategy: ForRenderStrategy = {
    setup(host, options) {
        let itemHeight = 0;
        if (options.itemHeight !== undefined) {
            const h = Number(options.itemHeight);
            if (!Number.isFinite(h) || h <= 0) {
                host.warn(`x-for.virtual: itemHeight 值无效（${JSON.stringify(options.itemHeight)}），退化为全量渲染`);
                return null;
            }
            itemHeight = h;
        }
        let overscan = 5;
        if (options.overscan !== undefined) {
            const o = Number(options.overscan);
            if (Number.isFinite(o) && o >= 0) overscan = Math.floor(o);
        }
        const instance = new VirtualScrollInstance(host, itemHeight, overscan);
        instance.attach();
        return instance;
    },
};

/** 双路径自举（ADR-0114 单点 installPlugin）：注册策略经 AutoSpark.forStrategy */
export function bootstrapVirtualPlugin(): void {
    installPlugin((autospark) => {
        autospark.forStrategy("virtual", virtualStrategy);
    });
}

// 模块加载即自举（对称 decorate 家族：置于模块尾部）
bootstrapVirtualPlugin();
