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
