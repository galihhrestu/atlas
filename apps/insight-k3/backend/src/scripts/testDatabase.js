import "dotenv/config";
import { prisma } from "../lib/prisma.js";
import { validateEnvironment } from "../config/env.js";

try {
  validateEnvironment();
  const startedAt = performance.now();

  await prisma.$queryRaw`SELECT 1`;

  console.log("Database PostgreSQL terhubung.");
  console.log(`Latency: ${Math.round(performance.now() - startedAt)} ms`);
  process.exitCode = 0;
} catch (error) {
  console.error("Database PostgreSQL belum terhubung.");
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
