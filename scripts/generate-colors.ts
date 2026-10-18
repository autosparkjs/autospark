/**
 * 调用 packages/theme 的 generateThemeGradientColors 生成 10 阶梯度调色板，
 * 以 CSS 自定义属性形式输出（格式同 packages/theme/src/styles/colors.less）。
 *
 * 用法：
 *   bun run generate-colors <颜色> [变量名前缀]
 *
 * 示例：
 *   bun run generate-colors "#9b9b9b" gray
 *   # 输出：
 *   #   --x-color-gray-0: #FAFAFA;
 *   #   ...
 *   #   --x-color-gray-9: #1F1F1F;
 */
import { generateThemeGradientColors } from "../packages/theme/src/utils/generateThemeGradientColors";

const [color, name = "primary"] = process.argv.slice(2);

if (!color) {
    console.error("用法: bun run generate-colors <颜色> [变量名前缀]");
    console.error('示例: bun run generate-colors "#9b9b9b" gray');
    process.exit(1);
}

const palette = generateThemeGradientColors(color);
palette.forEach((hex, i) => {
    console.log(`    --x-color-${name}-${i}: ${hex};`);
});
