/**
 * 静态主题包组装（ADR-0004 / ADR-0005 / ADR-0006）。
 *
 * 「指纹规则块 + 三块样式 + 维度烘焙守卫块」的纯函数组装，不依赖 ThemeScope——
 * CLI（scripts/generate-theme.ts 经 generateStaticTheme.ts）与运行时
 * ThemeScope._resolveDownloadCss（root 分支，ADR-0006）共用同一组装入口，
 * 两条产物路径逐字节一致，物理上不存在第二套静态包形态。
 *
 * 维度烘焙守卫块：dark/colorized/size/spacing/shadow/radius 经「守卫块」纯追加
 * 在三块样式之后——`:root:not([data-X])` 形选择器只在对应属性缺席时命中（零 JS
 * 首帧窗口），特异性压过基块使烘焙值成为默认；属性一经物化（运行时首访采纳
 * 指纹默认后写 <html>）守卫即失效，标准覆盖块接管同值，幂等。
 */
import type { ThemeOptions } from "../types";
import { type StaticFingerprintOptions } from "./staticFingerprint";
/** 参与烘焙的六个维度（调用侧须传归一后的生效值，缺省即「未烘焙」） */
export type BakedDimensionOptions = Required<Pick<ThemeOptions, "dark" | "colorized" | "size" | "spacing" | "shadow" | "radius">>;
/**
 * 生成维度烘焙守卫块（ADR-0005）。变量表逐字节复用 vars/*（!important 原样
 * 保留——守卫靠 :not() 失效而非被压过，important 无害且免去二次加工）。
 *
 * 唯一加工：dark 守卫剔除 darkShadowVars 的自举键 --auto-shadow——它与 size
 * 守卫交叠（sizeVars 按档驱动 --auto-shadow），同窗口内两守卫特异性 (0,4,0)>
 * (0,2,0) 会把烘焙档位钉回 medium。剔除后 --auto-shadow 由基块/ size 守卫
 * 声明、--x-shadow-* 由本守卫覆盖为暗配方，引用链在根上自洽（原自举键服务
 * 的是非根 data-dark 元素，由标准 [dark] 块负责，与守卫无关）。
 */
export declare function bakeDimensionGuards(options: BakedDimensionOptions): string;
/**
 * 组装一份完整静态主题包 CSS：指纹规则块 + 三块样式（调用侧生成）+ 维度烘焙
 * 守卫块。选择器约定 :host,:root——静态包只服务 root 作用域，三块样式须由
 * cssSelector 为 [":host", ":root"] 的 root scope 生成（ADR-0006）。
 */
export declare function assembleStaticThemeCss(css: string, options: StaticFingerprintOptions & BakedDimensionOptions): string;
