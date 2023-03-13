const express = require("express");
const mongoose = require("mongoose");
const app = express();
require("dotenv").config();
const cors = require("cors");
const bodyParser=require("body-parser")
const userRoute = require("./routes/userRoutes");
const messageRoute = require("./routes/MessagesRoute");
const groupRoute = require("./routes/groupRoutes");
const socket = require("socket.io");

const PORT = process.env.PORT;
const URI = process.env.URI;

app.use(cors());
app.use(express.json({limit:"50mb"}));
app.use(bodyParser.urlencoded({extended:true, limit:"50mb"}));
app.use("/api/auth", userRoute);
app.use("/api/messages", messageRoute);
app.use("/api/group", groupRoute);

mongoose
  .connect(URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Mongoose connects successfully");
  })
  .catch((err) => {
    console.log(err.message);
  });

const server = app.listen(PORT, () => {
  console.log(`app is listening at port ${PORT}`);
});

const io = socket(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

global.onlineUsers = new Map();
const currentUserId=""
io.on("connection", (socket) => {
  global.chatSocket = socket;
  socket.on("add-user", (userId) => {
    // console.log(socket.id,userId);
    onlineUsers.set( socket.id,userId);
    currentUserId=userId
    const users=Array.from(onlineUsers).map(([id,userId])=>userId)
    // console.log(users);
    socket.emit("onlineUsers", users);
    // console.log(`This ${currentUserId} has logged in`);
    // console.log(`OnlineUsers: ${users}`);
  })

socket.on("disconnect", () => {
onlineUsers.delete(socket.id);
const users=Array.from(onlineUsers).map(([id,userId])=>userId)

    socket.emit("onlineUsers", users);
     socket.emit("userDisconnected",{loggedOutUserId:currentUserId, lastSeen:new Date()});
    console.log(`This ${currentUserId} has logged out`);
    // console.log(`OnlineUsers: ${users}`);

})

// socket.on("disconnectMe", (userId) => {
//     socket.emit("userDisconnected",{loggedOutUserId:userId, lastSeen:new Date()});
//     console.log(`This ${userId} has logged out`);
// })



  socket.on("send-message", (data) => {
    const userSocketSent= onlineUsers.get(data.to);
    if (userSocketSent) {
      socket.to(userSocketSent).emit("received-message",data)
    }
  });
  socket.on("send-group-message", (data) => {
    const groupSocketSent= onlineUsers.get(data.group);
    if (groupSocketSent) {
      socket.to(groupSocketSent).emit("received-group-message",data)
    }
  });
});
