const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Connection = require('../models/Connection');

// Send a message
router.post('/', async (req, res) => {
  try {
    const { connectionId, senderId, content } = req.body;

    // Verify the connection exists
    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    const message = new Message({
      connection: connectionId,
      sender: senderId,
      content
    });

    await message.save();
    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get messages for a connection
router.get('/connection/:connectionId', async (req, res) => {
  try {
    const messages = await Message.find({ connection: req.params.connectionId })
      .populate('sender', 'name email')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark messages as read
router.put('/read/:connectionId', async (req, res) => {
  try {
    const { userId } = req.body;
    await Message.updateMany(
      {
        connection: req.params.connectionId,
        sender: { $ne: userId },
        read: false
      },
      { read: true }
    );
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 