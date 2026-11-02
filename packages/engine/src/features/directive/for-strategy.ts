/**
 * x-for 渲染策略注册表（ADR-0128 决策 3）：`.virtual` / `.paging` 修饰符声明的
 * 可选渲染策略扩展点——指令本体（语法/编译期行为/全量渲染核心）留在 engine，
 * 策略实现（窗口计算 / 分页状态机）经 `AutoSpark.forStrategy(name, strategy)`
 * 注册（插件形态分发：autospark.virtual.js / autospark.paging.js，选择性引入）。
 *
 * **职责分界**：策略管「窗口几何 / 页状态」（何时渲染哪个区间），核心管
 * 「DOM 事务」（renderRange 内的复用/重绑/两阶段提交，ADR-0076）——策略经
 * host 原语视图驱动核心，不直接操作项 DOM。
 *
 * 退化语义（ADR-0041 决策 15 延伸）：声明修饰符而策略未注册 → warn + 退化
 * 全量渲染（降级而非失效，列表功能不受影响）。
 */

/** x-for 内部原语的受控视图（策略唯一通道——不得越过此面直碰指令内部） */
export interface ForStrategyHost {
    /** 渲染容器（滚动宿主） */
    readonly container: HTMLElement;
    /** 归一后的当前数据（数组） */
    items(): unknown[];
    /** 项模板求值键（x-for :key 语义，index 兜底） */
    keyOf(item: unknown, index: number): unknown;
    /** 渲染 [from, to) 窗口（核心事务：复用/重绑/销毁窗口外项 + DOM 重排） */
    renderRange(from: number, to: number): void;
    /** 项高（px）——策略声明已知高，或传 0 触发核心自动检测（首项实测） */
    itemHeight: number;
    /** 窗口渲染后的垫片声明（顶部推位高度 / 底部撑高；核心管理垫片元素生命周期） */
    setSpacers(top: number, bottom: number): void;
    /** x-empty 等特殊态当前是否激活（激活时策略应暂停窗口计算） */
    specialActive(): boolean;
    /** 数据变化通知（x-for watcher 触发——策略重算窗口或翻页） */
    onSourceChange(cb: () => void): void;
    /** 运行中退化为全量渲染（itemHeight 无法确定等场景——策略实例被销毁后核心接管） */
    fallbackToFull(): void;
    /** 状态路径写（data-index 双向通道等——经引擎 store，响应式生效） */
    writeState(path: string, value: unknown): void;
    /** 读项模板原始属性（编译剥除前的声明源——:data-index 绑定检测等） */
    templateAttr(name: string): string | null;
    /** 告警通道（策略配置错误经指令 warn 统一格式） */
    warn(message: string): void;
}

/** 策略实例（setup 成功产物——生命周期归指令） */
export interface ForStrategyInstance {
    /** 数据变化（含首渲染——装配后核心立即调用一次） */
    onSourceChange(): void;
    /** 指令销毁 / 模式退化时清理（摘监听/Observer） */
    destroy(): void;
}

/** 渲染策略：setup 装配（读配置、挂监听）；返回 null = 配置无效退化全量（自行 warn） */
export interface ForRenderStrategy {
    setup(host: ForStrategyHost, options: Record<string, any>): ForStrategyInstance | null;
}

/** 全局策略注册表（跨 engine 单例——注册即全局，同 directive 安装器语义） */
const strategies = new Map<string, ForRenderStrategy>();

/** 注册策略（AutoSpark.forStrategy 转发；重名覆盖 + warn） */
export function registerForStrategy(name: string, strategy: ForRenderStrategy): void {
    if (strategies.has(name)) {
        console.warn(`AutoSpark.forStrategy: 策略 "${name}" 已注册，后者覆盖（ADR-0128 决策 3）`);
    }
    strategies.set(name, strategy);
}

/** 查策略（x-for 装配期消费；未注册 = null → 退化全量） */
export function getForStrategy(name: string): ForRenderStrategy | undefined {
    return strategies.get(name);
}
