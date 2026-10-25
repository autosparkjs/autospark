/**
 * 插件闭包构建漂移锁（ADR-0004）：mini vite build 端到端——fixture 源码经
 * {@link installAutosparkPlugin} 全管线（import 剥除 → exports 剥除 → 闭包包裹）产出
 * 真实产物文件，断言外壳契约的每一块字节形态；产物再经双路径运行时冒烟（直注册 /
 * 预加载队列回放）验证语义。产物形态漂移（全局名赋值回潮 / export 残留 / 队列分支
 * 缺失）在此即刻响铃。
 */
import { describe, expect, test } from "bun:test";
import { build } from "vite";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { installAutosparkPlugin } from "../vite/index";

/** fixture：覆盖创作糖全形态——AutoSpark 本名 + 具名成员 + namespace + default + type + 导出 */
const FIXTURE_SOURCE = `
import { AutoSpark, markRaw } from "autospark";
import type { AutoSpark as AutoSparkType } from "autospark";
import * as NS from "autospark";
import DefaultAlias from "autospark";
AutoSpark.components["hello-card"] = "<div>x</div>";
AutoSpark.ready(() => {
    markRaw("<b/>");
    if (NS !== DefaultAlias) throw new Error("namespace/default 必须映射命名空间本体");
});
export function helper(): string {
    return "x";
}
export const TAG = "hello";
`;

const OUT_FILE = path.join("dist", "autospark.fixture.js");

/** 一次构建，全部用例共享产物（模块顶层 await——构建失败即整文件失败，响而不哑） */
const workDir = mkdtempSync(path.join(tmpdir(), "autospark-closure-"));
const outFile = path.join(workDir, OUT_FILE);
writeFileSync(path.join(workDir, "fixture.ts"), FIXTURE_SOURCE);
await build({
    configFile: false,
    root: workDir,
    logLevel: "warn",
    plugins: [installAutosparkPlugin()],
    build: {
        outDir: path.join(workDir, "dist"), // 与 root 分离，避免 vite outDir==root 告警
        emptyOutDir: true,
        sourcemap: false, // 尾部无 sourcemap 注释，断言 endsWith 更直接
        minify: false, // 结构断言需要可读形态
            rollupOptions: {
                treeshake: false, // 漂移锁测 transform 契约而非优化器行为——发射语句须确定性保留
                input: { "autospark.fixture": path.join(workDir, "fixture.ts") },
                output: { entryFileNames: "[name].js" },
            },
    },
});
const code = readFileSync(outFile, "utf8");
process.on("exit", () => rmSync(workDir, { recursive: true, force: true }));

/**
 * immediate 外壳产物（plugins ADR-0006 决策 2）：独立工作目录二次构建，用例共享。
 * fixture 用 utils installPlugin 形态（库型插件的源码级自举——immediate 外壳的
 * 真实消费形态；经 alias 解析 workspace 源码，产物自包含内联）。
 */
const IMMEDIATE_FIXTURE_SOURCE = `
import { installPlugin } from "@autospark/utils";
installPlugin("fixture", "ready", (autospark) => {
    autospark.ready(() => {});
});
`;
const IMMEDIATE_UTILS_ENTRY = path.resolve(import.meta.dir, "../../../utils/src/index.ts");
const immWorkDir = mkdtempSync(path.join(tmpdir(), "autospark-closure-imm-"));
const immOutFile = path.join(immWorkDir, OUT_FILE);
writeFileSync(path.join(immWorkDir, "fixture.ts"), IMMEDIATE_FIXTURE_SOURCE);
await build({
    configFile: false,
    root: immWorkDir,
    logLevel: "warn",
    plugins: [installAutosparkPlugin({ shell: "immediate" })],
    resolve: {
        alias: { "@autospark/utils": IMMEDIATE_UTILS_ENTRY },
    },
    build: {
        outDir: path.join(immWorkDir, "dist"),
        emptyOutDir: true,
        sourcemap: false,
        minify: false,
            rollupOptions: {
                treeshake: false,
                input: { "autospark.fixture": path.join(immWorkDir, "fixture.ts") },
                output: { entryFileNames: "[name].js" },
            },
    },
});
const immediateCode = readFileSync(immOutFile, "utf8");
process.on("exit", () => rmSync(immWorkDir, { recursive: true, force: true }));

