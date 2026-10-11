/**
 * 路由匹配算法 v2.0
 *
 * 实现混合匹配策略：
 * - 完全匹配路径
 *
 * 匹配优先级：具体路径 > 参数化路径 > 通配符
 *
 * 返回首个匹配分支上所有嵌套路由项
 */

import type {
    KylinRouteItem,
    KylinMatchedRouteItem,
    RedirectTarget,
    RedirectFunction,
    RedirectResult,
    NamedRedirectTarget,
} from "@/types";
import { joinPath } from "./joinPath";
import { extractQueryParams } from "./extractQueryParams";
import { getRouteHash } from "./getRouteHash";
import {
    KylinMaxRedirectRouteError,
    KylinLoopRouteError,
    KylinNotFoundRouteError,
    KylinExternalRouteError,
} from "@/errors";
import { isExternalLink } from "./isExternalLink";

let matchedId: number = 0;

/**
 * 路由匹配选项
 */
export interface MatchRouteOptions {
    /**
     * 全局重定向配置（后备重定向）
     * 当匹配的路由项没有 redirect 配置时，使用此配置
     * 优先级低于 KylinRouteItem.redirect
     */
    redirect?: import("@/types").RedirectTarget | import("@/types").RedirectFunction;

    /**
     * 最大重定向次数限制
     * 防止无限重定向循环，每次重定向递归时此值减 1
     * 当 maxRedirect < 0 时抛出异常
     * @default 10
     */
    maxRedirect?: number;

    /**
     * 命名路由映射表
     * 用于解析命名路由重定向 { name: 'home' }
     */
    namedRoutes?: Map<string, WeakRef<import("@/types").KylinRouteItem>>;

    /**
     * 内部使用：重定向链，防止无限递归
     * @internal
     */
    _redirectChain?: Array<{ url: string; mode: "replace" | "push" }>;
}

/**
 * 单个路由匹配器的匹配结果
 */
interface RouteMatchResult {
    /** 是否匹配 */
    matched: boolean;
    /** 提取的参数 */
    params: Record<string, string>;
    /** 剩余路径（相对于匹配部分） */
    remainingPath: string;
}

/**
 * 编译后的路径模式
 */
interface CompiledPattern {
    regex: RegExp;
    paramNames: string[];
}

/**
 * 规范化 URL（移除末尾斜杠，除非是根路径）
 */
function normalizeUrl(url: string): string {
    if (url === "/" || url === "") {
        return "/";
    }
    return url.replace(/\/+$/, "");
}

/**
 * 规范化路径
 * 移除末尾斜杠并转换为小写
 *
 * 按照 D-07: 路径规范化自动移除末尾斜杠
 * 按照 D-08: 路径匹配不区分大小写
 */
/**
 * 规范化路径
 * - 确保路径以 / 开头
 * - 移除末尾的斜杠（除非是根路径）
 * - 空路径转换为 /
 */
function normalizePath(path: string): string {
    let normalized = path;

    // 确保路径以 / 开头
    if (!normalized.startsWith("/")) {
        normalized = "/" + normalized;
    }

    // 移除末尾的斜杠（除非是根路径）
    normalized = normalized.replace(/\/+$/, "");

    // 空路径转换为 /
    if (normalized === "") {
        normalized = "/";
    }

    return normalized.toLowerCase();
}

// ============================================================================
// 重定向处理辅助函数
// ============================================================================

/**
 * 解析相对路径重定向
 * 支持语法：
 * - ./sibling - 同级目录（相对于父路径）
 * - ../sibling - 父级目录（先去掉当前路由段，再向上一级）
 * - ../../uncle - 多级父目录
 * - /absolute - 绝对路径
 * - path - 相对于当前路径
 *
 * 注意：相对路径重定向是相对于当前路由的父路径解析的
 * 例如：当前路由 /a/b/up1 重定向到 ../target 时
 * - 先去掉当前路由段 up1，得到父路径 /a/b
 * - ../target 表示从父路径向上一级到 /a，然后添加 target -> /a/target
 */
