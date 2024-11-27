const express = require("express");
const router = express.Router();
const isAuthenticated = require("../../middleware/authentication.middeleware.js");
const isAuthorized = require("../../middleware/authoriztion.middelware.js");
const { validation } = require("../../middleware/validation.middleware.js");

const {
  signUPSchema,
  activeCode,
  signInSchema,
  logout,
  forgetPass,
  resetPassword,
} = require("./auth.validators.js");

const {
  SignUP,
  ActivationAccount,
  SignIn,
  SignupOrloginWithGmail,
  Logout,
  RefreshAccessToken,
  ForgetPass,
  ResetPassword,
} = require("./auth.controller.js");

// register
router.post(
  "/SignUP",
  validation(signUPSchema),
  SignUP
);
 
// Active account
router.get(
  "/confirmEmail/:activationCode",
  validation(activeCode),
  ActivationAccount
);

// //login
router.post("/SignIn", validation(signInSchema), SignIn);

// soical login 
router.post("/SignupOrloginWithGmail",SignupOrloginWithGmail);

//logout
router.post(
  "/logout/:_id",
  isAuthenticated,
  isAuthorized("user"),
  validation(logout),
  Logout
);

// Access token refreshed
router.post("/refreshToken",RefreshAccessToken);

// send code forget Password
router.patch(
  "/forget",
  validation(forgetPass),
  ForgetPass
);

// reset Password
router.patch(
  "/resetPassword",
  validation(resetPassword),
  ResetPassword
);

module.exports = router;