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
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);


// Hash password before saving
policeSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

policeSchema.methods.getJWT = async function () {
  const police = this;

  const token = await jwt.sign({ _id: police._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  return token;
};

policeSchema.methods.validatePassword = async function (passwordInputByUser) {
  const police = this;
  return bcrypt.compare(passwordInputByUser, police.password);
};

module.exports = mongoose.model("Police", policeSchema);
