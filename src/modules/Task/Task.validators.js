const joi = require("joi");
const {
  isValidObjectId,
} = require("../../middleware/validation.middleware.js");

const addTask = joi.object({
  //! isPublicTask visible to all users  or private visible only to the creator
  isSharedTask: joi.string().valid("Public", "Private").required(),
  typesTasks: joi.string().valid("text", "list").required(),
  categoryId: joi.string().custom(isValidObjectId).required(),
  oneTask: joi.string(),
  listTask: joi
    .array()
    .items({
      text: joi.string().required(),
    }),
}).required();

const updateTask = joi.object({
  task_id: joi.string().custom(isValidObjectId).required(),
  typesTasks: joi.string().valid("text", "list").required(),
  isSharedTask: joi.string().valid("Public", "Private").required(),
  oneTask: joi.string(),
  listTask: joi
    .array()
    .items({
      text: joi.string().required(),
      _id: joi.string().required()
    })
}).required();

const deleteTask = joi.object({
  task_id: joi.string().custom(isValidObjectId).required()
}).required();

const deleteTasksWithinMultipleTasks = joi.object({
  task_id: joi.string().custom(isValidObjectId).required(),
  listTask: joi
    .array()
    .items({
      _id: joi.string().required()
    })
}).required();

const addTasksWithinMultipleTasks = joi.object({
  task_id: joi.string().custom(isValidObjectId).required(),
  listTask: joi
    .array()
    .items({
      text: joi.string().required()
    })
}).required();

const getTasksWithUser = joi.object({ 
  _id: joi.string().custom(isValidObjectId).required() 
});

module.exports = {
  addTask,
  updateTask,
  addTasksWithinMultipleTasks,
  deleteTask,
  deleteTasksWithinMultipleTasks,
  getTasksWithUser,
};