function resolveRedirectPath(target: string, currentMatch: KylinMatchedRouteItem): string {
    // 绝对路径直接返回
    if (target.startsWith("/")) {
        return target;
    }

    // 获取父路径（去掉当前路由的最后一段）
    const parentPath = currentMatch.path.split("/").filter(Boolean).slice(0, -1).join("/");
    const segments = parentPath ? parentPath.split("/") : [];

    // 处理 ./ 开头的相对路径 - 相对于父路径的同级
    if (target.startsWith("./")) {
        const relativePart = target.slice(2);
        const newSegments = [...segments, relativePart];
        return "/" + newSegments.join("/");
    }

    // 处理 ../ 开头的相对路径 - 相对于父路径的上级
    if (target.startsWith("../")) {
        let remaining = target;
        let newSegments = [...segments];

        // 每个 ../ 向上一级
        while (remaining.startsWith("../")) {
            remaining = remaining.slice(3);
            if (newSegments.length > 0) {
                newSegments.pop();
            }
        }

        // 添加剩余路径
        if (remaining) {
            newSegments.push(remaining);
        }

        return "/" + newSegments.join("/");
    }

    // 普通相对路径：添加到父路径
    return joinPath(parentPath || "/", target);
}

/**
 * 重定向解析结果类型
 */
interface RedirectResolution {
    target: string;
    mode: "replace" | "push";
    /** 目标窗口：_self 当前窗口，_blank 新窗口 */
    windowTarget?: "_self" | "_blank";
    /** 目标不存在（命名路由未找到） */
    notFound?: boolean;
    /** 是否为外部链接 */
    isExternal?: boolean;
}

/**
 * 解析重定向目标为最终路径和模式
 * @returns RedirectResolution 或 null（不重定向）
 */
function resolveRedirect(
    target: RedirectTarget | RedirectFunction,
    namedRoutes: Map<string, WeakRef<KylinRouteItem>> | undefined,
    matchedRoute: KylinMatchedRouteItem,
): RedirectResolution | null {
    // 函数类型重定向
    if (typeof target === "function") {
        const result = (target as RedirectFunction)(matchedRoute);
        if (result === null) {
            return null; // 不重定向
        }
        return resolveRedirect(result, namedRoutes, matchedRoute);
    }

    // 字符串类型重定向
    if (typeof target === "string") {
        // 外部链接直接返回原始 URL
        if (isExternalLink(target)) {
            return {
                target,
                mode: "replace",
                isExternal: true,
            };
        }
        return {
            target: resolveRedirectPath(target, matchedRoute),
            mode: "replace",
        };
    }

    // RedirectResult 类型（包含 path 字段）
    if ("path" in target) {
        const redirectResult = target as RedirectResult;
        // 外部链接直接返回原始 URL
        if (isExternalLink(redirectResult.path)) {
            return {
                target: redirectResult.path,
                mode: redirectResult.mode || "replace",
                windowTarget: redirectResult.target,
                isExternal: true,
            };
        }
        return {
            target: resolveRedirectPath(redirectResult.path, matchedRoute),
            mode: redirectResult.mode || "replace",
            windowTarget: redirectResult.target,
        };
    }

    // NamedRedirectTarget 类型（包含 name 字段）
    if ("name" in target) {
        const namedTarget = target as NamedRedirectTarget;
        const weakRef = namedRoutes?.get(namedTarget.name);
        const routeItem = weakRef?.deref();

        if (!routeItem) {
            // 命名路由不存在，返回 notFound 标记
            return {
                target: `name:${namedTarget.name}`,
                mode: namedTarget.mode || "replace",
                windowTarget: namedTarget.target,
                notFound: true,
            };
        }

        // 构建完整路径，合并 params 和 query
        let targetPath = routeItem.path;
        if (namedTarget.params) {
            // 替换路径参数
            for (const [key, value] of Object.entries(namedTarget.params)) {
                targetPath = targetPath.replace(`:${key}`, value).replace(`<${key}>`, value);
            }
        }

        // 添加查询参数
        if (namedTarget.query) {
            const queryString = new URLSearchParams(namedTarget.query).toString();
            if (queryString) {
                targetPath += `?${queryString}`;
            }
        }

        return {
            target: resolveRedirectPath(targetPath, matchedRoute),
            mode: namedTarget.mode || "replace",
            windowTarget: namedTarget.target,
        };
    }

    return null;
}

/**
 * 转义正则特殊字符
 */
function escapeRegex(str: string): string {
    return str.replace(/[.+^${}()|[\]\\]/g, "\\$&");
}

/**
 * 从 pathname 中移除 hash 部分
 */