describe("外壳契约（ADR-0004 定谳模板）", () => {
    test("头部：闭包参数 + use strict + run 函数体", () => {
        expect(code.startsWith("(function (AutoSpark) {\n")).toBe(true);
        expect(code).toContain('    "use strict";\n');
        expect(code).toContain("var run = function (AutoSpark) {\n");
    });

    test("尾部：队列分支 + globalThis 实参", () => {
        expect(code).toContain("if (AutoSpark === undefined) {");
        expect(code).toContain("globalThis.__AUTOSPARK_PLUGINS__ ??= []");
        expect(code).toContain("if (Object.isFrozen(queue)) {");
        expect(code).toContain("queue.push(function (engine, ns) { run(ns); });");
        expect(code.trimEnd().endsWith("})(globalThis.AutoSpark);")).toBe(true);
    });

    test("tsup 工厂形态不得回潮：无全局名赋值、无 export 残留、无 import 残留", () => {
        expect(code).not.toMatch(/\bvar\s+AutoSpark\w+\s*=/); // globalName 赋值回潮
        expect(code).not.toMatch(/\bexport\s*\{/); // exports 面残留
        expect(code).not.toMatch(/\bimport\s*[{*"\']/); // 静态导入残留
        expect(code).not.toMatch(/from\s*(["'])autospark\1/); // autospark 外部引用残留
    });

    test("导入剥除发射：具名成员解构 + namespace/default 映射命名空间本体", () => {
        // rolldown 作用域提升可能将 const 降级为 var，绑定形态放宽、键名严格
        expect(code).toMatch(/(?:const|var|let)\s+\{\s*markRaw\s*\}\s*=\s*AutoSpark;/);
        expect(code).toMatch(/(?:const|var|let)\s+NS\s*=\s*AutoSpark;/);
        expect(code).toMatch(/(?:const|var|let)\s+DefaultAlias\s*=\s*AutoSpark;/);
        // AutoSpark 本名零发射（闭包参数直接绑定）：fixture 无 `const AutoSpark =`
        expect(code).not.toMatch(/\bconst\s+AutoSpark\s*=/);
    });
});

describe("运行时语义（双路径自举）", () => {
    /** 隔离沙箱：临时替换产物触碰的两个全局（AutoSpark / 预加载队列），用例后还原 */
    function runInSandbox(sandbox: Record<string, any>): void {
        const original = {
            AutoSpark: (globalThis as any).AutoSpark,
            queue: (globalThis as any).__AUTOSPARK_PLUGINS__,
        };
        try {
            (globalThis as any).AutoSpark = sandbox.AutoSpark;
            (globalThis as any).__AUTOSPARK_PLUGINS__ = sandbox.queue;
            new Function(code)();
            sandbox.queue = (globalThis as any).__AUTOSPARK_PLUGINS__;
        } finally {
            (globalThis as any).AutoSpark = original.AutoSpark;
            (globalThis as any).__AUTOSPARK_PLUGINS__ = original.queue;
        }
    }

    test("直路径：引擎已加载 → 插件体即刻执行（命名空间经闭包参数落定）", () => {
        const registered: string[] = [];
        const readyCbs: Array<() => void> = [];
        runInSandbox({
            AutoSpark: {
                components: {} as Record<string, string>,
                ready: (cb: () => void) => readyCbs.push(cb),
                directive: (spec: { name: string }) => registered.push(spec.name),
                markRaw: (v: any) => v,
            },
            queue: [],
        });
        expect(registered).toEqual([]); // fixture 未调 directive
        expect(readyCbs.length).toBe(1); // ready 回调已注册
        expect(readyCbs[0]).toBeTypeOf("function");
    });

    test("队列路径：引擎未加载 → 插件体入预加载队列，drain 回放注册", () => {
        const queue: Array<(engine: any, ns: any) => void> = [];
        runInSandbox({ AutoSpark: undefined, queue });
        expect(queue.length).toBe(1);
        // 真实时序回放：drain 时引擎全局已就位（ADR-0114），命名空间经第二参注入
        const readyCbs: Array<() => void> = [];
        queue[0]({ engine: 1 }, {
            components: {},
            ready: (cb: () => void) => readyCbs.push(cb),
        });
        expect(readyCbs.length).toBe(1);
    });

    test("冻结队列守卫：队列已消费且全局不可达 → console.error 响而不哑", () => {
        const errors: string[] = [];
        const originalError = console.error;
        console.error = (msg: unknown) => errors.push(String(msg));
        try {
            const frozen: never[] = [];
            Object.freeze(frozen);
            runInSandbox({ AutoSpark: undefined, queue: frozen });
        } finally {
            console.error = originalError;
        }
        expect(errors.some((msg) => msg.includes("插件未注册"))).toBe(true);
    });
});

describe("immediate 外壳契约（plugins ADR-0006 决策 2，库型插件）", () => {
    test("头部：闭包参数 + use strict；尾部：globalThis 实参收口", () => {
        expect(immediateCode.startsWith("(function (AutoSpark) {\n")).toBe(true);
        expect(immediateCode).toContain('    "use strict";\n');
        expect(immediateCode.trimEnd().endsWith("})(globalThis.AutoSpark);")).toBe(true);
    });

    test("无排队形态：无 run 延迟分支、无外壳级队列分支（installPlugin 内联队列语义除外）", () => {
        expect(immediateCode).not.toContain("var run = function");
        // 外壳自身队列分支的专属标记：回放体引用 run / ADR-0114 注释——源码级
        // installPlugin 的入队（__AUTOSPARK_PLUGINS__ / Object.isFrozen）合法内联
        expect(immediateCode).not.toContain("run(ns)");
        expect(immediateCode).not.toContain("插件先于引擎加载");
    });

    test("加载即执行：引擎未加载 → 源码级 installPlugin 仅入队 register 回调", () => {
        // AutoSpark undefined + 空队列：外壳不排队整包，installPlugin 把 register 推入队列
        const original = (globalThis as any).AutoSpark;
        const originalQueue = (globalThis as any).__AUTOSPARK_PLUGINS__;
        let queue: Array<(engine: any, ns: any) => void> = [];
        try {
            (globalThis as any).AutoSpark = undefined;
            (globalThis as any).__AUTOSPARK_PLUGINS__ = queue;
            new Function(immediateCode)();
            queue = (globalThis as any).__AUTOSPARK_PLUGINS__;
        } finally {
            (globalThis as any).AutoSpark = original;
            (globalThis as any).__AUTOSPARK_PLUGINS__ = originalQueue;
        }
        expect(queue).toHaveLength(1);
        // drain 回放：register 收命名空间，ready 注册随之发生
        const readyCbs: Array<() => void> = [];
        queue[0]({ engine: 1 }, { ready: (cb: () => void) => readyCbs.push(cb) });
        expect(readyCbs).toHaveLength(1);
    });

    test("加载即执行：引擎已加载 → 直取注册（ready 即刻登记）", () => {
        const readyCbs: Array<() => void> = [];
        const original = (globalThis as any).AutoSpark;
        try {
            (globalThis as any).AutoSpark = { ready: (cb: () => void) => readyCbs.push(cb) };
            new Function(immediateCode)();
        } finally {
            (globalThis as any).AutoSpark = original;
        }
        expect(readyCbs).toHaveLength(1);
    });

    test("导入剥除契约与 queued 外壳一致：无 export/import/autospark 残留", () => {
        expect(immediateCode).not.toMatch(/\bexport\s*\{/);
        expect(immediateCode).not.toMatch(/\bimport\s*[{*"\']/);
        expect(immediateCode).not.toMatch(/from\s*(["'])autospark\1/);
    });
});
