import "dotenv/config";

import { validateServerEnv } from "@/lib/env/server-env";

const mode = process.argv.includes("--prod") ? "production" : "development";
const result = validateServerEnv(mode);

if (!result.success) {
  console.error("[env-check] 配置校验失败");
  console.error(result.message);
  process.exit(1);
}

console.log(`[env-check] ${mode} 环境变量校验通过`);
