const express = require("express");
const cors = require("cors");

// Importing routes
const userRouter = require("./src/modules/auth/auth.router.js");
const categoryRouter = require("./src/modules/Category/Category.router.js");
const taskRouter = require("./src/modules/Task/Task.router.js");

// Mongoose connection
const mongodbconnect = require("./Database/dbConnection.js");

const AppRouter = (app) => {
  mongodbconnect();
  
  app.use(cors());
  //convert Buffer Data
  // Middleware to parse JSON
  app.use(express.json());

  // Routes
  app.use("/api/user", userRouter);
  app.use("/api/category", categoryRouter);
  app.use("/api/task", taskRouter);
  

  // 404 route
  app.use("*", (req, res) => {
    res.status(404).json({ Msg: "I Can't Found" });
  });
};

module.exports = AppRouter;
