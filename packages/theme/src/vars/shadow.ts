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
 * 覆盖 --x-shadow-* 基变量，并自举派生键 --auto-shadow——非根 data-dark 元素不重新
 * 声明它就继承根域已替换的亮阴影值。data-shadow / data-size 档位块生成在本块之后
 * （同特异性后者胜出、data-shadow 带 !important），档位切换正常覆盖本键。
 */
export const darkShadowVars = {
    '--x-shadow-x-small': '0 1px 2px hsl(0 0% 0% / 35%)',
    '--x-shadow-small': '0 1px 2px hsl(0 0% 0% / 45%)',
    '--x-shadow-medium': '0 2px 4px hsl(0 0% 0% / 50%)',
    '--x-shadow-large': '0 2px 8px hsl(0 0% 0% / 55%)',
    '--x-shadow-x-large': '0 4px 16px hsl(0 0% 0% / 60%)',
    '--auto-shadow': 'var(--x-shadow-medium)',
}
