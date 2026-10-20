import { describe, expect, test } from "bun:test";
import "../../setup";
import type { AutoSpark } from "../../../engine/engine";
import {
    createFetchLoaderFn,
    createRemoteLoader,
    createRetryAction,
    dispatchLoadError,
    normalizeLoadError,
    resolveLoaderOptions,
    resolveRequestInit,
    type RemoteLoadError,
    type RemoteLoadMeta,
} from "../../../features/directive/remote-load";

/**
 * 远程加载统一内核单测（ADR-0121）：DOM-free，直接装配 fake engine（仅 options.fetcher 被消费）。
 */

/** 最小 engine 替身（内核只读 engine.options.fetcher） */
const fakeEngine = (fetcher?: any): AutoSpark =>
    ({ options: fetcher ? { fetcher } : {} }) as unknown as AutoSpark;

/** Response 替身（内核只读 ok/status/statusText + 经 responseParser 消费） */
const fakeRes = (ok: boolean, status = 200, statusText = "") =>
    ({ ok, status, statusText }) as unknown as Response;

/** 空白 getOption（指定键返回值，其余 undefined） */
const opts =
    (map: Record<string, any> = {}) =>
    (key: string) =>
        map[key];

describe("resolveRequestInit（决策 7：request 权威 + 简写糖）", () => {
    test("缺省补 method:GET；signal 恒由内核接管", () => {
        const sig = new AbortController().signal;
        const init = resolveRequestInit(opts(), sig);
        expect(init.method).toBe("GET");
        expect(init.signal).toBe(sig);
    });

    test("request 整包为基底；request 显式 method 优先于 method 简写", () => {
        const sig = new AbortController().signal;
        const init = resolveRequestInit(
            opts({ request: { method: "POST", credentials: "include" }, method: "put" }),
            sig,
        );
        expect(init.method).toBe("POST"); // request 显式键优先
        expect(init.credentials).toBe("include");
    });

    test("method 简写大写归一；request 未给 method 时才生效", () => {
        const sig = new AbortController().signal;
        const init = resolveRequestInit(opts({ method: "post" }), sig);
        expect(init.method).toBe("POST");
    });

    test("header 简写仅在 request 未显式给 headers 时生效", () => {
        const sig = new AbortController().signal;
        const h1 = { "x-a": "1" };
        const h2 = { "x-b": "2" };
        const init1 = resolveRequestInit(opts({ header: h1 }), sig);
        expect(init1.headers).toBe(h1);
        const init2 = resolveRequestInit(opts({ request: { headers: h2 }, header: h1 }), sig);
        expect(init2.headers).toBe(h2); // request 显式键优先
    });

    test("用户 request.signal 被内核信号覆盖（超时 + 主动 abort 合并信号）", () => {
        const userSig = new AbortController().signal;
        const kernelSig = new AbortController().signal;
        const init = resolveRequestInit(opts({ request: { signal: userSig } }), kernelSig);
        expect(init.signal).toBe(kernelSig);
    });
});

describe("resolveLoaderOptions（决策 3/9：默认全 0 = 行为零变化）", () => {
    test("未声明 → retry/retryDelay/timeout/cache 全 0", () => {
        expect(resolveLoaderOptions(opts())).toEqual({
            retry: 0,
            retryDelay: 0,
            timeout: 0,
            cache: 0,
        });
    });

    test("正数透传；负数 / 非数字 / null 静默归 0", () => {
        const o = resolveLoaderOptions(
            opts({ retry: 2, retryDelay: "bad", timeout: -1, cache: null }),
        );
        expect(o.retry).toBe(2);
        expect(o.retryDelay).toBe(0);
        expect(o.timeout).toBe(0);
        expect(o.cache).toBe(0);
    });
});

