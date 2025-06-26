// const { groupModel, groupMemberModel, groupMessageModel } = require("../models/groupModel");
// const userModel = require("../models/userModel");
// const cloudinary = require("cloudinary").v2;

// cloudinary.config({
//   cloud_name: process.env.CLOUD_NAME,
//   api_key: process.env.API_KEY,
//   api_secret: process.env.API_SECRET,
// });

// const createGroup = async (req, res, next) => {
//   try {
//     const { name, admin } = req.body;
//     const existedGroup=await groupModel.findOne({name});
//     if (existedGroup) {
//      return   res.json({message:"A group with this name already exists", success:false});
//     }
//     const data = await groupModel.create({ name, admin });
//     if (data) {
//      return   res.json({message:"Data saved successfully", data, success:true});
//     }else{
//      return   res.json({message:"Data can't be saved", success:false});
//     }
//   } catch (ex) {
//   next(ex);
//   }
// };
// const AddGroupMember = async (req, res, next) => {
//   try {
//     const { member,group } = req.body;
//     const existedMember=await groupMemberModel.findOne({member,group});
//     if (existedMember) {
//      return   res.json({message:"This person is already a member", success:false});
//     }
//     const data = await groupMemberModel.create({ member,group });
//     if (data) {
//      return   res.json({message:"A member has been added successfully", success:true});
//     }else{
//      return   res.json({message:"There is an error", success:false});
//     }
//   } catch (ex) {
//   next(ex);
//   }
// };

// const getGroups = async (req, res, next) => {
//   try {
//   const {member}=req.body;
//   const whereIAmAMember=await groupMemberModel.find({member});
//     const Groups=await groupModel.find({});
//   return   res.json({Groups, whereIAmAMember, success:true});
//   } catch (ex) {
//   next(ex);
//   }
// };

// const getGroupMembers=async(req,res,next)=>{
// try {
//   const {group}=req.body;
//   console.log(group);
//   const users=await userModel.find({});
//   const members=await groupMemberModel.find({group});
//   if (members) {
//     res.json({members, users, message:"Got the members", success:true});
//   }else{
//     res.json({members, message:"No member", success:false});
//   }
// } catch (ex) {
//   next(ex)
// }
// }

// const sendMessageToGroup=async(req,res,next)=>{
// try {
//      const {sender,group,message}=req.body;
//     const data=await groupMessageModel.create({sender,message,group})
//     if (data) {
//        return res.json({message:"message sent"})
//     }else{
//        return res.json({message:"message sending failed",success:false})
//     }
// } catch (ex) {
//   next(ex)
// }
// }

// const getGroupMessages=async(req,res,next) => {
// try {
//   const {group}=req.body;
//   const messages=await groupMessageModel.find({group});
//   if (messages) {
//     res.json({messages, message:"Got the messages", success:true});
//   }else{
//     res.json({messages, message:"No message", success:false});
//   }
// } catch (ex) {
//   next(ex)
// }
// }

// const uploadFile = async (req, res, next) => {
//   try {
//     const { file, id } = req.body;
//     const result = await cloudinary.uploader.upload(file, {
//       folder: "Profile_Pictures",
//     });
//     if (!result) {
//       console.log("file did not upload");
//       res.json({ message: "Profile picture upload failed" });
//     } else {
//       await groupModel.findByIdAndUpdate(
//         { _id: id },
//         { profileImage: result.secure_url }
//       );
//       const group = await groupModel.findOne({ _id: id });
//       if (group) {
//         res.json({
//           message: "Profile picture uploaded successfully",
//           group,
//           success: true,
//         });
//       } else {
//         res.json({ message: "An error occurred",success: false  });
//       }
//     }
//   } catch (ex) {
//     next(ex);
//   }
// };

// const changeGroupName=async(req,res,next)=>{
// try {
//   const {name,id}=req.body;
//   await groupModel.findByIdAndUpdate({_id:id},{name});

//  const group = await groupModel.findOne({ _id: id });
//       if (group) {
//         res.json({
//           message: "Group name changed successfully",
//           group,
//           success: true,
//         });
//       } else {
//         res.json({ message: "An error occurred",success: false });
//       }
// } catch (ex) {
//   next(ex)
// }
// }

// module.exports = { createGroup,getGroups,AddGroupMember,getGroupMembers,sendMessageToGroup,getGroupMessages,uploadFile,changeGroupName};



