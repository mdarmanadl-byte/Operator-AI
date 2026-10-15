import express from "express";
import taskRoutes from "./routes/task.routes.js";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

const publicDirectory = path.resolve(
  currentDirectory,
  "../public",
);
app.use(express.static(publicDirectory));
app.use(
  cors({
    origin: "http://localhost:3001",
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "operator-ai-backend",
    timestamp: new Date().toISOString()
  });
});
app.use("/api/v1/tasks", taskRoutes);
export default app;