/**
 * confirm type 组件（ADR-0089）：继承 base（内容与公共 methods 复用），仅追加 yes/no——
 * 经 `messages.respond(id, value)` 走 value-action 统一闭环（写 result → `message:action` →
 * choice resolve → hide 判定；与 DOM 点击同一条执行路径，事件观察者无感知差异）。
 *
 * **thenable**（ADR-0089 决策七）：`await add({ type: "confirm" })` 直接得 choice 应答——
 * then 由 manager 在实例落地时动态附加（`Object.defineProperty`，choice promise 归 manager
 * 编排；组件模板不承载协议面）。sticky 永不 settle、永不 reject 语义保持（ADR-0077）。
 */
export const CONFIRM_TEMPLATE = `
<div x-define="autospark.messages.confirm" x-define:inherit="autospark.messages.base">
<script setup>
{
    methods: {
        yes() { this.engine.messages.respond(this.props.id, true); },
        no() { this.engine.messages.respond(this.props.id, false); },
    },
}
</script>
</div>`;

/**
 * confirm 种子默认（合并链 type 种子层）：紧凑形态 + **sticky**（delayClose 0——等应答不
 * 自动关，ADR-0077 沿用）+ **默认双钮**（value-only 数据化——ADR-0089 起 props.ts 的 confirm
 * 双钮注入 if 退役，种子层天然可被 options / types[type] / 单次 props 的 actions 覆盖）。
 */
export const CONFIRM_DEFAULTS: Record<string, any> = {
    width: 300,
    delayClose: 0,
    actions: [
        { title: "确定", value: true },
        { title: "取消", value: false },
    ],
};
