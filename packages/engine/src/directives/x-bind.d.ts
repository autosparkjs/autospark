import { AutoSparkDirectiveBase } from "../features/directive/base";
/**
 * 属性绑定指令（singleton=false，priority=50）。
 *
 * `x-bind:attr` / `:attr` 绑定任意属性；`x-class` / `x-style` 作为其特化别名——
 * 经 `getDirectives` 解析期归一化为 `bind+class` / `bind+style`，**无独立指令类、零运行时实体**。
 * 因此 `x-class` / `:class` / `x-bind:class` 三种写法完全等价。
 *
 * **无参形态 `x-bind="expr"` = 属性展开**（ADR-0043）：值须为对象，整对象摊成 N 个属性
 * （`<div x-bind="{title:tip, disabled:locked}">`）。展开逻辑委托 `SpreadBinder`（bind-spread.ts），
 * 值→属性写入与单属性绑定共用 `patchAttrValue` 五路分派（utils/attrPatch.ts）。
 *
 * ## 两个值来源（正交，见 ADR-0019）
 *
 * - **状态绑定**（默认，value 不含 `@`）：整值表达式经 `scope.watch` 订阅 store.state（纯路径走精准订阅，
 *   表达式走 `collectDependencies`，自动注入 x-for 的 localData）。支持相对表达式。`order.price` = 绑状态值。
 * - **配置绑定**（value 含 `@`）：`:placeholder="order.price@placeholder"` 把值来源切到 `configManager`
 *   元数据。`@` 左为**配置状态路径**（定位 configManager.state 中的 schema 条目），右为**配置属性路径**
 *   （schema 对象的属性，**支持多段嵌套**，如 `@style.color` 读 `schema.style.color`；schema 可扩展故无白名单）。
 *   用 `indexOf("@")` 第一个 `@` 分割。`@` 两侧纯路径 only，不支持表达式。经 `configManager.collectDependencies("read")`
 *   自动追踪依赖（含嵌套），回调同样经 scheduler 合并。configManager/schema 不存在 → warn + 静默；
 *   属性取不到 → 复用 patch removeAttribute。
 *
 * ## 求值（状态绑定）
 * **patch 按 attr 分派**（顺序敏感，`checked` 同属 property 与 boolean → property 优先；
 * 分派实现提炼于 utils/attrPatch.ts，与无参属性展开 SpreadBinder 共享同一抽象）：
 * - `class` → `normalizeClass` + `classList` diff（有 `lastApplied` 状态，**绝不用 `className=`**，
 *   原生 `class` 属性的 token 永不被碰；静态类走原生 `class`、动态类走 x-class，dirty tracking 合并）
 * - `style` → 字符串 `cssText` 整体替换 / 对象按 key 增删 diff（`lastAppliedStyle` 清残留，避免 `Object.assign` 合并泄漏）
 * - property 型（`value` / `checked`）→ `el[attr] = value`（**单向 state→DOM，非 x-model 双向**）
 * - boolean 型（`disabled` / `readonly` / `hidden` / `selected` / `multiple`）→ truthy `setAttribute` / falsy `removeAttribute`
 * - 普通 attribute → null/undefined/false `removeAttribute`，否则 `setAttribute(attr, String(value))`
 *
 * ## `.invert` 修饰符（值取反，ADR-0025）
 * `:attr.invert="expr"` 对**求值结果取反**（`!value`），语义化用于 boolean 型属性的**反向词汇映射**
 * （如 schema `enable`（true=可用）→ DOM `disabled`）。状态绑定与配置绑定均生效；对非布尔属性
 * 无意义（字符串 `!` 后恒 `true`），引擎不禁止、文档声明约定。x-model 元数据注入的
 * `enable → disabled` 反向即经此实现（合成 `:disabled.invert="path@enable"`，ADR-0020 决策 7 修订）。
 *
 * **求值抛错**：`scope.watch` 宽松求值返回 `undefined` → patch 普通 attr 分支 `removeAttribute`，不中断。
 *
 * **多实例**：singleton=false，同元素多个 `:attr` 各自独立；多个 `:class` 各维护 diff 状态，
 * 同名类不做引用计数，destroy 可能误删共有类（接受，文档不保证）。无参展开与显式 `:attr` 同键
 * 竞写同样不裁决（文档不保证，ADR-0043）。
 *
 * @example 普通属性（`:title` 与 `x-bind:title` 完全等价，后者为缩写）
 * <span :title="user.name"></span>
 * // state: { user:{name:'a'} } → store.user.name='b' → <span title="b">
 *
 * @example class 三写法等价：`x-class` / `:class` / `x-bind:class`（解析期归一化为 bind+class）
 * <div x-class="variant"></div>
 * // state: { variant:'primary' } → class="primary"；variant='secondary' → class="secondary"
 *
 * @example class 全形态：字符串空格拆分 / 对象多条件开关 / 三元表达式
 * <div x-class="v"></div>                                        // state:{v:'foo bar'} → class="foo bar"
 * <div x-class="{active:isActive, disabled:isDisabled}"></div>
 * // state:{isActive:true,isDisabled:false} → class="active"；isDisabled=true → class="active disabled"
 * <div x-class="paid ? 'on' : 'off'"></div>                      // state:{paid:true} → class="on"；paid=false → "off"
 *
 * @example 原生 class 与 x-class 共存（静态 token 永不被碰、不被覆盖）
 * <div class="btn" x-class="{primary:isPrimary}"></div>
 * // state:{isPrimary:true} → class="btn primary"；isPrimary=false → class="btn"
 *
 * @example x-style：字符串走 `cssText` 整体替换 / 对象按 key diff（切换时清除上次多余 key，不残留）
 * <div x-style="styleStr"></div>                                 // state:{styleStr:'color:red'} → style="color:red"
 * <div x-style="styleObj"></div>                                 // state:{styleObj:{color:'red',fontSize:'12px'}} → 写入 el.style
 * // 求值为 null/undefined/false/'' → 移除 style 属性
 *
 * @example x-style.transition：注入 CSS `transition` 属性，使内联样式变化被浏览器过渡动画
 * <div x-style.transition="s"></div>                             // state:{s:{color:'red'}} → 首渲即带 transition:all 0.2s ease-in
 * // 默认值 'all 0.2s ease-in'；x-options/x-bind-options 传字符串可覆盖；对象自带 transition key 显式优先；详见 ADR-0015
 *
 * @example `:value` / `:checked` 走 property，单向 state→DOM（非 x-model 双向，不监听 input 事件）
 * <input :value="text">
 * // state:{text:'a'} → store.text='b' → input.value='b'（回写 state 须另用 x-model）
 *
 * @example `:disabled` 等 boolean 型：truthy setAttribute / falsy removeAttribute
 * <button :disabled="locked">提交</button>
 * // state:{locked:true} → 禁用；locked=false → 解除（同此理：readonly / hidden / selected / multiple）
 *
 * @example `.invert` 值取反：反向词汇映射（enable=可用 → disabled=禁用）
 * <button :disabled.invert="editable">提交</button>
 * // state:{editable:true} → !true=false → 不禁用；editable=false → 禁用
 * <input :disabled.invert="order.price@enable"/>
 * // schema.enable=true（可用）→ disabled 移除；enable=false → disabled 设置
 *
 * @example `@` 配置引用：把 configManager 元数据响应式注入属性（见 ADR-0019）
 * <input :placeholder="order.price@placeholder"/>
 * // configManager.state["configKey.order.price"].placeholder = "请输入价格" → placeholder="请输入价格"
 * // @ 左 order.price 为配置状态路径，右 placeholder 为配置属性路径；改 schema.placeholder 自动更新
 *
 * @example `@` 右侧支持嵌套属性路径（绑 schema 对象属性）
 * <input :placeholder="order.price@style.color"/>
 * // 读 schema.style.color，支持任意深度嵌套
 *
 * @example `@` 全分派复用：class/style/property/boolean 均可绑元数据
 * <input :class="order.price@inputClass" :disabled="order.price@readonly"/>
 *
 * @example 无参形态 = 属性展开（ADR-0043）：整对象摊成 N 个属性，详见 bind-spread.ts
 * <div x-bind="{title: tip, disabled: locked, 'data-id': id}">
 * // state:{tip:'hi', locked:true, id:7} → <div title="hi" disabled data-id="7">
 * <div x-bind="attrs">
 * // state.attrs 整体替换 / 子键修改 / 增删键 → 均重展开（depth:2）
 */
