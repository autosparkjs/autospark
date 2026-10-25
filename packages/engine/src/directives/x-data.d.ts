import { AutoSparkDirectiveBase } from "../features/directive/base";
/**
 * x-data：数据指令（非结构指令）。编译期（`created`）解析模板 `x-data="..."` 的值并写入响应式
 * 数据域，供后代与同级表达式读取。
 *
 * ```html
 * <div x-data="{a:1}">
 *   <span x-text="a"></span>
 * </div>
 * ```
 *
 * **统一挂载模型（ADR-0029）——数据总要挂进全局状态树的某个容器，`mount` 选项指定挂在哪**：
 *
 * - **默认**（`x-data="{a:1}"`）：数据写入**私有响应式域** `store.state.$scopes[scope.id]`
 *   （`scope.data` 指向该 store 代理对象）。经 `getContext` 与 localData 同级叠加暴露，
 *   子树可见、scope 间隔离。读写经 store → `collectDependencies` 收集 `$scopes.<id>.<field>` 精准路径，
 *   字段级细粒度更新，**无需 refresh**。
 * - **根**（`x-data.global="{a:1}"` ≡ `x-data-options="{mount:''}"`）：数据**合并进全局 AutoStore
 *   根键**（`store.state.a=1`），所有 scope 可见。**不设 `scope._data`、不改变 scope 任何行为**——
 *   运行时改全局直接操作 `engine.state.<键>`。元素销毁时按 CAS 删除自己写入的键（见下）。
 * - **路径**（`x-data-options="{mount:'x.y'}"`）：数据 merge 进 `state.x.y` 容器，中间路径不存在
 *   则逐级自动创建（`x` 缺失时建出 `x:{y:{a:1}}`）；`scope._data` 指向挂载容器代理——声明子树内
 *   `{{a}}` 直读、全树任意处 `{{x.y.a}}` 可读、`this.data.a` 可写、`engine.data(el,…)` 直接 merge
 *   进容器。元素销毁时键级 CAS 删除 + 容器删空则连同路径上变空的中间容器向上回收。
 *
 * **mount 值语法**：
 *
 * - 绝对路径 `'x.y'`：`.` 分隔，从 `store.state` 根起算（支持 `\.` 转义，经 splitPath）；
 * - 相对路径 `'./x'` / `'../settings/theme'`：以 `.` / `..` 开头、**段间用 `/` 分隔**（与 x-teleport
 *   语法同构，规避 `..` 与路径分隔符 `.` 的字符冲突）：
 *   - `./x` = 自身容器下建 `x`（自身即 x-data 声明者，无歧义）；
 *   - `../x` = 直接父 scope 容器下（**不跳层**）；每多一级 `..` 多走一个 parent；
 *   - **越顶落根**：`..` 上溯超出链顶 → 停在根 `store.state`（与 x-teleport 越界到 body 同构）；
 *   - **无容器则创建**：`./` / `..` 命中的 scope 无 `_data` → 就地创建空私有域
 *     （`$scopes[pid]={}` + 设 `_data` + `invalidateScopeView()`，复用 `engine.data()` 先例），
 *     含 x-for item scope（数据随 item 生死）；
 * - `.nearest` 修饰符（≡ `nearest:true`）：改变每级 `..` 的步进单位——从「直接父 scope」变为
 *   「最近的持有 `_data` 的祖先 scope」（跳过占位 scope）；`./x` 仍指自身容器；上溯无数据祖先
 *   → 落根；配绝对路径时静默忽略（无相对段，无事可做）。
 *
 * **优先级与规范化**：`mount`（非空字符串）> `global` > 默认。mount 与 global 同写 → mount 胜出 +
 * `logger.warn`。`mount` 非字符串（含误写 `.mount` 修饰符产生的 `true`）→ warn + 忽略，回默认私有域；
 * `global` 值为非空字符串（旧提案残留写法）→ warn + 按根处理。
 *
 * **无效路径降级**：挂载路径中途断裂（存在但非对象，如 `state.x=5`）或任一段是数组 →
 * `logger.warn` + **降级默认私有域**（数据不丢、子树 `{{a}}` 照常，只是没落到指定路径）。
 * 「自动创建」只对「不存在」生效；「存在但类型不符」是用户数据冲突，绝不覆盖。
 * `mount:'$scopes.3'` 直指他域 = warn + **放行**（后果自负：目标 scope 销毁时整删条目会连带蒸发
 * 挂载数据，且两条销毁路径互相踩）。
 *
 * **仅编译期注入，不监听运行时变更**：本指令只在 `created` 解析 x-data 属性值并写入数据域——
 * **不在渲染元素上保留 x-data 属性、不挂 MutationObserver**。运行时更新数据请用 `engine.data(el, data)`，
 * 它直接 `Object.assign` 进数据容器（local/path 模式），路径订阅自动驱动更新，无需 refresh。
 *
 * **值解析**：用 relaxedToJson → `JSON.parse`，值必须是普通对象；
 * 解析失败**静默处理——仅打印日志**，按空对象继续，不中断编译。
 *
 * **嵌套覆盖**：父子元素的 data 经 `getContext` 的 parent 链层叠，子覆盖父同名键。
 *
 * **与 x-for 共存**：x-data 不占 `ownsChildren`，与 x-for 自由共存；容器 x-data 经 parent 链
 * 自动透传进各 item scope。x-for 的 localData（item/$index 等）仍为普通对象、靠 x-for 自身的
 * refresh 驱动——本指令只负责 data 的响应式化。
 *
 * **浅响应（ADR-0078）**：`shallow` 选项显式关闭私有域的深层代理（默认全深，行为零变化）：
 * `.shallow` 修饰符 ≡ `shallow:true` ≡ **0 档**（顶层键赋值有事件，键内字段读出即原始引用、
 * 深写静默失效，仅整体替换键值可唤醒深路径订阅）；`{shallow:1}` = **1 档**（第二层字段写
 * 有事件，第三层起失效）。`true→0` 归一在 engine 侧完成（autostore 运行时 true→1，不透传）；
 * 数值 ≥2 warn 归 1；仅 local 形态支持（root/path warn + 忽略）；异步落地与 `engine.data()`
 * 追加靠 autostore 惰性纳管自动继承域档位（零特判）。
 *
 * **铁律：永不整体替换 `$scopes[id]`**——`scope.data` 闭包绑定该 store 代理引用，
 * 写入只 `Object.assign` 原地改、`delete` 消失键，绝不 `store.state.$scopes[id] = newObj`，
 * 否则 data 指向旧代理、新数据写不进。
 *
 * **优先级 = 200**（最高，> x-for 100）：保证 `created()` 最先执行，在兄弟指令 `watch()` 缓存
 * `_scopeView` 之前把数据注入 data / store，使首渲即读到正确数据。
 */
