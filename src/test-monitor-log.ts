import * as lib from "./index";

(async () => {
  for await (const { level, tag, content } of lib.monitor_log()) {
    console.log(level, tag, content);
  }
})().catch(console.log);