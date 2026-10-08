import type { ThemeSize } from '../types'

function getSizeVars(size: ThemeSize) {
    return {
        /** 段落与字体 */
        '--auto-font-size': `var(--x-font-size-${size})`,
        '--auto-font-weight': `var(--x-font-weight-${size})`,
        '--auto-letter-spacing': `var(--x-letter-spacing-${size})`,
        '--auto-line-height': `var(--x-line-height-${size})`,
        /*
         * font 速写必须在每个档位选择器内重定义：
         * CSS 自定义属性的 var() 替换发生在定义元素（:root）的 computed value 阶段，
         * 若仅在 derivedVars（裸选择器）以 var(--auto-font-size) 组合定义，
         * 子元素继承的是已展开的具体值——局部 data-size 容器内无法联动。
         */
        '--auto-font': `var(--x-font-weight-${size}) var(--x-font-size-${size})/1.5 var(--auto-font-family)`,
        '--auto-title-font': `calc(var(--x-font-weight-${size}) + 200) calc(var(--x-font-size-${size}) * 1.05)/1.5 var(--auto-font-family)`,
        /* 用于内边距和外边距 */
        '--auto-spacing': `var(--x-spacing-${size})`,
        '--auto-padding': `var(--x-spacing-${size})`,
        '--auto-margin': `var(--x-spacing-${size})`,

        '--auto-shadow': `var(--x-shadow-${size})`,
        '--auto-icon-size': `calc(1.5 * var(--x-font-size-${size}))`,
        /* 输入框 */
        '--auto-input-height': `var(--x-input-height-${size})`,
    }
}

export const sizeVars = {
    'x-small': getSizeVars('x-small'),
    small: getSizeVars('small'),
    medium: getSizeVars('medium'),
    large: getSizeVars('large'),
    'x-large': getSizeVars('x-large'),
}
