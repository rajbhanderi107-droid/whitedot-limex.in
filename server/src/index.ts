import app from "./app.js";
import { env } from "./config/env.js";

const server = app.listen(env.PORT, () => {
  console.log(
    `WhiteDot backend listening on port ${env.PORT} (${env.NODE_ENV}); CORS origin: ${env.FRONTEND_URL}`,
  );
});

const shutdown = () => {
  console.log("Shutting down gracefully...");
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
