const express = require("express");
const router = express.Router();
const isAuthenticated = require("../../middleware/authentication.middeleware.js");
const isAuthorized = require("../../middleware/authoriztion.middelware.js");
const { validation } = require("../../middleware/validation.middleware.js");

const {
  createCategory,
  updateCategory,
  deleteCategory, 
} = require("./Category.validators.js");

const {
  CreateCategory,
  UpdateCategory,
  DeleteCategory,
  GetAllCategory,
  GetAllCategoryFilteringSortingPagination
} = require("./Category.controller.js");

router.post(
  "/create",
  isAuthenticated,
  isAuthorized("user"),
  validation(createCategory),
  CreateCategory
);

router.patch(
  "/update/:category_Id",
  isAuthenticated,
  isAuthorized("user"),
  validation(updateCategory),
  UpdateCategory
);

router.delete(
  "/delete/:category_Id",
  isAuthenticated,
  isAuthorized("user"),
  validation(deleteCategory),
  DeleteCategory
);

router.get("/all" , GetAllCategory);
router.get("/get/all" , GetAllCategoryFilteringSortingPagination);
 
module.exports = router;