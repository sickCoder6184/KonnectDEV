const express = require("express");
const requestRouter = express.Router();
const mongoose = require("mongoose");

const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");
const {
  formatValidationErrors,
  validateInterestStatus,
} = require("../utils/validation");

const { userAuth } = require("../middleware/auth");

//{ Interested or to Ignored} ...sending
requestRouter.post(
  "/request/send/:status/:toUserId",
  userAuth,
  async (req, res) => {
    const loggedInUser = req.user;

    try {
      // Extract parameters
      const fromUserId = loggedInUser._id;
      const toUserId = req.params.toUserId;
      const status = req.params.status;

      // Validate the interest status parameter
      try {
        validateInterestStatus(status);
      } catch (validationError) {
        return res.status(400).json({
          error: "Invalid interest status. Please provide a valid status.",
        });
      }

      // Check if the target user exists
      const toUser = await User.findById(toUserId);
      if (!toUser) {
        return res.status(404).json({
          message: "The requested user does not exist.",
        });
      }

      // Prevent users from sending requests to themselves
      // Note: This validation is also implemented at the schema level

      if (fromUserId.toString() === toUserId.toString()) {
        return res.status(400).json({
          error: "You cannot send a connection request to yourself.",
        });
      }

      // Check for existing connection requests between these users (bidirectional)
      const existingConnectionRequest = await ConnectionRequest.findOne({
        $or: [
          { fromUserId: fromUserId, toUserId: toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      });

      if (existingConnectionRequest) {
        return res.status(400).json({
          error: `A connection request already exists between you and ${toUser.firstName} .`,
        });
      }

      // Create new connection request
      const connectionRequest = new ConnectionRequest({
        fromUserId,
        toUserId,
        status: status.toLowerCase(), // Normalize status to lowercase for consistency
      });

      // Save the connection request to database
      const data = await connectionRequest.save();

      // Send success response
      res.json({
        message: `You have sent a ${status} request to ${toUser.firstName}.`,
        data,
      });
    } catch (err) {
      return res.status(500).json({
        error: "Failed to create connection request. Please try again later.",
        details: formatValidationErrors(err),
      });
    }
  }
);

//{ Accepted or Rejected}  ....recieving
//TODO: uncomment the update function
requestRouter.post(
  "/request/review/:status/:requestedConnectionId",
  userAuth,
  async (req, res) => {
    try {
      const loggedInUser = req.user;
      const { status, requestedConnectionId } = req.params;

      // 1. Validate status (case-insensitive)
      const allowedStatus = ["accepted", "rejected"];
      const normalizedStatus = status.toLowerCase();

      if (!allowedStatus.includes(normalizedStatus)) {
        return res.status(400).json({
          error: "Invalid status",
          message: "Status must be one of the allowed values.",
          allowedValues: allowedStatus,
        });
      }

      // 2. Validate ObjectId format before hitting DB
      if (!mongoose.Types.ObjectId.isValid(requestedConnectionId)) {
        return res.status(400).json({
          error: "Invalid connection ID format",
        });
      }

      // 3. Find the pending connection request
      const connectionRequest = await ConnectionRequest.findOne({
        _id: requestedConnectionId,
        toUserId: loggedInUser._id,
        status: "interested",
      });

      if (!connectionRequest) {
        return res.status(404).json({
          error: "Request not found",
          message:
            "No pending connection request found for this ID, or it has already been reviewed.",
        });
      }

      // 4. Find sender (fromUser)
      const fromUser = await User.findById(connectionRequest.fromUserId);
      if (!fromUser) {
        return res.status(404).json({
          error: "Sender not found",
          message:
            "The user who sent this connection request no longer exists.",
        });
      }

      // 5. Update the connection request
       connectionRequest.status = normalizedStatus;
      const data = await connectionRequest.save();

      // 6. Respond with success
      res.json({
        message: `${loggedInUser.firstName} You have ${normalizedStatus}, ${fromUser.firstName}'s connection request.`,
        data,
      });
    } catch (err) {

      return res.status(500).json({
        error: "Failed to review connection request. Please try again later.",
        details: err.message || "Unknown error",
      });
    }
  }
);

module.exports = requestRouter;