export declare class DataDirective extends AutoSparkDirectiveBase {
    static readonly priority = 200;
    static readonly singleton = true;
    /** global/path 模式：本指令写入容器的键 → 末值快照。destroy 时按 CAS 删除，避免误删后写者数据 */
    private attachedKeys;
    /** path 模式：解析后的挂载路径段（不含容器自身，从根到父容器）。null = 非 path 模式 */
    private mountSegments;
    /** 本指令创建的中间容器路径段（从浅到深），destroy 删空回收时逐级向上清理 */
    private createdSegments;
    /** `..` 步进基准（`.nearest` 修饰符切换，ADR-0029） */
    private stepBase;
    /** 浅响应档位（ADR-0078）：null = 不标记（全深默认）；0|1 = 私有域容器 shallow 标记档位 */
    private shallowDepth;
    /** 供 nearest 上溯取挂载容器路径：本实例是否 path 模式且已解析（scopeContainerSegments 消费） */
    isPathMode(): boolean;
    /** 挂载路径段只读副本（nearest 上溯拼段用，scopeContainerSegments 消费） */
    getMountSegments(): string[];
    /**
     * 规范化挂载模式与挂载路径（ADR-0029 决策 2）。
     *
     * 优先级 `mount`(非空串) > `global` > 默认；冲突（mount 与 global 同写）warn + mount 胜出。
     * 返回 `local` / `root` / `path`（path 时同时解析出 segments 与步进基准）。
     */
    private resolveMode;
    /**
     * 归一化 shallow 选项为档位（ADR-0078 决策 4）：
     *
     * - 缺省 / `false`（含 `"false"`）→ null（不标记，全深——默认行为零变化）；
     * - `true` / `"true"` / `0` → **0 档**：`true→0` 在 engine 侧归一、**不透传** autostore
     *   （其运行时 `shallow(obj, true)` 归 1，与 `.shallow` 修饰符 ≡ 0 档的声明语义矛盾）；
     * - `1` → 1 档（第二层字段写有事件，第三层起失效）；
     * - 数值 ≥2 → warn + 归 1（autostore 值域仅 0|1、无第三层，「宁深勿浅」）；
     * - 其他类型 → warn + 忽略（保持全深）。
     *
     * 仅 local 挂载形态生效（决策 6）：root 不能标记根 state（越权波及所有全局键）、
     * path 挂载容器可能与既有数据共享（单方面改共享者响应深度）→ warn + 忽略。
     */
    private resolveShallowDepth;
    /**
     * 解析 mount 值为绝对路径段（从 store.state 根起算）。
     *
     * - 绝对（`'x.y'`）→ `splitPath` 拆段（支持 `\.` 转义）；
     * - 相对（`'./x'` / `'../a/b'`，以 `.` / `..` 开头、段间 `/` 分隔）→ 先解析相对段
     *   （`./` = 自身容器、每级 `..` 上溯、越顶落根、无容器则创建），再把后续 `/` 段拼到容器路径后；
     * - 每段（含拼接结果）做「存在且非对象/数组」断裂校验，断裂 → warn + 返回 null（降级 local）；
     * - 指向 `$scopes` 命名空间 → warn + 放行（后果自负）。
     *
     * @returns 绝对路径段数组（空数组 = 根）；无效返回 null
     */
    private resolveMountPath;
    /**
     * 解析相对挂载的基准容器路径段（`./` 与 `..` 段，ADR-0029 决策 5/6）。
     *
     * - `./`（ups=0）→ 自身容器：自身即 x-data 声明者，**无容器则创建**自身私有域；
     * - 每级 `..`（ups>0）→ 上溯：
     *   - `parent` 基准（默认）：走一个**直接父 scope**，无 `_data` 则为其创建空私有域；
     *   - `nearest` 基准（`.nearest`）：走**最近的持有 `_data` 的祖先 scope**（跳过占位 scope），
     *     上溯途中再无数据祖先 → 落根（返回 `[]`）；
     *   - 越顶（无父可走）→ 落根 `[]`；
     * - 目标容器是私有域 → 返回 `['$scopes', String(id)]`；落根 → `[]`。
     */
    private resolveRelativeBase;
    created(): void;
    /**
     * 按（已解析的）数据对象注入。local/path 模式写 scope 数据容器（私有域或挂载容器）、
     * root 模式写根键，订阅者由响应式通知自动更新，无需 refresh（首渲亦由各指令 compile 完成）。
     * 解析移至 created（数据脚本合成需要「先各自 parse、后合并」，ADR-0032 决策 5）。
     */
    private applyData;
    /**
     * 数据脚本 builder 的首读激活（ADR-0032 决策 2）。
     *
     * AutoStore 对 `computed()` / `configurable()` / `watch()` builder 的就地激活发生在
     * 响应式代理的 **GET 陷阱**（首次读取持有 builder 的键时创建 observer 并回写）。
     * computed/configurable 天然被绑定首渲读到；watch 是纯副作用声明、无人读取——须在
     * 注入后强制首读激活。仅当数据含函数值（builder 均为函数形态）时触发，纯 JSON 路径
     * 零行为变化。只激活**顶层**键：嵌套 builder 由绑定读取自然激活（watch 请声明在顶层）。
     *
     * 注：激活回写会使容器键值偏离 attachedKeys 登记的 builder 末值，root/path 模式的
     * destroy CAS 因此不删 builder 键（残留语义与「运行时键视为用户接管」一致，可接受）。
     */
    private _activateObservers;
    /** 异步形态（url / action）；null = literal（既有同步管道） */
    private asyncForm;
    /** 挂载模式缓存（applyData 首次解析后供 setMeta / synthesizeLoading 复用，避免 resolveMode 重复 warn） */
    private modeCache;
    /** 共享取数执行器（ADR-0035 决策 5：形态判定/插值重取/竞态/abort 内聚于此，本指令只消费回调） */
    private runner;
    /** destroy 后拒收一切在途结果 */
    private destroyed;
    /** 是否异步形态（url / action）——同元素双异步时 x-html 独占视觉通道的依据 */
    isAsyncSource(): boolean;
    /**
     * 异步形态初始化（ADR-0033 / ADR-0122）：数据脚本为同步基底先落容器（applyData({}) 同时完成
     * 挂载解析与容器/attachedKeys 建立）→ 元状态就位 → 合成 x-loading（ADR-0122：双异步时
     * x-html 独占 overlay，x-data 不合成）→ 首次取数 + 依赖 watch。
     */
    private createdAsync;
    /** 到达映射（决策 2）：mapResponse 对象-only + path 提取；失败与加载失败同级姿态 */
    private arrive;
    /** 加载失败：warn 日志 + $error 落地 */
    private fail;
    /**
     * 异步数据落域：与 applyData 同构的挂载分派，差异仅在容器写入——**deepMerge 后到覆盖**
     * （数据脚本/旧值为基底，远程是权威数据，ADR-0033 决策 7），而非 Object.assign 浅覆盖。
     */
    private applyFetched;
    /** 元状态键目标容器：root → store 根；local/path → scope._data（applyData 已建容器） */
    private metaTarget;
    /**
     * 元状态写入（决策 3）：`$loading` / `$error`（Error 实例）经响应式代理落地（通知订阅者）；
     * 新一轮请求发起时清 $error；元键与数据键同责回收（attachedKeys 登记，destroy CAS 删）。
     * 仅异步形态调用——literal/数据脚本形态不注入（不制造「同步加载态」假象，Q14-4）。
     */
    private setMeta;
    /**
     * x-loading 覆盖层合成（ADR-0033 决策 4 / ADR-0122 决策 4-5）：给渲染元素注入
     * `x-loading="<元键全局路径>"` 属性（Runtime 指令属性保留在结果 DOM，dispatcher 自然拾取；
     * LoadingConfig 经 `x-loading-options` 直传）。ADR-0122 移除「有 x-fallback 不合成」互斥
     * 默认——恒合成，仅 `loading:false` 恒关；双异步（异步 x-data + 异步 x-html 同元素）时
     * 视觉通道归 x-html 独占，x-data 不合成 overlay（显式声明 loading 也忽略并 warn）。
     */
    private synthesizeLoading;
    /**
     * 解析宽松 JSON 为普通对象。
     *
     * 失败 / 非对象（数组、标量、null）→ **静默**：仅打印日志，返回空对象，不中断编译。
     * 值是 JSON 字面量（非表达式）：`{a:1+1}` 不做求值（方法等逻辑成员走 actions /
     * `<script type="autospark/actions">` 通道，ADR-0031）。
     */
    private parse;
    /**
     * local / path 模式统一入口：定位（或创建）数据容器，把数据 merge 进去。
     *
     * - local：容器 = `$scopes[scope.id]`（首次写入时建立 `scope._data` 指向，此后永不换引用）；
     * - path：容器 = 挂载路径逐级下钻（缺失中间段逐级自动创建并登记 createdSegments 供回收），
     *   `scope._data` 指向挂载容器代理。
     *
     * merge 语义：先删除新数据中已不存在的旧键，再 `Object.assign` 写入/更新——均经 store 代理
     * 触发 set/delete 通知，订阅者自动更新。
     */
    private applyToContainer;
    /** local 模式：取（不存在则建）本 scope 的私有响应式域容器 `$scopes[id]` */
    private ensureLocalContainer;
    /**
     * path 模式：沿 mountSegments 逐级下钻取挂载容器。
     *
     * 中间段不存在 → 逐级 `parent[seg] = {}` 自动创建（core 自动建响应式代理），并登记
     * createdSegments（从浅到深），destroy 删空回收时据此判定「这一级是我建的」。
     * 末段同样自动创建。**存在但非对象的断裂已在 resolveMountPath 拦截**（降级 local），
     * 此处仅处理「不存在 → 建」。
     */
    private acquireMountContainer;
    /**
     * root 模式（`.global` / `mount:""`）：CAS 写入全局 AutoStore 根键（store.state[k]）。
     *
     * - 先 CAS 删除"新数据中已消失、且当前值仍为自己末值"的旧键（被后写者覆盖过的键不误删）；
     * - 再写入/更新新键，键已存在且非自己之前写入时 warn 覆盖；
     * - 登记键→末值，供 destroy 与后续 CAS 判定。
     */
    private applyRoot;
    destroy(): void;
}
