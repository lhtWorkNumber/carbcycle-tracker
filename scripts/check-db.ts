import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();

  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("[db-check] 数据库连接正常");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("[db-check] 数据库连接失败");
  console.error(error);
  process.exit(1);
});
