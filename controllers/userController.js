const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const messageModel = require("../models/messageModel");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const register = async (req, res, next) => {
  try {
    console.log(req.body);
    const { firstName, lastName, userName, email, password } = req.body;
    const checkedUserName = await userModel.findOne({ userName });
    if (checkedUserName) {
      return res.json({
        message: "Username has already been used",
        status: false,
      });
    }
    const checkedEmail = await userModel.findOne({ email });
    if (checkedEmail) {
      return res.json({
        message: "This email has already been used",
        status: false,
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    if (hashedPassword) {
      const user = await userModel.create({
        firstName,
        lastName,
        userName,
        email,
        password: hashedPassword,
      });
      delete user.password;
      return res.json({ user, status: true });
    }
  } catch (ex) {
    next(ex);
  }
};

const logIn = async (req, res, next) => {
  try {
    console.log(req.body);
    const { userName, password } = req.body;
    const user = await userModel.findOne({ userName });
    if (!user) {
      return res.json({ message: "User doesn't exist", status: false });
    } else {
      const samePassword = await bcrypt.compare(password, user.password);
      if (samePassword) {
        delete user.password;
        return res.json({ user, status: true });
      } else {
        return res.json({ message: "Incorrect password", status: false });
      }
    }
  } catch (ex) {
    next(ex);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const users = await userModel
      .find({ _id: { $ne: req.params.id } })
      .select([
        "firstName",
        "lastName",
        "userName",
        "email",
        "profileImage",
        "_id",
      ]);
    return res.json(users);
  } catch (ex) {
    next(ex);
  }
};
const uploadFile = async (req, res, next) => {
  try {
    const { file, id } = req.body;
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
  const {firstName, lastName, userName, email, id}=req.body;
  await userModel.findByIdAndUpdate({_id:id},{firstName,lastName,userName,email});
  const user=await userModel.findById({_id:id});
  if (user) {
     res.json({
          message: "Updated successfully",
          user,
          status: true,
        });
  }else{
  res.json({ message: "An error occurred",status: false });
  }
} catch (ex) {
  next(ex)
}
}

module.exports = { register, logIn, getUsers, uploadFile,editUser};
