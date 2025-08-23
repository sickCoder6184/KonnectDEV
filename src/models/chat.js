// Import the Mongoose library to define schemas and create models
const mongoose = require("mongoose");

/**
 * Define a reusable subdocument schema for individual chat messages.
 * This will be embedded inside the main Chat schema as an array.
 */
const messageSchema = new mongoose.Schema(
  {
    // The sender's user ID (ObjectId referencing the User collection)
    // Using `ref: "User"` enables Mongoose population to fetch user details later.
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // enables populate() for user info
      required: true, // message must have a sender
    },

    // The actual message text content
    text: {
      type: String,
      required: true, // prevent saving empty messages
      // You can also add trim and minlength validations if needed:
      // trim: true,
      // minlength: 1,
    },
  },
  {
    // Add createdAt and updatedAt fields automatically for each message
    timestamps: true,
    // Note: timestamps here apply to each message subdocument in the array
  }
);

/**
 * Define the main Chat schema.
 * A chat document represents a conversation between two (or more) participants,
 * and contains an array of embedded message subdocuments.
 */
const chatSchema = new mongoose.Schema({
  // Array of participant user IDs. Typically 2 for direct chats,
  // but can support group chats as well.
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // enables populate() to load participant profiles
      required: true, // each participant entry must be valid
    },
  ],

  // An ordered list of messages exchanged in this chat.
  // Uses the subdocument schema defined above.
  messages: [messageSchema],
  // Optional: You can add chat-level timestamps if you need createdAt/updatedAt
  // for the chat document itself:
  // },
  // { timestamps: true }
});

/**
 * Create the Chat model from the schema.
 * This will map to a MongoDB collection named "chats" (pluralized by Mongoose),
 * unless a custom collection name is provided.
 */
const Chat = mongoose.model("Chat", chatSchema);

// Export the Chat model so it can be imported and used elsewhere in the app
module.exports = { Chat };
