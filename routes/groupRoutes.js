const express = require('express');
const router = express.Router();
const {
  createGroup,
  sendGroupMessage,
  getGroupHistory,
  uploadFile,
  updateGroupinformation,
  AddGroupMember,
  getGroups,
  getGroupMembers,
  getGroupMessages,
  markGroupMessageAsRead,
  addMembers,
  removeMember
} = require('../controllers/groupController');
const authMiddleware = require('../middlewares/auth');

// New structured routes
router.post('/create', authMiddleware, createGroup); // admin = req.user._id
router.get('/get-groups', authMiddleware, getGroups);
router.post('/add-members', authMiddleware, addMembers);     // only admin can add
router.delete('/remove-member', authMiddleware, removeMember);
router.post('/send-message', authMiddleware, sendGroupMessage);
router.get('/get-members/:groupId', authMiddleware, getGroupMembers);
router.get('/group-history/:groupId', authMiddleware, getGroupHistory);
router.post('/upload', authMiddleware, uploadFile);
router.put('/update', authMiddleware, updateGroupinformation);

// Legacy routes (can be deprecated gradually)
router.post('/get_group_message', authMiddleware, getGroupMessages);
router.post('/markGroupAsRead',authMiddleware, markGroupMessageAsRead);

module.exports = router;