export declare class BindDirective extends AutoSparkDirectiveBase {
    static readonly singleton = false;
    static readonly priority = 50;
    /** class/style 分支的 diff 状态（五路分派共享，见 utils/attrPatch.ts） */
    private _patchState;
    created(): void;
    /**
     * 配置绑定：把 `配置状态路径@配置属性路径` 绑到 configManager 元数据（ADR-0019）。
     *
     * - `indexOf("@")` 第一个 `@` 分割：左侧配置状态路径，右侧配置属性路径（支持多段嵌套，如 `style.color`）；
     * - 左侧 `splitPath(".")` 拼 fullKey（复刻 `configManager.add` 的 `joinPath([configKey?, ...pathKey])`，configKey 空串不加前缀）；
     * - 右侧 `splitPath(".")` 作为 getVal 路径读 schema 对象（支持任意深度嵌套）；
     * - `configManager.collectDependencies("read")` 在求值回调内 `getVal(state[fullKey], rightPath)` 自动追踪依赖
     *   （含嵌套层），规避手工拼 watch 路径；
     * - 三层降级：configManager/schema 不存在 → warn + 静默；属性取不到 → 复用 patch removeAttribute（不额外 warn）；
     * - watcher 进 `this.watchers`，随 scope.destroy 回收（与 scope 通道同构）；
     * - 回调经 `engine.scheduler.schedule` 合并（同 tick 多次变化合并成一次 patch）。
     */
    private _bindConfig;
    /**
     * 按 attr 分派写入（委托共享五路分派器 `patchAttrValue`，分派逻辑与注释见 utils/attrPatch.ts；
     * 与属性展开 SpreadBinder 依赖同一抽象，语义永不漂移）。
     */
    private patch;
    /**
     * 解析 `.transition` 配置层有效值（三级优先中的 ②③ 层，详见 ADR-0015）。
     *
     * - `getOption('transition') === true`（`.transition` 修饰符解析期注入）→ 默认 `'all 0.2s ease-in'`
     * - 字符串（`x-options` / `x-bind-options` 覆盖）→ 该字符串
     * - `false` / `undefined` → 不注入（显式 `false` 关闭，与 ADR-0007「显式 false 生效」一致）
     *
     * ① 层（用户 style 对象自带的 `transition` key）由 `patchAttrValue` 的 style 对象分支结构处理，不在此。
     */
    private resolveTransitionOption;
}
