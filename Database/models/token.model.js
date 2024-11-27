const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  isValied: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now, expires: "30d" }, // Auto-delete after 30 days
});

const tokenModel = mongoose.model("Token", tokenSchema);

module.exports = tokenModel;
