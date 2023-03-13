const express=require('express');
const { sendMessage, getAllMessages, currentChatMessages } = require('../controllers/MessagesController');
const router=express.Router()

router.post('/sendMessage', sendMessage)
router.get('/getAllMessages', getAllMessages)
router.post('/currentChatMessages', currentChatMessages)

module.exports=router