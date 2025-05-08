const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const jwt = require('jsonwebtoken');

describe('QR Code Management', () => {
  let user, token;

  beforeEach(async () => {
    // Create test user
    user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });

    token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
  });

  describe('GET /api/qr/generate', () => {
    it('should generate a QR code for authenticated user', async () => {
      const res = await request(app)
        .get('/api/qr/generate')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('qrCode');
      expect(res.body).toHaveProperty('userId', user._id.toString());
    });

    it('should not generate QR code without authentication', async () => {
      const res = await request(app)
        .get('/api/qr/generate');

      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/qr/scan', () => {
    it('should process a valid QR code scan', async () => {
      const qrData = {
        userId: user._id.toString(),
        timestamp: new Date().toISOString()
      };

      const res = await request(app)
        .post('/api/qr/scan')
        .set('Authorization', `Bearer ${token}`)
        .send(qrData);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('_id', user._id.toString());
    });

    it('should not process scan without authentication', async () => {
      const qrData = {
        userId: user._id.toString(),
        timestamp: new Date().toISOString()
      };

      const res = await request(app)
        .post('/api/qr/scan')
        .send(qrData);

      expect(res.statusCode).toBe(401);
    });

    it('should not process scan with invalid user ID', async () => {
      const qrData = {
        userId: '507f1f77bcf86cd799439011', // Random MongoDB ID
        timestamp: new Date().toISOString()
      };

      const res = await request(app)
        .post('/api/qr/scan')
        .set('Authorization', `Bearer ${token}`)
        .send(qrData);

      expect(res.statusCode).toBe(404);
    });

    it('should not process scan with expired timestamp', async () => {
      const qrData = {
        userId: user._id.toString(),
        timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      };

      const res = await request(app)
        .post('/api/qr/scan')
        .set('Authorization', `Bearer ${token}`)
        .send(qrData);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'QR code has expired');
    });
  });

  describe('GET /api/qr/validate', () => {
    it('should validate a QR code', async () => {
      const qrData = {
        userId: user._id.toString(),
        timestamp: new Date().toISOString()
      };

      const res = await request(app)
        .get('/api/qr/validate')
        .set('Authorization', `Bearer ${token}`)
        .query(qrData);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('valid', true);
    });

    it('should not validate QR code without authentication', async () => {
      const qrData = {
        userId: user._id.toString(),
        timestamp: new Date().toISOString()
      };

      const res = await request(app)
        .get('/api/qr/validate')
        .query(qrData);

      expect(res.statusCode).toBe(401);
    });

    it('should not validate QR code with invalid user ID', async () => {
      const qrData = {
        userId: '507f1f77bcf86cd799439011', // Random MongoDB ID
        timestamp: new Date().toISOString()
      };

      const res = await request(app)
        .get('/api/qr/validate')
        .set('Authorization', `Bearer ${token}`)
        .query(qrData);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('valid', false);
    });

    it('should not validate expired QR code', async () => {
      const qrData = {
        userId: user._id.toString(),
        timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      };

      const res = await request(app)
        .get('/api/qr/validate')
        .set('Authorization', `Bearer ${token}`)
        .query(qrData);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('valid', false);
    });
  });
}); 