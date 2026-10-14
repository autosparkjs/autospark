import type { ThemeSize } from '@/types'

function getSpacingVars(spacing: ThemeSize) {
    return {
        '--auto-spacing': `var(--x-spacing-${spacing}) !important`,
        '--auto-padding': `var(--x-spacing-${spacing}) !important`,
        '--auto-margin': `var(--x-spacing-${spacing}) !important`,
        /* 消费方（button.less/input.less）取 var(--auto-input-padding)——它在
         * derivedVars 中组合 var(--auto-padding)，与 --auto-padding 同步按档直引梯度。 */
        '--auto-input-padding': `var(--x-spacing-${spacing}) !important`,
    }
}

export const spacingVars = {
    'none': getSpacingVars('none'),
    'x-small': getSpacingVars('x-small'),
    small: getSpacingVars('small'),
    medium: getSpacingVars('medium'),
    large: getSpacingVars('large'),
    'x-large': getSpacingVars('x-large'),
}
