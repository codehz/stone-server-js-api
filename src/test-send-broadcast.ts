import * as lib from "./index";

(async () => {
  await lib.send_broadcast("hello");
})().catch(console.log);