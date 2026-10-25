/**
 * 轻量宽松 JSON 转标准 JSON，替代 really-relaxed-json (~214 KB UMD bundle)。
 *
 * 用法：JSON.parse(relaxedToJson(raw))
 *
 * 支持：无引号键名、尾逗号、单引号字符串、嵌套对象和数组、裸值透传。
 */
export declare function relaxedToJson(input: string): string;
