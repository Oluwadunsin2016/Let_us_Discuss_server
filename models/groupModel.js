const mongoose = require('mongoose');

const groupSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true, // Prevent duplicate names (optional)
  },
  description: {
    type: String,
    required: false,
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true,
  },
  profileImage: {
    type: String,
    default: 'https://res.cloudinary.com/dz8elpgwn/image/upload/v1677083376/Profile_Pictures/groupImage_m49682.png',
  },
}, {
  timestamps: true,
});

const groupChatSchema = mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Groups',
    required: true,
    unique: true, // One chat per group
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GroupMessages',
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true
});


const groupMemberSchema = mongoose.Schema({
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Groups',
      required: true,
    },
  }, { timestamps: true });
  
  
  const groupMessageSchema = mongoose.Schema({
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Groups',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    unreadBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
    }],
  }, {
    timestamps: true,
  });
  
  

const groupModel=mongoose.model('Groups',groupSchema);
const groupMemberModel=mongoose.model('GroupMembers',groupMemberSchema);
const groupMessageModel=mongoose.model('GroupMessages',groupMessageSchema);
const GroupChatModel = mongoose.model("GroupChats", groupChatSchema);
module.exports={groupModel,groupMemberModel,groupMessageModel, GroupChatModel}