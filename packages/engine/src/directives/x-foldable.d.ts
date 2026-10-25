import { AutoSparkDirectiveBase } from "../features/directive/base";
import type { AutoSpark } from "../engine/engine";
/** 注入 block 全局样式（幂等；多 engine 共享、destroy 不移除——对齐全局样式惯例） */
export declare function registerFoldableStyles(): void;
/**
 * x-foldable 指令（ADR-0098 重写版）：溢出折叠容器。
 */
export declare class FoldableDirective extends AutoSparkDirectiveBase {
    static readonly priority = 0;
    static readonly singleton = true;
    /** Hybrid：scope 通道管编译期装配（shell 解析/触发按钮/选项透传）+ observer 通道管生命周期（观察器启停） */
    static readonly kind: 2;
    /** 类级初始化：注入全局样式 + 注册共享空内容组件（幂等，per engine 一次） */
    static initialize(engine: AutoSpark): void;
    /** 当前轴（值表达式求值派生；非 "column" 一律归一 row） */
    private _dir;
    /** more 触发按钮（编译期预置的 x-popover 宿主，开关归 PopoverDirective） */
    private _trigger;
    /** 面板外壳组件名（仅 x-foldable-options.shell 显式指定时非空；写入触发按钮的 x-popover-options.shell，缺省走 popover 内置 shell） */
    private _shellName;
    /** 折叠子元素栈（push 序 = 折叠序 = DOM 逆序；栈顶 = DOM 最靠前的折叠元素） */
    private _stash;
    /** 各折叠元素的原位锚（折叠时刻的 nextSibling；复位按 LIFO + 锚精确还原） */
    private _anchors;
    /** 各折叠元素的自然主轴尺寸缓存（溢出态测量值——grow 不污染，见文件头论证） */
    private _cache;
    /** 尺寸观察（宿主 + 子元素；观察开始必发一次首回调——初始评估入口） */
    private _ro;
    /** 宿主子树观察（childList 增删 + 换轴 data-direction 属性变化的重估通道） */
    private _mo;
    /** window resize 兜底通道（亦是测试驱动入口——happy-dom 无 RO 回调） */
    private _onWinResize;
    /** 重估重入防护（折叠/恢复动作会改变布局，防评估循环） */
    private _reconciling;
    /** 微任务建连前被销毁（快速 x-if 切换防护，splitter 先例） */
    private _destroyed;
    /** min 尺寸已写入值（同值不重写——防宿主 RO 循环） */
    private _minWritten;
    /** 当前打开的实例（overlay:open 认领；overlay:close 广播时清引用；面板开关真相在触发按钮 dataset.panelOpen——中继写、键盘通道读，跨实例共享走 DOM） */
    private _inst;
    /** overlay:open / overlay:close 广播退订（destroy 摘除） */
    private _unsubOpen;
    private _unsubClose;
    created(): void;
    compile(_context: Record<string, any>, _parent: HTMLElement): void;
    /**
     * 结果树挂载后（observer 通道实例）：打开观察通道 + 子元素契约落样式 + 初始折叠评估。
     *
     * Hybrid 双实例注意：本钩子跑在 observer 实例上，scope 实例编译期装配的触发按钮与
     * 轴标记须**经 DOM 找回**（两实例字段互不共享）——触发按钮按契约类在宿主子元素中
     * 查找，轴从 `data-direction` 读回（dataset 是轴的单一真相）。
     */
    mounted(): void;
    /** observer 通道实例销毁（元素移出引擎根 / dispatcher dispose）：共享善后 */
    unmounted(): void;
    /** scope 通道实例销毁（scope 销毁 / 编译产物剥除）：共享善后（幂等，两侧调用安全） */
    destroy(): void;
    /** 运行态善后（两通道实例共用，幂等）：断开观察器、退订中继、关闭面板、清折叠栈 */
    private _teardown;
    /**
     * 指令值解析：裸词 `row` / `column` 按字面量（主轴几乎不动态切换，字面量书写免引号）；
     * 其余按 scope 表达式订阅（状态驱动换轴，Q7 裁决），结果 "column" → column、其余归一
     * row（静默归一——过渡态 undefined 不构成误用，x-splitter 先例）。
     */
    private _setupAxis;
    private _applyDir;
    /** 换轴热更触发按钮弹出方位（row：面板右对齐按钮下方；column：对称右侧） */
    private _syncTriggerPlacement;
    /** 面板弹出方位（more 恒在主轴末端：row 下方右对齐 / column 右侧下对齐） */
    private _placement;
    /**
     * 面板外壳解析：**默认无壳**——popover 解析链回退内置 `autospark.popover` 种子 shell
     * （自带边框/出口/arrow 载体，锚定模式箭头默认开启），宿主样式不再克隆延续；
     * `x-foldable-options.shell` 显式指定组件名时才以用户外壳为面板容器（查找走 popover
     * 的 scope 链 + 全局组件表协议，须自带默认出口）。非法值 warn + 维持无壳默认。
     */
    private _resolveShellName;
    /**
     * more 触发按钮（编译期形态；图标走全局 sprite）：声明 `x-popover:共享空内容组件`
     * （attr 必填的通道契约，实际内容由 overlay 广播挂入）+ `x-popover-options`（默认仅
     * `at.placement` 按轴初值、换轴经 {@link _syncTriggerPlacement} 热更；`x-foldable-options.popover`
     * 对象整包透传合并——用户值优先，可配 arrow / delayShow / delayHide / at 等 x-popover
     * 全量选项）。键盘 Enter/Space 模拟 mouseenter/mouseleave（hover 模型补偿）。
     */
    private _buildTrigger;
    /** 键盘通道：Enter/Space 按面板开关状态模拟 hover 进出（delayShow=0 时同步开）。
     *  开关真相在触发按钮 dataset.panelOpen（中继写、此处读——keydown 监听挂在中继
     *  所属实例之外，Hybrid 双实例不共享字段，状态收敛到 DOM） */
    private _onTriggerKeydown;
    /** 宿主直接子元素清单（元素节点；排除触发按钮与 x-resizable 手柄——手柄是宿主真实
        子元素（`data-autospark-resize-handle` 契约属性）但 absolute 定位不占 flex 流，
        不参与折叠候选与求和） */
    private _childItems;
    /** 打开观察通道（RO + window resize + 宿主子树 MO；回调统一宏任务化防自触发重入） */
    private _startObserving;
    /** 换轴感知（dataset.direction 单一真相——scope 实例写、本实例读）：换轴时折叠子元素全部按原位锚复位后按新轴全量重算 */
    private _syncAxisFromDom;
    /** 子元素尺寸观察同步（子元素增删后补挂 RO；detached 元素 RO 自动静默，无需摘除） */
    private _syncChildRO;
    /**
     * 内容主轴自然宽（**对齐无关**的溢出判据）：可见子元素 + 触发按钮（显示时）的主轴
     * 尺寸求和 + gap×(n-1)。`scrollWidth` 在非 start 主轴对齐下失真——flex-end 溢出向
     * 起始侧（负方向），负溢出不计入 scrollWidth（scroll > client 恒假，右对齐工具栏
     * 永不折叠）——判据不得依赖 scroll 尺寸；元素级求和（offsetWidth/offsetHeight）
     * 对齐无关。
     */
    private get _contentMain();
    /**
     * 主轴内容可用宽：client 尺寸**减主轴 padding**——clientWidth/clientHeight 含
     * padding，而 flex 子元素布局在 content box 内，判据分母是内容区而非 client 区
     *（不减则阈值宽出 padding，临界态少折、按钮被 overflow:hidden 裁切）。
     * computed padding 恒为 px 解析值；空值（异常环境）归零。
     */
    private get _clientMain();
    private _sizeOf;
    /** 主轴 gap（用户 CSS 承载，引擎不预设；normal 解析为 NaN 归零） */
    private _mainGap;
    /**
     * 子元素可见性（display:none 不占布局——折叠候选与恢复判定都跳过）。
     *
     * detached 元素（stash 中）的 getComputedStyle 在浏览器与 happy-dom 均返回空样式
     * 表——恢复判定对栈内元素失明会把隐藏者错误放回。文档内以 computed 为权威；
     * 空值（detached）以内联 display 兜底（x-show 等运行期隐藏均落内联；类规则
     * display:none 对脱离文档元素两法皆不可判，按可见处理——放回后再经文档内
     * 重估通道纠正，不破坏收敛）。
     */
    private _hidden;
    /**
     * 折叠重估：溢出 → 折叠最后一个可见子元素（缓存自然尺寸 + 原位锚，真实搬移出文档；
     * more 按钮显示、宿主 min 尺寸写入）；有富余 → 从栈顶试恢复（`scroll + gap + 缓存 ≤
     * client` 才放回，失败即停；隐藏者跳过留栈，等可见后自然回位）。每步重读真实布局，
     * more 显隐 / gap / 动态内容的耦合被循环自然吸收；guard 防御意外死循环。
     *
     * **不做振荡熔断**（初版有 `_settle` 深度回访熔断，已移除）：步进算法本身单调（fold
     * 前富余严格小于被折元素宽，恢复判定必不成立，决策 4 论证）——自触发 RO 链数学上
     * 收敛，每轮 guard 上限兜底单轮死循环；而「深度回访即熔断」会把**用户正常来回拖动**
     * （5→3→5）误判为拉锯——宿主宽度变化的唯一驱动若只是 RO（如滑块改 style.width），
     * 熔断后无外部输入解锁、机制永久静默。理论病态（宿主 CSS 尺寸依赖折叠态的深度拉锯）
     * 由 guard 上限表现为可见抖动，可发现可修，不再静默熔断。
     */
    private _reconcile;
    /** 折叠一步：末个可见子元素出文档入栈；无可折叠者返回 false（溢出交 overflow:hidden 裁切） */
    private _foldOne;
    /**
     * 恢复一步：栈顶起找首个可见者放回原位，实测放不下则同帧折回并停步。
     *
     * 恢复判定用**实测法**（真实放回 → 读内容求和溢出 → 放不下折回本人）：理论判定
     * `scroll + gap + cached ≤ client` 两条死路——不溢出态 scrollWidth = clientWidth
     * （scrollable overflow 取较大者）恒假；flex-end 右对齐下溢出向起始侧（负方向）
     * scrollWidth 又漏记负溢出。放回后按 `_contentMain`（对齐无关求和）校验；放回-
     * 校验-折回在同一同步块完成，无渲染帧间闪动；折回后停步（防振荡）。
     */
    private _restoreOne;
    /** 按原位锚复位（锚失效——运行时外部 DOM 变动——退化为尾插；触发按钮 DOM 恒居首位、
        视觉序由 flex order 承担，尾插 = appendChild 即视觉末尾） */
    private _insertBack;
    /** 换轴复位：全部折叠元素按 LIFO + 锚还原（锚在 DOM 未动时恒有效），再走全量重算 */
    private _restoreAll;
    /** more 按钮显隐（display 切换单一真相在指令；未溢出时不参与 flex 不计 gap） */
    private _showTrigger;
    /**
     * 宿主 min 尺寸 = 触发按钮主轴尺寸 + 宿主主轴 padding/border（按钮**完整外沿占位**——
     * 写入后不撤，保证极窄态按钮不被宿主 padding/border 挤裁；同值不重写）。
     * computed padding/border 恒为 px 解析值；空值（异常环境）归零（同 {@link _clientMain}）。
     */
    private _writeMinSize;
    /**
     * 订阅 overlay 广播：**open** 时按 `config.at.selector` 认领本指令触发按钮打开的实例
     * （selector = 按钮，PopoverDirective 缺省锚 = 宿主自身）→ 折叠子元素按 DOM 序挂入
     * 面板出口（活 DOM 无声明式投影通道，注入是唯一旁路；出口 display:contents 透明）；
     * **close** 时在面板 DOM 尚在的窗口把子元素摘回（脱离文档持有——覆盖物实例关闭即
     * 销毁 ADR-0052 修订共识 5，控件状态跨开关保留）。
     */
    private _setupPanelRelay;
    /** 面板关闭善后（leave 动画未播、面板 DOM 尚在——x-popover 同款时序）：子元素摘回 */
    private _onPanelClosed;
}
