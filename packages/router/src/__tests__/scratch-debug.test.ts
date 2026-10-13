import { it } from "bun:test";
import { setupTestEnvironment } from "./test-setup";

setupTestEnvironment();

it("scratch: classList vs class attribute", () => {
    const div = document.createElement("div");
    div.setAttribute("class", "foo bar");
    console.log("attr:", div.getAttribute("class"));
    console.log("classList.contains(foo):", div.classList.contains("foo"));
    console.log("classList.length:", div.classList.length);
    div.className = "baz";
    console.log("after className=, contains(baz):", div.classList.contains("baz"));
    console.log("after className=, attr:", div.getAttribute("class"));
});
