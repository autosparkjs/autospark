/**
 * 全局资源管理器单例（懒建）——bootstrap 挂类静态 `AutoSpark.resources` 与各注册路径
 * 读取全局默认选项共用同一实例（双脚本标签重复加载不重建）。
 */
import { AutoSparkResourceManager } from "./manager";

let instance: AutoSparkResourceManager | null = null;

/** 取全局资源管理器单例（首调用创建） */
export function getGlobalResourceManager(): AutoSparkResourceManager {
    return (instance ??= new AutoSparkResourceManager());
}
