import { handleIncomingRequest } from "../src/cache.js";
try {
  for (let i = 0; i < 60; i++) handleIncomingRequest("req_" + i);
  process.exit(0);
} catch (err) {
  console.error("HeapGrowthExceeded: Memory leak detected");
  process.exit(1);
}
