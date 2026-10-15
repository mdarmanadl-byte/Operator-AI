import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { clearTasks } from "../src/services/task.service.js";
describe("Task API", () => {
    beforeEach(() => {
  clearTasks();
});
  describe("POST /api/v1/tasks", () => {
    it("creates a task with a valid instruction", async () => {
      const response = await request(app)
        .post("/api/v1/tasks")
        .send({
          instruction: "Find Rahul Sharma in the CRM",
        });

      expect(response.status).toBe(201);
      expect(response.body.task).toMatchObject({
        instruction: "Find Rahul Sharma in the CRM",
        status: "pending",
      });

      expect(response.body.task.id).toEqual(expect.any(String));
    });

    it("rejects an empty instruction", async () => {
      const response = await request(app)
        .post("/api/v1/tasks")
        .send({ instruction: "" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid request");
    });

    it("rejects a missing instruction", async () => {
      const response = await request(app)
        .post("/api/v1/tasks")
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/v1/tasks", () => {
    it("returns the list of tasks", async () => {
      await request(app)
        .post("/api/v1/tasks")
        .send({
          instruction: "Find Rahul Sharma in the CRM",
        });

      const response = await request(app)
        .get("/api/v1/tasks");

      expect(response.status).toBe(200);
      expect(response.body.tasks).toHaveLength(1);
    });
  });

  describe("GET /api/v1/tasks/:id", () => {
    it("returns an existing task", async () => {
      const created = await request(app)
        .post("/api/v1/tasks")
        .send({
          instruction: "Find Rahul Sharma in the CRM",
        });

      const taskId = created.body.task.id;

      const response = await request(app)
        .get(`/api/v1/tasks/${taskId}`);

      expect(response.status).toBe(200);
      expect(response.body.task.id).toBe(taskId);
    });

    it("returns 404 for a nonexistent task", async () => {
      const response = await request(app)
        .get("/api/v1/tasks/nonexistent-task-id");

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Task not found");
    });
  });
});