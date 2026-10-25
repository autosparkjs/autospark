import type { AutoSparkScope } from "../../../engine/scope";
import type { AutoSpark } from "../../../engine/engine";
import { type AutoSparkDirectiveBase } from "../base";
import type { AutoDirectiveInfo } from "../types";
/**
 * 将读取的指令信息转换为指令实例对象
 *
 * 处理逻辑如下：
 *
 * - 未注册指令静默跳过
 * - 同名单例指令只有最后一个有效（后声明覆盖先声明）
 * - 非单例指令允许同名多实例，保持声明顺序
 *
 * const directiveClass = engine.directives.get(name)
 *
 * - 按指令的优先级进行排列，directiveClass.priority 越大排在前面（先执行）；
 *   priority 相同时保持声明顺序（Array.sort 稳定）。
 *
 * 然后创建指令实例，将 DirectiveInfo 整体传入指令构造函数。
 *
 * @param engine     引擎实例（提供指令注册表，并注入到每个指令实例）
 * @param directives 待解析的指令信息列表
 * @param scope    所属绑定对象
 * @returns 按优先级排序后的指令实例列表
 */
export declare function createDirectives(engine: AutoSpark, directives: AutoDirectiveInfo[], scope: AutoSparkScope): AutoSparkDirectiveBase[];
