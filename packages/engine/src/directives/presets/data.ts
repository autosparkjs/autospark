import { AutoSparkDirectiveBase } from "../base";
import { relaxedToJson } from "../../utils/relaxedToJson";
import { deepMerge } from "flex-tools/object/deepMerge";
import { SCOPES_KEY } from "../../engine";
import { getVal, splitPath } from "autostore";
import type { AutoSparkScope } from "../../scope";
import { AsyncSourceRunner } from "../async-source";
import { detectDataForm, isAsyncDataValue, mapResponse } from "./async-source";
import type { DataScriptStash } from "../../compile/dataScript";

/**
 * 挂载模式（由 mount/global 选项规范化得出，ADR-0029）：
 *
 * - `local`：默认私有域 `_scopes.<id>`（独占容器，destroy 整删条目）；
 * - `root`：`.global`（≡ `mount:""`）——合并进根键（共享容器，键级 CAS 回收）；
 * - `path`：`mount:'x.y'`——逐级解析挂载路径，`_data` 指向挂载容器代理（与 local 同构的
 *   行为红利：子树直读 + 全树路径读 + this.data/engine.data 直写），键级 CAS + 删空回收。
 */
type MountMode = "local" | "root" | "path";

/**
 * 相对挂载的步进基准（`.nearest` 修饰符切换 `..` 的步进单位，ADR-0029）：
 *
 * - `parent`（默认）：每级 `..` 上溯一个**直接父 scope**；命中的 scope 无 `_data` 则就地创建
 *   空私有域（「无容器则创建」）；
 * - `nearest`：每级 `..` 上溯到最近的**持有 `_data` 的祖先 scope**（跳过 x-if/x-for/x-scope
 *   等占位 scope）；上溯无数据祖先时落根 state。
 */
type StepBase = "parent" | "nearest";

/**
 * 解析后的挂载描述：mode=path 的落点（segments 为空数组 = 落根 state）。
 */
type ResolvedMount = {
    mode: "path";
    /** 挂载容器的绝对路径段（从 store.state 根起算；空数组 = 根） */
    segments: string[];
};

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
 * - **默认**（`x-data="{a:1}"`）：数据写入**私有响应式域** `store.state._scopes[scope.id]`
 *   （`scope.data` 指向该 store 代理对象）。经 `getContext` 与 localData 同级叠加暴露，
 *   子树可见、scope 间隔离。读写经 store → `collectDependencies` 收集 `_scopes.<id>.<field>` 精准路径，
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
 *     （`_scopes[pid]={}` + 设 `_data` + `invalidateScopeView()`，复用 `engine.data()` 先例），
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
 * `mount:'_scopes.3'` 直指他域 = warn + **放行**（后果自负：目标 scope 销毁时整删条目会连带蒸发
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
 * **铁律：永不整体替换 `_scopes[id]`**——`scope.data` 闭包绑定该 store 代理引用，
 * 写入只 `Object.assign` 原地改、`delete` 消失键，绝不 `store.state._scopes[id] = newObj`，
 * 否则 data 指向旧代理、新数据写不进。
 *
 * **优先级 = 200**（最高，> x-for 100）：保证 `created()` 最先执行，在兄弟指令 `watch()` 缓存
 * `_scopeView` 之前把数据注入 data / store，使首渲即读到正确数据。
 */
export class DataDirective extends AutoSparkDirectiveBase {
    static override readonly priority = 200;
    static override readonly singleton = true;

    /** global/path 模式：本指令写入容器的键 → 末值快照。destroy 时按 CAS 删除，避免误删后写者数据 */
    private attachedKeys: Map<string, any> | null = null;
    /** path 模式：解析后的挂载路径段（不含容器自身，从根到父容器）。null = 非 path 模式 */
    private mountSegments: string[] | null = null;
    /** 本指令创建的中间容器路径段（从浅到深），destroy 删空回收时逐级向上清理 */
    private createdSegments: string[][] | null = null;
    /** `..` 步进基准（`.nearest` 修饰符切换，ADR-0029） */
    private stepBase: StepBase = "parent";

    /** 供 nearest 上溯取挂载容器路径：本实例是否 path 模式且已解析（scopeContainerSegments 消费） */
    isPathMode(): boolean {
        return this.mountSegments !== null;
    }

    /** 挂载路径段只读副本（nearest 上溯拼段用，scopeContainerSegments 消费） */
    getMountSegments(): string[] {
        return this.mountSegments ? this.mountSegments.slice() : [];
    }

