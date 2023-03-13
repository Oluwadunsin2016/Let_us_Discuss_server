const { default: mongoose } = require("mongoose");
const messageModel = require("../models/messageModel");

const sendMessage=async(req,res,next)=>{
try {
    const {from, to, message}=req.body;
    const data=await messageModel.create({message,users:[from,to],sender:from})
    if (data) {
       return res.json({message:"message sent"})
    }else{
       return res.json({message:"message sending failed"})
    }
} catch (ex) {
    next(ex)
}
}
const currentChatMessages=async(req,res,next)=>{
try {
    const {from, to}=req.body;
   const messages=messageModel.find({users:{$all:[from,to]}}).sort({updatedAt:1})
   const projectedMessages=(await messages).map(msg=>{
  //  console.log(msg);
   return {
   fromSelf:msg.sender.toString()===from,
   message:msg.message,
   createdAt:msg.createdAt
   }
   })
   return res.json(projectedMessages)
} catch (ex) {
    next
}
}

const getAllMessages=async(req,res,next)=>{
try {
  const messages=await messageModel.find();
  // console.log(messages);
  res.json({messages, message:"It gets all messages"})
} catch (ex) {
  next(ex);
}
}

module.exports={sendMessage,getAllMessages,currentChatMessages}