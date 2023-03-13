const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    unique: true,
    min: 3,
    max: 20,
  },
  lastName: {
    type: String,
    required: true,
    unique: true,
    min: 3,
    max: 20,
  },
  userName: {
    type: String,
    required: true,
    unique: true,
    min: 3,
    max: 20,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    max: 50,
  },
  password: {
    type: String,
    required: true,
    min: 5,
  },
  profileImage: {
    type: String,
    default: "https://res.cloudinary.com/dz8elpgwn/image/upload/v1677083356/Profile_Pictures/default_user_image_fjdzay.png",
  },
});

const userModel = mongoose.model("Users", userSchema);

module.exports = userModel;