    /**
     * 规范化挂载模式与挂载路径（ADR-0029 决策 2）。
     *
     * 优先级 `mount`(非空串) > `global` > 默认；冲突（mount 与 global 同写）warn + mount 胜出。
     * 返回 `local` / `root` / `path`（path 时同时解析出 segments 与步进基准）。
     */
    private resolveMode(): MountMode {
        const mountRaw = this.getOption("mount");
        const globalRaw = this.getOption("global");
        // nearest 修饰符（≡ nearest:true）：仅改变相对路径 .. 的步进单位，配绝对路径静默忽略
        this.stepBase = this.getOption("nearest") ? "nearest" : "parent";

        let mount: string | null = null;
        if (mountRaw !== undefined) {
            if (typeof mountRaw !== "string") {
                // 误写形态：.mount 修饰符产生 true / 数字等——warn + 忽略（修饰符无参，ADR-0007）
                this.engine.logger.warn(
                    `x-data: mount 选项须为字符串路径（如 mount:'x.y'），实际得到 ${JSON.stringify(mountRaw)}，已忽略`,
                );
            } else if (mountRaw.trim() !== "") {
                mount = mountRaw.trim();
            } else {
                // mount === ""（空串）合法：等价根（≡ .global），不视为误写
                return "root";
            }
        }
        if (mount !== null && (globalRaw === true || globalRaw === "true")) {
            this.engine.logger.warn(
                `x-data: mount("${mount}") 与 global 同写，mount 优先（global 被忽略）`,
            );
        }
        if (mount !== null) {
            this.mountSegments = this.resolveMountPath(mount);
            // 路径无效（断裂/数组段/非法语法）时 resolveMountPath 内已 warn 并返回 null → 降级 local
            return this.mountSegments ? "path" : "local";
        }
        if (globalRaw === true || globalRaw === "true") return "root";
        if (globalRaw !== undefined && globalRaw !== false && globalRaw !== null) {
            // 旧提案残留：global:'x.y' 带路径写法——warn + 仍按根处理
            this.engine.logger.warn(
                `x-data: global 选项不支持路径值（${JSON.stringify(globalRaw)}），已按挂载根处理；指定位置请用 mount:'...'`,
            );
            return "root";
        }
        return "local";
    }

    /**
     * 解析 mount 值为绝对路径段（从 store.state 根起算）。
     *
     * - 绝对（`'x.y'`）→ `splitPath` 拆段（支持 `\.` 转义）；
     * - 相对（`'./x'` / `'../a/b'`，以 `.` / `..` 开头、段间 `/` 分隔）→ 先解析相对段
     *   （`./` = 自身容器、每级 `..` 上溯、越顶落根、无容器则创建），再把后续 `/` 段拼到容器路径后；
     * - 每段（含拼接结果）做「存在且非对象/数组」断裂校验，断裂 → warn + 返回 null（降级 local）；
     * - 指向 `_scopes` 命名空间 → warn + 放行（后果自负）。
     *
     * @returns 绝对路径段数组（空数组 = 根）；无效返回 null
     */
    private resolveMountPath(mount: string): string[] | null {
        // 相对段拆解：'../a/b' → ups=1, afterUps='a/b'；'./x' → ups=0, afterUps='x'；'..' → ups=1, afterUps=''
        const m = /^((?:\.\.\/)*)(\.\.?)?(?:\/(.*))?$/.exec(mount);
        const isRelative = !!m && m[2] !== undefined; // '.' / '..' 前缀（'./x' 的 m[2]='.'）
        let base: string[];
        if (isRelative && m) {
            const ups = m[1]!.length / 3 + (m[2] === ".." ? 1 : 0);
            const container = this.resolveRelativeBase(ups);
            if (!container) return null; // resolveRelativeBase 内已 warn
            // 容器自身路径段 + 后续 / 段（每段再经 splitPath 支持 \. 转义）
            base = container;
            const tail = m[3];
            if (tail !== undefined && tail !== "") {
                for (const seg of tail.split("/")) {
                    base = [...base, ...splitPath(seg)];
                }
            }
        } else {
            base = splitPath(mount);
        }
        // 段落校验：非法空段（'x..y' / 尾点）→ 无效
        if (base.some((s) => s === "")) {
            this.engine.logger.warn(`x-data: mount 路径 "${mount}" 含空段，无效，已降级默认私有域`);
            return null;
        }
        // _scopes 命名空间：warn + 放行（目标 scope 销毁会整删条目，连带蒸发挂载数据，后果自负）
        if (base[0] === SCOPES_KEY) {
            this.engine.logger.warn(
                `x-data: mount 路径 "${mount}" 直指引擎保留容器 _scopes，目标 scope 销毁时挂载数据将被连带删除，后果自负`,
            );
        }
        // 断裂校验：沿根下钻，任一段「存在但非对象」或「是数组」→ warn + 降级 local（绝不覆盖用户数据）
        const state = this.engine.store.state as Record<string, any>;
        let cur: any = state;
        for (let i = 0; i < base.length - 1; i++) {
            const seg = base[i]!;
            if (!(seg in cur) || cur[seg] === undefined || cur[seg] === null) break; // 不存在 → 后续由写入时自动创建
            const next = cur[seg];
            if (Array.isArray(next) || typeof next !== "object") {
                this.engine.logger.warn(
                    `x-data: mount 路径 "${mount}" 中途段 "${seg}" 是${Array.isArray(next) ? "数组" : "非对象"}，无法穿透，已降级默认私有域`,
                );
                return null;
            }
            cur = next;
        }
        return base;
    }

