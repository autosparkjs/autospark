import { describe, expect, test } from "bun:test";
import "../setup";
import { params } from "../../utils/params";

describe("params 字符串插值（ADR-0136 自 router 迁入）", () => {
    test("位置参数", () => {
        expect(params("{}+{}", 1, 2)).toBe("1+2");
    });

    test("命名参数", () => {
        expect(params("{a}+{b}", { a: 1, b: 2 })).toBe("1+2");
    });

    test("$ 前缀命名参数（复数变量通道，正则放宽）", () => {
        expect(params("{$count}辆车", { $count: 3 })).toBe("3辆车");
        expect(params("{name}有{$count}辆车", { name: "张三", $count: 1 })).toBe("张三有1辆车");
    });

    test("缺成员为空串（undefined/null → \"\"）", () => {
        expect(params("{a}{b}", { a: 1 })).toBe("1");
    });

    test("函数值执行", () => {
        expect(params("{a}", { a: () => "hello" })).toBe("hello");
    });

    test("无参数原样返回（含 {} 不替换）", () => {
        expect(params("no {} vars")).toBe("no {} vars");
    });

    test("String.prototype.params 副作用扩展保留（router 既有用法契约）", () => {
        expect("我有{}辆车".params(5)).toBe("我有5辆车");
    });
});
