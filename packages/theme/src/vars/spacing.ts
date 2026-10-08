import type { ThemeSize } from '@/types'

function getSpacingVars(spacing: ThemeSize) {
    return {
        '--auto-spacing': `var(--x-spacing-${spacing}) !important`,
        '--auto-padding': `var(--x-spacing-${spacing}) !important`,
        '--auto-margin': `var(--x-spacing-${spacing}) !important`,
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