    /**
     * 解析相对挂载的基准容器路径段（`./` 与 `..` 段，ADR-0029 决策 5/6）。
     *
     * - `./`（ups=0）→ 自身容器：自身即 x-data 声明者，**无容器则创建**自身私有域；
     * - 每级 `..`（ups>0）→ 上溯：
     *   - `parent` 基准（默认）：走一个**直接父 scope**，无 `_data` 则为其创建空私有域；
     *   - `nearest` 基准（`.nearest`）：走**最近的持有 `_data` 的祖先 scope**（跳过占位 scope），
     *     上溯途中再无数据祖先 → 落根（返回 `[]`）；
     *   - 越顶（无父可走）→ 落根 `[]`；
     * - 目标容器是私有域 → 返回 `['_scopes', String(id)]`；落根 → `[]`。
     */
    private resolveRelativeBase(ups: number): string[] | null {
        const scope = this.binding;
        if (ups === 0) {
            // ./：自身容器（自身无 _data 则创建——含 .global 被 mount 遮蔽等一切形态）。
            // 注意此处 mountSegments 尚未解析（resolveMode 先调本函数再赋值），自身必是
            // 「首次声明 x-data」的 scope，容器就是即将建立的私有域/挂载容器——直接返回私有域段，
            // 后续 tail 段会拼在其上；path 模式的容器由 applyToContainer 经完整 segments 下钻建立。
            ensureScopeData(this.engine, scope);
            return scopeDataSegments(scope);
        }
        let target: AutoSparkScope | null = scope;
        if (this.stepBase === "parent") {
            // 默认：每级 .. 走一个直接父 scope；越顶落根
            for (let i = 0; i < ups; i++) {
                target = target?.parent ?? null;
            }
            if (!target) return []; // 越顶 = 根
            // 无容器则创建（含 x-for item scope：数据随 item 生死）
            if (target.directives.some((d) => d instanceof DataDirective && d.isPathMode())) {
                return scopeContainerSegments(target);
            }
            ensureScopeData(this.engine, target);
            return scopeDataSegments(target);
        }
        // nearest：每级 .. 走最近持有 _data 的祖先；上溯无数据祖先 → 落根。
        // 目标容器可能是挂载容器（path 模式的 _data 不在 _scopes 下）——此时返回目标 scope 自身的
        // mountSegments（其 DataDirective 实例上已解析）。
        for (let i = 0; i < ups; i++) {
            let p: AutoSparkScope | null = target?.parent ?? null;
            while (p && !p._data) p = p.parent;
            if (!p) return []; // 本级已无数据祖先 → 落根
            target = p;
        }
        if (!target) return [];
        return scopeContainerSegments(target);
    }