// groupController updated
const { default: mongoose } = require("mongoose");
const { groupModel, groupMemberModel, groupMessageModel, GroupChatModel } = require("../models/groupModel");
const cloudinary = require("cloudinary").v2;
const moment = require('moment');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Create group
exports.createGroup = async (req, res, next) => {
  try {
    const { name, members, description, image } = req.body;

    if (!name || !members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ success: false, message: "Name and members are required" });
    }

    // Optional: check for unique group name
    const nameExists = await groupModel.findOne({ name });
    if (nameExists) {
      return res.status(409).json({ success: false, message: "Group name already taken" });
    }

    // Upload image if provided
    let imageUrl = "https://res.cloudinary.com/dz8elpgwn/image/upload/v1677083376/Profile_Pictures/groupImage_m49682.png";
    if (image && image.startsWith("data:image")) {
      const uploadRes = await cloudinary.uploader.upload(image, {
        folder: "Profile_Pictures",
      });
      imageUrl = uploadRes.secure_url;
    }

    // Create group
    const group = await groupModel.create({
      name,
      admin: req.user._id,
      profileImage: imageUrl,
      description: description || "",
    });

    // Add members (including admin)
    const allMembers = [...new Set([...members, req.user._id.toString()])];
    const groupMembers = allMembers.map(memberId => ({
      member: memberId,
      group: group._id,
    }));

    await groupMemberModel.insertMany(groupMembers);

    const populatedGroup = await groupModel.findById(group._id).populate("admin", "userName profileImage");

    res.status(201).json({
      success: true,
      message: "Group created successfully",
      group: populatedGroup,
    });

  } catch (err) {
    console.error("createGroup error:", err);
    next(err);
  }
};

// Add member (admin only)
exports.addMembers = async (req, res, next) => {
  try {
    const { groupId, memberIds } = req.body;

    if (!groupId || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ success: false, message: "Group ID and member IDs are required" });
    }

    const group = await groupModel.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    if (!group.admin.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: "Only admin can add members" });
    }

    // Filter out members already in the group
    const existingMembers = await groupMemberModel.find({ group: groupId, member: { $in: memberIds } });
    const existingIds = existingMembers.map(m => m.member.toString());

    const newMembers = memberIds
      .filter(id => !existingIds.includes(id))
      .map(id => ({ group: groupId, member: id }));

    if (newMembers.length === 0) {
      return res.status(400).json({ success: false, message: "All selected users are already in the group" });
    }

    await groupMemberModel.insertMany(newMembers);

    res.json({ success: true, message: "Members added successfully" });
  } catch (err) {
    console.error("Error adding members:", err);
    next(err);
  }
};


// Send group message
exports.sendGroupMessage = async (req, res, next) => {
  const { groupId, message, from } = req.body;
  if (!await groupMemberModel.findOne({ group: groupId, member: from }))
    return res.status(403).json({ success: false });

  const msg = await groupMessageModel.create({
    sender: from,
    group: groupId,
    content: message,
    unreadBy: (await groupMemberModel.find({ group: groupId })).map(m => m.member.toString())
      .filter(id => id !== from.toString())
  });

await GroupChatModel.findOneAndUpdate(
  { group: groupId },
  { lastMessage: msg._id, lastUpdated: new Date() },
  { upsert: true, new: true }
);

  // req.io.in(`group_${groupId}`).emit("receive-group-message", msg);
  res.json({ success: true, msg });
};

// Fetch group messages & unread
exports.getGroupHistory = async (req, res, next) => {
  const { groupId } = req.params;
  if (!await groupMemberModel.findOne({ group: groupId, member: req.user._id }))
    return res.status(403).json({ success: false });

  const messages = await groupMessageModel.find({ group: groupId })
    .sort({ createdAt: 1 })
    .populate("sender", "userName profileImage firstName lastName email lastSeen");
  
  const unreadCount = messages.filter(m => m.unreadBy.includes(req.user._id.toString())).length;
  const history = formatByDate(messages);

  await groupMessageModel.updateMany({
    group: groupId,
    unreadBy: req.user._id
  }, { $pull: { unreadBy: req.user._id } });

  res.json({ history, unreadCount });
};

exports.updateGroupinformation = async (req, res, next) => {
  try {
    const { name, description, groupId } = req.body;

    const group = await groupModel.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    if (!group.admin.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: "Only the admin can change the name" });
    }

    group.name = name;
    group.description = description;
    await group.save();

    res.json({ success: true, message: "Group name changed successfully", group });
  } catch (ex) {
    next(ex);
  }
};

// Add this function to groupController.js
exports.removeMember = async (req, res, next) => {
  try {
    const { groupId, memberId } = req.body;
    
    // Validate inputs
    if (!groupId || !memberId) {
      return res.status(400).json({ 
        success: false, 
        message: "Group ID and Member ID are required" 
      });
    }

    // Find the group
    const group = await groupModel.findById(groupId);
    if (!group) {
      return res.status(404).json({ 
        success: false, 
        message: "Group not found" 
      });
    }

    // Check if requester is admin
    if (!group.admin.equals(req.user._id)) {
      return res.status(403).json({ 
        success: false, 
        message: "Only admin can remove members" 
      });
    }

    // Prevent admin from removing themselves
    if (group.admin.equals(memberId)) {
      return res.status(403).json({ 
        success: false, 
        message: "Admin cannot remove themselves from the group" 
      });
    }

    // Check if member exists in the group
    const membership = await groupMemberModel.findOne({
      group: groupId,
      member: memberId
    });
    
    if (!membership) {
      return res.status(404).json({ 
        success: false, 
        message: "Member not found in this group" 
      });
    }

    // Remove the member
    await groupMemberModel.findByIdAndDelete(membership._id);

    // Remove member from unreadBy arrays in messages
    await groupMessageModel.updateMany(
      { group: groupId },
      { $pull: { unreadBy: memberId } }
    );

    res.json({ 
      success: true, 
      message: "Member removed successfully" 
    });
    
  } catch (err) {
    console.error("removeMember error:", err);
    next(err);
  }
};

