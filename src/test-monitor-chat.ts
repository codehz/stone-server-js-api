import * as lib from "./index";

(async () => {
  for await (const { sender, content } of lib.monitor_chat()) {
    console.log(sender, ":", content);
  }
})().catch(console.log);