// @ts-nocheck

import { describe, it, expect } from "bun:test";
import { normalizeRoutes } from "@/utils/normalizeRoutes";
import type { KylinRouteItem } from "@/types";

describe("normalizeRoutes - 基础功能", () => {
    it("应该接受单个路由对象", () => {
        const input: KylinRouteItem = { path: "home", view: "home.html" };
        const output = normalizeRoutes(input);

        expect(output).toMatchObject({
            path: "/",
            children: [{ path: "home", view: "home.html" }],
        });
    });

    it("应该保持单段路由不变（包装在根路由中）", () => {
        const input: KylinRouteItem[] = [
            { path: "home", view: "home.html" },
            { path: "about", view: "about.html" },
        ];
        const output = normalizeRoutes(input);

        expect(output).toMatchObject({
            path: "/",
            children: [
                { path: "home", view: "home.html" },
                { path: "about", view: "about.html" },
            ],
        });
    });

    it("应该自动创建根路由", () => {
        const input: KylinRouteItem[] = [{ path: "home", view: "home.html" }];
        const output = normalizeRoutes(input);

        expect(output).toMatchObject({
            path: "/",
            children: [{ path: "home", view: "home.html" }],
        });
    });

    it("应该保留已存在的根路由属性", () => {
        const input: KylinRouteItem[] = [
            { path: "/", name: "root", meta: { title: "Root" } },
            { path: "home", view: "home.html" },
        ];
        const output = normalizeRoutes(input);

        expect(output).toMatchObject({
            path: "/",
            name: "root",
            meta: { title: "Root" },
            children: [{ path: "home", view: "home.html" }],
        });
    });

    it("应该处理空数组", () => {
        const output = normalizeRoutes([]);

        expect(output).toMatchObject({
            path: "/",
        });
        expect(output.children).toBeUndefined();
    });

    it("应该处理 null 输入", () => {
        const output = normalizeRoutes(null as any);

        expect(output).toMatchObject({
            path: "/",
        });
        expect(output.children).toBeUndefined();
    });
});

describe("normalizeRoutes - 路径分解", () => {
    it("应该将 a/b 分解为嵌套结构", () => {
        const input: KylinRouteItem[] = [{ path: "a/b", view: "b.html", meta: { title: "B" } }];
        const output = normalizeRoutes(input);

        expect(output).toMatchObject({
            path: "/",
            children: [
                {
                    path: "a",
                    children: [{ path: "b", view: "b.html", meta: { title: "B" } }],
                },
            ],
        });
    });

    it("应该合并相同前缀的扁平路由", () => {
        const input: KylinRouteItem[] = [
            { path: "a/b", view: "b.html" },
            { path: "a/c", view: "c.html" },
        ];
        const output = normalizeRoutes(input);

        expect(output).toMatchObject({
            path: "/",
            children: [
                {
                    path: "a",
                    children: [
                        { path: "b", view: "b.html" },
                        { path: "c", view: "c.html" },
                    ],
                },
            ],
        });
    });

    it("应该处理三层嵌套路径", () => {
        const input: KylinRouteItem[] = [{ path: "a/b/c", view: "c.html" }];
        const output = normalizeRoutes(input);

        expect(output).toMatchObject({
            path: "/",
            children: [
                {
                    path: "a",
                    children: [
                        {
                            path: "b",
                            children: [{ path: "c", view: "c.html" }],
                        },
                    ],
                },
            ],
        });
    });

    it("应该处理复杂的多层路径合并", () => {
        const input: KylinRouteItem[] = [
            { path: "admin/user/list", view: "list.html" },
            { path: "admin/user/detail", view: "detail.html" },
            { path: "admin/settings", view: "settings.html" },
        ];
        const output = normalizeRoutes(input);

        expect(output).toMatchObject({
            path: "/",
            children: [
                {
                    path: "admin",
                    children: [
                        {
                            path: "user",
                            children: [
                                { path: "list", view: "list.html" },
                                { path: "detail", view: "detail.html" },
                            ],
                        },
                        { path: "settings", view: "settings.html" },
                    ],
                },
            ],
        });
    });
});

