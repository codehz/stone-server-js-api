"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib = require("./index");
(async () => {
    for await (const { size, list } of lib.monitor_userlist()) {
        console.log(size, list);
    }
})().catch(console.log);
//# sourceMappingURL=test-monitor-userlist.js.map