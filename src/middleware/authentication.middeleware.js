const jwt = require('jsonwebtoken');
const tokenModel = require('./../../Database/models/token.model.js');
const userModel = require('./../../Database/models/User.model.js');
const http = require('../folderS,F,E/S,F,E.JS');
const { First } = require('../utils/httperespons');

const isAuthenticated = async (req, res, next) => {
  try {
    // Check if token is provided in the headers
    const token = req.headers.token;
    if (!token) {
      return First(res, "Token is required", 400, http.FAIL);
    }

    // Check token existence in the database
    const tokenDb = await tokenModel.findOne({ token, isValied: true });
    if (!tokenDb) {
      return First(res, "Expired or invalid token", 400, http.FAIL);
    }

    // Verify the JWT token
    const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if(!payload) return First(res, "token is roing", 404, http.FAIL);
      

    // Check if the user exists
    const user = await userModel.findById(payload._id);
    if (!user) {
      console.log(user);
      return First(res, "User not found", 404, http.FAIL);
    }

    // Attach the user to the request object for downstream middleware
    req.user = user;

    next(); // Proceed to the next middleware
  } catch (err) {
    console.error("Error in isAuthenticated middleware:", err);
    return First(res, "Internal server error", 500, http.FAIL);
  }
};

module.exports = isAuthenticated;
