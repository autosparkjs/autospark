export type AutoDirectiveInfo = {
    name: string;
    value?: string;
    attr?: string;
    modifiers?: string[];
    options?: Record<string, any>;
    /**
     * 选项成员属性（ADR-0007 修订：选项定向与成员属性）：成员名 → 表达式文本。
     * 由 `x-{name}-options.<成员>` / `x-{name}-options:<参数>.<成员>` 声明，值是**表达式**
     * （经 binding.watch 求值，可绑定响应式状态），优先级高于 options 内同名键（整键覆盖）。
     * 消费方经基类 `_watchOptionExprs` 统一建订阅、`getOption` 读取收敛终值。
     */
    optionExprs?: Record<string, string>;
};

/**
 *
 *
 *
 * const store = new AutoStore({
 *    order:{
 *       name:"AutoStore",
 *       price:100,
 *       count: 3
 *    }
 * })
 * <div x-text="order.price * order.count"/>   item是全局store中成员
 * <div x-text="item"/>   item是全局store中成员

 * <div x-for="item of items">  // items是store成员
 *  <div x-text="item.id"/>
 * </div>
 *
 *  item是div创建的是上下文变量,item会覆盖state.item
 *  如果一定要访问store中的成员，则需要使用 $store.item
 *
 *
 *
 */
// export class TextDirective extends TemplateDirectiveBase {
//     override created(): void {
//         const value = this.value;
//         this.watch(this.value, ({ value }) => {
//             if (this.el) this.el.innerText = value;
//         });
//     }
//     override compile(_context: Record<string, any>, _parent: HTMLElement) {
//         if (this.el) {
//             this.el.innerText = getVal(this.engine.store.state, this.value);
//         }
//     }
// }
