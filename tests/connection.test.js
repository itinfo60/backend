const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Connection = require('../src/models/Connection');
const jwt = require('jsonwebtoken');

describe('Connection Management', () => {
  let user1, user2, token1, token2;

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
  });

  describe('POST /api/connections', () => {
    it('should create a connection between two users', async () => {
      const res = await request(app)
        .post('/api/connections')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          user1Id: user1._id,
          user2Id: user2._id
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('user1', user1._id.toString());
      expect(res.body).toHaveProperty('user2', user2._id.toString());
      expect(res.body).toHaveProperty('status', 'accepted');
    });

    it('should not create duplicate connections', async () => {
      await Connection.create({
        user1: user1._id,
        user2: user2._id,
        status: 'accepted'
      });

      const res = await request(app)
        .post('/api/connections')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          user1Id: user1._id,
          user2Id: user2._id
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/connections/user/:userId', () => {
    beforeEach(async () => {
      await Connection.create({
        user1: user1._id,
        user2: user2._id,
        status: 'accepted'
      });
    });

    it('should get all connections for a user', async () => {
      const res = await request(app)
        .get(`/api/connections/user/${user1._id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0]).toHaveProperty('user1');
      expect(res.body[0]).toHaveProperty('user2');
    });

    it('should not get connections without authentication', async () => {
      const res = await request(app)
        .get(`/api/connections/user/${user1._id}`);

      expect(res.statusCode).toBe(401);
    });
  });

  describe('DELETE /api/connections/:id', () => {
    let connection;

    beforeEach(async () => {
      connection = await Connection.create({
        user1: user1._id,
        user2: user2._id,
        status: 'accepted'
      });
    });

    it('should delete a connection', async () => {
      const res = await request(app)
        .delete(`/api/connections/${connection._id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.statusCode).toBe(200);
      
      const deletedConnection = await Connection.findById(connection._id);
      expect(deletedConnection).toBeNull();
    });

    it('should not delete connection without authentication', async () => {
      const res = await request(app)
        .delete(`/api/connections/${connection._id}`);

      expect(res.statusCode).toBe(401);
    });
  });
}); 