/**
 * AutoSparkResourceManager —— 资源管理器（ADR-0011）。
 *
 * **一个类双用途**（KISS）：
 *
 * - **类静态全局单例** `AutoSpark.resources`（无 engine 构造）：全局资源容器（跨 engine
 *   真相源）+ 全局默认选项（baseUrl/fetch/headers/unwrap/mapping）。`add()` 动态注册的
 *   资源展开为平铺点号名后写入 `AutoSpark.actions` 插件全局 action 表（ADR-0111）——
 *   各 engine 的 `getAction` 链末端惰性物化（buildAction 包装绑定触发 engine），晚注册
 *   天然对所有 engine 生效；
 * - **engine 级视图** `engine.resources`（ready 回调构造，传入 engine）：`add()` 注册
 *   engine 生命周期私有资源（注入本 engine.actions）；`options` 读 `options.resources`
 *   （engine 级配置层的编程面）。
 *
 * 同名覆盖 + warn（全局表跨 engine，覆盖影响面大——与 DirectiveManager.set 静默覆盖
 * 不同，warn 必要）。
 *
 * 命名空间经 `utils/namespace` 运行时解析（本包对 autospark 编译期零 import 纪律，
 * ADR-0003；类型导入除外）。
 */
import type { AutoSpark } from "autospark";
import { resolveNamespace } from "../../utils/namespace";
import { expandResource } from "./define";
import type { ResourceDef, ResourcesOptions } from "./types";

export class AutoSparkResourceManager {
    /** engine 级视图的目标 engine（全局单例形态为 undefined） */
    readonly engine?: AutoSpark<any>;

    /** 全局资源定义表（name → def 原样存储——get/遍历/调试真相源；生效面在 action 表） */
    private _defs = new Map<string, ResourceDef>();

    /** 全局默认选项（仅全局单例形态消费；engine 视图经 `options` getter 读 engine 配置） */
    private _globalOptions: ResourcesOptions = {};

    constructor(engine?: AutoSpark<any>) {
        this.engine = engine;
    }

    /**
     * 选项视图：全局单例返回全局默认表（可直改）；engine 视图返回 `engine.options.resources`
     * （构造入参的编程面，未配置时惰性建空表）。
     */
    get options(): ResourcesOptions {
        if (this.engine) {
            return (this.engine.options.resources ??= {});
        }
        return this._globalOptions;
    }

    /**
     * 动态注册资源（全局资源的唯一入口，共识修订：options.resources.globals 已移除）。
     *
     * 双重载：`add(name, def)` 单个 / `add({ name: def, … })` 批量。
     * def 为三形态（url 字符串 | 方法集 | 混搭对象）。
     *
     * - 全局单例：存定义表 + 展开写 `AutoSpark.actions` 插件全局 action 表（同名覆盖 + warn）；
     * - engine 视图：展开写本 `engine.actions`（Proxy 自动规范化包装，同名覆盖 + warn）。
     */
    add(nameOrRecord: string | Record<string, ResourceDef>, def?: ResourceDef): void {
        const entries =
            typeof nameOrRecord === "string"
                ? [[nameOrRecord, def as ResourceDef] as const]
                : Object.entries(nameOrRecord);
        for (const [name, d] of entries) {
            if (d === undefined) continue;
            if (this._defs.has(name) || this._hasAction(`${name}.`)) {
                console.warn(
                    `[autospark] resources.add: 资源 "${name}" 重复注册，后者覆盖（ADR-0011）`,
                );
            }
            this._defs.set(name, d);
            const decls = expandResource(name, d, this.engine, this._globalOptions);
            if (Object.keys(decls).length === 0) {
                console.warn(
                    `[autospark] resources.add: 资源 "${name}" 定义为空（无 url 也无方法），已跳过`,
                );
                continue;
            }
            this._write(decls);
        }
    }

    /** 取资源定义（三形态原样；未注册 undefined） */
    get(name: string): ResourceDef | undefined {
        return this._defs.get(name);
    }

    /** 是否已注册指定资源（engine 视图查本 engine.action 表前缀，全局查定义表） */
    has(name: string): boolean {
        return this._defs.has(name) || this._hasAction(`${name}.`);
    }

    /** 展开表写入目标 action 表（全局 → 插件全局表；engine → 本 engine.actions） */
    private _write(decls: Record<string, (...args: any[]) => any>): void {
        const table = this._actionTable();
        if (!table) {
            console.warn(
                "[autospark] resources.add: AutoSpark 命名空间不可用（插件未自举？），全局注册未生效",
            );
            return;
        }
        for (const [id, fn] of Object.entries(decls)) table[id] = fn;
    }

    /** 目标 action 表（engine 视图 = 本 engine.actions；全局 = 插件全局表；不可达 null） */
    private _actionTable(): Record<string, any> | null {
        if (this.engine) return this.engine.actions;
        const ns = resolveNamespace();
        return ns && typeof ns === "function" ? ns.actions : null;
    }

    /** 目标 action 表是否已存在指定前缀的点号名（同名覆盖 warn 判据） */
    private _hasAction(prefix: string): boolean {
        const table = this._actionTable();
        if (!table) return false;
        return Object.keys(table).some((k) => k.startsWith(prefix));
    }
}