    override created() {
        // 编译期首次注入：x-data 属性值 + 数据脚本预扫产物（ADR-0032）合成后按挂载模式写入。
        // 仅 created 一次，不保留 x-data 属性、不监听 setAttribute——运行时更新请用 engine.data(el, data)。
        const stash = this.engine.compiler.consumeDataScriptStash(this.binding);
        const raw = String(this.value ?? "");
        // 值形态三分发（ADR-0033 决策 1）：url / action 走异步管道，literal 走既有同步管道
        if (isAsyncDataValue(raw)) {
            this.createdAsync(raw, stash);
            return;
        }
        if (stash) {
            // options 裁决（ADR-0032 决策 6）：父元素 x-data-options 为权威，同写则脚本 options 被忽略并 warn
            if (stash.options && Object.keys(stash.options).length > 0) {
                if (this.options && Object.keys(this.options).length > 0) {
                    this.engine.logger.warn(
                        `x-data: 数据脚本的 options 被 x-data-options 遮蔽（父元素为权威），已忽略（ADR-0032 决策 6）`,
                    );
                } else {
                    this.options = stash.options;
                }
            }
            // 数据合成（决策 5）：多个脚本已在预扫按文档序深合并为 stash.data；x-data 值最后
            // 合并、优先级最高（脚本装大对象基底、属性写微调覆盖）。末尾恒追加空对象 {} 隔离
            // deepMerge 对最后一个实参的 $merge/$ignoreUndefined 指令键探测（用户数据撞名不被吞）
            this.applyData(raw.trim() === "" ? stash.data : deepMerge(stash.data, this.parse(raw), {}));
        } else {
            this.applyData(this.parse(raw));
        }
    }

    /**
     * 按（已解析的）数据对象注入。local/path 模式写 scope 数据容器（私有域或挂载容器）、
     * root 模式写根键，订阅者由响应式通知自动更新，无需 refresh（首渲亦由各指令 compile 完成）。
     * 解析移至 created（数据脚本合成需要「先各自 parse、后合并」，ADR-0032 决策 5）。
     */
    private applyData(data: Record<string, any>) {
        const mode = this.resolveMode();
        this.modeCache = mode;
        if (mode === "root") {
            this.applyRoot(data);
            this._activateObservers(this.engine.store.state as Record<string, any>, data);
            return;
        }
        // local：容器 merge（与既有 applyLocal 行为一致）；path：挂载容器 merge
        this.applyToContainer(data);
        this._activateObservers(this.binding._data!, data);
    }

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
    private _activateObservers(container: Record<string, any>, data: Record<string, any>): void {
        let hasFn = false;
        for (const v of Object.values(data)) {
            if (typeof v === "function") {
                hasFn = true;
                break;
            }
        }
        if (!hasFn) return;
        for (const k of Object.keys(data)) void container[k];
    }

    // ── 异步数据源（ADR-0033：url / action 形态）────────────────────────────

    /** 异步形态（url / action）；null = literal（既有同步管道）。x-html 双异步互斥查询消费（ADR-0035） */
    private asyncForm: "url" | "action" | null = null;
    /** 挂载模式缓存（applyData 首次解析后供 setMeta / synthesizeLoading 复用，避免 resolveMode 重复 warn） */
    private modeCache: MountMode | null = null;
    /** 共享取数执行器（ADR-0035 决策 5：形态判定/插值重取/竞态/abort 内聚于此，本指令只消费回调） */
    private runner: AsyncSourceRunner | null = null;
    /** 首次成功落地图数据——x-fallback 显示条件 = 非就绪 && !hasArrivedData（重取保旧值，Q11） */
    private hasArrivedData = false;
    /** destroy 后拒收一切在途结果 */
    private destroyed = false;
    /** x-fallback 特例子节点模板（template.children 中带 x-fallback 的元素，文档序） */
    private fallbackTpls: HTMLElement[] | null = null;
    /** 已挂载的 fallback 实体（激活期存在） */
    private fallbackLive: { els: HTMLElement[]; scopes: AutoSparkScope[] } | null = null;
    /** fallback 激活期被 detach 保活的正常子树（就绪后按原序复原） */
    private stashedNodes: ChildNode[] | null = null;

    /** 是否异步形态（url / action）——同元素双异步的反馈互斥查询（HtmlDirective 消费，ADR-0035 决策 6） */
    isAsyncSource(): boolean {
        return this.asyncForm !== null;
    }

