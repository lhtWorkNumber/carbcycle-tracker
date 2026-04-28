import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  await prisma.$queryRaw`SELECT 1`;
  console.log("[db-check] 数据库连接正常");
} catch (error) {
  console.error("[db-check] 数据库连接失败");
  console.error(error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
