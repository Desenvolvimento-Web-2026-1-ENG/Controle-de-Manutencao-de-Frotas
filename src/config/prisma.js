/**
 * Singleton do Prisma Client
 * Centraliza a conexão com o banco de dados SQLite
 */

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  log: process.env.DEBUG_QUERIES === "true" ? ["query", "warn", "error"] : ["warn", "error"]
});

module.exports = prisma;

