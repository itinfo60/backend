const express = require('express');
const router = express.Router();
const Connection = require('../models/Connection');
const User = require('../models/User');

// Create a new connection
router.post('/', async (req, res) => {
  try {
    const { user1Id, user2Id } = req.body;
    
    // Create connection in both directions
    const connection = new Connection({
      user1: user1Id,
      user2: user2Id,
      status: 'accepted'
    });

    await connection.save();

    // Update both users' connections
    await User.findByIdAndUpdate(user1Id, {
      $push: { connections: connection._id }
    });
    await User.findByIdAndUpdate(user2Id, {
      $push: { connections: connection._id }
    });

    res.status(201).json(connection);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all connections for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const connections = await Connection.find({
      $or: [{ user1: req.params.userId }, { user2: req.params.userId }]
    })
    .populate('user1', 'name email')
    .populate('user2', 'name email');

    res.json(connections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a connection
router.delete('/:id', async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id);
    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    // Remove connection from both users
    await User.findByIdAndUpdate(connection.user1, {
      $pull: { connections: connection._id }
    });
    await User.findByIdAndUpdate(connection.user2, {
      $pull: { connections: connection._id }
    });

    await connection.remove();
    res.json({ message: 'Connection deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 