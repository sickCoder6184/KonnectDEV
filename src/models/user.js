    const mongoose = require('mongoose');

    //created Schema
    const userSchema=new mongoose.Schema({
        firstName:{
            type:String,
        },
        lastName:{
            type:String,
        },
        emailId:{
            type:String,
        },
        password:{
            type:String,
        },
        age:{
            type:Number,
        },
        gender:{
            type:String,
        },
        
    });

    //created model
    const User=mongoose.model("User",userSchema); 

    module.exports=User;