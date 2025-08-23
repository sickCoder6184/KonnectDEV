// Import Socket.IO server factory to create a WebSocket server on top of an HTTP/S server
const socket = require("socket.io");

// Import Node's crypto module for hashing (used to generate a secret room ID)
const crypto = require("crypto");

// Import Mongoose (used here to cast string IDs into ObjectId for MongoDB queries)
const mongoose = require("mongoose");

// Import the Chat Mongoose model (stores chat documents with participants and messages)
const { Chat } = require("../models/chat");

// Import ConnectionRequest model (reserved for potential friendship/permission checks)
const ConnectionRequest = require("../models/connectionRequest");

/**
 * Derive a deterministic, secret room ID from two user IDs.
 * - Sorts the two IDs to ensure the same pair always yields the same room.
 * - Joins them with a delimiter ("$") to avoid accidental collisions.
 * - Hashes with SHA-256 to keep the actual IDs hidden from clients/logs and to create a fixed-length ID.
 *
 * @param {string} loggedInUserID - Current user's MongoDB ObjectId as string
 * @param {string} targetUserId - Target user's MongoDB ObjectId as string
 * @returns {string} A SHA-256 hex digest representing the room ID
 */
const getSecretRoomId = (loggedInUserID, targetUserId) => {
  return crypto
    .createHash("sha256")
    .update([loggedInUserID, targetUserId].sort().join("$"))
    .digest("hex");
};

/**
 * Initialize Socket.IO on the provided HTTP/S server instance.
 * - Configures CORS to allow the frontend origin.
 * - Sets up per-connection event handlers (join room, send message, disconnect).
 *
 * @param {import('http').Server} server - Node HTTP/S server
 */
const initializeSocket = (server) => {
  // Create Socket.IO server bound to the HTTP/S server with CORS settings
  const io = socket(server, {
    cors: {
      origin: "http://localhost:5173", // Allow frontend dev origin
    },
  });

  // Fired for each new client connection
  io.on("connection", (socket) => {
    /**
     * Client requests to join a chat room shared by two users.
     * Payload fields expected from client:
     * - firstName: Used only for logging/UX
     * - loggedInUserId: Current user's _id (string)
     * - targetUserId: Other participant's _id (string)
     *
     * We compute the secret room ID and join the socket to that room.
     */
    socket.on("joinChat", ({ firstName, loggedInUserId, targetUserId }) => {
      // Basic validation
      if (!loggedInUserId || !targetUserId) return;
      // Compute stable, secret room identifier from the two user IDs
      const roomId = getSecretRoomId(loggedInUserId, targetUserId);

      // Log for debugging (roomId is hashed and does not reveal actual user IDs)
      console.log(firstName + " joined Room : " + roomId);

      // Join the socket to this room so it can receive room-scoped broadcasts
      socket.join(roomId);
    });

    /**
     * Client sends a chat message.
     * Payload fields expected from client:
     * - firstName, lastName: For display purposes in recipient UI
     * - loggedInUserId: Sender's _id (string)
     * - targetUserId: Recipient's _id (string)
     * - text: Message body (string)
     *
     * Steps performed:
     * 1) Compute roomId to know which room to emit to.
     * 2) Cast string IDs to ObjectId for DB operations.
     * 3) Find existing chat (by participants) or create a new one.
     * 4) Append message to chat.messages with correct senderId.
     * 5) Save to DB.
     * 6) Emit "messageReceived" to all clients in the same room.
     */
    socket.on(
      "sendMessage",
      async ({ firstName, lastName, loggedInUserId, targetUserId, text }) => {
        try {
          // Validate inputs
          if (
            !loggedInUserId ||
            !targetUserId ||
            typeof text !== "string" ||
            !text.trim()
          ) {
            socket.emit("messageError", { message: "Invalid message payload" });
            return;
          }

          if (!mongoose.Types.ObjectId.isValid(loggedInUserId) ||
              !mongoose.Types.ObjectId.isValid(targetUserId)) {
            socket.emit("messageError", { message: "Invalid user id(s)" });
            return;
          }

          // Prevent sending messages to self if undesired
          if (loggedInUserId === targetUserId) {
            socket.emit("messageError", { message: "Cannot send message to yourself" });
            return;
          }

          // Compute the same roomId used during join
          const roomId = getSecretRoomId(loggedInUserId, targetUserId);
          console.log(firstName + " " + text);

          // Cast incoming string IDs to ObjectId for Mongoose queries and document writes
          const loggedInUserObjectId = new mongoose.Types.ObjectId(loggedInUserId);
          const targetUserObjectId = new mongoose.Types.ObjectId(targetUserId);

          // TODO completed: ensure users are connected/allowed to message each other
          const connection = await ConnectionRequest.findOne({
            $or: [
              { fromUserId: loggedInUserObjectId, toUserId: targetUserObjectId },
              { fromUserId: targetUserObjectId, toUserId: loggedInUserObjectId },
            ],
            status: "accepted",
          }).lean();

          if (!connection) {
            socket.emit("messageError", {
              message:
                "You are not connected with this user. Send a connection request first.",
            });
            return;
          }

          // Find an existing chat containing both participants (order-agnostic via $all)
          let chat = await Chat.findOne({
            participants: { $all: [loggedInUserObjectId, targetUserObjectId] },
          });

          // If chat does not exist, create a new one with both participants
          if (!chat) {
            chat = new Chat({
              participants: [loggedInUserObjectId, targetUserObjectId], // Use ObjectIds for schema compliance
              messages: [],
            });
          }

          // Append the new message with senderId and text
          chat.messages.push({
            senderId: loggedInUserObjectId, // Store as ObjectId, matches schema
            text: text.trim(),
            createdAt: new Date(),
          });

          // Persist changes to MongoDB
          await chat.save();

          // Notify all sockets in the room about the new message
          // Client listens on "messageReceived"
          io.to(roomId).emit("messageReceived", { firstName, lastName, text: text.trim() });
        } catch (err) {
          // Any validation or DB errors will be logged here
          console.log("Error in sendMessage:", err);
          socket.emit("messageError", { message: "Failed to send message" });
        }
      }
    );

    /**
     * Fired when the client disconnects.
     * Place for cleanup, presence tracking, or emitting user-offline events.
     */
    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });
};

// Export the initializer to be used in server bootstrapping
module.exports = initializeSocket;
