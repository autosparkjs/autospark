import { it } from "bun:test";
import { setupTestEnvironment } from "./test-setup";

setupTestEnvironment();

it("scratch: direct textContent assignment", async () => {
    const style = document.createElement("style");
    style.id = "scratch2";
    style.textContent = ".a{color:red}";
    console.log("2 textContent:", JSON.stringify(style.textContent));
    console.log("3 childCount:", style.childNodes.length);
    document.head.appendChild(style);
    console.log("4 textContent:", JSON.stringify(style.textContent));
    console.log("5 head.innerHTML:", document.head.innerHTML);
});
