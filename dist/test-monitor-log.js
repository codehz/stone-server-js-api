"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib = require("./index");
(async () => {
    for await (const { level, tag, content } of lib.monitor_log()) {
        console.log(level, tag, content);
    }
})().catch(console.log);
//# sourceMappingURL=test-monitor-log.js.map