function stripHash(pathname: string): string {
    const hashIndex = pathname.indexOf("#");
    return hashIndex >= 0 ? pathname.slice(0, hashIndex) : pathname;
}

/**
 * 解析 URL 查询参数
 * 复用 extractQueryParams 函数来提取查询参数
 */
function parseQueryString(pathname: string): { pathname: string; query: Record<string, string> } {
    const cleaned = stripHash(pathname);
    const [path, search = ""] = cleaned.split("?", 2);

    // 复用 extractQueryParams 来解析查询参数
    const query = search ? extractQueryParams("?" + search) : {};

    return { pathname: path, query };
}

/**
 * 将路径分割为段并逐段编译
 * 每个 segment 独立处理，避免正则转义冲突
 *
 * 支持语法：
 * - 静态段: "user" -> "user"
 * - 单段通配符: "*" -> 匹配单个段
 * - 多段通配符: "**" -> 匹配零个或多个段（仅在路径末尾）
 * - 冒号参数: ":id" -> 捕获组
 * - 尖括号参数: "<id>" -> 捕获组
 * - 正则约束: ":id(\d+)" 或 "<id(\d+)>"
 */
function compileSegments(pattern: string, fullMatch: boolean): CompiledPattern {
    const paramNames: string[] = [];
    // 先在原始 pattern 上提取参数名（保留大小写）
    // 然后对静态部分做规范化（小写 + 去末尾斜杠）
    const rawSegments = pattern.split("/").filter(Boolean);
    const regexParts: string[] = [];

    for (let i = 0; i < rawSegments.length; i++) {
        const rawSegment = rawSegments[i];

        // 检查是否是多段通配符（** 仅允许在末尾）
        if (rawSegment === "**") {
            if (i !== rawSegments.length - 1) {
                throw new Error("Multi-wildcard '**' can only appear at the end of a pattern");
            }
            // ** 匹配一个或多个段（不包括空路径）
            regexParts.push(".+");
            continue;
        }

        // 检查是否是单段通配符
        if (rawSegment === "*") {
            // * 匹配单个段（不包括斜杠）
            regexParts.push("[^/]+");
            continue;
        }

        // 检查是否是冒号参数段 - 提取原始参数名，对正则约束做小写处理
        const colonMatch = rawSegment.match(/^:(\w+)(?:\((.+)\))?$/);
        if (colonMatch) {
            const name = colonMatch[1];
            const constraint = colonMatch[2];
            paramNames.push(name);
            regexParts.push(`(${constraint || "[^/]+"})`);
            continue;
        }

        // 检查是否是尖括号参数段
        const angleMatch = rawSegment.match(/^<(\w+)(?:\((.+)\))?>$/);
        if (angleMatch) {
            const name = angleMatch[1];
            const constraint = angleMatch[2];
            paramNames.push(name);
            regexParts.push(`(${constraint || "[^/]+"})`);
            continue;
        }

        // 静态段 - 规范化为小写并转义正则特殊字符
        regexParts.push(escapeRegex(rawSegment.toLowerCase()));
    }

    // 构建完整正则
    let regexBody: string;

    // 检查是否有 ** 通配符在末尾
    const hasMultiWildcard = regexParts.length > 0 && regexParts[regexParts.length - 1] === ".*";

    if (hasMultiWildcard) {
        // 如果最后是 **，需要使其匹配零个或多个段
        // 即使没有任何内容，也应该匹配
        const beforeWildcard = regexParts
            .slice(0, -1)
            .map((p) => "/" + p)
            .join("");
        regexBody = beforeWildcard + "(?:/.*)?";
    } else {
        regexBody = regexParts.map((p) => "/" + p).join("");
    }

    let regexStr: string;

    if (fullMatch) {
        // 完全匹配（叶子节点）
        regexStr = `^${regexBody}/?$`;
    } else {
        // 前缀匹配（父节点 - 匹配自身或自身后有子路径）
        regexStr = `^${regexBody}(?:/(.*))?$`;
    }

    return {
        regex: new RegExp(regexStr),
        paramNames,
    };
}

/**
 * 提取路径中的所有参数名
 * 支持 :param 和 <param> 语法
 */
