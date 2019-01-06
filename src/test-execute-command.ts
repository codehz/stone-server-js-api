import * as lib from "./index";

(async () => {
  const out = await lib.execute_command("server", "/help");
  console.log(out);
})().catch(console.log);