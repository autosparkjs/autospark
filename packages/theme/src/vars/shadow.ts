import type { ThemeSize } from '@/types'

function getShadowVars(size: ThemeSize | 'none') {
    return {
        '--auto-shadow': `var(--x-shadow-${size})!important`,
    }
}

export const shadowVars = {
    'none': getShadowVars('none'),
    'x-small': getShadowVars('x-small'),
    small: getShadowVars('small'),
    medium: getShadowVars('medium'),
    large: getShadowVars('large'),
    'x-large': getShadowVars('x-large'),
}

/**
 * 暗色专属阴影五档：深底上中灰阴影（baseVars 配方）不可见，换黑色系高不透明度。
 * 仅覆盖 --x-shadow-* 基变量，data-shadow 尺寸切换（--auto-shadow 档位引用）自动生效。
 */
export const darkShadowVars = {
    '--x-shadow-x-small': '0 1px 2px hsl(0 0% 0% / 35%)',
    '--x-shadow-small': '0 1px 2px hsl(0 0% 0% / 45%)',
    '--x-shadow-medium': '0 2px 4px hsl(0 0% 0% / 50%)',
    '--x-shadow-large': '0 2px 8px hsl(0 0% 0% / 55%)',
    '--x-shadow-x-large': '0 4px 16px hsl(0 0% 0% / 60%)',
}
