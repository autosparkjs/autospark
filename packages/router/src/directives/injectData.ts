import type { Alpine } from "alpinejs";

// 缓存上次注入的数据，用于变化检测
const injectedDataCache = new WeakMap<HTMLElement, Record<string, any>>();
// 跟踪已设置 observer 的元素
const observedElements = new WeakSet<HTMLElement>();
// 存储 observer 引用以便清理
const elementObservers = new WeakMap<HTMLElement, MutationObserver>();

/**
 * 用于为注入数据
 * 支持监听 x-inject-data 属性变化并自动更新组件数据
 *
 *<div id="a" x-data="dropdown()"
     x-inject-data="{ extraProp: 'A专属', type: 'premium' }">
    <span x-text="extraProp"></span>
    <span x-text="type"></span>
</div>
 * @param Alpine
 */
export function registerInjectDataDirective(Alpine: Alpine): void {
    // 注册自定义指令
    Alpine.directive("inject-data", (el, { expression }, { evaluate }) => {
        const extraData = evaluate(expression) as Record<string, any>;
        const componentData = Alpine.$data(el) as Record<string, any>;

        // 获取上次注入的数据
        const previousData = injectedDataCache.get(el) || {};

        // 检查数据是否实际变化
        const hasChanges = Object.keys(extraData).some(key =>
            JSON.stringify(extraData[key]) !== JSON.stringify(previousData[key])
        );

        if (hasChanges || Object.keys(previousData).length === 0) {
            // 更新组件数据
            Object.assign(componentData, extraData);
            // 缓存当前数据
            injectedDataCache.set(el, { ...extraData });
        }

        // 设置 MutationObserver 监听属性变化
        if (!observedElements.has(el)) {
            observedElements.add(el);

            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' &&
                        mutation.attributeName === 'x-inject-data') {
                        // 属性变化时重新处理指令
                        const newExpression = el.getAttribute('x-inject-data');
                        if (newExpression) {
                            try {
                                const newExtraData = Alpine.evaluate(el, newExpression) as Record<string, any>;
                                const newComponentData = Alpine.$data(el) as Record<string, any>;
                                Object.assign(newComponentData, newExtraData);
                                injectedDataCache.set(el, { ...newExtraData });
                            } catch (e) {
                                console.warn('Failed to update inject-data:', e);
                            }
                        }
                    }
                });
            });

            observer.observe(el, {
                attributes: true,
                attributeFilter: ['x-inject-data']
            });

            elementObservers.set(el, observer);
        }
    });

    // 设置清理逻辑
    Alpine.onElRemoved((el) => {
        // 断开 observer 并清理缓存
        const observer = elementObservers.get(el);
        if (observer) {
            observer.disconnect();
            elementObservers.delete(el);
        }
        observedElements.delete(el);
        injectedDataCache.delete(el);
    });
}
