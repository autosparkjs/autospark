/**
 * autospark.pagination 组件插件（组件库 P2 导航件，ADR-0018 清单权威表 navigation 行）：
 * 经插件全局组件表注册（ADR-0111 决策 5，`AutoSpark.components[name] = 模板字符串`），
 * 跨 engine 真全局——晚注册立即生效，同名后注册覆盖先注册。
 *
 * 分页器：受控当前页（page，el.value 桥 + change detail = { page, pageSize } + input
 * 回写 x-model）、每页条数（pageSize）、总条数（total）、条数切换（pageSizes，状态引用
 * 注入；元素名形态走 data-page-sizes JSON 通道）、极简形态（simple）。页码窗口省略号
 * 折叠（总页数 <= 7 全量直出，>7 时五宽窗口 + 首末页 + 省略号），上/下一页与首/末页
 * 按钮（首末为双箭头形态）。内置文案走 i18n 词典（ADR-0018 决策 6 约定 1）：键
 * pagination.first / prev / next / last / total（"共 {n} 条"插值）/ pageSize
 * （"{n} 条/页"插值），未装 i18n 或词典无键时回退硬编码中文。
 *
 * 元素名快速写法 `<x-pagination page="2" total="100">` 由 engine 元素名自动组件承载
 * （ADR-0117 缺省注册）；裸 `page-sizes` JSON 字符串属性经本文件 precompile 改道
 * data-page-sizes（规避值对象内字面量数组 props 的死环缺陷，P0 固化规避清单第 1 条，
 * breadcrumb 同款纪律）。
 *
 * IIFE 产物全局名 `AutoSparkPagination`（autospark.pagination.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import paginationTemplate from "./pagination.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const PAGINATION_NAME = "autospark.pagination";

/**
 * 插件注册体：写插件全局组件表 + precompile 元素名 page-sizes 改道。
 */
function mountPaginationPlugin(autospark: typeof AutoSpark): void {
    autospark.components[PAGINATION_NAME] = paginationTemplate;
    // 裸 page-sizes 属性（JSON 字符串）改道 data-items 同款通道：engine 元素名自动组件的
    // 静态属性折叠会把 `[10,20,30]` 推断为数组字面量折进 props 值对象——值对象内字面量
    // 数组存在无限更新缺陷（ADR-0019 规避清单第 1 条），字符串标量通道绕开；data-* 属性
    // 在元素名折叠规则中保留，组件 mounted 解析写 data 响应渲染
    autospark.precompile?.((engine: InstanceType<typeof AutoSpark>) => {
        for (const el of Array.from(engine.el.querySelectorAll("x-pagination"))) {
            const bare = el.getAttribute("page-sizes");
            if (bare != null && bare !== "" && !el.hasAttribute(":page-sizes")) {
                el.setAttribute("data-page-sizes", bare);
            }
            el.removeAttribute("page-sizes");
        }
    });
}

bootstrapPaginationPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapPaginationPlugin(): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
        mountPaginationPlugin(autospark);
    });
}

export { bootstrapPaginationPlugin };