    /**
     * 异步形态初始化（ADR-0033）：数据脚本为同步基底先落容器（applyData({}) 同时完成
     * 挂载解析与容器/attachedKeys 建立）→ 元状态就位 → 采集 x-fallback → 合成 x-loading
     * （互斥默认）→ 首次取数 + 依赖 watch → scheduler 延迟首次 fallback 同步（编译完成后
     * 子树就位，detach 才有意义）。
     */
    private createdAsync(raw: string, stash: DataScriptStash | undefined): void {
        this.asyncForm = detectDataForm(raw) === "url" ? "url" : "action";
        if (stash) {
            // 数据脚本 options 沿用 ADR-0032 决策 6 裁决：父元素 x-data-options 权威
            if (
                stash.options &&
                Object.keys(stash.options).length > 0 &&
                !(this.options && Object.keys(this.options).length > 0)
            ) {
                this.options = { ...this.options, ...stash.options };
            }
            this.applyData(stash.data);
        } else {
            this.applyData({});
        }
        this.setMeta(true, undefined);
        this.collectFallback();
        this.synthesizeLoading();
        this.runner = new AsyncSourceRunner(this.binding, (k) => this.getOption(k), {
            responseParser: (res) => res.json(),
            onLoading: () => this.setMeta(true, undefined),
            onResult: (result) => this.arrive(result),
            onError: (err) => this.fail(err),
        });
        this.runner.start(raw);
        this.engine.scheduler.schedule(() => this.syncFallback());
    }

    /** 到达映射（决策 2）：mapResponse 对象-only + path 提取；失败与加载失败同级姿态 */
    private arrive(result: unknown): void {
        const mapped = mapResponse(result, this.getOption("path"));
        if (!mapped.ok) {
            this.fail(mapped.error);
            return;
        }
        this.hasArrivedData = true;
        this.setMeta(false, undefined);
        this.applyFetched(mapped.data);
        this.engine.scheduler.schedule(() => this.syncFallback());
    }

    /** 加载失败：warn 日志 + $error 落地 + fallback 同步（非就绪态认领） */
    private fail(err: Error): void {
        this.engine.logger.warn(`x-data: ${err.message}`);
        this.setMeta(false, err);
        this.engine.scheduler.schedule(() => this.syncFallback());
    }

    /**
     * 异步数据落域：与 applyData 同构的挂载分派，差异仅在容器写入——**deepMerge 后到覆盖**
     * （数据脚本/旧值为基底，远程是权威数据，ADR-0033 决策 7），而非 Object.assign 浅覆盖。
     */
    private applyFetched(data: Record<string, any>): void {
        const mode = this.resolveMode();
        this.modeCache = mode;
        if (mode === "root") {
            this.applyRoot(data);
            this._activateObservers(this.engine.store.state as Record<string, any>, data);
            return;
        }
        // 响应键遮蔽预警（local/path 模式，ADR-0033 边界）：响应键与全局状态根键同名时，
        // 聚合视图（data 层优先）将遮蔽全局键——url 插值 / action 实参的重求值读到域内旧值，
        // 依赖驱动的重取会静默失效（如接口回显 page/size 撞上全局分页控制键）。提醒改名或让接口不回显。
        const rootState = this.engine.store.state as Record<string, any>;
        for (const k of Object.keys(data)) {
            if (k !== "$loading" && k !== "$error" && Object.prototype.hasOwnProperty.call(rootState, k)) {
                this.engine.logger.warn(
                    `x-data: 响应键 "${k}" 与全局状态同名，落域后将遮蔽全局键（聚合视图 data 层优先）——插值/实参可能读到响应旧值、依赖重取可能失效。建议控制键改名，或让接口不回显该键`,
                );
            }
        }
        const scope = this.binding;
        if (this.mountSegments) {
            if (!scope._data) scope._data = this.acquireMountContainer();
            if (!this.attachedKeys) this.attachedKeys = new Map();
            for (const [k, v] of Object.entries(data)) this.attachedKeys.set(k, v);
        } else if (!scope._data) {
            scope._data = this.ensureLocalContainer();
        }
        deepMerge(scope._data!, data, {});
        this._activateObservers(scope._data!, data);
    }

    /** 元状态键目标容器：root → store 根；local/path → scope._data（applyData 已建容器） */
    private metaTarget(): Record<string, any> {
        return this.modeCache === "root"
            ? (this.engine.store.state as Record<string, any>)
            : (this.binding._data ?? (this.engine.store.state as Record<string, any>));
    }

