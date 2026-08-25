/**
 * @jest-environment node
 */

const request = require('supertest');
const express = require('express');

// Mocks similar to existing students.test.js
jest.mock('../models', () => {
  const Student = { findAll: jest.fn(), findOne: jest.fn() };
  const User = {};
  const Certificate = { count: jest.fn(), findAll: jest.fn() };
  const Issuer = {};
  return { Student, User, Certificate, Issuer };
});

jest.mock('../middleware/auth', () => {
  let mockAuth = { wallet: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', role: 'student' };
  return {
    authenticate: (req, res, next) => { req.auth = mockAuth; next(); },
    __setMockAuth: (a) => { mockAuth = a; }
  };
});

const { Student } = require('../models');
const auth = require('../middleware/auth');
const studentsRouter = require('../routes/students');

let app;

beforeEach(() => {
  app = express();
  app.use(express.json());
  app.use('/api/students', studentsRouter);
  jest.clearAllMocks();
  auth.__setMockAuth({ wallet: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', role: 'student' });
});

describe('students integration - new endpoints', () => {
  test('POST /api/students/:wallet/share increments share_count', async () => {
    const wallet = '0x0000000000000000000000000000000000001111';
    const student = {
      id: 77,
      share_count: 4,
      increment: jest.fn(function (field) { this.share_count += 1; return Promise.resolve(); }),
      reload: jest.fn().mockResolvedValue(),
    };

    Student.findOne.mockResolvedValueOnce(student);

    const res = await request(app).post(`/api/students/${wallet}/share`).expect(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.share_count).toBe('number');
    expect(res.body.share_count).toBe(5);
    expect(student.increment).toHaveBeenCalledWith('share_count');
  });

  test('PATCH /api/students/me/photo updates photo for authenticated student', async () => {
    const student = { photo_url: null, update: jest.fn(function (data) { this.photo_url = data.photo_url; return Promise.resolve(this); }) };
    Student.findOne.mockResolvedValueOnce(student);

    // Ensure auth is the same wallet as we return from findOne (route uses req.auth.wallet)
    auth.__setMockAuth({ wallet: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', role: 'student' });

    // Mock findOne to accept wallet lookup by lowercase; route passes req.auth.wallet
    const res = await request(app).patch('/api/students/me/photo').send({ photo_url: 'ipfs://QmNewPhoto' }).expect(200);
    expect(res.body.photo_url).toBe('ipfs://QmNewPhoto');
    expect(student.update).toHaveBeenCalledWith({ photo_url: 'ipfs://QmNewPhoto' });
  });

  test('PATCH /api/students/me/photo returns 400 for invalid url', async () => {
    const res = await request(app).patch('/api/students/me/photo').send({ photo_url: 'https://example.com/x.png' }).expect(400);
    expect(res.body.error).toBeDefined();
  });

  test('GET /api/students/:wallet_address returns public privacy-first view', async () => {
    const wallet = '0x0000000000000000000000000000000000002222';
    // Mock Student.findOne inside getPublicStudentProfile
    const StudentMock = require('../models').Student;
    StudentMock.findOne.mockResolvedValueOnce({
      id: 5,
      wallet_address: wallet,
      field_of_study: 'Design',
      photo_url: 'ipfs://QmStu',
      created_at: '2020-01-01',
      User: { name: 'N', lastname: 'L', created_at: '2020-01-01' }
    });
    const Certificate = require('../models').Certificate;
    Certificate.count.mockResolvedValueOnce(2);
    Certificate.findAll.mockResolvedValueOnce([]);

    const res = await request(app).get(`/api/students/${wallet}`).expect(200);
    expect(res.body.student).toBeDefined();
    expect(res.body.student.field_of_study).toBe('Design');
    expect(res.body.student.photo_url).toBe('ipfs://QmStu');
    // Ensure sensitive fields are not present
    expect(res.body.student.wallet_address).toBeUndefined();
    expect(res.body.student.created_at).toBeUndefined();
  });

});
