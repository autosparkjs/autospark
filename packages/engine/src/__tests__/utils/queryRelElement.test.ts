import { describe, expect, test } from "bun:test";
import "../setup";
import { queryRelElement } from "../../utils/queryRelElement";

/**
 * queryRelElement 相对元素查询单元测试。
 *
 * DOM 结构（挂 document 以便全局 '/' 与 closest 跨层验证）：
 * <div id="gp">            ← 祖父
 *   <a id="gp-a"></a>
 *   <div id="parent">      ← 父
 *     <a id="p-a"></a>
 *     <div id="self">      ← 基准 el
 *       <span id="in"></span>
 *       <div id="child"><a id="c-a"></a></div>
 *     </div>
 *   </div>
 * </div>
 */
describe("utils/queryRelElement", () => {
    const build = () => {
        const root = document.createElement("div");
        root.innerHTML = `
            <div id="gp">
                <a id="gp-a"></a>
                <div id="parent">
                    <a id="p-a"></a>
                    <div id="self">
                        <span id="in"></span>
                        <div id="child"><a id="c-a"></a></div>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(root);
        return root;
    };

    test("空 selector / '.' / './' → 返回 el 自身", () => {
        const root = build();
        const self = root.querySelector("#self")!;
        expect(queryRelElement(self, "")).toBe(self);
        expect(queryRelElement(self, null)).toBe(self);
        expect(queryRelElement(self, undefined)).toBe(self);
        expect(queryRelElement(self, ".")).toBe(self);
        expect(queryRelElement(self, "./")).toBe(self);
        expect(queryRelElement(null, "#x")).toBeNull(); // el 为空 → null
        root.remove();
    });

    test("普通选择器：el 内部 query（不含 el 自身）", () => {
        const root = build();
        const self = root.querySelector("#self")!;
        expect(queryRelElement(self, "#in")!.id).toBe("in");
        expect(queryRelElement(self, "a")!.id).toBe("c-a"); // 后代命中
        expect(queryRelElement(self, "#p-a")).toBeNull(); // 父级元素不在 el 内部
        root.remove();
    });

    test("'../' 父元素内 query（支持多级；超出根停在根）", () => {
        const root = build();
        const self = root.querySelector("#self")!;
        expect(queryRelElement(self, "../#p-a")!.id).toBe("p-a"); // 父内部
        expect(queryRelElement(self, "../#self")!.id).toBe("self"); // #self 是父的直接子元素（子树内命中）
        expect(queryRelElement(self, "../../#gp-a")!.id).toBe("gp-a"); // 祖父内部
        // 超出根：停在根元素继续 query（三级爬升到 body，#gp 在 body 内命中）
        expect(queryRelElement(self, "../../../#gp")!.id).toBe("gp");
        root.remove();
    });

    test("'/' 全局 query", () => {
        const root = build();
        const self = root.querySelector("#self")!;
        expect(queryRelElement(self, "/#gp")!.id).toBe("gp"); // 跳出子树全局查
        expect(queryRelElement(self, "/#nope")).toBeNull();
        root.remove();
    });

    test("'^' closest（含 el 自身）+ '../' 起点上爬", () => {
        const root = build();
        const child = root.querySelector("#child")!;
        // closest 从起点**含自身**向上
        expect(queryRelElement(child, "^div")!.id).toBe("child");
        expect(queryRelElement(child, "^#self")!.id).toBe("self");
        expect(queryRelElement(child, "^../#self")!.id).toBe("self"); // 起点爬到父（self），closest 命中自身
        expect(queryRelElement(child, "^../../#parent")!.id).toBe("parent");
        // child 的祖先链（#self → #parent → #gp）上无 <a>（#p-a 是 #self 的兄弟）→ null
        expect(queryRelElement(child, "^a")).toBeNull();
        expect(queryRelElement(child, "^../../a")).toBeNull();
        // closest 起点爬升超出根：停在根继续 closest（含起点自身——爬到 #gp 命中自身）
        expect(queryRelElement(child, "^../../../#gp")!.id).toBe("gp");
        expect(queryRelElement(child, "^../../../body")!.tagName).toBe("BODY"); // 爬三级到 #gp，closest('body') 沿祖先链命中
        root.remove();
    });

    test("边界：el 为空 → null；空白选择器 → el；无选择器的 '..'/'^' → null", () => {
        const root = build();
        const self = root.querySelector("#self")!;
        expect(queryRelElement(null, "#x")).toBeNull();
        expect(queryRelElement(self, "   ")).toBe(self); // 空白 trim 后 = 空 → el 自身
        expect(queryRelElement(self, "..")).toBeNull(); // 纯 '..' 无选择器
        expect(queryRelElement(self, "^")).toBeNull(); // '^' 无选择器
        expect(queryRelElement(self, "^../../")).toBeNull(); // 爬升后无选择器
        expect(queryRelElement(self, "###bad")).toBeNull(); // 非法选择器不抛错
        expect(queryRelElement(self, "^###bad")).toBeNull();
        root.remove();
    });
});
