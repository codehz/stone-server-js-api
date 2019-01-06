import * as lib from "./index";

(async () => {
  await lib.manage_blacklist({ type: "add-xuid", id: "123", reason: "test" });
})().catch(console.log);
