/**
 * Middleware central de tratamento de erros
 * Formata e padroniza as respostas de erro HTTP em JSON
 */

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Erro interno do servidor.";

  // Exibir log no console em ambiente de desenvolvimento
  if (process.env.NODE_ENV !== "test") {
    console.error(`[ERRO ${statusCode}] ${req.method} ${req.originalUrl}:`, err.message);
    if (statusCode === 500 && err.stack) {
      console.error(err.stack);
    }
  }

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    error: message,
    detalhes: err.detalhes || null,
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
}

function notFoundHandler(req, res, next) {
  const error = new Error(`Rota ${req.method} ${req.originalUrl} não foi encontrada.`);
  error.statusCode = 404;
  next(error);
}

module.exports = {
  errorHandler,
  notFoundHandler
};
