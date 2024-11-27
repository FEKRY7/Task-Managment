const slugify = require("slugify");
const categoryModel = require("../../../Database/models/category.model.js");
const http = require('../../folderS,F,E/S,F,E.JS');
const { First, Second, Third } = require('../../utils/httperespons');

// ? CRUD
// ?Create category : 
const CreateCategory = async (req, res) => {
  try {
    // Create a new category
    const category = await categoryModel.create({
      categoryName: req.body.categoryName,
      slug: slugify(req.body.categoryName),
      createdBy: req.user._id,
    });

    // Return success response with category data
    return Second(res, ["Category created successfully", category], 200, http.SUCCESS);
  } catch (error) {
    console.error(error);
    return Third(res, "Internal Server Error", 500, http.ERROR);
  }
};


// ? update category 
const UpdateCategory = async (req, res) => {
  try {
    // Find the category by ID
    const category = await categoryModel.findById(req.params.category_Id);
    if (!category) {
      return First(res, "Invalid categoryId!", 400, http.FAIL);
    }

    // Check if the user is authorized to update the category
    if (req.user._id.toString() !== category.createdBy.toString()) {
      return First(res, "Not authorized!", 403, http.FAIL);
    }

    // Update category fields
    if (req.body.categoryName) {
      category.categoryName = req.body.categoryName;
      category.slug = req.body.categoryName
    }

    // Save updated category
    await category.save();

    // Send success response
    return Second(res, ["Category updated successfully", category], 200, http.SUCCESS);
  } catch (error) {
    console.error(error);
    return Third(res, "Internal Server Error", 500, http.ERROR);
  }
};

// ? delete category
const DeleteCategory = async (req, res) => {
  try {
    // Find the category by ID
    const category = await categoryModel.findById(req.params.category_Id);
    if (!category) {
      return First(res, "Invalid categoryId!", 400, http.FAIL);
    }

    // Check if the user is authorized to delete the category
    if (req.user._id.toString() !== category.createdBy.toString()) {
      return First(res, "Not authorized!", 403, http.FAIL);
    }

    // Delete the category
    await categoryModel.findByIdAndDelete(req.params.category_Id);

    // Send success response
    return Second(res, "Category deleted successfully!", 200, http.SUCCESS);
  } catch (error) {
    console.error(error);
    return Third(res, "Internal Server Error", 500, http.ERROR);
  }
};

// ? get all categorys > isSharedTask=Public
const GetAllCategory = async (req, res) => {
  try {
    // Fetch categories with specified fields and populate nested fields
    const categories = await categoryModel
      .find({})
      .select("categoryName slug")
      .paginate(req.query.page); // Assuming `paginate` is a valid plugin on the model

    // Check if categories exist
    if (!categories || categories.length === 0) {
      return First(res, "No categories found", 404, http.FAIL);
    }

    // Send response
    return Second(res, ["Categories fetched successfully", categories], 200, http.SUCCESS);
  } catch (error) {
    console.error(error);
    return Third(res, "Internal Server Error", 500, http.ERROR);
  }
};

// ? get all categorys > Pagination , Sorting , Filtering
// http://localhost:3000/category/get/all/?sort=categoryName&page=1&categoryName=projects New 9
const GetAllCategoryFilteringSortingPagination = async (req, res) => {
  try {
    // Fetch query parameters
    const { page = 1, limit = 10, sort = '-createdAt', ...filters } = req.query;

    // Parse page and limit to numbers
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    // Apply filters, pagination, and sorting
    const categories = await categoryModel
      .find(filters)
      .sort(sort)
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    // Get total count for pagination metadata
    const totalCount = await categoryModel.countDocuments(filters);

    return Second(res, [{
      page: pageNumber,
      totalPages: Math.ceil(totalCount / limitNumber),
      totalItems: totalCount,
      categories,
      message: "Fetched all categories successfully"
    }], 200, http.SUCCESS);
  } catch (error) {
    console.error(error);
    return Third(res, "Internal Server Error", 500, http.ERROR);
  }
};

module.exports = {
  CreateCategory,
  UpdateCategory,
  DeleteCategory,
  GetAllCategory,
  GetAllCategoryFilteringSortingPagination,
};
