"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib = require("./index");
(async () => {
    const list = await lib.fetch_userlist();
    console.log(list);
})().catch(console.log);
//# sourceMappingURL=test-fetch-userlist.js.map