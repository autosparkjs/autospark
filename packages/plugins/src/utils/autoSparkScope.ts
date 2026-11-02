/** scope 容器类（engine 公开导出 AutoSparkScope——instance rootless 域构建消费）——nsMember 具名包装 */
import { nsMember } from "./namespace";

export function autoSparkScope(): new (...args: any[]) => any {
    return nsMember<new (...args: any[]) => any>("AutoSparkScope");
}
