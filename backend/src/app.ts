import express from "express";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "operator-ai-backend",
    timestamp: new Date().toISOString()
  });
});

export default app;