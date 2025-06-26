const express=require('express')
const { register, logIn, getUsers, uploadFile, editUser, getUser } = require('../controllers/userController')
const authMiddleware = require('../middlewares/auth')
const router=express.Router()

router.post('/register',register)
router.post('/login',logIn)
router.get('/user',authMiddleware, getUser)
router.get('/allUsers',authMiddleware,getUsers)
router.post('/upload',authMiddleware,uploadFile)
router.put('/editUser',authMiddleware,editUser)

module.exports=router