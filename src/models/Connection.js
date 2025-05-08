const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
  user1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Ensure a connection can only exist once between two users
connectionSchema.index({ user1: 1, user2: 1 }, { unique: true });

module.exports = mongoose.model('Connection', connectionSchema); 