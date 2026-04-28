import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: process.env.PRISMA_SCHEMA_PATH ?? "prisma/schema.prisma"
});
