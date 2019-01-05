"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib = require("./index");
(async () => {
    for await (const { sender, content } of lib.monitor_chat()) {
        console.log(sender, ":", content);
    }
})().catch(console.log);
//# sourceMappingURL=test-monitor-chat.js.map