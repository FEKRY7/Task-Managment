const joi = require("joi");
const {
  isValidObjectId,
} = require("../../middleware/validation.middleware.js");

const signUPSchema = joi
  .object({
    userName: joi.string().min(3).max(22).required(),
    email: joi
      .string()
      .email({ maxDomainSegments: 2, tlds: { allow: ["com", "net"] } })
      .required(),
    password: joi.string().pattern(RegExp("^[a-zA-Z0-9]{3,30}$")).required(),
    confirmPassword: joi.string().valid(joi.ref("password")).required(),
  })
  .required();
const activeCode = joi
  .object({
    activationCode: joi.string().required()
  })
  .required();
const signInSchema = joi
  .object({
    userName: joi
      .string().required(),
    password: joi.string().required()
  })
  .required();
  const logout = joi.object({
    _id: joi.string().custom(isValidObjectId).required()
  });
const forgetPass = joi
  .object({
    email: joi
      .string().required()
  })
  .required();
const resetPassword = joi
  .object({
    forgetCode: joi.string().length(4).required(),
    email: joi
      .string().required(),
    password: joi.string().pattern(RegExp("^[a-zA-Z0-9]{3,30}$")).required(),
    confirmPassword: joi.string().valid(joi.ref("password")).required()
  })
  .required();

module.exports = {
  signUPSchema,
  activeCode,
  signInSchema,
  logout,
  forgetPass,
  resetPassword,
};
