const mongoose  =require("mongoose");

const connectDB=async () => {
    await mongoose.connect(
        "mongodb+srv://preyanshudhapola6184:6184@learningnode.dedpzmv.mongodb.net/KonnectDEV"
    )
}

module.exports={
    connectDB:connectDB
}