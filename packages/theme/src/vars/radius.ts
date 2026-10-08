import type { ThemeSize } from '@/types'

function getRadiusVars(radius: ThemeSize) {
    return {
        '--auto-border-radius': `var(--x-border-radius-${radius})!important`,
    }
}

export const radiusVars = {
    'none': getRadiusVars('none'),
    'x-small': getRadiusVars('x-small'),
    small: getRadiusVars('small'),
    medium: getRadiusVars('medium'),
    large: getRadiusVars('large'),
    'x-large': getRadiusVars('x-large'),
}
