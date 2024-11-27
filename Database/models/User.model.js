const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
  profileImage: {
    url: {
      type: String,
      default:
        "https://res.cloudinary.com/dvferafsw/image/upload/v1700258634/default-profile-account-unknown-icon-black-silhouette-free-vector_leqzap.jpg",
    },
    publicId: {
      type: String,
      default: "default-profile-account-unknown-icon-black-silhouette-free-vector_leqzap",
    },
  },
  userName: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 22,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
    match: [/.+@.+\..+/, "Please enter a valid email address"],
  },
  password: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: "offline",
    enum: ["offline", "online"],
  },
  role: {
    type: String,
    default: "user",
    enum: ["user", "admin"],
  },
  isConfirmed: {
    type: Boolean,
    default: false,
  },
  provider: {
    type: String,
    default: "SYSTEM",
    enum: ["SYSTEM", "GOOGLE", "FACEBOOK", "ICLOUD"],
  },
  accessToken: { type: String },
  refreshToken: { type: String },
  agent: String,
  forgetCode: String,
  activationCode: String,
}, { timestamps: true }); // Automatically add `createdAt` and `updatedAt` fields

// Middleware to hash the password before saving
userSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) return next();

    const saltRounds = parseInt(process.env.SALT_ROUND, 10) || 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check if the password is correct
userSchema.methods.isPasswordCorrect = async function (password) {
  return bcrypt.compare(password, this.password);
};

// Method to generate an access token
userSchema.methods.generateAccessToken = function () {
  try {
    return jwt.sign(
      {
        _id: this._id,
        email: this.email,
        userName: this.userName,
        role: this.role,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1d" }
    );
  } catch (error) {
    res.statuse(404).json("Error generating access token");
  }
};

// Method to generate a refresh token
userSchema.methods.generateRefreshToken = function () {
  try {
    return jwt.sign(
      { _id: this._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "365d" }
    );
  } catch (error) {
    res.statuse(404).json("Error generating refresh token");
  }
};

const userModel = mongoose.model("User", userSchema);

module.exports = userModel;
