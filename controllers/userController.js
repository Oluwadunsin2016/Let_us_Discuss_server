const userModel = require("../models/userModel");
const bcrypt = require("bcryptjs");
const messageModel = require("../models/messageModel");
const cloudinary = require("cloudinary").v2;
const jwt = require("jsonwebtoken");
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const register = async (req, res, next) => {
  try {
    const { firstName, lastName, userName, email, password } = req.body;

    // Check if username is taken
    const checkedUserName = await userModel.findOne({ userName });
    if (checkedUserName) {
      return res.json({
        message: "Username has already been used",
        status: false,
      });
    }

    // Check if email is taken
    const checkedEmail = await userModel.findOne({ email });
    if (checkedEmail) {
      return res.json({
        message: "This email has already been used",
        status: false,
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await userModel.create({
      firstName,
      lastName,
      userName,
      email,
      password: hashedPassword,
    });

    // Create token
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });


    return res.status(201).json({
      token,
      status: true,
    });

  } catch (ex) {
    next(ex);
  }
};


const logIn = async (req, res, next) => {
  try {
    const { userName, password } = req.body;
    const user = await userModel.findOne({ userName });

    if (!user) {
      return res.json({ message: "User doesn't exist", status: false });
    }

    const samePassword = await bcrypt.compare(password, user.password);

    if (!samePassword) {
      return res.json({ message: "Incorrect password", status: false });
    }

    // Create payload and token
    // const payload = {
    //   _id: user._id,
    //   userName: user.userName,
    //   email: user.email,
    // };
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d", // token will expire in 7 days
    });

    return res.json({ token, status: true });

  } catch (ex) {
    next(ex);
  }
};


const getUser = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user._id).select("-password");
    return res.json(user);
  } catch (ex) {
    next(ex);
  }
};


const getUsers = async (req, res, next) => {
  try {
    const users = await userModel
      .find({ _id: { $ne: req.user._id } })
      .select('-password')
      .sort({ createdAt: -1 });
    return res.json(users);
  } catch (ex) {
    next(ex);
  }
};


const uploadFile = async (req, res, next) => {
  try {
    const { file } = req.body;
    const id = req.user._id
    const result = await cloudinary.uploader.upload(file, {
      folder: "Profile_Pictures",
    });
    if (!result) {
      console.log("file did not upload");
      res.json({ message: "Profile picture upload failed",status: false });
    } else {
      await userModel.findByIdAndUpdate(
        { _id: id },
        { profileImage: result.secure_url }
      );
      const user = await userModel.findOne({ _id: id });
      if (user) {
        res.json({
          message: "Profile picture uploaded successfully",
          user,
          status: true,
        });
      } else {
        res.json({ message: "An error occurred",status: false });
      }
    }
  } catch (ex) {
    next(ex);
  }
};

const editUser=async(req,res,next)=>{
try {
  const {firstName, lastName, userName, email}=req.body;
  const id =req.user._id
  console.log("UserId:", req.user._id);
  
  await userModel.findByIdAndUpdate({_id:id},{firstName,lastName,userName,email});
  res.json({
       message: "Updated successfully",
       status: true,
     });
} catch (ex) {
  next(ex)
}
}

const logOut = async (userId) => {
  await userModel.findByIdAndUpdate(
      { _id: userId },
      { lastSeen: Date.now() }
   )

};

// (async () => {
//   try {
//       // await userModel.deleteMany({});
//     const users = await userModel.find();
//     console.log("All users:", users);
//   } catch (error) {
//     console.error("Error fetching users:", error.message);
//   }
// })();

module.exports = { register, logIn,getUser, getUsers, uploadFile,editUser, logOut};
