const mongoose = require("mongoose");

const chatSchema = mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true,
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Messages',
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});


const messageSchema = mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chats',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
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


const Chat = mongoose.model("Chats", chatSchema);
const Message = mongoose.model("Messages", messageSchema);

module.exports = { Chat, Message };
