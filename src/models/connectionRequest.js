const mongoose = require('mongoose');

const connectionRequestsSchema=new mongoose.Schema({
    fromUserId:{
        type:mongoose.Schema.ObjectId,
        ref:"User",
        required:true
    
    },
    toUserId:{
        type:mongoose.Schema.ObjectId,
        ref:"User",
        required:true
    },
    status:{
        type:String,
        required:true,
        enum:{
            values:["ignored","accepted","rejected","interested"],
            message:`{VALUE} is not valid status type `
        }
    }

},{timestamps:true})

connectionRequestsSchema.index({fromUserId:1,toUserId:1})

connectionRequestsSchema.pre("save",function (next) {
    const connectionRequest=this;

    if(connectionRequest.fromUserId.equals(connectionRequest.toUserId)){
        return next(new Error("Cannot send connection request to yourself!"));
    }
    
    next();
})

const ConnectionRequestModel=new mongoose.model(
    "ConnectionRequest",connectionRequestsSchema
)



module.exports=ConnectionRequestModel