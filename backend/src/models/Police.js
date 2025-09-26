const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const policeSchema = new mongoose.Schema(
  {
    policeStationName: {
      type: String,
      required: true,
    },
    badgeNumber: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);


policeSchema.methods.getJWT = async function () {
  const police = this;

  const token = await jwt.sign({ _id: police._id }, "DEV@Police$790", {
    expiresIn: "7d",
  });

  return token;
};

policeSchema.methods.validatePassword = async function (passwordInputByUser) {
  const police = this;
  const storedPassword = police.password;

  // Simple string comparison for plain text passwords
  return passwordInputByUser === storedPassword;
};

module.exports = mongoose.model("Police", policeSchema);
