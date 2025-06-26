const express=require('express');
const { sendMessage, getAllMessages, currentChatMessages, getChatHistory, markMessageAsRead, getUserChats } = require('../controllers/ChatController');
const authMiddleware = require('../middlewares/auth');
const router=express.Router()

router.post('/sendMessage',authMiddleware, sendMessage)
router.get('/get-history/:otherId',authMiddleware, getChatHistory)
router.get('/user-chats',authMiddleware, getUserChats)
router.post('/markAsRead',authMiddleware, markMessageAsRead);
// router.post('/currentChatMessages', currentChatMessages)

module.exports=router