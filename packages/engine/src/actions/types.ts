/**
 * ActionDesc / ActionDecl —— action 的统一存储形态与声明形态（ADR-0036）。
 *
 * **存储层全量规范化（决策 1）**：三入口（`options.actions` 构造扫描 / `engine.actions` Proxy
 * 赋值 / `<script type="autospark/actions">` 提取）写入时，函数简写与对象写法统一规范化为
 * `ActionDesc` 描述符存储——`engine.actions` 与 `scope.actions` 的值恒为本形态，无双形态并存。
 *
 * **开放元数据（决策 2）**：`handle` 是唯一必需保留键（执行体）；`title` / `icon` 为文档化
 * 约定键，其余自由键原样保留（引擎只认 `handle`，不为未来键做专门处理）。
 */

/**
 * action 的统一存储与读取形态（descriptor）。
 *
 * 函数写法是它的**简写形态**（≡ `{ handle: fn }`），两种写法在任一声明入口可混用（逐条独立
 * 判断形态）。`engine.actions[name]` / `scope.getAction` 恒返回本对象，执行取 `.handle(...)`
 * （x-on / x-model / x-data 等内部消费者透明解包，模板侧无感）。
 */
export interface ActionDesc {
    /**
     * 执行体（唯一必需保留键）。规范化时经 buildAction 包装，获得双通道生命周期广播
     * （ADR-0010 / 0011）；广播与 `this.action` 自引用取到的即包装后版本。
     */
    handle: (...args: any[]) => any;
    /**
     * action 名（注册键）。规范化时由 ActionManager 以注册键统一注入/覆盖（决策 3）——
     * descriptor 自知其名，`Object.values` 遍历不丢名；用户声明里的 name 不生效。
     */
    name: string;
    /** 文档化约定键：展示标题（如 UI 工具生成菜单、加载提示显示动作标题） */
    title?: string;
    /** 文档化约定键：图标名称 */
    icon?: string;
    /**
     * 文档化约定键（行为型，ADR-0038）：x-loading 动作按钮点击后是否隐藏所在加载覆盖层，
     * 默认 `true`（隐藏）、显式 `false` 关闭（如 retry 续显）。由 x-loading 按钮委托在
     * **点击时现读**；其他场景不解释（开放元数据，引擎核心只认 handle）。
     */
    hide?: boolean;
    /**
     * 自由元数据键（开放元数据，决策 2）：原样保留、引擎不解释。将来扩展
     * `description` / `hotkey` / `disabled` 等键无需改本类型与规范化逻辑。
     */
    [key: string]: any;
}

/**
 * action 的**声明形态**（三入口接受的入参类型）：函数简写 | 对象写法。
 *
 * 规范化由 ActionManager 统一执行（`options.actions` / Proxy set / extractScript），
 * 非法声明（非函数、对象缺 `handle` 或 `handle` 非函数）记 error 日志后跳过（决策 2）。
 */
export type ActionDecl = ((...args: any[]) => any) | ActionDesc;