exports.getGroups = async (req, res, next) => {
  try {
    const memberships = await groupMemberModel
    .find({ member: req.user._id })
    .populate({ path: "group", populate: { path: "admin", select: "userName profileImage firstName lastName email lastSeen" } }); // Optional: populate admin info too
  
  const groups = memberships
    .map(m => m.group)
    .filter(Boolean); 
    res.json({ success: true, groups });
  } catch (ex) {
    next(ex);
  }
};

exports.getGroupMembers = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    
if (!mongoose.Types.ObjectId.isValid(groupId)) {
  return res.status(400).json({ success: false, message: "Invalid group ID" });
}

const isMember = await groupMemberModel.findOne({ group: groupId, member: req.user._id });
if (!isMember) {
  return res.status(403).json({ success: false, message: "Not a group member" });
}

const members = await groupMemberModel
  .find({ group: groupId })
  .populate("member", "userName profileImage firstName lastName email lastSeen createdAt")
  .lean();

res.json({ success: true, members });
  } catch (ex) {
    next(ex);
  }
};

exports.getGroupMessages = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const isMember = await groupMemberModel.findOne({ group: groupId, member: req.user._id });
    if (!isMember) return res.status(403).json({ success: false, message: "Not a group member" });

    const messages = await groupMessageModel.find({ group: groupId })
      .sort({ createdAt: 1 })
      .populate("sender", "userName profileImage firstName lastName email lastSeen");

    res.json({ success: true, messages });
  } catch (ex) {
    next(ex);
  }
};


exports.markGroupMessageAsRead = async (req, res) => {
  const { groupId } = req.body;
  try {
    await groupMessageModel.updateMany(
      { group: groupId, unreadBy: req.user._id },
      { $pull: { unreadBy: req.user._id } }
    );
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("markGroupMessageAsRead error:", err);
    res.status(500).json({ error: err.message });
  }
};



exports.uploadFile = async (req, res, next) => {
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

const formatByDate = (messages) => {
  const groupedMessages = [];

  messages.forEach((msg, index) => {
    const currentMsgDate = moment(msg.createdAt);
    const prevMsgDate = index > 0 ? moment(messages[index - 1].createdAt) : null;

    let label;
    if (currentMsgDate.isSame(moment(), 'day')) {
      label = 'Today';
    } else if (currentMsgDate.isSame(moment().subtract(1, 'days'), 'day')) {
      label = 'Yesterday';
    } else if (currentMsgDate.isAfter(moment().subtract(7, 'days'))) {
      label = currentMsgDate.format('dddd'); // like "Friday"
    } else {
      label = currentMsgDate.format('D MMMM, YYYY'); // like "15 March, 2025"
    }

    // const time = currentMsgDate.format('h:mm A');

    // Push date separator if first message or date changed from previous
    const shouldInsertDateLabel =
      index === 0 || !currentMsgDate.isSame(prevMsgDate, 'day');

    if (shouldInsertDateLabel) {
      groupedMessages.push({
        _id: `label-${currentMsgDate.format()}`,
        type: 'label',
        label,
      });
    }

    groupedMessages.push(msg);
    // groupedMessages.push({
    //   _id: msg._id,
    //   type: 'message',
    //   sender: msg.sender,
    //   content: msg.content,
    //   time,
    //   isOwnMessage: msg.sender._id?.toString() === currentUserId.toString(),
    // });
  });

  return groupedMessages;
};

// (async () => {
//   try {
//       // await groupModel.deleteMany({});
//     const groups = await groupModel.find();
//     console.log("All groups:", groups);
//   } catch (error) {
//     console.error("Error fetching users:", error.message);
//   }
// })();

// (async () => {
//   try {
//       // await groupMessageModel.deleteMany({});
//     const groupMessages = await groupMessageModel.find();
//     console.log("All groups:", groupMessages);
//   } catch (error) {
//     console.error("Error fetching users:", error.message);
//   }
// })();

// (async () => {
//   try {
//       // await groupMemberModel.deleteMany({});
//     const groupMessages = await groupMemberModel.find();
//     console.log("All groups members:", groupMessages);
//   } catch (error) {
//     console.error("Error fetching users:", error.message);
//   }
// })();
