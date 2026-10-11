import type { KylinOutlet } from "./index";
import { css } from "lit";

/**
 * 布局基类
 * 定义所有布局必须实现的抽象接口
 */
export abstract class OutletLayoutBase {
    protected outlet: KylinOutlet;

    /**
     * 布局样式
     * 子类必须定义自己的样式
     */
    static styles: ReturnType<typeof css>;

    constructor(outlet: KylinOutlet) {
        this.outlet = outlet;
    }

    /**
     * 布局初始化
     * 在 connectedCallback 中调用
     */
    abstract init(): void;

    /**
     * 布局清理
     * 在 disconnectedCallback 中调用
     */
    abstract cleanup(): void;

    /**
     * 当视图容器变化时调用
     * @param mutations - MutationRecord 数组
     */
    abstract onSlotChange(mutations: MutationRecord[]): void;

    /**
     * 当属性变化时调用
     * @param name - 属性名
     * @param oldValue - 旧值
     * @param newValue - 新值
     */
    abstract onPropertyChanged(name: string, oldValue: any, newValue: any): void;
}
