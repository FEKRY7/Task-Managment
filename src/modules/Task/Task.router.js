const express = require("express");
const router = express.Router();
const isAuthenticated = require("../../middleware/authentication.middeleware.js");
const isAuthorized = require("../../middleware/authoriztion.middelware.js");
const { validation } = require("../../middleware/validation.middleware.js");

const {
  addTask,
  updateTask,
  addTasksWithinMultipleTasks,
  deleteTask,
  deleteTasksWithinMultipleTasks,
  getTasksWithUser
} = require("./Task.validators.js");

const {
  CreateTask,
  UpdateTask,
  AddTasksWithinMultipleTasks,
  DeleteTask,
  DeleteTasksWithinMultipleTasks,
  GetAllTasks,
  GetTasksVisibleOnlyCreator,
  GetAllTasksFilteringSortingPagination
} = require("./Task.controller.js");

router.post(
  "/addTask/:categoryId",
  isAuthenticated,
  isAuthorized("user"),
  validation(addTask),
  CreateTask
);

router.patch(
  "/update/:task_id",
  isAuthenticated,
  isAuthorized("user"),
  validation(updateTask),
  UpdateTask
);
router.patch(
  "/update/add/:task_id",
  isAuthenticated,
  isAuthorized("user"),
  validation(addTasksWithinMultipleTasks),
  AddTasksWithinMultipleTasks
);
router.delete(
  "/delete/:task_id",
  isAuthenticated,
  isAuthorized("user"),
  validation(deleteTask),
  DeleteTask
);
router.patch(
  "/delete/multipleTasks/:task_id",
  isAuthenticated,
  isAuthorized("user"),
  validation(deleteTasksWithinMultipleTasks),
  DeleteTasksWithinMultipleTasks
);
router.get("/getAll", GetAllTasks);
router.get(
  "/get/VisibleOnlyCreator/:_id",
  validation(getTasksWithUser),
  GetTasksVisibleOnlyCreator
);
router.get(
  "/all",
  GetAllTasksFilteringSortingPagination
);

module.exports = router;