describe("normalizeRoutes - 特殊路径处理", () => {
    it("应该保持通配符 * 路径不分解", () => {
        const input: KylinRouteItem[] = [
            { path: "*", view: "404.html" },
            { path: "home", view: "home.html" },
        ];
        const output = normalizeRoutes(input);

        expect(output).toMatchObject({
            path: "/",
            children: [
                { path: "*", view: "404.html" },
                { path: "home", view: "home.html" },
            ],
        });
    });

    it("应该将 a/** 分解为嵌套结构", () => {
        const input: KylinRouteItem[] = [{ path: "a/**", view: "catch-all.html" }];
        const output = normalizeRoutes(input);

        expect(output).toMatchObject({
            path: "/",
            children: [
                {
                    path: "a",
                    children: [{ path: "**", view: "catch-all.html" }],
                },
            ],
        });
    });

    it("应该将 a/b/** 分解为多层嵌套结构", () => {
        const input: KylinRouteItem[] = [{ path: "a/b/**", view: "catch-all.html" }];
        const output = normalizeRoutes(input);

        expect(output).toMatchObject({
            path: "/",
            children: [
                {
                    path: "a",
                    children: [
                        {
                            path: "b",
                            children: [{ path: "**", view: "catch-all.html" }],
                        },
                    ],
                },
            ],
        });
    });

    it("应该忽略 ** 路由中的 children", () => {
        const input: KylinRouteItem[] = [
            { path: "a/**", view: "catch-all.html", children: [{ path: "x" }] },
        ];
        const output = normalizeRoutes(input);

        expect(output).toMatchObject({
            path: "/",
            children: [
                {
                    path: "a",
                    children: [{ path: "**", view: "catch-all.html" }],
                },
            ],
        });
    });

    it("应该忽略多层路径中 ** 路由的 children", () => {
        const input: KylinRouteItem[] = [
            { path: "a/b/**", view: "catch-all.html", children: [{ path: "x" }] },
        ];
        const output = normalizeRoutes(input);

        expect(output).toMatchObject({
            path: "/",
            children: [
                {
                    path: "a",
                    children: [
                        {
                            path: "b",
                            children: [{ path: "**", view: "catch-all.html" }],
                        },
                    ],
                },
            ],
        });
    });

    it("应该分解参数化路径 :id", () => {
        const input: KylinRouteItem[] = [{ path: "user/:id", view: "user.html" }];
        const output = normalizeRoutes(input);

        expect(output).toMatchObject({
            path: "/",
            children: [
                {
                    path: "user",
                    children: [{ path: ":id", view: "user.html" }],
                },
            ],
        });
    });

    it("应该分解参数化路径 <id>", () => {
        const input: KylinRouteItem[] = [{ path: "post/<id>", view: "post.html" }];
        const output = normalizeRoutes(input);

        expect(output).toMatchObject({
            path: "/",
            children: [
                {
                    path: "post",
                    children: [{ path: "<id>", view: "post.html" }],
                },
            ],
        });
    });

    it("应该分解正则约束路径", () => {
        const input: KylinRouteItem[] = [{ path: "user/:id(\\d+)", view: "user.html" }];
        const output = normalizeRoutes(input);

        expect(output).toMatchObject({
            path: "/",
            children: [
                {
                    path: "user",
                    children: [{ path: ":id(\\d+)", view: "user.html" }],
                },
            ],
        });
    });
});

describe("normalizeRoutes - 边界情况", () => {
    it("应该处理重复路径（后者覆盖前者）", () => {
        const input: KylinRouteItem[] = [
            { path: "a/b", view: "first.html" },
            { path: "a/b", view: "second.html" },
        ];
        const output = normalizeRoutes(input);

        expect(output).toMatchObject({
            path: "/",
            children: [
                {
                    path: "a",
                    children: [{ path: "b", view: "second.html" }],
                },
            ],
        });
    });

    it("应该处理已有嵌套结构的路由", () => {
        const input: KylinRouteItem[] = [
            {
                path: "admin",
                children: [
                    { path: "user", view: "user.html" },
                    { path: "settings", view: "settings.html" },
                ],
            },
        ];
        const output = normalizeRoutes(input);

        expect(output).toMatchObject({
            path: "/",
            children: [
                {
                    path: "admin",
                    children: [
                        { path: "user", view: "user.html" },
                        { path: "settings", view: "settings.html" },
                    ],
                },
            ],
        });
    });

    it("应该处理根路由已有 children 的情况", () => {
        const input: KylinRouteItem[] = [
            {
                path: "/",
                children: [
                    { path: "home", view: "home.html" },
                    { path: "about", view: "about.html" },
                ],
            },
        ];
        const output = normalizeRoutes(input);

        expect(output.path).toBe("/");
        expect(output.children).toEqual([
            { path: "home", view: "home.html" },
            { path: "about", view: "about.html" },
        ]);
    });

    it("应该混合处理扁平路由和嵌套路由", () => {
        const input: KylinRouteItem[] = [
            { path: "a/b/c", view: "c.html" },
            {
                path: "x",
                children: [{ path: "y", view: "y.html" }],
            },
        ];
        const output = normalizeRoutes(input);

        expect(output).toMatchObject({
            path: "/",
            children: [
                {
                    path: "a",
                    children: [{ path: "b", children: [{ path: "c", view: "c.html" }] }],
                },
                { path: "x", children: [{ path: "y", view: "y.html" }] },
            ],
        });
    });

    it("应该正确处理带前导斜杠的路径", () => {
        const input: KylinRouteItem[] = [{ path: "/a/b", view: "b.html" }];
        const output = normalizeRoutes(input);

        expect(output).toMatchObject({
            path: "/",
            children: [{ path: "a", children: [{ path: "b", view: "b.html" }] }],
        });
    });

    it("应该正确处理带后导斜杠的路径", () => {
        const input: KylinRouteItem[] = [{ path: "a/b/", view: "b.html" }];
        const output = normalizeRoutes(input);

        expect(output).toMatchObject({
            path: "/",
            children: [{ path: "a", children: [{ path: "b", view: "b.html" }] }],
        });
    });
});