describe("normalizeLoadError（决策 5：统一错误对象）", () => {
    test("Error 实例保持身份；meta.url/statusCode 写入；source=load", () => {
        const raw = new Error("boom");
        const out = normalizeLoadError(raw, { url: "/a.json", statusCode: 500 });
        expect(out).toBe(raw as any);
        expect(out.url).toBe("/a.json");
        expect(out.statusCode).toBe(500);
        expect(out.source).toBe("load");
    });

    test("字符串 / 非 Error 值兜成 Error；已有 url 不被 meta 覆盖", () => {
        const out = normalizeLoadError("bad");
        expect(out).toBeInstanceOf(Error);
        expect(out.message).toBe("bad");
        const own = new Error("x") as RemoteLoadError;
        own.url = "/own";
        const out2 = normalizeLoadError(own, { url: "/meta" });
        expect(out2.url).toBe("/own");
    });
});

describe("createFetchLoaderFn（决策 1/7/8：fetcher 出站口 + res.ok 检查）", () => {
    test("engine.options.fetcher 单点出站；成功经 responseParser 消费", async () => {
        const calls: any[] = [];
        const engine = fakeEngine((url: string, init: any) => {
            calls.push([url, init.method]);
            return Promise.resolve(fakeRes(true));
        });
        const meta: RemoteLoadMeta = { url: "/d.json" };
        const loaderFn = createFetchLoaderFn({
            engine,
            url: "/d.json",
            getOption: opts({ method: "post" }),
            responseParser: async () => ({ ok: 1 }),
        });
        const out = await loaderFn({ abortSignal: new AbortController().signal, meta } as any);
        expect(out).toEqual({ ok: 1 });
        expect(calls).toEqual([["/d.json", "POST"]]);
    });

    test("!res.ok 抛错且 statusCode 写 meta（网络错误无此字段）", async () => {
        const engine = fakeEngine(() => Promise.resolve(fakeRes(false, 404, "Not Found")));
        const meta: RemoteLoadMeta = { url: "/404.json" };
        const loaderFn = createFetchLoaderFn({
            engine,
            url: "/404.json",
            getOption: opts(),
            responseParser: async (r) => r,
        });
        await expect(
            loaderFn({ abortSignal: new AbortController().signal, meta } as any),
        ).rejects.toThrow("HTTP 404 Not Found");
        expect(meta.statusCode).toBe(404);
    });

    test("engine 无 fetcher 配置回退原生 fetch（全局 fetch 被替换即生效）", async () => {
        const origin = globalThis.fetch;
        let hit = 0;
        globalThis.fetch = (() => {
            hit++;
            return Promise.resolve(fakeRes(true));
        }) as any;
        try {
            const loaderFn = createFetchLoaderFn({
                engine: fakeEngine(),
                url: "/x",
                getOption: opts(),
                responseParser: async () => "done",
            });
            const out = await loaderFn({
                abortSignal: new AbortController().signal,
                meta: { url: "/x" },
            } as any);
            expect(out).toBe("done");
            expect(hit).toBe(1);
        } finally {
            globalThis.fetch = origin;
        }
    });
});

