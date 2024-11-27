const joi = require("joi");
const {
  isValidObjectId,
} = require("../../middleware/validation.middleware.js");

const createCategory = joi
  .object({
    categoryName: joi.string().min(5).max(20).required(),
  })
  .required();

const updateCategory = joi.object({
  category_Id:joi.string().custom(isValidObjectId).required(),
  categoryName:joi.string().min(5).max(20).required(),
}).required();

const deleteCategory = joi.object({
  category_Id:joi.string().custom(isValidObjectId).required(),
}).required();

module.exports = {
  createCategory,
  updateCategory,
  deleteCategory, 
};