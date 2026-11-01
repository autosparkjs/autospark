/**
 * resource 插件类型定义（ADR-0011）——资源 = 服务端数据的命名操作集。
 *
 * 核心约定（与共识对齐）：
 * - 资源方法是**平铺点号 action 名**（`order.get` / `order.add`…，engine ADR-0131）——
 *   经 action 三通道（`actions/<id>/pending|resolved|rejected` 信号、DOM 冒泡、
 *   `@click.feedback` 修饰符）自动获得生命周期广播；
 * - 纯 RPC 语义：方法返回 Promise（解包后数据或 ResourceError），不写状态、无本地缓存
 *   ——状态写入由调用方组合（`await order.getMany()` 后自行赋值）。
 */
import type { AutoSpark } from "autospark";

/**
 * RequestDesc：映射规则产出的请求描述符（四字段封顶）。
 * 规则只负责"怎么拼请求"，query 序列化 / body JSON 化 / headers 合并 / fetch / 解包 /
 * 错误包装统一由执行管线承担。
 */
export interface RequestDesc {
    /** HTTP 方法（GET/POST/PUT/DELETE…） */
    method: string;
    /** 资源 url（相对形态，未含 baseUrl——baseUrl 由执行管线按三层回退拼接） */
    url: string;
    /** query 参数对象（序列化：数组值逗号连接，如 `ids=1,2,3` / `tags=a,b`） */
    query?: Record<string, any>;
    /** 请求体（JSON 化；POST/PUT 等携带，`add` 的数组体原样一次发） */
    body?: any;
}

/**
 * 映射规则条目：`(url, ...args) => RequestDesc`。
 * 函数形态全权掌控 url 拼接与 query 构造（不发明声明式 DSL）。
 */
export type ResourceMappingFn = (url: string, ...args: any[]) => RequestDesc;

/**
 * 通用条件选项（条件形态方法的公共实参形态）：`get(options)` / `getMany(options)` /
 * `update(data, options)` / `delete(options)` 共用同一机制——经 `conditionQuery` 归一化进 query。
 *
 * - `where`：过滤条件——**对象形态逐键展开**进 query（`{status:"open"}` → `status=open`）；
 *   **字符串形态**作为单一 `where` 参数直传（后端方言解释，如 `"amount>99"`）；
 * - `order`：排序描述直传（如 `"id desc"`）；
 * - `page` / `pageSize`：分页字段（仅传入时出现，对齐响应壳约定）；
 * - 其余任意键：原样透传 query（getMany 既有约定不变）。
 */
export interface ResourceCondition {
    where?: string | Record<string, any>;
    order?: string;
    page?: number;
    pageSize?: number;
    [key: string]: unknown;
}

/** 映射规则表：资源方法名（get/getMany/add/update/delete…）→ 规则条目 */
export type ResourceMapping = Record<string, ResourceMappingFn>;

/** 资源方法手写形态：方法名 → 执行体（this = action 上下文，`this.engine` 可用） */
export type ResourceMethods = Record<string, (...args: any[]) => any>;

/** 请求执行选项（三层回退的载体字段：资源内联 > engine options > 全局默认） */
export interface ResourceRequestOptions {
    /** 资源 url 前缀（拼接在规则产出的相对 url 前） */
    baseUrl?: string;
    /** 自定义 fetch（测试 mock / 拦截器 / token 注入；缺省 globalThis.fetch） */
    fetch?: typeof fetch;
    /** 默认请求头（逐请求合并） */
    headers?: Record<string, string>;
    /**
     * 响应解包钩子（默认恒等）：适配包裹壳（如 `{code,data,message}` 剥壳）。
     * 收 (响应 JSON, RequestDesc)，返回值即资源方法的 resolve 值。
     */
    unwrap?: (data: any, desc: RequestDesc) => any;
}

/** `AutoSparkOptions.resources` 形态（engine 级配置层，ADR-0011） */
export interface ResourcesOptions extends ResourceRequestOptions {
    /**
     * 按方法覆盖默认 REST 映射表（浅合并：只覆盖给出的键，其余沿用默认——无整表替换）。
     * 合并链（逐层浅合并，后者覆盖）：默认表 → 本表 → 资源定义内联 `mapping`。
     */
    mapping?: ResourceMapping;
}

/**
 * 资源定义的对象形态（混搭）：`url` 打底走映射生成 + 手写方法覆写个别方法 + 内联请求选项。
 * 除保留键（url/mapping/请求选项四项）外，值为函数的键即手写方法（优先于映射生成）。
 */
export interface ResourceObjectDef extends ResourceRequestOptions {
    /** REST 资源集合地址（如 `/api/orders`）——映射生成的打底 url */
    url?: string;
    /** 内联映射覆盖（优先于 options.resources.mapping） */
    mapping?: ResourceMapping;
    /** 手写方法（自由键；优先于映射生成，适配个别方法协议不同的后端） */
    [method: string]: any;
}

/**
 * 资源定义三形态（ADR-0011 决策：三形态都进第一版）：
 * - `string`：纯 REST——url 即定义，五方法（get/getMany/add/update/delete）全走映射生成；
 * - `ResourceMethods`：纯手写方法集——完全自定义，无映射参与；
 * - `ResourceObjectDef`：混搭——`url` 打底 + 手写方法覆写 + 内联选项。
 */
export type ResourceDef = string | ResourceMethods | ResourceObjectDef;

/** 资源方法执行时的 action 上下文最小契约（this.engine 活取 engine 级配置） */
export interface ResourceActionContext {
    engine?: AutoSpark<any>;
    [key: string]: any;
}

/**
 * 资源请求失败异常（非 2xx / 网络错 / 解包抛错均 reject 本形态）。
 * 携带 status/url/method 标量供调用方与 error 信号消费方定位。
 */
export class ResourceError extends Error {
    /** HTTP 状态码（网络错误时为 0） */
    readonly status: number;
    /** 完整请求 url（含 baseUrl 与 query） */
    readonly url: string;
    /** HTTP 方法名 */
    readonly method: string;
    constructor(message: string, status: number, url: string, method: string) {
        super(message);
        this.name = "ResourceError";
        this.status = status;
        this.url = url;
        this.method = method;
    }
}
