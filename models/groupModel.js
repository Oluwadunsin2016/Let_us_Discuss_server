const mongoose=require('mongoose')

const groupSchema=mongoose.Schema({
name:{
type:String,
required:true,
},
admin:{
type:mongoose.Schema.Types.ObjectId,
ref:'admin',
required:true,
},
profileImage:{
type:String,
default:'https://res.cloudinary.com/dz8elpgwn/image/upload/v1677083376/Profile_Pictures/groupImage_m49682.png'
}
},
{
timestamps:true
}
)

const groupMemberSchema=mongoose.Schema({
member:{
type:mongoose.Schema.Types.ObjectId,
required:true,
},
group:{
type:mongoose.Schema.Types.ObjectId,
required:true,
}
})

const groupMessageSchema=mongoose.Schema({
sender:{
type:mongoose.Schema.Types.ObjectId,
required:true,
},
message:{
type:String,
required:true,
},
group:{
type:mongoose.Schema.Types.ObjectId,
required:true,
}
},
{
timestamps:true
})


const groupModel=mongoose.model('Groups',groupSchema);
const groupMemberModel=mongoose.model('GroupMembers',groupMemberSchema);
const groupMessageModel=mongoose.model('groupMessages',groupMessageSchema);
module.exports={groupModel,groupMemberModel,groupMessageModel}