function extractParamNames(path: string): string[] {
    const colonPattern = /^:(\w+)(?:\(.+\))?$/;
    const anglePattern = /^<(\w+)(?:\(.+\))?>$/;
    const paramNames: string[] = [];
    const segments = path.split("/").filter(Boolean);

    for (const segment of segments) {
        const colonMatch = segment.match(colonPattern);
        if (colonMatch) {
            paramNames.push(colonMatch[1]);
            continue;
        }
        const angleMatch = segment.match(anglePattern);
        if (angleMatch) {
            paramNames.push(angleMatch[1]);
        }
    }
    return paramNames;
}

/**
 * 用 params 默认值替换路径中的参数
 * 如果参数没有默认值，保留原始占位符
 */
function replacePathParams(path: string, params: Record<string, string>): string {
    const segments = path.split("/").filter(Boolean);
    const replacedSegments = segments.map((segment) => {
        // 匹配 :param 或 :param(regex) 语法
        const colonMatch = segment.match(/^:(\w+)(?:\(.+\))?$/);
        if (colonMatch) {
            const paramName = colonMatch[1];
            return params[paramName] ?? segment;
        }
        // 匹配 <param> 或 <param(regex)> 语法
        const angleMatch = segment.match(/^<(\w+)(?:\(.+\))?>$/);
        if (angleMatch) {
            const paramName = angleMatch[1];
            return params[paramName] ?? segment;
        }
        return segment;
    });
    return replacedSegments.length > 0 ? "/" + replacedSegments.join("/") : "/";
}

/**
 * 在子路由中递归查找默认路由
 * 只选择 default: true 的路由
 * 返回默认路由及其所有嵌套的默认子路由
 *
 * view/data 继承规则：
 * - 如果父路由的 view 为空且默认路由有 view，则使用默认路由的 view
 * - 如果父路由的 data 为空且默认路由有 data，则使用默认路由的 data
 */
function findDefaultRoute(
    routes: KylinRouteItem[],
    parentMatchedRoute: KylinMatchedRouteItem,
    inputQuery: Record<string, string>,
    id: number,
): KylinMatchedRouteItem[] | null {
    // 查找第一个 default: true 的路由
    for (const route of routes) {
        if (route.default === true) {
            const fullPath = joinPath(parentMatchedRoute.path, route.path);
            const mergedParams = { ...parentMatchedRoute.params, ...route.params };
            const mergedQuery = { ...route.query, ...inputQuery };

            // 构建 URL：对于默认路由，url 应该包含完整路径
            // 例如：根路由 "/" + 默认路由 "home" -> url = "/home"
            // 如果路径包含参数且有默认值，用默认值替换所有参数（包括父路径中的参数）
            const fullPathWithDefaults = replacePathParams(fullPath, mergedParams);
            const fullUrl = normalizeUrl(fullPathWithDefaults);

            const currentMatch: KylinMatchedRouteItem = {
                route,
                params: mergedParams,
                query: mergedQuery,
                state: {},
                path: fullPath,
                url: fullUrl,
                hash: "",
                id,
            };
            currentMatch.hash = getRouteHash(currentMatch);

            // 递归查找下一级默认路由
            if (route.children && route.children.length > 0) {
                const childDefaults = findDefaultRoute(
                    route.children,
                    currentMatch,
                    inputQuery,
                    id,
                );
                if (childDefaults && childDefaults.length > 0) {
                    return [currentMatch, ...childDefaults];
                }
            }

            return [currentMatch];
        }
    }

    return null;
}

/**
 * 创建未匹配的路由项（用于 404 处理）
 */
function createUnmatchedRouteItem(
    unmatchedPath: string,
    parentMatchedRoute: KylinMatchedRouteItem | null,
    inputQuery: Record<string, string>,
    id: number,
): KylinMatchedRouteItem {
    const parentPath = parentMatchedRoute?.path || "";
    const parentUrl = parentMatchedRoute?.url || "";
    const parentParams = parentMatchedRoute?.params || {};

    const fullPath = joinPath(parentPath, unmatchedPath);
    const fullUrl = normalizeUrl(joinPath(parentUrl, unmatchedPath));

    return {
        route: undefined as any,
        params: parentParams,
        query: inputQuery,
        state: {},
        path: fullPath,
        url: fullUrl,
        hash: `unmatched-${fullPath.replace(/\//g, "-")}`,
        id,
    };
}

/**
 * 创建单个路由的匹配函数
 *
 * 支持静态路径、动态参数（:param 和 <param>）、正则约束、通配符
 *
 * @param route - 路由配置
 * @param isPrefix - 是否使用前缀匹配（用于嵌套路由）
 * @returns 匹配函数，接受 pathname 返回匹配结果
 */
