const express = require("express");
const { userAuth } = require("../middleware/auth");
const userRouter = express.Router();

const Users = require("../models/user");
const ConnectionRequest = require("../models/connectionRequest");
const { buildFeedQuery } = require('../utils/feedQueryBuilder');
const { buildFiltersResponse, handleFeedError } = require('../utils/responseHelpers');

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
    
    // Parse pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    // Build search query
    const searchQuery = await buildFeedQuery(loggedInUser._id, req.query);
    
    // Execute queries in parallel
    const [totalUsers, discoverUsers] = await Promise.all([
      Users.countDocuments(searchQuery),
      Users.find(searchQuery)
        .select(USER_SAFE_VALUE)
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    // Build response
    const totalPages = Math.ceil(totalUsers / limit);
    res.json({
      success: true,
      message: "Feed retrieved successfully",
      data: discoverUsers,
      count: discoverUsers.length,
      pagination: {
        page,
        limit,
        total: totalUsers,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: buildFiltersResponse(req.query)
    });

  } catch (err) {
    console.error("Feed fetch error:", err);
    handleFeedError(err, res);
  }
});



module.exports = userRouter;
