import type { AutoSparkScope } from "../scope";
import type { ComponentHooks, ComponentSetup } from "../directives/component-def";
import type { StyleBind } from "../utils/styleBind";
import type { OverlayInstance } from "./instance";

/**
 * 覆盖层体系类型（ADR-0052）。
 *
 * 家族词汇：**覆盖层定义**（x-overlay 声明 → OverlayDef）/ **覆盖层实例**（消费渲染产物 →
 * OverlayInstance）/ **覆盖层消费者**（x-dialog 等指令 + 命令式 OverlayHandle）。
 */

/**
 * 定位锚配置（ADR-0052 决策 21）：与 scope 正交——scope 管数据视图、anchor 管显示位置。
 * 键名对齐 floating-ui（placement/offset/shift/flip/arrow），减少映射层。
 */
export interface OverlayAnchorConfig {
    /**
     * 定位锚（两栖，决策 22）：字符串选择器（`@` 前缀全局 `document.querySelector`、
     * 无前缀在 searchRoot 子树内查，打开时现查，未命中 warn + 退屏幕居中）或元素引用（命令式）。
     */
    at?: string | HTMLElement;
    /** floating-ui 原生 placement 值（'top' | 'top-start' | 'bottom-end' | …） */
    placement?: string;
    /** 透传 offset 中间件（间距） */
    offset?: any;
    /** 透传 shift 中间件（视口内滑移 padding） */
    shift?: any;
    /** 视口翻转，默认 true（floating-ui 推荐默认） */
    flip?: boolean;
    /** 箭头：true 时引擎自动注入载体元素 + 伪元素默认视觉（8×8 旋转 45°，决策 24） */
    arrow?: boolean;
}

/**
 * 覆盖层生效配置：四级深度合并后的形态
 * （声明式：内置默认 < x-overlay-options < x-dialog-options < 值对象内联；
 *   命令式：内置默认 < x-overlay-options < getOverlay options < open options——少一级，ADR-0052 决策 4/17）。
 */
export interface OverlayConfig {
    /** 类型认领标记（'' = 通用；消费者类型不匹配 warn 仍渲染，决策 3） */
    type: string;
    /** 单例（默认 true）：懒实例化 + 关闭隐藏保活；false 每次新实例可并存、关闭即销毁（决策 10） */
    singleton: boolean;
    /** 点击遮罩请求关闭（默认 true，决策 12） */
    closeOnMask: boolean;
    /** 进出场动画（ADR-0039 三形态：字符串 | 对象 | false；默认 'fade'，经 resolveAnimate 解析） */
    animate: any;
    /**
     * scope 基准（决策 11 三合一：表达式上下文 = 挂链 = 生命周期）：
     * `declarer`（默认）实例随声明处 scope 生死；`consumer` 随消费者 scope。
     */
    scope: "consumer" | "declarer";
    /** 定位锚（可选；无 at 或未命中时 dialog 恒屏幕居中，ADR-0052 决策 21/24） */
    anchor?: OverlayAnchorConfig;
    /** 其余自由键原样保留（开放配置，供消费者指令/自定义 UI 消费） */
    [key: string]: any;
}

/** 内置默认配置（合并链第一层） */
export const OVERLAY_DEFAULTS: OverlayConfig = {
    type: "",
    singleton: true,
    closeOnMask: true,
    animate: "fade",
    scope: "declarer",
};

/**
 * 覆盖层定义（ADR-0052 决策 5）：编译期前置 transformer 命中 x-overlay 时收集。
 *
 * 快照与组件语义（setup/hooks/styles/styleBinds）复用 `buildComponentDef` 管道——覆盖层模板具
 * 完整组件能力，消费时经 `compileChild(…, componentDef=def)` 注入（data()/methods/四阶段 hooks/
 * scoped CSS 全生效）。快照保留指令属性、未编译、已剥离 script/style 子节点。
 */
export interface OverlayDef {
    /** 覆盖层名（x-overlay:<名称> 的名称，查找键） */
    name: string;
    /** 类型认领标记（声明值；'' = 通用） */
    type: string;
    /** 冻结快照根（深克隆，消费时 cloneNode 后编译） */
    snapshot: HTMLElement;
    /** 合并后的 `<script setup>`（同 ComponentDef.setup）；无则 undefined */
    setup: ComponentSetup | undefined;
    /** 合并后的四阶段钩子表；无则 undefined */
    hooks: ComponentHooks | undefined;
    /** scoped CSS 文本数组（bind 提取后）；无则 undefined */
    styles: string[] | undefined;
    /** 响应式 `<style>` bind 清单；无则 undefined */
    styleBinds: StyleBind[] | undefined;
    /** 声明处选项（`x-overlay-options` 解析产物，合并链第二层）；无则 null */
    options: Record<string, any> | null;
    /** 声明处 scope（declarer 基准的挂链目标；`.global` 定义注销的判据） */
    owner: AutoSparkScope;
    /** 单例池槽位（决策 10/18：单例实例按定义共享，命令式与声明式同池） */
    singletonInstance: OverlayInstance | null;
}
