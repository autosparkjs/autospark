import type { AutoDirectiveInfo } from "../types";
/**
 *
 * 解析返回元素上的所有指令信息
 *
 * 指令形式：
 * <div x-if="xxx"></div>  // 普通指令，{name:"if",value:"xxx"}
 * <div x-calk></div>          // 只有名称没有值 {name:"calk"}
 * <div @click="xxxx"></div>    // 事件绑定指令,{name:"event",value:"xxx"}
 * <div x-event:click="xxx"></div>    // 事件绑定指令,{name:"event",value:"xxx"}
 * <div @click.debounce="xxx"></div>    // 事件绑定指令,{name:"event",value:"xxxx",attr:"click",modifiers:[debounce]}     *
 * <div x-bind:title="xxx"></div>   //   {name:"bind",value:"xxx",attr:"title"}
 * <div :title="xxx"></div>   //  {name:"bind",value:"xxx",attr:"title"},:title是快捷方式
 * <div x-if.once.y="xxx"></div> //{name:"if",value:"xxx",modifiers:["once","y"]}
 * <div x-if="xxx" x-if-options="{a:1}"></div> // {name:"if",value:"xxx",options:{a:1}}   以-options结性的视为对x-if指令的补充额外的选项参数
 *
 * x-if-options值必须是一个对象字符串，使用 relaxedToJson 进行解析
 *
 * 按顺序进行解析并返回结果
 *
 * 说明：
 * - 事件类指令（@event / x-on:name）统一解析为 name 为 "on"，事件名放入 attr，
 *   修饰符放入 modifiers；属性类指令（:attr / x-bind:name）统一解析为 name 为 "bind"。
 * - `@` 与 `:` 为固定快捷前缀，不受 prefix 参数影响；prefix 仅控制 x- 这类长前缀的识别。
 * - 指令选项（x-{name}-options）不单独占位，而是合并到同元素上同名指令的 options 字段；
 *   若找不到同名主指令则忽略（补充参数无主指令则无意义）。
 *   修订（ADR-0007）：-options 后缀家族扩展为四形态——整包 / 成员属性
 *   （`x-{name}-options.<成员>`，值为表达式，挂 optionExprs 字段）/ 定向整包 / 定向成员
 *   （`x-{name}-options:<参数>[.成员]`，冒号后首段匹配同名主指令 attr 即定向到该实例）。
 * - modifier（无参开关）在解析期注入为同名指令选项（options[name]=true，显式选项优先）；
 *   故指令层统一只读 options，不再读 modifiers（ADR-0007）。
 * - 元素级宿主选项（裸 x-options）不作为指令，由 getHostOptions 单独解析挂 scope。
 *
 * @param el
 */
export declare function getDirectives(el: HTMLElement, prefix?: string): AutoDirectiveInfo[];
/**
 * 解析元素级宿主选项 `x-options`（ADR-0007）。
 *
 * x-options 声明元素级共享配置，挂载到 scope.hostOptions，供同元素所有指令经
 * `getOption` 回退读取（指令选项未命中时回退到此）。值用宽松 JSON 解析，须为普通对象
 * （否则抛错，与 x-{name}-options 一致）。
 *
 * 与 getDirectives 分离：x-options 不是指令，不进入指令流（getDirectives 显式跳过裸 x-options）。
 *
 * @param el
 * @param prefix 指令前缀，默认 "x-"
 * @returns 解析后的宿主选项对象；元素无 x-options 属性时返回 undefined
 */
export declare function getHostOptions(el: HTMLElement, prefix?: string): Record<string, any> | undefined;
