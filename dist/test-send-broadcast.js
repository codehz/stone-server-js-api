"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib = require("./index");
(async () => {
    await lib.send_broadcast("hello");
})().catch(console.log);
//# sourceMappingURL=test-send-broadcast.js.map