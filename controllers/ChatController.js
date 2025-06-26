// chatController.js
const { default: mongoose } = require("mongoose");
const { Chat, Message } = require("../models/messageModel");
const moment = require('moment');
const { onlineUsers } = require("./socket");
const { groupModel, groupMemberModel, groupMessageModel, GroupChatModel } = require("../models/groupModel");

// Send message & update chat
// exports.sendMessage = async (req, res, next) => {
//   const { from, to, message } = req.body;
//   const chat = await Chat.findOneAndUpdate(
//     { participants: { $all: [from, to] } },
//     { $setOnInsert: { participants: [from, to] } },
//     { upsert: true, new: true }
//   );

//   const msg = await Message.create({
//     chat: chat._id,
//     sender: from,
//     content: message,
//     unreadBy: [to],
//   });

//   chat.lastMessage = msg._id;
//   chat.lastUpdated = new Date();
//   await chat.save();

//   // Emit via socket & return
//   req.io.to(toSocket).emit("receive-message", msg);
//   res.json({ success: true, msg });
// };

exports.sendMessage = async (req, res) => {
  try {
    const { from, to, message } = req.body;

    // Ensure participants are ObjectIds
    const fromId = mongoose.Types.ObjectId(from);
    const toId = mongoose.Types.ObjectId(to);

    // Find or create chat
    let chat = await Chat.findOne({ participants: { $all: [fromId, toId] } });

    if (!chat) {
      chat = await Chat.create({ participants: [fromId, toId]});
    }

    // Save message
    const msg = await Message.create({
      chat: chat._id,
      sender: fromId,
      content: message,
      unreadBy: [toId],
    });

    // Update chat with lastMessage and lastUpdated
    chat.lastMessage = msg._id;
    chat.lastUpdated = new Date();
    await chat.save();

    // Emit to the recipient if online
    // const toSocket = onlineUsers[to]; // get recipient's socket ID
    // if (toSocket) {
    //   req.io.to(toSocket).emit("receive-message", msg);
    // }

    res.status(200).json({ success: true, msg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to send message" });
  }
};


// Fetch chat history with day-sectioning
exports.getChatHistory = async (req, res) => {
  const { otherId } = req.params;
  const userId = req.user._id; // ✅ fix

  try {
    const chat = await Chat.findOne({ participants: { $all: [userId, otherId] } });
    if (!chat) return res.json({ history: [], unreadCount: 0 });

    const messages = await Message.find({ chat: chat._id })
      .sort({ createdAt: 1 })
      .populate("sender", "userName profileImage");

    const unreadCount = messages.filter((m) => m.unreadBy.includes(userId)).length;
    const history = formatByDate(messages); // ✅ assumes this groups by date like "Today", "Yesterday", etc.

    await Message.updateMany(
      { chat: chat._id, unreadBy: userId },
      { $pull: { unreadBy: userId } }
    );

    res.json({ history, unreadCount });
  } catch (err) {
    console.error("getChatHistory error:", err);
    res.status(500).json({ error: err.message });
  }
};


exports.getUserChats = async (req, res) => {
  try {
    const userId = mongoose.Types.ObjectId(req.user._id);

    /** --------------------- PRIVATE CHATS ---------------------- */
    const privateChats = await Chat.find({ participants: userId })
      .sort({ lastUpdated: -1 })
      .populate({
        path: "participants",
        select: "userName profileImage",
      })
      .populate({
        path: "lastMessage",
        select: "content unreadBy sender createdAt",
        populate: {
          path: "sender",
          select: "userName profileImage",
        },
      });

    const formattedPrivateChats = await Promise.all(
      privateChats.map(async (chat) => {
        const otherUser = chat.participants.find(
          (p) => p._id.toString() !== userId.toString()
        );

        const unreadCount = await Message.countDocuments({
          chat: chat._id,
          unreadBy: userId,
        });

        return {
          _id: chat._id,
          type: "private",
          otherUser,
          lastMessage: chat.lastMessage,
          lastUpdated: chat.lastMessage?.createdAt || chat.lastUpdated,
          unreadCount,
        };
      })
    );

    /** --------------------- GROUP CHATS ---------------------- */
    const groupMemberships = await groupMemberModel.find({ member: userId });
    const groupIds = groupMemberships.map(m => m.group);
    
    const groupChats = await GroupChatModel.find({ group: { $in: groupIds } })
      .sort({ lastUpdated: -1 })
      .populate({
        path: "group",
        populate: { path: "admin", select: "userName profileImage" }
      })
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "userName profileImage" }
      });

      const formattedGroupChats = await Promise.all(
        groupChats.map(async (chat) => {
          const unreadCount = await groupMessageModel.countDocuments({
            group: chat.group._id,
            unreadBy: userId
          });
      
          return {
            _id: chat._id,
            type: "group",
            name: chat.group.name,
            profileImage: chat.group.profileImage,
            lastMessage: chat.lastMessage,
            lastUpdated: chat.lastUpdated,
            unreadCount,
          };
        })
      );

    /** --------------------- COMBINED ---------------------- */
    const allChats = [...formattedPrivateChats, ...formattedGroupChats]
    .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));

  res.json({ success: true, chats: allChats });
  } catch (error) {
    console.error("getUserChats error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch chats" });
  }
};


exports.markMessageAsRead = async (req, res) => {
  const { from } = req.body;
  const to = mongoose.Types.ObjectId(req.user._id)
  try {
    // Find the chat between the two participants
    const chat = await Chat.findOne({
      participants: { $all: [from, to] }
    });

    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    // Remove the 'to' user from unreadBy in all messages in that chat
    await Message.updateMany(
      { chat: chat._id, unreadBy: to },
      { $pull: { unreadBy: to } }
    );

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("markMessageAsRead error:", err);
    res.status(500).json({ success: false, error: err.message });
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
//       // await Message.deleteMany({});
//     const messages = await Message.find();
//     console.log("All messages:", messages);
//   } catch (error) {
//     console.error("Error fetching users:", error.message);
//   }
// })();
