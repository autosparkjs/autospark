import { describe, it, expect } from "bun:test";
import { parsePathParams, compilePathPattern } from "@/utils/parseParams";
import { extractQueryParams } from "@/utils/extractQueryParams";

describe("parsePathParams", () => {
    describe("冒号语法参数", () => {
        it("应该提取冒号语法参数 /user/:id/:post", () => {
            const params = parsePathParams("/user/:id/:post", "/user/123/456");

            expect(params).toEqual({ id: "123", post: "456" });
        });

        it("应该提取单个冒号参数", () => {
            const params = parsePathParams("/user/:id", "/user/abc");

            expect(params).toEqual({ id: "abc" });
        });

        it("无参数路径应返回空对象", () => {
            const params = parsePathParams("/user/home", "/user/home");

            expect(params).toEqual({});
        });
    });

    describe("尖括号语法参数", () => {
        it("应该提取尖括号语法参数 /user/<id>/post/<post>", () => {
            const params = parsePathParams("/user/<id>/post/<post>", "/user/123/post/456");

            expect(params).toEqual({ id: "123", post: "456" });
        });

        it("应该提取单个尖括号参数", () => {
            const params = parsePathParams("/user/<id>", "/user/test");

            expect(params).toEqual({ id: "test" });
        });
    });

    describe("查询参数", () => {
        it("应该提取查询参数 ?id=123&name=test", () => {
            const params = extractQueryParams("?id=123&name=test");

            expect(params).toEqual({ id: "123", name: "test" });
        });

        it("空查询字符串应返回空对象", () => {
            const params = extractQueryParams("");

            expect(params).toEqual({});
        });

        it("无值的查询参数应返回空字符串", () => {
            const params = extractQueryParams("?empty&key=val");

            expect(params).toEqual({ empty: "", key: "val" });
        });
    });

    describe("混合提取", () => {
        it("应该同时提取路径参数和查询参数", () => {
            const pathParams = parsePathParams("/user/:id", "/user/123");
            const queryParams = extractQueryParams("?name=test");

            expect(pathParams).toEqual({ id: "123" });
            expect(queryParams).toEqual({ name: "test" });
        });
    });

    describe("正则约束验证", () => {
        it("/user/:id(\\d+) 应该仅匹配数字 ID", () => {
            const params = parsePathParams("/user/:id(\\d+)", "/user/123");

            expect(params).toEqual({ id: "123" });
        });

        it("/user/:id(\\d+) 不匹配非数字时应返回 null 值", () => {
            const params = parsePathParams("/user/:id(\\d+)", "/user/abc");

            expect(params.id).toBeUndefined();
        });
    });
});

describe("compilePathPattern", () => {
    it("应该编译静态路径", () => {
        const { regex, paramNames } = compilePathPattern("/user/home");

        expect(paramNames).toEqual([]);
        expect(regex.test("/user/home")).toBe(true);
        expect(regex.test("/user/other")).toBe(false);
    });

    it("应该编译带参数的路径并返回参数名", () => {
        const { regex, paramNames } = compilePathPattern("/user/:id/post/:postId");

        expect(paramNames).toEqual(["id", "postId"]);
        const match = "/user/1/post/2".match(regex);
        expect(match).not.toBeNull();
        expect(match![1]).toBe("1");
        expect(match![2]).toBe("2");
    });

    it("应该编译带正则约束的路径", () => {
        const { regex, paramNames } = compilePathPattern("/user/:id(\\d+)");

        expect(paramNames).toEqual(["id"]);
        expect(regex.test("/user/123")).toBe(true);
        expect(regex.test("/user/abc")).toBe(false);
    });

    it("应该编译尖括号语法", () => {
        const { regex, paramNames } = compilePathPattern("/user/<name>");

        expect(paramNames).toEqual(["name"]);
        const match = "/user/john".match(regex);
        expect(match).not.toBeNull();
        expect(match![1]).toBe("john");
    });
});
