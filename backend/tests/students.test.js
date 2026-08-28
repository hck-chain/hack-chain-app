/**
 * @jest-environment node
 */

const request = require('supertest');
const express = require('express');

// Mocks
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

jest.mock('../services/studentService', () => ({
  validateDeletionMessage: jest.fn(),
  deleteStudentAccount: jest.fn()
}));

const { Student, Certificate } = require('../models');
const auth = require('../middleware/auth');
const studentService = require('../services/studentService');
const studentsRouter = require('../routes/students');

let app;

beforeEach(() => {
  app = express();
  app.use(express.json());
  app.use('/api/students', studentsRouter);
  jest.clearAllMocks();
  auth.__setMockAuth({ wallet: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', role: 'student' });
});

describe('students routes', () => {
  test('GET /api/students returns mapped list', async () => {
    Student.findAll.mockResolvedValueOnce([
      {
        id: 1,
        wallet_address: '0x1',
        field_of_study: null,
        User: { id: 10, wallet_address: '0x1', name: 'John' },
        certificates: [{ id: 100 }, { id: 101 }],
        created_at: '2020-01-01'
      }
    ]);

    const res = await request(app).get('/api/students').expect(200);
    expect(Array.isArray(res.body.students)).toBe(true);
    const s = res.body.students[0];
    expect(s.field_of_study).toBe('N/A');
    expect(s.total_certificates).toBe(2);
    expect(s.user).toBeDefined();
  });

  test('GET /api/students/:wallet_address returns 404 when not found', async () => {
    Student.findOne.mockResolvedValueOnce(null);

    const res = await request(app).get('/api/students/0x1234567890123456789012345678901234567890').expect(404);
    expect(res.body.error).toBe('Student not found');
  });

  test('GET /api/students/:wallet_address returns student with certificate count', async () => {
    Student.findOne.mockResolvedValueOnce({
      id: 2,
      wallet_address: '0x2222222222222222222222222222222222222222',
      field_of_study: 'Math',
      User: { id: 20, wallet_address: '0x2222' },
      created_at: '2021-01-01'
    });
    Certificate.count.mockResolvedValueOnce(5);

    const res = await request(app).get('/api/students/0x2222222222222222222222222222222222222222').expect(200);
    expect(res.body.student).toBeDefined();
    expect(res.body.student.total_certificates).toBe(5);
  });

  test('GET /api/students/:wallet_address/educators returns 400 for invalid wallet', async () => {
    const res = await request(app).get('/api/students/not-a-wallet/educators').expect(400);
    expect(res.body.error).toBe('Invalid wallet address');
  });

  test('GET /api/students/:wallet_address/educators returns 403 when accessing another student', async () => {
    // set auth wallet to something else
    auth.__setMockAuth({ wallet: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef', role: 'student' });
    const valid = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';

    const res = await request(app).get(`/api/students/${valid}/educators`).expect(403);
    expect(res.body.error).toBe("Forbidden: cannot access another student's educators");
  });

  test('GET /api/students/:wallet_address/educators returns grouped educators', async () => {
    const wallet = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    // ensure auth matches
    auth.__setMockAuth({ wallet, role: 'student' });

    Certificate.findAll.mockResolvedValueOnce([
      {
        issuer_wallet_address: '0xiss1',
        Issuer: {
          wallet_address: '0xiss1',
          organization_name: 'Org 1',
          photo_url: null,
          bio: 'bio1',
          knowledge_areas: ['A'],
          certificates_issued: 10,
          User: { name: 'Alice', lastname: 'A', created_at: '2019-01-01' }
        }
      },
      {
        issuer_wallet_address: '0xiss1',
        Issuer: {
          wallet_address: '0xiss1',
          organization_name: 'Org 1',
          photo_url: null,
          bio: 'bio1',
          knowledge_areas: ['A'],
          certificates_issued: 10,
          User: { name: 'Alice', lastname: 'A', created_at: '2019-01-01' }
        }
      },
      {
        issuer_wallet_address: '0xiss2',
        Issuer: {
          wallet_address: '0xiss2',
          organization_name: 'Org 2',
          photo_url: null,
          bio: 'bio2',
          knowledge_areas: ['B'],
          certificates_issued: 5,
          User: { name: 'Bob', lastname: 'B', created_at: '2020-01-01' }
        }
      }
    ]);

    const res = await request(app).get(`/api/students/${wallet}/educators`).expect(200);
    expect(Array.isArray(res.body.educators)).toBe(true);
    // two different issuers -> two educators
    expect(res.body.educators.length).toBe(2);
    const ed1 = res.body.educators.find(e => e.wallet_address === '0xiss1');
    const ed2 = res.body.educators.find(e => e.wallet_address === '0xiss2');
    expect(ed1.certs_to_me).toBe(2);
    expect(ed2.certs_to_me).toBe(1);
  });

  test('PUT /api/students/:wallet_address returns 403 when modifying another student', async () => {
    const wallet = '0xabc0000000000000000000000000000000000000';
    // auth wallet different
    auth.__setMockAuth({ wallet: '0xother0000000000000000000000000000000000', role: 'student' });

    const res = await request(app).put(`/api/students/${wallet}`).send({ field_of_study: 'CS' }).expect(403);
    expect(res.body.error).toBe("Cannot modify another student's profile");
  });

  test('DELETE /api/students/me returns 400 when signature/message missing', async () => {
    auth.__setMockAuth({ wallet: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', role: 'student' });

    const res = await request(app).delete('/api/students/me').send({}).expect(400);
    expect(res.body.error).toBe('signature and message are required');
  });

  test('DELETE /api/students/me returns 400 when validation fails', async () => {
    auth.__setMockAuth({ wallet: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', role: 'student' });
    studentService.validateDeletionMessage.mockReturnValueOnce({ ok: false, error: 'bad message' });

    const res = await request(app).delete('/api/students/me').send({ signature: 'sig', message: 'msg' }).expect(400);
    expect(res.body.error).toBe('bad message');
  });

  test('DELETE /api/students/me deletes account when validation passes', async () => {
    auth.__setMockAuth({ wallet: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', role: 'student' });
    studentService.validateDeletionMessage.mockReturnValueOnce({ ok: true });
    studentService.deleteStudentAccount.mockResolvedValueOnce();

    const res = await request(app).delete('/api/students/me').send({ signature: 'sig', message: 'msg' }).expect(200);
    expect(res.body.message).toBe('Account deleted successfully');
    expect(studentService.deleteStudentAccount).toHaveBeenCalledWith('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd');
  });
});
