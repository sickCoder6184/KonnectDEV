const express = require("express");
const { userAuth } = require("../middleware/auth");
const { Chat } = require("../models/chat");

const chatRouter = express.Router();

//I
chatRouter.get("/toChat/:targetUserId", userAuth, async (req, res) => {
  const { targetUserId } = req.params;
  const loggedInUser = req.user._id;

  try {

    // what is this ??
    let chat = await Chat.findOne({
      participants: { $all: [loggedInUser, targetUserId] },
    }).populate({
      path: "messages.senderId",
      select: "firstName lastName",
    });
    //Not Found So add new One
    if (!chat) {
      chat = new Chat({
        participants: [loggedInUser, targetUserId],
        messages: [],
      });
      await chat.save();
    }
    res.json(chat);
  } catch (err) {
    console.error(err);
  }
});

module.exports = chatRouter;