    /**
     * 元状态写入（决策 3）：`$loading` / `$error`（Error 实例）经响应式代理落地（通知订阅者）；
     * 新一轮请求发起时清 $error；元键与数据键同责回收（attachedKeys 登记，destroy CAS 删）。
     * 仅异步形态调用——literal/数据脚本形态不注入（不制造「同步加载态」假象，Q14-4）。
     */
    private setMeta(loading: boolean, error: Error | undefined): void {
        const target = this.metaTarget();
        target.$loading = loading;
        if (error === undefined) {
            if (target.$error !== undefined) target.$error = undefined;
        } else {
            target.$error = error;
        }
        if (this.attachedKeys) {
            this.attachedKeys.set("$loading", loading);
            this.attachedKeys.set("$error", target.$error);
        }
    }

    /** 采集 x-fallback 特例子节点（template 直接子级，文档序；walk 到达前采集完毕） */
    private collectFallback(): void {
        const tpl = this.template;
        if (!tpl) return;
        for (const child of tpl.children) {
            if (child instanceof HTMLElement && child.hasAttribute("x-fallback")) {
                (this.fallbackTpls ??= []).push(child);
            }
        }
    }

    /**
     * x-loading 覆盖层合成（决策 4）：给渲染元素注入 `x-loading="<元键全局路径>"` 属性
     * （Runtime 指令属性保留在结果 DOM，dispatcher 自然拾取；LoadingConfig 经
     * `x-loading-options` 直传）。互斥默认：有 x-fallback 且未显式声明 loading → 不合成
     * （避免「fallback 替换内容 + overlay 盖宿主」双重加载指示）；`loading:false` 恒关。
     */
    private synthesizeLoading(): void {
        const loadingOpt = this.getOption("loading");
        if (loadingOpt === false) return;
        if (this.fallbackTpls && loadingOpt === undefined) return;
        const path =
            this.modeCache === "root"
                ? "$loading"
                : this.mountSegments
                  ? [...this.mountSegments, "$loading"].join(".")
                  : `${SCOPES_KEY}.${this.binding.id}.$loading`;
        this.el?.setAttribute("x-loading", path);
        if (loadingOpt && typeof loadingOpt === "object") {
            this.el?.setAttribute("x-loading-options", JSON.stringify(loadingOpt));
        }
    }

    /**
     * fallback 状态同步（scheduler 微任务驱动）：显示条件 = 非就绪（$loading 或 $error）
     * **且域内尚无数据**——首载显示；重取保旧值、不闪断（Q11）。激活 = 正常子树整体
     * detach 保活（watcher 照常更新 detached 节点，复原即终态）+ 逐模板挂载编译后的
     * fallback；就绪 = 销毁 fallback scope + 按原序复原子树。
     */
    private syncFallback(): void {
        if (this.destroyed || !this.fallbackTpls) return;
        const target = this.metaTarget();
        const notReady = target.$loading === true || target.$error !== undefined;
        const active = notReady && !this.hasArrivedData;
        if (active === !!this.fallbackLive) return;
        if (active) this.activateFallback();
        else this.deactivateFallback();
    }

    private activateFallback(): void {
        const host = this.el;
        if (!host) return;
        const stash = document.createDocumentFragment();
        while (host.firstChild) stash.appendChild(host.firstChild);
        this.stashedNodes = Array.from(stash.childNodes);
        this.fallbackLive = { els: [], scopes: [] };
        for (const tpl of this.fallbackTpls!) {
            // compileChild 以 template 为只读输入（根浅克隆 + 剥指令属性），fallback 内容
            // 可引用 $loading/$error（scope 链：fallback scope → 宿主 scope → 域）
            const { el, scope } = this.engine.compiler.compileChild(tpl, this.binding, {});
            this.binding.addChild(scope);
            host.appendChild(el);
            this.fallbackLive.els.push(el);
            this.fallbackLive.scopes.push(scope);
        }
    }

    private deactivateFallback(): void {
        const live = this.fallbackLive;
        if (!live) return;
        this.fallbackLive = null;
        for (const s of live.scopes) s.destroy();
        for (const e of live.els) e.remove();
        const host = this.el;
        if (host && this.stashedNodes) {
            for (const n of this.stashedNodes) host.appendChild(n);
        }
        this.stashedNodes = null;
    }

