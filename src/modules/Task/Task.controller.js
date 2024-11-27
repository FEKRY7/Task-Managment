// import { query } from "express";
const categoryModel = require('../../../Database/models/category.model.js')
const taskModel = require('../../../Database/models/task.model.js')
const http = require('../../folderS,F,E/S,F,E.JS');
const { First, Second, Third } = require('../../utils/httperespons');

/*
    update > 
    - update oneTask: Handles updating a single task (typesTasks: 'text').
    - listTask: Handles updating multiple tasks within a list (typesTasks: 'list').
    - addTasksWithinMultipleTasks: Handles adding tasks to a list of tasks (typesTasks: 'list').
    - updateTask: Handles updating an existing task, either a single task or a list of tasks.
    delete >
    - Delete Task: Handles deletion of a single task based on its ID (task_id).
    - Delete Tasks Within Multiple Tasks: Handles deletion of tasks within a list of tasks
      based on their IDs (task_id).
*/

// ? CRUD
// ? create task
const CreateTask = async (req, res) => {
  try {
      const { typesTasks, isSharedTask, oneTask, listTask } = req.body;

      // Validate category existence
      const category = await categoryModel.findById(req.params.categoryId);
      if (!category) {
        return First(res, "Invalid categoryId", 400, http.FAIL);
      }

      if (typesTasks === "list") {
          // Validate listTask
          if (!Array.isArray(listTask) || listTask.length === 0) {
            return First(res, "List task cannot be empty", 400, http.FAIL);
          }

          const tasks = await taskModel.create({
              typesTasks,
              isSharedTask,
              listTask,
              createdBy: req.user._id,
              categoryId: req.params.categoryId
          });

          return Second(res, ["Tasks added!", tasks], 200, http.SUCCESS);
      }

      if (typesTasks === "text") {
          // Validate oneTask
          if (!oneTask || oneTask.trim() === "") {
            return First(res, "Text task cannot be empty", 400, http.FAIL);
          }

          const task = await taskModel.create({
              typesTasks,
              isSharedTask,
              oneTask,
              createdBy: req.user._id,
              categoryId: req.params.categoryId
          });

          return Second(res, ["Task added!", task], 200, http.SUCCESS);
      }

      // Handle invalid typesTasks
      return First(res, "Invalid typesTasks value", 400, http.FAIL);

  } catch (error) {
    console.error(error);
    return Third(res, "Internal Server Error", 500, http.ERROR);
  }
};


// ? update one Task Or ListTask
const UpdateTask = async (req, res) => {
  try {
      const { typesTasks, isSharedTask, oneTask, listTask } = req.body;

      // Validate task existence
      const task = await taskModel.findById(req.params.task_id);
      if (!task) {
        return First(res, "Invalid taskId!", 400, http.FAIL);
      }

      // Check authorization
      if (req.user._id.toString() !== task.createdBy.toString()) {
        return First(res, "Not authorized!", 403, http.FAIL);
      }

      if (typesTasks === "text") {
          // Validate oneTask
          if (!oneTask || oneTask.trim() === "") {
            return First(res, "Text task cannot be empty", 400, http.FAIL);
          }

          // Update task fields
          task.isSharedTask = isSharedTask ?? task.isSharedTask;
          task.oneTask = oneTask ?? task.oneTask;

          await task.save();

          return Second(res, ["Task updated!", task], 200, http.SUCCESS);
      }

      if (typesTasks === "list") {
          // Validate listTask
          if (!Array.isArray(listTask) || listTask.some(item => !item._id || !item.text)) {
            return First(res, "Each list item must have an _id and text!", 400, http.FAIL);
          }

          // Update individual list tasks
          const updatePromises = listTask.map(item =>
              taskModel.findOneAndUpdate(
                  { 'listTask._id': item._id },
                  { $set: { 'listTask.$.text': item.text } },
                  { new: true }
              )
          );

          await Promise.all(updatePromises);

          // Update shared task flag (if provided)
          task.isSharedTask = isSharedTask ?? task.isSharedTask;

          await task.save();

          return Second(res, ["Tasks updated!", task], 200, http.SUCCESS);
      }

      // Handle invalid typesTasks
      return First(res, "Invalid typesTasks value!", 400, http.FAIL);

  } catch (error) {
    console.error(error);
    return Third(res, "Internal Server Error", 500, http.ERROR);
  }
};

