/**
 * 静态主题包同源生成器（ADR-0004 / ADR-0005 / ADR-0006）。
 *
 * 与运行时注入共用同一份 ThemeScope 生成逻辑：构造一个不 connect 的 root
 * scope，直接取 toStyles()（base → colors → semantics，顺序与运行时 connect
 * 注入一致），再经 assembleStaticThemeCss 前置指纹块、追加维度烘焙守卫块。
 * 物理上不存在第二套 CSS 生成逻辑，杜绝分叉；输出漂移由 static-theme.test.ts
 * 的同源断言与 golden 快照兜底。
 *
 * 组装函数 assembleStaticThemeCss 同时服务运行时 ThemeScope._resolveDownloadCss
 * 的 root 分支（ADR-0006：download() 产物即合规静态包）——本模块 import scope，
 * scope 只能反向依赖不 import 本模块的组装纯函数，避免循环引用。
 *
 * 不经 src/utils/index.ts 再导出（该模块被 scope.ts 依赖，避免循环引用）；
 * CLI（scripts/generate-theme.ts）与测试直接引用本文件。
 */
import { AutoSparkThemeScope } from "../scope";
import type { ThemeOptions } from "../types";
import { assembleStaticThemeCss } from "./staticThemeCss";

export type GenerateStaticThemeOptions = Pick<
    ThemeOptions,
    | "themeColor"
    | "dark"
    | "colorized"
    | "size"
    | "spacing"
    | "shadow"
    | "radius"
    | "seedLightnessGap"
    | "chromaBoostCap"
    | "primary"
    | "success"
    | "warning"
    | "danger"
    | "info"
>;

/**
 * 生成一份完整静态主题包 CSS（指纹块 + 基量 + 主题标尺亮/暗块 + 语义色
 * + 维度烘焙守卫块）。选择器固定 :host,:root——静态包只服务 root 作用域，
 * 局部作用域永远运行时注入。
 */
export function generateStaticThemeCss(
    options: GenerateStaticThemeOptions & { themeColor: string },
): string {
    const scope = new AutoSparkThemeScope({
        id: "root",
        cssSelector: [":host", ":root"],
        autoConnect: false,
        autoAttach: false,
        persistence: false,
        ...options,
    });
    // 指纹取自 scope 归一后的生效 options（默认值由构造函数补齐），与运行时
    // connect() 水合后参与比对的字段同源。
    return assembleStaticThemeCss(scope.toStyles(), {
        themeColor: scope.options.themeColor,
        seedLightnessGap: scope.options.seedLightnessGap,
        chromaBoostCap: scope.options.chromaBoostCap,
        primary: scope.options.primary,
        success: scope.options.success,
        warning: scope.options.warning,
        danger: scope.options.danger,
        info: scope.options.info,
        dark: scope.options.dark,
        colorized: scope.options.colorized,
        size: scope.options.size,
        spacing: scope.options.spacing,
        shadow: scope.options.shadow,
        radius: scope.options.radius,
    });
}
