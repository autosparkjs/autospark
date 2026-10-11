/**
 * EventEmitter - 基于 Mitt 的事件发射器类
 *
 * 提供类型安全的事件管理，支持继承和扩展：
 * - 封装 mitt 实例，提供简洁的 API
 * - 支持泛型类型定义，确保事件名称和数据类型安全
 * - 提供常用方法：on、off、emit、once
 * - 可作为基类被继承，用于构建自定义事件管理器
 *
 * 使用示例：
 * ```ts
 * // 定义事件类型
 * interface MyEvents {
 *   change: { value: string };
 *   error: Error;
 * }
 *
 * // 继承 EventEmitter
 * class MyClass extends EventEmitter<MyEvents> {
 *   doSomething() {
 *     this.emit('change', { value: 'hello' });
 *   }
 * }
 *
 * // 直接实例化
 * const emitter = new EventEmitter<MyEvents>();
 * emitter.on('change', (data) => console.log(data.value));
 * ```
 */

import mitt from "mitt";
import type { Emitter } from "mitt";

/**
 * 事件类型映射
 * Key 是事件名称，Value 是事件数据类型
 * 使用 unknown 作为数据类型表示无数据事件
 */
export type EventHandlerMap = Record<string, unknown>;

/**
 * 事件处理器类型
 */
export type EventHandler<T = unknown> = (data: T) => void;

/**
 * EventEmitter 类
 *
 * 基于 mitt 封装的事件发射器，提供类型安全的事件管理
 *
 * @template Events - 事件类型映射，定义事件名称和对应的数据类型
 *
 * @example
 * ```ts
 * // 定义事件类型
 * interface AppEvents {
 *   routeChange: { path: string; params: Record<string, string> };
 *   userLogin: { userId: string };
 *   logout: void;
 * }
 *
 * // 继承使用
 * class Router extends EventEmitter<AppEvents> {
 *   navigate(path: string) {
 *     this.emit('routeChange', { path, params: {} });
 *   }
 * }
 *
 * // 直接实例化
 * const emitter = new EventEmitter<AppEvents>();
 * emitter.on('routeChange', (data) => {
 *   console.log(`Navigated to ${data.path}`);
 * });
 * ```
 */
export class EventEmitter<Events extends EventHandlerMap = Record<string, unknown>> {
    /**
     * Mitt 实例
     * 使用非空断言，因为在构造函数中初始化
     */
    protected _emitter!: Emitter<Events>;

    /**
     * 保留的事件数据映射
     * 存储设置了 retain 的事件的最后一条数据
     * 懒加载，仅在需要时创建
     */
    private _retainEvents?: Map<keyof Events, Events[keyof Events]>;

    /**
     * 构造函数
     * 初始化 mitt 实例
     */
    constructor() {
        this._initEmitter();
    }

    /**
     * 初始化 mitt 实例
     * 分离初始化逻辑，便于子类重写
     */
    protected _initEmitter(): void {
        this._emitter = mitt<Events>();
    }

    /**
     * 注册事件监听器
     * 如果该事件有保留的数据（retain），会立即触发 handler
     *
     * @param event - 事件名称
     * @param handler - 事件处理函数
     * @returns 取消订阅的函数
     *
     * @example
     * ```ts
     * const unsubscribe = emitter.on('routeChange', (data) => {
     *   console.log(data.path);
     * });
     * // 取消订阅
     * unsubscribe();
     * ```
     */
    public on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): () => void {
        this._emitter.on(event, handler);

        // 检查是否有保留的数据，如果有则立即触发
        const retainedData = this._retainEvents?.get(event);
        if (retainedData !== undefined) {
            handler(retainedData as Events[K]);
        }

        // 返回取消订阅函数
        return () => this.off(event, handler);
    }

    /**
     * 注册一次性事件监听器
     * 事件触发后自动移除监听器
     *
     * @param event - 事件名称
     * @param handler - 事件处理函数
     * @returns 取消订阅的函数
     *
     * @example
     * ```ts
     * emitter.once('init', () => {
     *   console.log('仅执行一次');
     * });
     * ```
     */
    public once<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): () => void {
        // 使用立即执行函数创建包装处理器，避免类型推断问题
        const setup = () => {
            let active = true;

            const wrappedHandler: EventHandler<Events[K]> = (data: Events[K]) => {
                if (!active) return;
                active = false;
                // 执行原始处理器
                handler(data);
                // 移除监听器
                this._emitter.off(event, wrappedHandler);
            };

            return wrappedHandler;
        };

        const wrappedHandler = setup();

        // 注册包装处理器
        this._emitter.on(event, wrappedHandler);

        // 返回取消订阅函数
        return () => this._emitter.off(event, wrappedHandler);
    }

    /**
     * 移除事件监听器
     *
     * @param event - 事件名称
     * @param handler - 要移除的事件处理函数，如果不提供则移除该事件的所有监听器
     *
     * @example
     * ```ts
     * // 移除特定处理器
     * emitter.off('routeChange', handler);
     *
     * // 移除所有处理器
     * emitter.off('routeChange');
     * ```
     */
    public off<K extends keyof Events>(event: K, handler?: EventHandler<Events[K]>): void {
        if (handler) {
            this._emitter.off(event, handler);
        } else {
            this._emitter.all.clear();
        }
    }

    /**
     * 监听所有事件
     *
     * @param handler - 事件处理函数，接收事件名称和数据作为参数
     * @returns 取消订阅的函数
     *
     * @example
     * ```ts
     * const unsubscribe = emitter.onAny((event, data) => {
     *   console.log(`Event ${event}:`, data);
     * });
     * // 取消订阅
     * unsubscribe();
     * ```
     */
    public onAny(handler: (event: keyof Events, data: Events[keyof Events]) => void): () => void {
        this._emitter.on("*", handler as any);
        // 返回取消订阅函数
        return () => this._emitter.off("*", handler as any);
    }

    /**
     * 触发事件
     *
     * @param event - 事件名称
     * @param data - 事件数据
     * @param retain - 是否保留此事件数据，后续订阅者会立即收到最后保留的数据
     *
     * @example
     * ```ts
     * // 普通触发
     * emitter.emit('routeChange', { path: '/home', params: {} });
     *
     * // 保留事件数据，后续订阅者会立即收到
     * emitter.emit('init', { status: 'ready' }, true);
     * ```
     */
    public emit<K extends keyof Events>(event: K, data: Events[K], retain?: boolean): void {
        // 如果需要保留，保存数据
        if (retain) {
            if (!this._retainEvents) {
                this._retainEvents = new Map();
            }
            this._retainEvents.set(event, data);
        }
        this._emitter.emit(event, data);
    }
}
