/**
 * resource 插件（ADR-0011）——服务端资源的抽象操作层。
 *
 * 资源 = 服务端数据的命名操作集；资源方法展开为**平铺点号名 action**（`order.get` 等，
 * engine ADR-0131 点号名 action），经 action 三通道自动获得生命周期广播（信号 /
 * DOM 冒泡 / `@click.feedback` 联动）。纯 RPC 语义：返回 Promise（解包后数据或
 * ResourceError），不写状态、无本地缓存。
 *
 * 三条声明/注册路径：
 *
 * 1. `<script type="autospark/resources">`（经 ADR-0132 script type 派发）——三形态定义
 *    （url 字符串 / 方法集 / 混搭对象），默认挂最近 scope（就近覆盖），`global` 属性
 *    挂 engine 级；
 * 2. `x-resource:名="url"` 指令——纯 REST 形态，默认映射生成五方法，挂宿主 scope；
 * 3. `AutoSpark.resources.add(name, def)`——跨 engine 全局资源唯一动态入口（写插件
 *    全局 action 表，各 engine getAction 末端惰性物化）。
 *
 * 映射规则函数化（`(url, ...args) => RequestDesc`）：默认 REST 映射表可按方法覆盖
 * （默认表 → options.resources.mapping → 资源内联 mapping 逐层浅合并）——适配任意
 * 后端协议；请求选项三层回退（资源内联 > engine options > 全局默认）。
 */
import "./types/augment"; // 声明合并副作用导入（options.resources / engine.resources）
import { bootstrapResourcePlugin } from "./bootstrap";

export { AutoSparkResourceManager } from "./manager";
export { getGlobalResourceManager } from "./global";
export { DEFAULT_REST_MAPPING, buildQuery, conditionQuery, executeRequest } from "./mapping";
export { expandResource, mergeMapping, resolveRequestOptions } from "./define";
export { resourceScriptHandler } from "./script";
export { createResourceDirectiveSpec } from "./directive";
export { ResourceError } from "./types";
export type {
    RequestDesc,
    ResourceMapping,
    ResourceMappingFn,
    ResourceMethods,
    ResourceObjectDef,
    ResourceDef,
    ResourceRequestOptions,
    ResourcesOptions,
    ResourceActionContext,
} from "./types";

// 模块加载即自举（ADR-0111：插件 = 无协议副作用脚本，加载即生效；notifications 同款）
bootstrapResourcePlugin();
