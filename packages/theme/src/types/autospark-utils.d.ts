/**
 * 构建期 @autospark/utils 类型垫片（theme 包内专用，emit-time only）——签名与
 * packages/utils/src/installPlugin/index.ts 的公开契约逐字同步（漂移在 build:types
 * 即刻暴露）。用途与边界见 ./autospark.d.ts 头注释。
 */
export declare function installPlugin(register: (autospark: any) => void): void;
