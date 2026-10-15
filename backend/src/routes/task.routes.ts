import { Router } from "express";
import {
  createTaskController,
  getTaskController,
  listTasksController,
} from "../controllers/task.controller.js";

const router = Router();

router.post("/", createTaskController);
router.get("/", listTasksController);
router.get("/:id", getTaskController);

export default router;