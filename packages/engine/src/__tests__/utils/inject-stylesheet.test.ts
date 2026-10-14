import { describe, expect, test, beforeEach } from "bun:test";
import "../setup";
import { injectStylesheet } from "../../utils/injectStylesheet";

/**
 * injectStylesheet 单测（ADR-0113 增补 patch 模式）。
 *
 * 覆盖：
 * - default 幂等查重（已存在不覆写）
 * - replace 无条件覆写
 * - patch 内容不同才覆写 / 等值不动 textContent
 * - append 追加
 */
describe("injectStylesheet", () => {
    beforeEach(() => {
        for (const el of Array.from(document.head.querySelectorAll("[id^='is-test-']"))) {
            el.remove();
        }
    });

    test("default：查重复用，已存在不覆写内容", () => {
        const a = injectStylesheet(".a { color: red }", { id: "is-test-1" });
        const b = injectStylesheet(".a { color: blue }", { id: "is-test-1" });
        expect(b).toBe(a);
        expect(a!.textContent).toBe(".a { color: red }");
    });

    test("replace：无条件覆写", () => {
        injectStylesheet(".a { color: red }", { id: "is-test-2" });
        const b = injectStylesheet(".a { color: blue }", { id: "is-test-2", mode: "replace" });
        expect(b!.textContent).toBe(".a { color: blue }");
    });

    test("patch：内容不同才写入", () => {
        const a = injectStylesheet(".a { color: red }", { id: "is-test-3" });
        const b = injectStylesheet(".a { color: blue }", { id: "is-test-3", mode: "patch" });
        expect(b).toBe(a);
        expect(b!.textContent).toBe(".a { color: blue }");
        // 等值再 patch：内容不变（写入与否由比对决定，断言语义等价）
        const c = injectStylesheet(".a { color: blue }", { id: "is-test-3", mode: "patch" });
        expect(c!.textContent).toBe(".a { color: blue }");
        expect(document.head.querySelectorAll("#is-test-3").length).toBe(1);
    });

    test("patch：新建时与 default 同语义（不存在则创建）", () => {
        const el = injectStylesheet(".n { color: red }", { id: "is-test-4", mode: "patch" });
        expect(el).not.toBeNull();
        expect(el!.textContent).toBe(".n { color: red }");
    });

    test("append：在既有内容后追加", () => {
        injectStylesheet(".a { color: red }", { id: "is-test-5" });
        const b = injectStylesheet(".b { color: blue }", { id: "is-test-5", mode: "append" });
        expect(b!.textContent).toBe(".a { color: red }.b { color: blue }");
    });
});
