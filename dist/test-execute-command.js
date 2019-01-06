"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib = require("./index");
(async () => {
    const out = await lib.execute_command("server", "/help");
    console.log(out);
})().catch(console.log);
//# sourceMappingURL=test-execute-command.js.map