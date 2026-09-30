import "./src/__tests__/setup";
import { mount } from "./src/__tests__/helpers";

const m = mount(`<div id="app"></div>`, {}, {
    components: { probe: `<div class="probe-card"><b x-html="title"></b></div>` },
    messages: { kinds: { notice: { render: "probe" } } },
});
try {
    const task = m.engine.messages.add({ title: "t", kind: "notice", delayClose: 0 });
    console.log("task.id:", task.id, "closed:", task.closed, "el:", task.el?.tagName);
    await new Promise((r) => setTimeout(r, 20));
    console.log("container:", document.querySelector(".autospark-messages")?.outerHTML?.slice(0, 400) ?? "NULL");
    console.log("probe found:", !!document.querySelector(".probe-card"));
} catch (e: any) {
    console.log("THROWN:", e?.stack ?? e);
}
m.engine.destroy();
