import { Router } from "express";
import {
  createTaskController,
  getTaskController,
  listTasksController,
} from "../controllers/task.controller.js";
import { executeTaskController } from "../controllers/task-execution.controller.js";
const router = Router();

router.post("/", createTaskController);
router.get("/", listTasksController);
router.get("/:id", getTaskController);
router.post("/:id/execute", executeTaskController);
export default router;