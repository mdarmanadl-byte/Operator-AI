import { Router } from "express";
import {
  createTaskController,
  getTaskController,
  listTasksController,
} from "../controllers/task.controller.js";
import { executeTaskController } from "../controllers/task-execution.controller.js";
import { getTaskEventsController } from "../controllers/task-event.controller.js";
import { cancelTaskController } from "../controllers/task.controller.js";
const router = Router();

router.post("/", createTaskController);
router.get("/", listTasksController);
router.get("/:id/events", getTaskEventsController);
router.get("/:id", getTaskController);
router.post("/:id/execute", executeTaskController);
router.post("/:id/cancel", cancelTaskController);
export default router;