// ? addTasksWithinMultipleTasks
const AddTasksWithinMultipleTasks = async (req, res) => {
  try {
      const { listTask } = req.body;

      // Validate if the task exists
      const isTask = await taskModel.findById(req.params.task_id);
      if (!isTask) {
        return First(res, "Invalid taskId!", 400, http.FAIL);
      }

      // Check if the user is authorized to modify the task
      if (req.user._id.toString() !== isTask.createdBy.toString()) {
        return First(res, "Not authorized!", 403, http.FAIL);
      }

      // Validate and update the list of tasks
      if (!Array.isArray(listTask) || listTask.some(task => !task.text)) {
        return First(res, "Each task must have text!", 400, http.FAIL);
      }

      const updatePromises = listTask.map(task =>
          taskModel.findByIdAndUpdate(
              req.params.task_id,
              {
                  $push: { listTask: { text: task.text } },
              },
              { new: true }
          )
      );

      // Await all the task updates
      await Promise.all(updatePromises);

      return Second(res, ["Tasks added within multiple tasks!",  isTask], 200, http.SUCCESS);

  } catch (error) {
    console.error(error);
    return Third(res, "Internal Server Error", 500, http.ERROR);
  }
};

// ?Delete Task
const DeleteTask = async (req, res) => {
  try {
      // Find the task by ID
      const task = await taskModel.findById(req.params.task_id);
      if (!task) {
        return First(res, "Invalid taskId!", 400, http.FAIL);
      }

      // Check if the user is authorized to delete the task
      if (req.user._id.toString() !== task.createdBy.toString()) {
        return First(res, "Not authorized!", 403, http.FAIL);
      }

      // Delete the task
      await taskModel.findByIdAndDelete(req.params.task_id);

      return Second(res, "Task deleted successfully!", 200, http.SUCCESS);
  } catch (error) {
    console.error(error);
    return Third(res, "Internal Server Error", 500, http.ERROR);
  }
};


// ? delete tasks within multiple tasks
const DeleteTasksWithinMultipleTasks = async (req, res) => {
  try {
      const { listTask } = req.body;

      // Validate if the task exists
      const isTask = await taskModel.findById(req.params.task_id);
      if (!isTask) {
        return First(res, "Invalid taskId!", 400, http.FAIL);
      }

      // Check if the user is authorized to modify the task
      if (req.user._id.toString() !== isTask.createdBy.toString()) {
        return First(res, "Not authorized!", 403, http.FAIL);
      }

      // Validate listTask
      if (!Array.isArray(listTask) || listTask.some(task => !task._id)) {
        return First(res, "Each task must have a valid _id!", 400, http.FAIL);
      }

      // Remove each task within listTask
      const deletePromises = listTask.map(task =>
          taskModel.findOneAndUpdate(
              { _id: req.params.task_id },
              { $pull: { listTask: { _id: task._id } } },
              { new: true }
          )
      );

      // Wait for all deletions to complete
      await Promise.all(deletePromises);

      return Second(res, ["Tasks deleted successfully!", isTask], 200, http.SUCCESS);
  } catch (error) {
    console.error(error);
    return Third(res, "Internal Server Error", 500, http.ERROR);
  }
};


/*
Tasks can be shared (visible to all users and unauthenticated 
viewers) or private (visible only to the creator)
 */
const GetAllTasks = async (req, res) => {
  try {
      const tasks = await taskModel
          .find({ isSharedTask: "Public" })
          .select("-_id")
          .populate({ path: "categoryId", select: "categoryName slug" })
          .populate({ path: "createdBy", select: "-_id userName email" });

          return Second(res, ["All public tasks retrieved successfully", tasks], 200, http.SUCCESS);
  } catch (error) {
    console.error(error);
    return Third(res, "Internal Server Error", 500, http.ERROR);
  }
};

const GetTasksVisibleOnlyCreator = async (req, res) => {
  try {
      const tasks = await taskModel
      .findById(req.params._id)
          .select("-_id")
          .populate({ path: "categoryId", select: "categoryName slug" })
          .populate({ path: "createdBy", select: "-_id userName email" });

          return Second(res, ["Tasks visible to creator retrieved successfully", tasks], 200, http.SUCCESS);
  } catch (error) {
    console.error(error);
    return Third(res, "Internal Server Error", 500, http.ERROR);
  }
};

// ? get all Tasks > Pagination , Sorting , Filtering
//http://localhost:3000/tasks/all?page=1&sort=isSharedTask
const GetAllTasksFilteringSortingPagination = async (req, res) => {
  try {
      const { page = 1, limit = 10, sort = "-createdAt" } = req.query;

      const tasks = await taskModel
          .find({})
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(parseInt(limit))
          .populate({ path: "categoryId", select: "categoryName slug" })
          .populate({ path: "createdBy", select: "userName email" });

      const totalTasks = await taskModel.countDocuments();

      return Second(res, [{
            message: "Tasks retrieved with filtering, sorting, and pagination",
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(totalTasks / limit),
            totalTasks,
            tasks
        }], 200, http.SUCCESS);
  } catch (error) {
    console.error(error);
    return Third(res, "Internal Server Error", 500, http.ERROR);
  }
};

module.exports = {
  CreateTask,
  UpdateTask,
  AddTasksWithinMultipleTasks,
  DeleteTask,
  DeleteTasksWithinMultipleTasks,
  GetAllTasks,
  GetTasksVisibleOnlyCreator,
  GetAllTasksFilteringSortingPagination
};