describe("normalizeRoutes - 属性处理", () => {
    it("应该将所有属性放在叶子节点", () => {
        const input: KylinRouteItem[] = [
            {
                path: "admin/user/edit",
                view: "edit.html",
                data: { api: "/user" },
                meta: { auth: true },
                title: "Edit User",
                keepAlive: false,
            },
        ];
        const output = normalizeRoutes(input);

        expect(output).toMatchObject({
            path: "/",
            children: [
                {
                    path: "admin",
                    children: [
                        {
                            path: "user",
                            children: [
                                {
                                    path: "edit",
                                    view: "edit.html",
                                    data: { api: "/user" },
                                    meta: { auth: true },
                                    title: "Edit User",
                                    keepAlive: false,
                                },
                            ],
                        },
                    ],
                },
            ],
        });
    });

    it("应该保留 redirect 属性", () => {
        const input: KylinRouteItem[] = [
            {
                path: "old/path",
                redirect: "/new/path",
            },
        ];
        const output = normalizeRoutes(input);

        expect(output).toMatchObject({
            path: "/",
            children: [
                {
                    path: "old",
                    children: [{ path: "path", redirect: "/new/path" }],
                },
            ],
        });
    });
});

describe("normalizeRoutes - 尾部斜杠处理", () => {
    it('应该移除路径尾部的斜杠（但保留 path="/"）', () => {
        const input: KylinRouteItem[] = [
            { path: "/", name: "root", meta: { title: "Root" } },
            {
                path: "home/",
                view: "home.html",
                children: [{ path: "x/", view: "x.html" }],
            },
        ];
        const output = normalizeRoutes(input);

        expect(output).toMatchObject({
            path: "/",
            name: "root",
            meta: { title: "Root" },
            children: [
                {
                    path: "home",
                    view: "home.html",
                    children: [{ path: "x", view: "x.html" }],
                },
            ],
        });
    });

    it("应该移除多层路径中各段的尾部斜杠", () => {
        const input: KylinRouteItem[] = [{ path: "a/b/c/", view: "deep.html" }];
        const output = normalizeRoutes(input);

        expect(output).toMatchObject({
            path: "/",
            children: [
                {
                    path: "a",
                    children: [
                        {
                            path: "b",
                            children: [{ path: "c", view: "deep.html" }],
                        },
                    ],
                },
            ],
        });
    });

    it("应该正确处理只有尾部斜杠的路径", () => {
        const input: KylinRouteItem[] = [{ path: "test/", view: "test.html" }];
        const output = normalizeRoutes(input);

        expect(output).toMatchObject({
            path: "/",
            children: [{ path: "test", view: "test.html" }],
        });
    });

    it('应该保持 path="/" 不变', () => {
        const input: KylinRouteItem[] = [{ path: "/", name: "root", view: "root.html" }];
        const output = normalizeRoutes(input);

        expect(output).toMatchObject({
            path: "/",
            name: "root",
            view: "root.html",
        });
    });

    it("应该处理混合了尾部斜杠和正常路径的情况", () => {
        const input: KylinRouteItem[] = [
            { path: "about/", view: "about.html" },
            { path: "contact", view: "contact.html" },
            { path: "products/", view: "products.html" },
        ];
        const output = normalizeRoutes(input);

        expect(output).toMatchObject({
            path: "/",
            children: [
                { path: "about", view: "about.html" },
                { path: "contact", view: "contact.html" },
                { path: "products", view: "products.html" },
            ],
        });
    });
});
