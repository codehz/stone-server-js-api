import * as lib from "./index";

(async () => {
  for await (const item of lib.monitor_userlist()) {
    if (item.type === "list") {
      const { size, list } = item;
      console.log(size, list);
    } else {
      console.log(item.type, item.target);
    }
  }
})().catch(console.log);