    /**
     * 解析宽松 JSON 为普通对象。
     *
     * 失败 / 非对象（数组、标量、null）→ **静默**：仅打印日志，返回空对象，不中断编译。
     * 值是 JSON 字面量（非表达式）：`{a:1+1}` 不做求值。
     */
    private parse(raw: string): Record<string, any> {
        const trimmed = raw.trim();
        if (!trimmed) return {};
        try {
            const parsed: unknown = JSON.parse(relaxedToJson(trimmed));
            if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
                this.engine.logger.warn(
                    `x-data: 值必须解析为对象，实际得到 ${JSON.stringify(parsed)}`,
                );
                return {};
            }
            return parsed as Record<string, any>;
        } catch (e: any) {
            this.engine.logger.warn(`x-data: 解析 "${raw}" 失败: ${e?.message ?? e}`);
            return {};
        }
    }

    /**
     * local / path 模式统一入口：定位（或创建）数据容器，把数据 merge 进去。
     *
     * - local：容器 = `_scopes[scope.id]`（首次写入时建立 `scope._data` 指向，此后永不换引用）；
     * - path：容器 = 挂载路径逐级下钻（缺失中间段逐级自动创建并登记 createdSegments 供回收），
     *   `scope._data` 指向挂载容器代理。
     *
     * merge 语义：先删除新数据中已不存在的旧键，再 `Object.assign` 写入/更新——均经 store 代理
     * 触发 set/delete 通知，订阅者自动更新。
     */
    private applyToContainer(data: Record<string, any>) {
        const scope = this.binding;
        if (this.mountSegments) {
            // path：容器 = 挂载路径逐级下钻（相对挂载时 _data 可能已被 resolveRelativeBase 的
            // ensureScopeData 建为空私有域——那只是容器占位，真实容器按完整 segments 下钻替换指向）
            scope._data = this.acquireMountContainer();
            if (!this.attachedKeys) this.attachedKeys = new Map();
            for (const [k, v] of Object.entries(data)) this.attachedKeys.set(k, v);
        } else if (!scope._data) {
            scope._data = this.ensureLocalContainer();
        }
        Object.assign(scope._data!, data);
    }

    /** local 模式：取（不存在则建）本 scope 的私有响应式域容器 `_scopes[id]` */
    private ensureLocalContainer(): Record<string, any> {
        const scopes = (this.engine.store.state as Record<string, any>)[SCOPES_KEY] as Record<
            string,
            any
        >;
        // 不存在才建：避免对已存在的 [id] 重复赋值触发无谓的 set 通知
        if (!scopes[this.binding.id]) scopes[this.binding.id] = {};
        return scopes[this.binding.id];
    }

    /**
     * path 模式：沿 mountSegments 逐级下钻取挂载容器。
     *
     * 中间段不存在 → 逐级 `parent[seg] = {}` 自动创建（core 自动建响应式代理），并登记
     * createdSegments（从浅到深），destroy 删空回收时据此判定「这一级是我建的」。
     * 末段同样自动创建。**存在但非对象的断裂已在 resolveMountPath 拦截**（降级 local），
     * 此处仅处理「不存在 → 建」。
     */
    private acquireMountContainer(): Record<string, any> {
        const state = this.engine.store.state as Record<string, any>;
        const segments = this.mountSegments!;
        let cur: Record<string, any> = state;
        this.createdSegments = [];
        for (let i = 0; i < segments.length; i++) {
            const seg = segments[i]!;
            if (typeof cur[seg] !== "object" || cur[seg] === null) {
                cur[seg] = {};
                this.createdSegments.push(segments.slice(0, i + 1));
            }
            cur = cur[seg];
        }
        return cur;
    }

    /**
     * root 模式（`.global` / `mount:""`）：CAS 写入全局 AutoStore 根键（store.state[k]）。
     *
     * - 先 CAS 删除"新数据中已消失、且当前值仍为自己末值"的旧键（被后写者覆盖过的键不误删）；
     * - 再写入/更新新键，键已存在且非自己之前写入时 warn 覆盖；
     * - 登记键→末值，供 destroy 与后续 CAS 判定。
     */
    private applyRoot(data: Record<string, any>) {
        const state = this.engine.store.state as Record<string, any>;
        if (!this.attachedKeys) this.attachedKeys = new Map();
        // 1. CAS 删除消失键
        for (const [k, v] of this.attachedKeys) {
            if (!Object.prototype.hasOwnProperty.call(data, k)) {
                if (state[k] === v) delete state[k];
                this.attachedKeys.delete(k);
            }
        }
        // 2. 写入/更新
        for (const [k, v] of Object.entries(data)) {
            if (Object.prototype.hasOwnProperty.call(state, k) && !this.attachedKeys.has(k)) {
                this.engine.logger.warn(`x-data.global: 键 "${k}" 已存在于 store，覆盖写入`);
            }
            state[k] = v; // 新键自动建响应式代理；已有键触发 set notify
            this.attachedKeys.set(k, v);
        }
    }

    override destroy() {
        // 异步形态清理（ADR-0033 决策 7）：中止进行中 fetch、序号失效（action 在途结果不落地）。
        // stashedNodes/fallback 随宿主元素一起消亡，无需复原。
        if (this.asyncForm) {
            this.destroyed = true;
            this.runner?.destroy();
        }
        const state = this.engine.store.state as Record<string, any>;
        if (this.mountSegments) {
            // path 模式：键级 CAS 删除 + 容器删空则连同路径上变空的中间容器向上回收
            if (this.attachedKeys) {
                const container = getVal(state, this.mountSegments);
                if (container && typeof container === "object") {
                    for (const [k, v] of this.attachedKeys) {
                        if ((container as Record<string, any>)[k] === v) {
                            delete (container as Record<string, any>)[k];
                        }
                    }
                }
                this.attachedKeys.clear();
            }
            // 删空回收：从最深往浅逐级删「已变空」的路径段（engine.data 运行时追加的键残留时不删——
            // 运行时键不在声明清单，视为用户接管，残留可接受）
            for (let i = this.mountSegments.length - 1; i >= 0; i--) {
                const segs = this.mountSegments.slice(0, i + 1);
                const obj = getVal(state, segs);
                if (obj && typeof obj === "object" && Object.keys(obj).length === 0) {
                    const parent = i === 0 ? state : getVal(state, segs.slice(0, -1));
                    if (parent && typeof parent === "object") {
                        delete (parent as Record<string, any>)[segs[i]!];
                    }
                } else {
                    break; // 某级非空 → 更浅的父级必也非空，短路
                }
            }
            this.mountSegments = null;
            this.createdSegments = null;
            return;
        }
        if (this.attachedKeys) {
            // root 模式：CAS 删除自己写过、且当前值仍为自己末值的键（被后写者覆盖过的键保留）
            for (const [k, v] of this.attachedKeys) {
                if (state[k] === v) delete state[k];
            }
            this.attachedKeys.clear();
            return;
        }
        // local 模式：回收本 scope 的私有响应式域（_scopes 容器保留，仅清该 [id] 条目）
        const scopes = state[SCOPES_KEY] as Record<string, any> | undefined;
        if (scopes) delete scopes[this.binding.id];
    }
}

