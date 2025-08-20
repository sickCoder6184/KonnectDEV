const express = require("express");
const { userAuth } = require("../middleware/auth");
const userRouter = express.Router();

const Users = require("../models/user");
const ConnectionRequest = require("../models/connectionRequest");

const USER_SAFE_VALUE = "firstName lastName age gender photo bio skills";

//  Get all pending requests
userRouter.get("/user/requests/pending", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    if (!loggedInUser) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "You must be logged in to view pending requests.",
      });
    }

    const connectionRequests = await ConnectionRequest.find({
      toUserId: loggedInUser._id,
      status: "interested",
    }).populate("fromUserId", USER_SAFE_VALUE);

    if (!connectionRequests.length) {
      return res.status(200).json({
        message: "No pending requests found.",
        data: [],
      });
    }

    // normalize to always show "the other person"
    const data = connectionRequests.map((row) => ({
      id: row._id,
      fromUserId: row.fromUserId,
    }));

    res.json({
      message: "Pending Request fetched successfully.",
      count: data.length,
      data: data,
    });
  } catch (err) {
    console.error("Error fetching pending requests:", err);
    res.status(500).json({
      error: "Failed to fetch pending requests.",
      details: err.message || "Unknown error",
    });
  }
});

// Get my COnnectiion
userRouter.get("/user/requests/my-connection", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    if (!loggedInUser) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "You must be logged in to view connections.",
      });
    }

    const connectionRequests = await ConnectionRequest.find({
      $or: [
        { fromUserId: loggedInUser._id, status: "accepted" },
        { toUserId: loggedInUser._id, status: "accepted" },
      ],
    })
      .populate("fromUserId", USER_SAFE_VALUE)
      .populate("toUserId", USER_SAFE_VALUE);

    if (!connectionRequests.length) {
      return res.status(200).json({
        message: "No connections found.",
        data: [],
      });
    }

    // normalize to always show "the other person"
    const data = connectionRequests.map((row) => {
      // preyanshu id (abc) === toUserId._id (abc) = (give) => fromUserId(def)
      // preyanshu id (abc) !== fromUserId(def) = (give) => toUserId._id(abc)
      return loggedInUser._id.toString() === row.toUserId._id.toString()
        ? row.fromUserId
        : row.toUserId;
    });

    res.json({
      message: "Connections fetched successfully.",
      count: data.length,
      data,
    });
  } catch (err) {
    console.error("Error fetching connections:", err);
    res.status(500).json({
      error: "Failed to fetch connections.",
      details: err.message || "Unknown error",
    });
  }
});

//feed
userRouter.get("/user/feed", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const page = parseInt(req.query.page) || 1;

    //tries to Exceed limit do this
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 50 ? 50 : limit;

    const skip = (page - 1) * limit;

    // Find all connection requests involving the logged-in user
    // This includes both sent and received requests
    const connectionRequests = await ConnectionRequest.find({
      $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
    });

    // Create a Set to store user IDs that should be hidden from feed
    // Using Set for O(1) lookup performance
    const hideUserFromFeed = new Set();

    // Add all users who have connection requests with logged-in user to the hide list
    connectionRequests.forEach((request) => {
      hideUserFromFeed.add(request.fromUserId.toString());
      hideUserFromFeed.add(request.toUserId.toString());
    });

    // Find users to show in feed by excluding:
    // 1. Users with existing connection requests
    // 2. The logged-in user themselves
    const discoverUsers = await Users.find({
      $and: [
        // Exclude users with connection requests
        { _id: { $nin: Array.from(hideUserFromFeed) } },
        { _id: { $ne: loggedInUser._id } }, // Exclude self
      ],
    })
      .select(USER_SAFE_VALUE)
      .skip(skip)
      .limit(limit);

      

    // Send successful response with user list
    res.status(200).json({
      success: true,
      message: "Feed users retrieved successfully",
      data: discoverUsers,
      count: discoverUsers.length,
    });
  } catch (err) {
    console.error("Error fetching connections:", err);
    res.status(500).json({
      error: "Failed to fetch connections.",
      details: err.message || "Unknown error",
    });
  }
});
module.exports = userRouter;
