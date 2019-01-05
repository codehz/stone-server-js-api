import * as lib from "./index";

(async () => {
  for await (const { size, list } of lib.monitor_userlist()) {
    console.log(size, list);
  }
})().catch(console.log);