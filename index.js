const express = require("express");
const mongoose = require("mongoose");
const app = express();
require("dotenv").config();
const cors = require("cors");
const bodyParser=require("body-parser")
const userRoute = require("./routes/userRoutes");
const messageRoute = require("./routes/ChatRoute");
const groupRoute = require("./routes/groupRoutes");
const socket = require("socket.io");
const { setupSocket, onlineUsers } = require("./controllers/socket");
// const helmet = require("helmet");

const PORT = process.env.PORT;
const URI = process.env.URI;

// app.use(helmet());
app.use(cors());
app.use(express.json({limit:"50mb"}));
app.use(bodyParser.urlencoded({extended:true, limit:"50mb"}));
app.get('/', (req, res)=>{
res.json({message:'The page is working fine'})
})
app.use("/api/auth", userRoute);
app.use("/api/message", messageRoute);
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
    // origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
    origin: "*",
    credentials: true,
  },
});
setupSocket(io);

app.use((req, res, next) => {
  req.io = io;
  req.onlineUsers = onlineUsers;
  next();
});

