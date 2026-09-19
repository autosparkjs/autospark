import { describe, expect, spyOn, test } from "bun:test";
import { AutoSpark } from "../engine";
import "./setup";
import { mount, nextTick } from "./helpers";

/**
 * 引擎级端到端用例：scheduler 微任务合并、destroy 资源清理。
 * 指令级行为（x-text/x-if/x-for）已拆分到各自独立测试文件。
 */

describe("e2e - scheduler 微任务合并", () => {
    test("同 tick 多次变更只 flush 一次", async () => {
        const { root, engine } = mount(`<span x-text="user.name"></span>`, {
            user: { name: "a" },
        });
        let flushCount = 0;
        const origFlush = engine.scheduler.flush.bind(engine.scheduler);
        engine.scheduler.flush = () => {
            flushCount++;
            origFlush();
        };
        engine.state.user.name = "b";
        engine.state.user.name = "c";
        engine.state.user.name = "d";
        await nextTick();
        expect(flushCount).toBe(1);
        // 合并 flush 后取累积最新值 d
        expect(root).toEqualHTML(`<div>
  <span>d</span>
</div>`);
    });
});

describe("e2e - destroy 资源清理", () => {
    test("destroy 后状态变化不再更新 DOM（watcher 已 off）", async () => {
        const root = document.createElement("div");
        root.innerHTML = `<span x-text="name"></span>`;
        const app = new AutoSpark(root, { name: "a" });
        expect(root).toEqualHTML(`<div>
  <span>a</span>
</div>`);

        app.destroy();
        app.state.name = "b";
        await nextTick();
        // destroy 经 replaceChildren 移除挂载 DOM 并销毁订阅，状态变化不再回写
        expect(root).toEqualHTML(`<div></div>`);
    });

    test("destroy 恒销毁自建 store（ADR-0044：无共享语义）", () => {
        const root = document.createElement("div");
        root.innerHTML = `<span x-text="name"></span>`;
        const app = new AutoSpark(root, { name: "a" });
        const spy = spyOn(app.store, "destroy");
        app.destroy();
        expect(spy).toHaveBeenCalledTimes(1);
    });
});
