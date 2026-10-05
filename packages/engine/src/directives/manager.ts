import type { AutoSpark } from "../engine";
import type { AutoSparkDirectiveBase } from "./base";
import { DirectiveKind } from "./base";
import { presetDirectives } from "./presets";

/** 指令类的构造器类型（typeof 基类），用于访问静态成员 kind/initialize/dispose 等 */
type DirectiveClass = typeof AutoSparkDirectiveBase;

/**
 * 指令注册表
 *
 * 管理指令名 → 指令类 的映射。预设指令来自 `presetDirectives`（显式映射，
 * 避免类的 `Function.name` 与指令名不一致——例如类名是 "TextDirective" 而指令名是 "text"）。
 * 亦支持运行时注册自定义指令类以覆盖内置指令。
 *
 * ## 类级初始化（initialize/dispose）生命周期
 *
 * - `initializeAll()`：engine 构造末尾（autostart 的 compile 之后）调用一次，对**全部注册类**
 *   （不分 kind）补调 `Cls.initialize(engine)`，跳过已初始化的；随后标记 engine 就绪。
 * - `set()`（晚注册）：engine 就绪后立即对新类 initialize；就绪前仅注册（待 initializeAll 统一处理）。
 *   —— 预设指令在构造期用 `super.set` 原样注册、不触发 initialize（此时 compile 未跑、observer 扫描无意义）。
 * - `disposeAll()`：engine.destroy 调用，对已 initialize 的类 dispose，清空追踪集合。
 *
 * 幂等性由 `initialized` 集合保证：同一 (类, engine) 仅 initialize 一次。
 */
export class DirectiveManager extends Map<string, DirectiveClass> {
    readonly engine: AutoSpark;
    /** 已在本 engine 上执行过 initialize 的指令类（幂等保证 + disposeAll 追踪） */
    readonly initialized = new Set<DirectiveClass>();
    /** engine 是否已就绪（构造完成）：就绪后 set 才立即触发 initialize */
    private _ready = false;
    /**
     * 元素名 → 指令名 反查索引（ADR-0084，惰性构建）：元素名形态指令（类静态
     * `elementName` 非 null，如 x-super）的触发通道。set 晚注册后置空重建。
     */
    private _elementNameIndex: Map<string, string> | null = null;

    constructor(engine: AutoSpark<any>) {
        super();
        this.engine = engine;
        // 预设：原样注册，不触发 initialize（engine 尚未构造完成、autostart compile 未跑，
        // 此时建 observer / 扫描 DOM 无意义且会指向即将被 compile 替换的原始模板）。
        Object.entries(presetDirectives).forEach(([name, Cls]) => {
            super.set(name, Cls);
        });
    }

    /**
     * 晚注册自定义指令类（engine 就绪后覆盖/新增）。
     *
     * engine 就绪后立即对新类调用 initialize（runtime 指令得以建 observer 生效）；
     * 就绪前仅注册，由 `initializeAll` 统一处理。
     */
    override set(name: string, Cls: DirectiveClass): this {
        super.set(name, Cls);
        this._elementNameIndex = null; // 注册表变更：元素名索引重建
        if (this._ready) {
            this._initOne(Cls);
            // runtime 指令晚注册：通知 dispatcher 重建 observer attributeFilter + 重扫该属性
            if (Cls.kind === DirectiveKind.Runtime) this.engine.dispatcher.onDirectiveRegistered(name, Cls);
        }
        return this;
    }

    /**
     * 按元素名反查指令名（ADR-0084 元素名形态指令通道）。
     *
     * 索引惰性构建（声明 `elementName` 的类 → 指令名），tagName 大小写归一（HTML 元素名
     * 被 DOM 小写化，`<x-super>` 的 tagName 为 "X-SUPER"）。单次编译内注册表不变，缓存稳定。
     *
     * @returns 指令名（如 "super"）；无元素名指令命中返回 undefined
     */
    findByElementName(tagName: string): string | undefined {
        if (!this._elementNameIndex) {
            this._elementNameIndex = new Map();
            for (const [name, cls] of this) {
                if (cls.elementName) this._elementNameIndex.set(cls.elementName, name);
            }
        }
        return this._elementNameIndex.get(tagName.toLowerCase());
    }

    /**
     * engine 构造末尾调用：对全部注册类补 initialize（跳过已初始化），并标记就绪。
     *
     * 须在 autostart compile 之后调用——runtime 指令的 initialize 会扫描已挂载的编译产物。
     */
    initializeAll(): void {
        for (const Cls of this.values()) {
            this._initOne(Cls);
        }
        this._ready = true;
    }

    /**
     * engine.destroy 调用：对已 initialize 的类调用 dispose（断开 observer、销毁 live 实例），
     * 随后清空 initialized 追踪集合。
     */
    disposeAll(): void {
        for (const Cls of this.initialized) {
            try {
                Cls.dispose(this.engine);
            } catch (e: any) {
                this.engine.logger.error(e);
            }
        }
        this.initialized.clear();
        this._ready = false;
    }

    /** 对单个类幂等执行 initialize（已初始化则跳过）。异常吞掉记日志，不中断其它指令。 */
    private _initOne(Cls: DirectiveClass): void {
        if (this.initialized.has(Cls)) return;
        this.initialized.add(Cls);
        try {
            Cls.initialize(this.engine);
        } catch (e: any) {
            this.engine.logger.error(e);
        }
    }
}
