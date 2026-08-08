import "dotenv/config";
import app from "./app.js";
import { validateEnvironment, getServerConfig } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

validateEnvironment();

const config = getServerConfig();

const server = app.listen(config.port, config.host, () => {
  console.log(
    `INSIGHTK3 API berjalan di http://${config.host}:${config.port}`
  );
});

async function shutdown(signal) {
  console.log(`${signal} diterima. Menutup server dengan aman...`);

  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

  setTimeout(() => {
    console.error("Server dipaksa berhenti karena waktu shutdown habis.");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  shutdown("UNCAUGHT_EXCEPTION");
});