export function createRouteMatcher(
    route: KylinRouteItem,
    isPrefix: boolean = false,
): (pathname: string) => RouteMatchResult {
    const rawPattern = route.path;

    // 单独的 * 通配符：匹配单个段（不是所有路径）
    if (rawPattern === "*") {
        // 编译为匹配单个段的正则，使用前缀匹配模式以支持剩余路径
        const { regex, paramNames } = compileSegments("/*", false);

        return (pathname: string) => {
            const normalized = normalizePath(parseQueryString(pathname).pathname);
            const fullMatch = normalized.match(regex);

            if (fullMatch) {
                const params: Record<string, string> = {};
                paramNames.forEach((name, index) => {
                    params[name] = fullMatch[index + 1] || "";
                });

                // * 作为前缀匹配，返回剩余路径
                let remainingPath = "";
                const remainingIndex = paramNames.length + 1;
                remainingPath = fullMatch[remainingIndex] || "";

                return {
                    matched: true,
                    params,
                    remainingPath,
                };
            }

            return {
                matched: false,
                params: {},
                remainingPath: pathname,
            };
        };
    }

    // 忽略 route.path 开头的 /，因为路由表中的 path 应该不以 / 开头
    const cleanedPattern = rawPattern === "/" ? "/" : rawPattern.replace(/^\/+/, "");
    const absolutePattern = cleanedPattern.startsWith("/") ? cleanedPattern : "/" + cleanedPattern;

    const { regex, paramNames } = compileSegments(absolutePattern, !isPrefix);

    return (pathname: string) => {
        const normalized = normalizePath(parseQueryString(pathname).pathname);
        const fullMatch = normalized.match(regex);

        if (fullMatch) {
            const params: Record<string, string> = {};
            paramNames.forEach((name, index) => {
                params[name] = fullMatch[index + 1] || "";
            });

            // 对于前缀匹配，remainingPath 来自最后的捕获组
            let remainingPath = "";
            if (isPrefix) {
                const remainingIndex = paramNames.length + 1;
                remainingPath = fullMatch[remainingIndex] || "";
            }

            return {
                matched: true,
                params,
                remainingPath,
            };
        }

        return {
            matched: false,
            params: {},
            remainingPath: pathname,
        };
    };
}

/**
 * 处理单个路由的匹配逻辑
 * @returns 匹配结果数组，如果未匹配则返回 null
 */
