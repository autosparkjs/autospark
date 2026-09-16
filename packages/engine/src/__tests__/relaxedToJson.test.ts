import { describe, expect, test } from "bun:test";
import { relaxedToJson } from "../utils/relaxedToJson";

/**
 * relaxedToJson 单元测试
 *
 * 覆盖：无引号键、尾逗号、单引号字符串、嵌套、裸值透传。
 */
describe("relaxedToJson", () => {
    // ── 无引号键名 ──
    test("无引号键名", () => {
        expect(JSON.parse(relaxedToJson('{name: "foo"}'))).toEqual({ name: "foo" });
        expect(JSON.parse(relaxedToJson('{a: 1, b: "hello"}'))).toEqual({ a: 1, b: "hello" });
    });

    // ── 尾逗号 ──
    test("尾逗号（对象）", () => {
        expect(JSON.parse(relaxedToJson('{a: 1, b: 2,}'))).toEqual({ a: 1, b: 2 });
    });

    test("尾逗号（数组）", () => {
        expect(JSON.parse(relaxedToJson('[1, 2, 3,]'))).toEqual([1, 2, 3]);
    });

    test("多层尾逗号", () => {
        expect(JSON.parse(relaxedToJson('{a: [1, 2,], b: {x: 1,},}'))).toEqual({
            a: [1, 2],
            b: { x: 1 },
        });
    });

    // ── 单引号字符串 ──
    test("单引号字符串值", () => {
        expect(JSON.parse(relaxedToJson("{name: 'foo'}"))).toEqual({ name: "foo" });
    });

    test("单引号字符串键", () => {
        expect(JSON.parse(relaxedToJson("{'key': 'value'}"))).toEqual({ key: "value" });
    });

    test("单引号内含双引号", () => {
        expect(JSON.parse(relaxedToJson("{a: 'he\"llo'}"))).toEqual({ a: 'he"llo' });
    });

    test("双引号内含单引号", () => {
        expect(JSON.parse(relaxedToJson('{a: "he\'llo"}'))).toEqual({ a: "he'llo" });
    });

    // ── 嵌套 ──
    test("嵌套对象", () => {
        expect(JSON.parse(relaxedToJson('{a: {b: {c: 1}}}'))).toEqual({ a: { b: { c: 1 } } });
    });

    test("嵌套数组", () => {
        expect(JSON.parse(relaxedToJson('{a: [[1, 2], [3, 4]]}'))).toEqual({ a: [[1, 2], [3, 4]] });
    });

    test("混合嵌套", () => {
        const input = '{items: [{name: "a", tags: [1, 2]}, {name: "b"}]}';
        expect(JSON.parse(relaxedToJson(input))).toEqual({
            items: [
                { name: "a", tags: [1, 2] },
                { name: "b" },
            ],
        });
    });

    // ── 裸值透传 ──
    test("裸值 true/false/null", () => {
        expect(JSON.parse(relaxedToJson('{a: true, b: false, c: null}'))).toEqual({
            a: true,
            b: false,
            c: null,
        });
    });

    test("数字值", () => {
        expect(JSON.parse(relaxedToJson('{a: 42, b: -1, c: 3.14, d: 1e5}'))).toEqual({
            a: 42,
            b: -1,
            c: 3.14,
            d: 100000,
        });
    });

    // ── 已有合法 JSON 透传 ──
    test("合法 JSON 透传", () => {
        const input = '{"a": 1, "b": [2, 3]}';
        expect(JSON.parse(relaxedToJson(input))).toEqual({ a: 1, b: [2, 3] });
    });

    // ── 空输入 ──
    test("空对象 / 空数组", () => {
        expect(JSON.parse(relaxedToJson("{}"))).toEqual({});
        expect(JSON.parse(relaxedToJson("[]"))).toEqual([]);
    });

    // ── 综合场景 ──
    test("综合：无引号键 + 尾逗号 + 单引号", () => {
        const input = `{name: 'test', count: 5, enabled: true, tags: ['a', 'b',]}`;
        expect(JSON.parse(relaxedToJson(input))).toEqual({
            name: "test",
            count: 5,
            enabled: true,
            tags: ["a", "b"],
        });
    });
});
