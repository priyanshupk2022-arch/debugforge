import { execute } from "../src/telemetry.js";
try {
  await execute();
  process.exit(0);
} catch (err) {
  console.error("UnhandledPromiseRejection: Missing catch block in telemetry");
  process.exit(1);
}
