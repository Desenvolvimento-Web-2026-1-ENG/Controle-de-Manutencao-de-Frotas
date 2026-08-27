/**
 * Singleton do Prisma Client
 * Centraliza a conexão com o banco de dados SQLite
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"]
});

module.exports = prisma;
