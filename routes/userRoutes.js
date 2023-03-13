const express=require('express')
const { register, logIn, getUsers, uploadFile, editUser } = require('../controllers/userController')
const router=express.Router()

router.post('/register',register)
router.post('/login',logIn)
router.get('/allUsers/:id',getUsers)
router.post('/upload',uploadFile)
router.post('/editUser',editUser)

module.exports=router