/**
 * 引擎统一错误体系（ADR-0093 决策 5）。
 *
 * 收敛策略：本次仅收编**编译期错误**（模板编译 / 指令属性解析阶段的结构性错误，
 * 不可恢复、编译中止）；其余散点 `throw new Error(...)` 保持原文、后续逐步迁移
 * ——重组本体是搬结构，全量替换会混进行为变化，使「纯搬家」不可验证。
 *
 * 约定：错误消息文案保持稳定（测试断言与用户可见面），`code` 是结构化标识
 * （子类自带前缀，如 `compile/<slug>`），`context` 携带机器可读字段。
 */

/** 引擎错误基类：结构化 code + 机器可读 context */
export class AutoSparkError extends Error {
    /** 结构化错误码（如 "compile/interpolation-conflict"） */
    readonly code: string;
    /** 附加上下文（冲突属性名、指令名等机器可读字段） */
    readonly context?: Record<string, unknown>;

    constructor(code: string, message: string, context?: Record<string, unknown>) {
        super(message);
        // new.target.name：子类实例的 name 自动取子类名（不受编译/downlevel 影响）
        this.name = new.target.name;
        this.code = code;
        this.context = context;
    }
}

/**
 * 编译期错误：模板编译 / 指令属性解析阶段的结构性错误。
 *
 * 构造入参 code 为 slug（不带前缀），完整 code 形如 `compile/<slug>`。
 */
export class CompileError extends AutoSparkError {
    constructor(code: string, message: string, context?: Record<string, unknown>) {
        super(`compile/${code}`, message, context);
    }
}