/**
 * 确保 scope 持有数据容器（「无容器则创建」，ADR-0029 决策 5）：无 `_data` 时为其创建空私有域
 * `_scopes[id]={}` 并失效视图缓存。复用 `engine.data()` 的既有先例（engine.ts 无 data 分支）。
 *
 * 供相对挂载 `./` / `..`（parent 基准）命中「无 `_data` 的 scope」时调用——含 x-for item scope
 * （数据随 item 生死）。**不写任何数据键**，仅建容器；数据键由 applyToContainer merge。
 */
function ensureScopeData(engine: { store: { state: any } }, scope: AutoSparkScope): void {
    if (scope._data) return;
    const scopes = engine.store.state[SCOPES_KEY] as Record<string, any>;
    if (!scopes[scope.id]) scopes[scope.id] = {};
    scope._data = scopes[scope.id];
    // 失效视图缓存：_scopeView 是懒缓存，data 从无到有后须重建，否则子树经 parent 链读不到
    scope.invalidateScopeView();
}

/**
 * 取 scope 数据容器的绝对路径段：私有域 → `['_scopes', String(id)]`；挂载容器（path 模式的
 * `_data` 不在 `_scopes` 下）→ 取该 scope 上 DataDirective 实例已解析的 mountSegments。
 *
 * 供 nearest 上溯命中「path 模式祖先」时取其真实容器路径（parent 基准走 ensureScopeData，
 * 必为私有域，不经此函数）。
 */
function scopeContainerSegments(scope: AutoSparkScope): string[] {
    for (const d of scope.directives) {
        if (d instanceof DataDirective && d.isPathMode()) {
            return d.getMountSegments();
        }
    }
    return [SCOPES_KEY, String(scope.id)];
}

/**
 * 取私有域路径段（`./` 与 parent 基准 `..` 的默认落点，容器必为 `_scopes[id]`）。
 */
function scopeDataSegments(scope: AutoSparkScope): string[] {
    return [SCOPES_KEY, String(scope.id)];
}
