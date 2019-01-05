import * as lib from "./index";

(async () => {
  const list = await lib.fetch_userlist();
  console.log(list);
})().catch(console.log);