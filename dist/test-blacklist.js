"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib = require("./index");
(async () => {
    await lib.manage_blacklist({ type: "add-xuid", id: "123", reason: "test" });
})().catch(console.log);
//# sourceMappingURL=test-blacklist.js.map