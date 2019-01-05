import * as lib from "./index";

(async () => {
  await lib.send_chat("test", "hello");
})().catch(console.log);