describe("createRemoteLoader（决策 1/3：装配 AsyncLoader 统一纪律）", () => {
    test("autostart:false 恒定——构造不启动，显式 get() 才发起请求", async () => {
        let n = 0;
        const loader = createRemoteLoader({
            engine: fakeEngine(),
            getOption: opts(),
            loaderFn: async () => {
                n++;
                return "v";
            },
        });
        expect(n).toBe(0);
        await loader.get();
        expect(n).toBe(1);
    });

    test("成功：onResult 收到产物；失败：onError 收归一化 RemoteLoadError", async () => {
        const results: any[] = [];
        const errors: RemoteLoadError[] = [];
        const okLoader = createRemoteLoader({
            engine: fakeEngine(),
            getOption: opts(),
            url: "/ok",
            loaderFn: async () => "good",
            onResult: (v) => results.push(v),
        });
        await okLoader.get();
        expect(results).toEqual(["good"]);

        const badLoader = createRemoteLoader({
            engine: fakeEngine(),
            getOption: opts(),
            url: "/bad",
            loaderFn: async () => {
                throw new Error("挂了");
            },
            onError: (e) => errors.push(e),
        });
        await badLoader.get().catch(() => {});
        expect(errors.length).toBe(1);
        expect(errors[0]!.message).toBe("挂了");
        expect(errors[0]!.url).toBe("/bad");
        expect(errors[0]!.source).toBe("load");
    });

    test("retry:1 失败一次后自动重试成功（平坦 retryDelay）", async () => {
        let n = 0;
        const loader = createRemoteLoader({
            engine: fakeEngine(),
            getOption: opts({ retry: 1 }),
            loaderFn: async () => {
                n++;
                if (n === 1) throw new Error("first fail");
                return "recovered";
            },
        });
        const out = await loader.get();
        expect(out).toBe("recovered");
        expect(n).toBe(2);
    });

    test("主动 abort：不重试、onError 不触发（AbortError 静默丢弃）", async () => {
        let n = 0;
        const errors: any[] = [];
        const loader = createRemoteLoader({
            engine: fakeEngine(),
            getOption: opts({ retry: 3 }),
            loaderFn: ({ abortSignal }) =>
                new Promise((_, reject) => {
                    n++;
                    abortSignal?.addEventListener("abort", () => {
                        const e = new Error("aborted");
                        e.name = "AbortError";
                        reject(e);
                    });
                }),
            onError: (e) => errors.push(e),
        });
        const p = loader.get();
        loader.abort();
        await p.catch(() => {});
        await new Promise((r) => setTimeout(r, 20));
        expect(n).toBe(1); // 未重试
        expect(errors.length).toBe(0); // 未呈现
    });

    test("timeout：慢请求按超时失败（计可重试失败）", async () => {
        let n = 0;
        const loader = createRemoteLoader({
            engine: fakeEngine(),
            getOption: opts({ timeout: 10 }),
            loaderFn: ({ abortSignal }) =>
                new Promise<string>((resolve, reject) => {
                    n++;
                    abortSignal?.addEventListener("abort", () => {
                        const e = new Error("timeout");
                        e.name = "TimeoutError";
                        reject(e);
                    });
                    setTimeout(() => resolve("late"), 500);
                }),
        });
        await expect(loader.get()).rejects.toThrow();
        expect(n).toBe(1);
    });

    test("cache>0：同 hash 二次 get 命中缓存不再请求；refresh 强制重取", async () => {
        let n = 0;
        const getOption = opts({ cache: 60_000 });
        const mk = () =>
            createRemoteLoader({
                engine: fakeEngine(),
                getOption,
                url: "/cached",
                loaderFn: async () => {
                    n++;
                    return `v${n}`;
                },
            });
        const l1 = mk();
        expect(await l1.get()).toBe("v1");
        const l2 = mk(); // 同 url → 同 hash → 跨实例缓存命中
        expect(await l2.get()).toBe("v1");
        expect(n).toBe(1);
        expect(await l2.refresh()).toBe("v2"); // refresh 清缓存强制重取
        expect(n).toBe(2);
    });
});

describe("createRetryAction / dispatchLoadError（决策 4/5：两件公共弹药）", () => {
    test("retry action：handle 执行体 = loader.refresh()（重新发起请求）", async () => {
        let n = 0;
        const loader = createRemoteLoader({
            engine: fakeEngine(),
            getOption: opts(),
            loaderFn: async () => `v${++n}`,
        });
        await loader.get();
        const action = createRetryAction(loader);
        expect(action.id).toBe("retry");
        action.handle();
        await new Promise((r) => setTimeout(r, 0));
        expect(n).toBe(2);
    });

    test("dispatchLoadError：bubbles+composed error 事件，detail.error 归一化普通对象 + detail.retry", () => {
        const host = document.createElement("div");
        const child = document.createElement("span");
        host.appendChild(child);
        document.body.appendChild(host);
        let captured: any = null;
        host.addEventListener("error", (e) => {
            captured = (e as unknown as CustomEvent).detail;
        });
        const err = normalizeLoadError(new Error("load boom"), { url: "/x", statusCode: 503 });
        const retry = () => {};
        dispatchLoadError(child, err, retry);
        expect(captured).not.toBeNull(); // bubbles 到宿主
        expect(captured.retry).toBe(retry);
        // 归一化普通对象（非 Error 实例——ADR-0118 决策 6：Error 实例不进响应式域）
        expect(captured.error).not.toBeInstanceOf(Error);
        expect(captured.error).toMatchObject({
            name: "Error",
            message: "load boom",
            url: "/x",
            statusCode: 503,
            source: "load",
        });
        host.remove();
    });
});
