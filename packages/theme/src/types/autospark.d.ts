/**
 * 构建期 autospark 类型垫片（theme 包内专用，emit-time only）。
 *
 * 用途：`build:types`（tsc --emitDeclarationOnly）的 emit 程序必须能解析
 * plugin.ts 的 `import type { AutoSpark }` 与 `declare module "autospark"`
 * 增强目标——映射到 engine 源码会把整张引擎类型图（?raw 资源、内部类型面）拖进
 * emit 程序；映射到本垫片则 emit 程序收敛为 theme 源自身。
 *
 * 边界纪律：
 * - 仅服务声明产物生成，**不发布**（files: dist）；dev/editor 类型走 tsconfig.json
 *   的 engine 源码映射，垫片签名与真实面的偏差在 build 时即刻暴露；
 * - plugin.ts 公开 API（themeManager / ThemeProjectionState / 增强块）不引用
 *   垫片内类型——产出的 dist/index.d.ts 对 "autospark" 零类型引用，增强块在
 *   消费端与真实引擎类型合并。
 */
export type Dict = Record<string, any>;

export declare class AutoSpark<State extends Dict = Record<string, any>> {
    static ready(cb: (engine: any) => void): void;
    static precompile(cb: (engine: any) => void): void;
    options: Record<string, any>;
    store: {
        watch(paths: string | string[], cb: (operate: { path: string[]; value: any }) => void): {
            off(): void;
        };
    };
    state: { $: AutoSparkMeta } & Record<string, any>;
    on(event: string, cb: () => void): void;
}

export interface AutoSparkMeta extends Record<string, any> {}