function processSingleRoute(
    route: KylinRouteItem,
    path: string,
    parentMatchedRoute: KylinMatchedRouteItem | null,
    inputQuery: Record<string, string>,
    id: number,
): KylinMatchedRouteItem[] | null {
    const parentPath = parentMatchedRoute?.path || "";
    const parentParams = parentMatchedRoute?.params || {};
    const parentUrl = parentMatchedRoute?.url || "";

    const isLeaf = !route.children || route.children.length === 0;
    const matcher = createRouteMatcher(route, true);
    const matchResult = matcher(path);
    if (!matchResult.matched) return null;

    const matchedUrl = normalizeUrl(
        path.slice(0, path.length - (matchResult.remainingPath?.length || 0)),
    );
    const fullUrl = normalizeUrl(joinPath(parentUrl, matchedUrl));
    const fullPath = joinPath(parentPath, route.path);

    const mergedParams = Object.assign({}, route.params, parentParams, matchResult.params);
    const routeQuery = route.query || {};

    const currentMatch: KylinMatchedRouteItem = {
        route,
        params: mergedParams,
        query: routeQuery,
        state: {},
        path: fullPath,
        url: fullUrl,
        hash: "",
        id,
    };
    currentMatch.hash = getRouteHash(currentMatch);

    if (!matchResult.remainingPath) {
        // 路径完全匹配当前路由
        if (route.children && route.children.length > 0) {
            // 首先查找默认路由
            const defaultMatches = findDefaultRoute(
                route.children,
                currentMatch,
                inputQuery,
                id,
            );
            if (defaultMatches && defaultMatches.length > 0) {
                return [currentMatch, ...defaultMatches];
            }

            // 尝试匹配空路径的子路由
            const childMatches = _matchRoutesInternal(
                "/",
                route.children,
                currentMatch,
                inputQuery,
                id,
            );
            if (childMatches.length > 0) {
                return [currentMatch, ...childMatches];
            }
            // 子路由无法匹配时的处理
            // 如果子路由无法匹配，仍然返回父路由
            // 因为路径已经完全匹配父路由
            return [currentMatch];
        }
        // 没有子路由，直接返回当前路由（叶子节点，合并 inputQuery）
        currentMatch.query = { ...routeQuery, ...inputQuery };
        return [currentMatch];
    }

    if (route.children && route.children.length > 0) {
        const childPath = "/" + matchResult.remainingPath;
        const childMatches = _matchRoutesInternal(
            childPath,
            route.children,
            currentMatch,
            inputQuery,
            id,
        );

        if (childMatches.length > 0) {
            return [currentMatch, ...childMatches];
        }

        // 子路由完全无法匹配
        // 对于通配符路由（* 或以 /* 结尾），且有子路由时，返回未匹配项
        if (route.path === "*" || route.path.endsWith("/*")) {
            const unmatchedItem = createUnmatchedRouteItem(
                matchResult.remainingPath,
                currentMatch,
                inputQuery,
                id,
            );
            return [currentMatch, unmatchedItem];
        }

        // 普通路由创建未匹配路由项
        const unmatchedItem = createUnmatchedRouteItem(
            matchResult.remainingPath,
            currentMatch,
            inputQuery,
            id,
        );
        return [currentMatch, unmatchedItem];
    }

    if (!isLeaf && matchResult.remainingPath) {
        return null;
    }

    // 通配符路由 * 有剩余路径时的处理
    if (matchResult.remainingPath && route.path === "*") {
        // 根级别的 * 返回 null（让其他路由尝试）
        // 嵌套的 *（如 /a/* 中的 *）返回未匹配项
        if (!parentMatchedRoute || parentMatchedRoute.path === "/") {
            return null;
        }
        const unmatchedItem = createUnmatchedRouteItem(
            matchResult.remainingPath,
            currentMatch,
            inputQuery,
            id,
        );
        return [currentMatch, unmatchedItem];
    }

    return [currentMatch];
}

function _matchRoutesInternal(
    path: string,
    routes: KylinRouteItem[],
    parentMatchedRoute: KylinMatchedRouteItem | null,
    inputQuery: Record<string, string> = {},
    id: number,
): KylinMatchedRouteItem[] {
    // 按优先级分组遍历：具体路径 > 参数化路径 > 通配符
    // 第一组：具体路径和参数化路径（非通配符）
    for (const route of routes) {
        if (route.path === "*" || route.path.includes("*")) continue;

        const result = processSingleRoute(
            route,
            path,
            parentMatchedRoute,
            inputQuery,
            id,
        );
        if (result) return result;
    }

    // 第二组：通配符路由（优先级最低）
    for (const route of routes) {
        if (!route.path.includes("*")) continue;

        const result = processSingleRoute(
            route,
            path,
            parentMatchedRoute,
            inputQuery,
            id,
        );
        if (result) return result;
    }

    // 顶层无匹配时，根据路径决定是否返回未匹配路由项
    if (parentMatchedRoute === null) {
        // 对于根路径且没有子路由匹配的情况，返回空数组
        // 让主函数决定是否返回根路由本身
        if (path === "/" || path === "") {
            return [];
        }
        // 对于非根路径的无匹配情况，返回未匹配路由项（404处理）
        const unmatchedItem = createUnmatchedRouteItem(path, null, inputQuery, id);
        return [unmatchedItem];
    }

    return [];
}

/**
 * 主路由匹配函数 - 新版实现
 *
 * 支持返回单个或多个匹配项，支持重定向处理
 *
 * @param path - 当前 URL 路径
 * @param roots - 树形路由表配置（具有唯一根节点）
 * @param options - 匹配选项
 * @returns 匹配的路由项数组，包含根路由和匹配分支上的所有 KylinMatchedRouteItem
 *
 * @example
 * // 返回完整的匹配分支（包括根路由）
 * const roots = {
 *   path: "/",
 *   children: [
 *     { name: "home", path: "" },
 *     { name: "user", path: "user" }
 *   ]
 * };
 * matchRoute("/user/123", roots);
 * // 返回: [{ route: root, ... }, { route: user, ... }]
 */
