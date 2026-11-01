/**
 * `x-resource:名="url"` 指令（ADR-0011）——REST 资源的声明性注册位。
 *
 * - **Compile 通道**（缺省 kind）：`created` 编译期把 url 经映射管线展开为平铺点号名
 *   声明表，注入宿主 scope.actions（local 包装就近覆盖）——纯注册语义（不自动拉取，
 *   纯 RPC 共识）；指令属性随编译剪枝，结果 DOM 不留痕（x-define 同款声明性名位）；
 * - **属性参数** = 资源名（`x-resource:order` → `order.get` / `order.add`…），**值** =
 *   REST 集合地址（字面量，如 `/api/orders`）；
 * - 可见性：挂宿主自身 scope——宿主元素与整个子树（含兄弟指令）均可调用。
 *
 * 混搭/纯方法集形态走 `<script type="autospark/resources">`（本指令只承载纯 REST 形态，
 * url 字符串即全部输入）。
 */
import type { DirectiveSpec } from "autospark";
import { expandResource } from "./define";
import { getGlobalResourceManager } from "./global";

/**
 * 构造 x-resource 指令 spec（bootstrap 经 `AutoSpark.directive(spec)` 注册）。
 */
export function createResourceDirectiveSpec(): DirectiveSpec {
    return {
        name: "resource",
        created() {
            const name = (this.attr ?? "").trim();
            if (!name) {
                this.warn(`x-resource: 缺属性参数（形态 x-resource:<资源名>="<url>"），本声明已忽略`);
                return;
            }
            const raw = String(this.value ?? "").trim();
            if (!raw) {
                this.warn(`x-resource:${name}: 缺 url 值，本声明已忽略`);
                return;
            }
            const decls = expandResource(
                name,
                raw,
                this.engine,
                getGlobalResourceManager().options,
            );
            if (Object.keys(decls).length === 0) {
                this.warn(`x-resource:${name}: 资源展开为空（映射表不可用？），本声明已忽略`);
                return;
            }
            this.engine.actionsManager.registerScoped(this.binding, decls);
        },
    };
}
