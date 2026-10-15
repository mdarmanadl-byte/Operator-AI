import express from "express";
import taskRoutes from "./routes/task.routes.js";
const app = express();

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