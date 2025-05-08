const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Connection = require('../src/models/Connection');
const Message = require('../src/models/Message');
const jwt = require('jsonwebtoken');

describe('Message Management', () => {
  let user1, user2, token1, token2, connection;

  beforeEach(async () => {
    // Create test users
    user1 = await User.create({
      name: 'User 1',
      email: 'user1@example.com',
      password: 'password123'
    });

    user2 = await User.create({
      name: 'User 2',
      email: 'user2@example.com',
      password: 'password123'
    });

    token1 = jwt.sign({ userId: user1._id }, process.env.JWT_SECRET);
    token2 = jwt.sign({ userId: user2._id }, process.env.JWT_SECRET);

    // Create a connection between users
    connection = await Connection.create({
      user1: user1._id,
      user2: user2._id,
      status: 'accepted'
    });
  });

  describe('POST /api/messages', () => {
    it('should create a new message', async () => {
      const messageData = {
        connectionId: connection._id,
        content: 'Hello, how are you?',
        sender: user1._id
      };

      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${token1}`)
        .send(messageData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('content', messageData.content);
      expect(res.body).toHaveProperty('sender', user1._id.toString());
      expect(res.body).toHaveProperty('connection', connection._id.toString());
    });

    it('should not create message without authentication', async () => {
      const messageData = {
        connectionId: connection._id,
        content: 'Hello, how are you?',
        sender: user1._id
      };

      const res = await request(app)
        .post('/api/messages')
        .send(messageData);

      expect(res.statusCode).toBe(401);
    });

    it('should not create message for non-existent connection', async () => {
      const messageData = {
        connectionId: '507f1f77bcf86cd799439011', // Random MongoDB ID
        content: 'Hello, how are you?',
        sender: user1._id
      };

      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${token1}`)
        .send(messageData);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/messages/connection/:connectionId', () => {
    beforeEach(async () => {
      // Create some test messages
      await Message.create([
        {
          connection: connection._id,
          content: 'Hello from user 1',
          sender: user1._id
        },
        {
          connection: connection._id,
          content: 'Hi from user 2',
          sender: user2._id
        }
      ]);
    });

    it('should get all messages for a connection', async () => {
      const res = await request(app)
        .get(`/api/messages/connection/${connection._id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      expect(res.body[0]).toHaveProperty('content');
      expect(res.body[0]).toHaveProperty('sender');
      expect(res.body[0]).toHaveProperty('connection');
    });

    it('should not get messages without authentication', async () => {
      const res = await request(app)
        .get(`/api/messages/connection/${connection._id}`);

      expect(res.statusCode).toBe(401);
    });

    it('should return empty array for non-existent connection', async () => {
      const res = await request(app)
        .get('/api/messages/connection/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });
  });

  describe('DELETE /api/messages/:id', () => {
    let message;

    beforeEach(async () => {
      message = await Message.create({
        connection: connection._id,
        content: 'Test message',
        sender: user1._id
      });
    });

    it('should delete a message', async () => {
      const res = await request(app)
        .delete(`/api/messages/${message._id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.statusCode).toBe(200);
      
      const deletedMessage = await Message.findById(message._id);
      expect(deletedMessage).toBeNull();
    });

    it('should not delete message without authentication', async () => {
      const res = await request(app)
        .delete(`/api/messages/${message._id}`);

      expect(res.statusCode).toBe(401);
    });

    it('should not delete message created by another user', async () => {
      const res = await request(app)
        .delete(`/api/messages/${message._id}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.statusCode).toBe(403);
    });
  });
}); 