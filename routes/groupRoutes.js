const express=require('express');
const { createGroup, getGroups, AddGroupMember, getGroupMembers, sendMessageToGroup, getGroupMessages, uploadFile, changeGroupName } = require('../controllers/groupController');
const router=express.Router();

router.post('/create-group',createGroup)
router.post('/get-groups',getGroups)
router.post('/addMember',AddGroupMember)
router.post('/getMembers',getGroupMembers)
router.post('/send_group_message',sendMessageToGroup)
router.post('/get_group_message',getGroupMessages)
router.post('/Upload',uploadFile)
router.post('/update',changeGroupName)

module.exports=router