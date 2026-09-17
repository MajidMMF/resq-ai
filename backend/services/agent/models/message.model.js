
import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    name: String,
    content: String,
  },
  { _id: false }
);

const artifactSchema = new mongoose.Schema(
  {
    id: Number,
    type: String,
    title: String,
    files: [fileSchema],
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AIConversation",
      required: true,
      index: true,
    },
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 10000,
    },
    images: {
      type: [String],
      default: [],
    },
    artifacts: {
      type: [artifactSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Fast queries
messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ incidentId: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;