export function matchRoute(
    path: string,
    roots: KylinRouteItem,
    options?: MatchRouteOptions,
): KylinMatchedRouteItem[] {
    const { pathname: pathWithoutQuery, query: inputQuery } = parseQueryString(path);
    const normalizedPath = normalizePath(pathWithoutQuery);
    const redirectChain = options?._redirectChain || [];
    const maxRedirect = options?.maxRedirect ?? 10;
    const namedRoutes = options?.namedRoutes;

    const currentId = ++matchedId;

    // 创建根路由的匹配项（根路由的 path 一定是 "/"）
    // @ts-ignore
    const rootMatch: KylinMatchedRouteItem = {
        id: currentId,
        route: roots,
        params: {},
        query: inputQuery,
        url: "/",
        path: "/",
        hash: "",
    };
    rootMatch.hash = getRouteHash(rootMatch);

    // 从根节点的 children 开始匹配
    const rootChildren = roots.children || [];
    let childMatches = _matchRoutesInternal(
        normalizedPath,
        rootChildren,
        null,
        inputQuery,
        currentId,
    );

    // 检查子路由是否有真正的匹配（不是未匹配项）
    const hasRealMatch = childMatches.some((match) => match.route !== undefined);

    // 如果子路由有真正的匹配，将根路由添加到开头
    if (hasRealMatch) {
        childMatches = [rootMatch, ...childMatches];
    } else if (normalizedPath === "/" || normalizedPath === "") {
        // 如果路径是根路径，检查是否有默认子路由
        const defaultMatches = findDefaultRoute(
            rootChildren || [],
            rootMatch,
            inputQuery,
            currentId,
        );

        if (defaultMatches && defaultMatches.length > 0) {
            childMatches = [rootMatch, ...defaultMatches];
        } else {
            // 没有默认子路由，只返回根路由
            childMatches = [rootMatch];
        }
    } else if (childMatches.length > 0) {
        // 如果子路由返回了结果（包括未匹配项），都将根路由添加到开头
        childMatches = [rootMatch, ...childMatches];
    } else {
        // 否则返回空数组
        return [];
    }

    // 获取最深层匹配的路由项
    const deepestRoute = childMatches[childMatches.length - 1];

    // 防止无限重定向：检查 maxRedirect
    if (maxRedirect < 0) {
        // 返回带错误的结果
        const lastMatched = childMatches[childMatches.length - 1];
        return [
            ...childMatches.slice(0, -1),
            {
                ...lastMatched,
                route: undefined,
                error: new KylinMaxRedirectRouteError(lastMatched),
                redirectFrom: redirectChain.length > 0 ? [...redirectChain] : undefined,
            },
        ];
    }

    // 检测重定向循环
    if (redirectChain.some((item) => item.url === normalizedPath)) {
        // 返回带错误的结果
        const lastMatched = childMatches[childMatches.length - 1];
        return [
            ...childMatches.slice(0, -1),
            {
                ...lastMatched,
                route: undefined,
                error: new KylinLoopRouteError(lastMatched),
                redirectFrom: redirectChain.length > 0 ? [...redirectChain] : undefined,
            },
        ];
    }

    // 检查路由级重定向
    if (deepestRoute?.route?.redirect) {
        const redirectResult = resolveRedirect(
            deepestRoute.route.redirect,
            namedRoutes,
            deepestRoute,
        );

        // 如果命名路由不存在，返回错误
        if (redirectResult === null) {
            return childMatches.map((r) => ({ ...r, redirectFrom: undefined }));
        }

        const { target: redirectTarget, mode, windowTarget, notFound, isExternal } = redirectResult;

        // 如果重定向目标不存在（命名路由未找到），返回错误
        if (notFound) {
            const lastMatched = childMatches[childMatches.length - 1];
            return [
                ...childMatches.slice(0, -1),
                {
                    ...lastMatched,
                    target: windowTarget,
                    error: new KylinNotFoundRouteError(redirectTarget, lastMatched),
                    redirectFrom: redirectChain.length > 0 ? [...redirectChain] : undefined,
                },
            ];
        }

        // 检查是否为外部链接
        if (isExternal) {
            const lastMatched = childMatches[childMatches.length - 1];
            return [
                ...childMatches.slice(0, -1),
                {
                    ...lastMatched,
                    target: windowTarget || "_blank",
                    error: new KylinExternalRouteError(redirectTarget, windowTarget || "_blank"),
                    redirectFrom: redirectChain.length > 0 ? [...redirectChain] : undefined,
                },
            ];
        }

        // 递归调用，传递新的重定向链，maxRedirect 减 1
        const newChain = [...redirectChain, { url: normalizedPath, mode }];
        const recursiveResult = matchRoute(redirectTarget, roots, {
            ...options,
            _redirectChain: newChain,
            maxRedirect: maxRedirect - 1,
        });

        // 如果递归结果已包含错误（如循环检测或最大重定向限制），直接返回
        const hasError = recursiveResult.some((r) => r.error !== undefined);
        if (hasError) {
            return recursiveResult;
        }

        // 如果重定向目标路径不存在，返回错误
        // 检查：结果为空，或只有根路由+未匹配项（没有真正的路由匹配）
        const hasValidMatch =
            recursiveResult.length > 1 &&
            recursiveResult.slice(1).some((r) => r.route !== undefined);

        if (!hasValidMatch) {
            const lastMatched = childMatches[childMatches.length - 1];
            return [
                ...childMatches.slice(0, -1),
                {
                    ...lastMatched,
                    target: windowTarget,
                    error: new KylinNotFoundRouteError(redirectTarget, lastMatched),
                    redirectFrom: redirectChain.length > 0 ? [...redirectChain] : undefined,
                },
            ];
        }

        // 将 windowTarget 添加到递归结果的每个匹配项
        return recursiveResult.map((r) => ({
            ...r,
            target: windowTarget,
        }));
    }

    // 检查全局重定向（仅当无路由级重定向时，且是原始调用）
    if (options?.redirect && !deepestRoute?.route?.redirect && redirectChain.length === 0) {
        const redirectResult = resolveRedirect(options.redirect, namedRoutes, deepestRoute);

        if (redirectResult) {
            const {
                target: redirectTarget,
                mode,
                windowTarget,
                notFound,
                isExternal,
            } = redirectResult;

            // 如果重定向目标不存在（命名路由未找到），返回错误
            if (notFound) {
                const lastMatched = childMatches[childMatches.length - 1];
                return [
                    ...childMatches.slice(0, -1),
                    {
                        ...lastMatched,
                        target: windowTarget,
                        error: new KylinNotFoundRouteError(redirectTarget, lastMatched),
                        redirectFrom: redirectChain.length > 0 ? [...redirectChain] : undefined,
                    },
                ];
            }

            // 检查是否为外部链接
            if (isExternal) {
                const lastMatched = childMatches[childMatches.length - 1];
                return [
                    ...childMatches.slice(0, -1),
                    {
                        ...lastMatched,
                        target: windowTarget || "_blank",
                        error: new KylinExternalRouteError(
                            redirectTarget,
                            windowTarget || "_blank",
                        ),
                        redirectFrom: redirectChain.length > 0 ? [...redirectChain] : undefined,
                    },
                ];
            }

            const newChain = [...redirectChain, { url: normalizedPath, mode }];
            const recursiveResult = matchRoute(redirectTarget, roots, {
                ...options,
                _redirectChain: newChain,
                maxRedirect: maxRedirect - 1,
            });

            // 如果递归结果已包含错误（如循环检测或最大重定向限制），直接返回
            const hasError = recursiveResult.some((r) => r.error !== undefined);
            if (hasError) {
                return recursiveResult;
            }

            // 如果重定向目标路径不存在，返回错误
            // 检查：结果为空，或只有根路由+未匹配项（没有真正的路由匹配）
            const hasValidMatch =
                recursiveResult.length > 1 &&
                recursiveResult.slice(1).some((r) => r.route !== undefined);

            if (!hasValidMatch) {
                const lastMatched = childMatches[childMatches.length - 1];
                return [
                    ...childMatches.slice(0, -1),
                    {
                        ...lastMatched,
                        target: windowTarget,
                        error: new KylinNotFoundRouteError(redirectTarget, lastMatched),
                        redirectFrom: redirectChain.length > 0 ? [...redirectChain] : undefined,
                    },
                ];
            }

            // 将 windowTarget 添加到递归结果的每个匹配项
            return recursiveResult.map((r) => ({
                ...r,
                target: windowTarget,
            }));
        }
    }

    // 无重定向：在结果上附加重定向历史
    return childMatches.map((r) => ({
        ...r,
        redirectFrom: redirectChain.length > 0 ? [...redirectChain] : undefined,
    }));
}
