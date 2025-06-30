const { groupMemberModel, GroupChatModel, groupMessageModel } = require("../models/groupModel");
const { Chat, Message } = require("../models/messageModel");
const moment = require('moment');
const { logOut } = require("./userController");
const { default: mongoose } = require("mongoose");


const onlineUsers = new Map();
const setupSocket = (io) => {

  io.on("connection", (socket) => {
    // 👤 User Login
    socket.on("currentlyOnline", (userId) => {
      socket.userId = userId;
      onlineUsers.set(userId, socket.id);
      const users = Array.from(onlineUsers.keys());
      io.emit("onlineUsers", users);
      // console.log(`👤 User ${userId} logged in`);
    });

    // 📩 One-on-One Messaging
    socket.on("send-message", async(data) => {
      const recipientSocketId = onlineUsers.get(data.to);
      const senderId = data.from;
      try {
        const chat = await Chat.findOne({ participants: { $all: [senderId, data.to] } });
        if (!chat) return res.json({ history: [], unreadCount: 0 });
    
        const messages = await Message.find({ chat: chat._id })
          .sort({ createdAt: 1 })
          .populate("sender", "userName profileImage");
        const history = formatByDate(messages);

        const {allChats} = await getUserChats(senderId)
    
        // res.json({ history });
        if (recipientSocketId) {
          socket.to(recipientSocketId).emit("received-message", { history, chats:allChats });
        } else {
          // 🚨 Notify sender: recipient is offline
          socket.emit("user-offline", {
            message: `User ${data.to} is offline.`,
          });
        }
      } catch (err) {
        console.error("getChatHistory error:", err);
      }


      // 🔔 Emit unread notification if recipient not currently in chat with sender
      socket.broadcast.emit("notify-unread-message", {
        from: senderId,
        to: data.to,
        isGroup: false,
      });
    });

    socket.on("typing", ({ from, to }) => {
      const toSocket = onlineUsers.get(to);
      console.log(`Received typing from ${from} to ${to} | toSocket: ${toSocket}`);
        if (toSocket) {
          io.to(toSocket).emit("user-typing", { from });
        }
      });
      
      socket.on("stop-typing", ({ from, to }) => {
        const toSocket = onlineUsers.get(to);
        if (toSocket) {
          io.to(toSocket).emit("user-stopped-typing", { from });
        }
      });      

    // 👥 Group Messaging

    socket.on("send-group-message", async (data) => {
      const { groupId, from } = data;

      console.log('groupMessage:', data)
    
      try {
        const {allChats} = await getUserChats(from)

          const messages = await groupMessageModel.find({ group: groupId })
            .sort({ createdAt: 1 })
            .populate("sender", "userName profileImage firstName lastName email lastSeen");
          
          const history = formatByDate(messages);


        const members = await groupMemberModel.find({ group: groupId });
    

        members.forEach(({ member }) => {
          if (String(member) !== String(from)) {
            const socketId = onlineUsers.get(String(member));
            if (socketId) {
              socket.to(socketId).emit("received-group-message", { history, chats:allChats });
            }
          }
        });
    
      } catch (err) {
        console.error("send-group-message error:", err);
      }
    });

    // 👀 User enters a specific chat room (used to mute notifications if viewing that chat)
    socket.on("join-chat", ({ userId, chatWith }) => {
      socket.join(`chat-${userId}-${chatWith}`);
      console.log(`👀 User ${userId} joined chat with ${chatWith}`);
    });

    socket.on('userLoggedOut',async(userId)=>{
      console.log("LoggedOutUser:", userId)
      onlineUsers.delete(userId);
      await logOut(userId);
      io.emit("userDisconnected", {
        loggedOutUserId: userId,
        lastSeen: new Date(),
      });
    })

    // ❌ Disconnection
    socket.on("disconnect", async () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        const users = Array.from(onlineUsers.keys());
        await logOut(socket.userId);
        io.emit("onlineUsers", users);
        io.emit("userDisconnected", {
          loggedOutUserId: socket.userId,
          lastSeen: new Date(),
        });
    }
})
        // console.log(`🚪 User ${socket.userId} disconnected`);
    })
}


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
  });

  return groupedMessages;
};

const getUserChats = async (from) => {
  try {
    const userId = mongoose.Types.ObjectId(from);

    /** --------------------- PRIVATE CHATS ---------------------- */
    const privateChats = await Chat.find({ participants: userId })
      .sort({ lastUpdated: -1 })
      .populate({
        path: "participants",
        select: "userName profileImage",
      })
      .populate({
        path: "lastMessage",
        select: "content sender createdAt",
        populate: {
          path: "sender",
          select: "userName profileImage",
        },
      });

    const formattedPrivateChats = await Promise.all(
      privateChats.map(async (chat) => {
        const otherUser = chat.participants.find(
          (p) => p._id.toString() == userId.toString()
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

  // res.json({ success: true, chats: allChats });
  return { allChats }
  } catch (error) {
    console.error("getUserChats error:", error);
  }
};


module.exports = {
    setupSocket,
    onlineUsers, // ✅ export it
  };
