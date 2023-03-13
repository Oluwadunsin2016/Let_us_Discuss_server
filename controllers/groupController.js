const { groupModel, groupMemberModel, groupMessageModel } = require("../models/groupModel");
const userModel = require("../models/userModel");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const createGroup = async (req, res, next) => {
  try {
    const { name, admin } = req.body;
    const existedGroup=await groupModel.findOne({name});
    if (existedGroup) {
     return   res.json({message:"A group with this name already exists", success:false});
    }
    const data = await groupModel.create({ name, admin });
    if (data) {
     return   res.json({message:"Data saved successfully", data, success:true});
    }else{
     return   res.json({message:"Data can't be saved", success:false});
    }
  } catch (ex) {
  next(ex);
  }
};
const AddGroupMember = async (req, res, next) => {
  try {
    const { member,group } = req.body;
    const existedMember=await groupMemberModel.findOne({member,group});
    if (existedMember) {
     return   res.json({message:"This person is already a member", success:false});
    }
    const data = await groupMemberModel.create({ member,group });
    if (data) {
     return   res.json({message:"A member has been added successfully", success:true});
    }else{
     return   res.json({message:"There is an error", success:false});
    }
  } catch (ex) {
  next(ex);
  }
};

const getGroups = async (req, res, next) => {
  try {
  const {member}=req.body;
  const whereIAmAMember=await groupMemberModel.find({member});
    const Groups=await groupModel.find({});
  return   res.json({Groups, whereIAmAMember, success:true});
  } catch (ex) {
  next(ex);
  }
};

const getGroupMembers=async(req,res,next)=>{
try {
  const {group}=req.body;
  console.log(group);
  const users=await userModel.find({});
  const members=await groupMemberModel.find({group});
  if (members) {
    res.json({members, users, message:"Got the members", success:true});
  }else{
    res.json({members, message:"No member", success:false});
  }
} catch (ex) {
  next(ex)
}
}

const sendMessageToGroup=async(req,res,next)=>{
try {
     const {sender,group,message}=req.body;
    const data=await groupMessageModel.create({sender,message,group})
    if (data) {
       return res.json({message:"message sent"})
    }else{
       return res.json({message:"message sending failed",success:false})
    }
} catch (ex) {
  next(ex)
}
}

const getGroupMessages=async(req,res,next) => {
try {
  const {group}=req.body;
  const messages=await groupMessageModel.find({group});
  if (messages) {
    res.json({messages, message:"Got the messages", success:true});
  }else{
    res.json({messages, message:"No message", success:false});
  }
} catch (ex) {
  next(ex)
}
}

const uploadFile = async (req, res, next) => {
  try {
    const { file, id } = req.body;
    const result = await cloudinary.uploader.upload(file, {
      folder: "Profile_Pictures",
    });
    if (!result) {
      console.log("file did not upload");
      res.json({ message: "Profile picture upload failed" });
    } else {
      await groupModel.findByIdAndUpdate(
        { _id: id },
        { profileImage: result.secure_url }
      );
      const group = await groupModel.findOne({ _id: id });
      if (group) {
        res.json({
          message: "Profile picture uploaded successfully",
          group,
          success: true,
        });
      } else {
        res.json({ message: "An error occurred",success: false  });
      }
    }
  } catch (ex) {
    next(ex);
  }
};

const changeGroupName=async(req,res,next)=>{
try {
  const {name,id}=req.body;
  await groupModel.findByIdAndUpdate({_id:id},{name});

 const group = await groupModel.findOne({ _id: id });
      if (group) {
        res.json({
          message: "Group name changed successfully",
          group,
          success: true,
        });
      } else {
        res.json({ message: "An error occurred",success: false });
      }
} catch (ex) {
  next(ex)
}
}

module.exports = { createGroup,getGroups,AddGroupMember,getGroupMembers,sendMessageToGroup,getGroupMessages,uploadFile,changeGroupName};
