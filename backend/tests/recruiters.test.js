/**
 * @jest-environment node
 */

const request = require('supertest');
const express = require('express');

// Mocks
jest.mock('../models', () => {
  const Recruiter = { findAll: jest.fn(), findOne: jest.fn() };
  const User = {};
  const Student = { findAll: jest.fn() };
  return { Recruiter, User, Student };
});

jest.mock('../middleware/auth', () => {
  let mockAuth = { wallet: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', role: 'recruiter' };
  return {
    authenticate: (req, _res, next) => { req.auth = mockAuth; next(); },
    __setMockAuth: (a) => { mockAuth = a; }
  };
});

const { Recruiter, Student } = require('../models');
const auth = require('../middleware/auth');
const recruitersRouter = require('../routes/recruiters');

let app;

beforeEach(() => {
  app = express();
  app.use(express.json());
  app.use('/api/recruiters', recruitersRouter);
  jest.clearAllMocks();
  auth.__setMockAuth({ wallet: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', role: 'recruiter' });
});

describe('recruiters routes', () => {
  test('GET /api/recruiters returns mapped list', async () => {
    Recruiter.findAll.mockResolvedValueOnce([
      {
        id: 1,
        wallet_address: '0x1',
        company_name: 'Acme Corp',
        User: { id: 10, wallet_address: '0x1', name: 'Jane', lastname: 'Doe' },
        created_at: '2020-01-01'
      }
    ]);

    const res = await request(app).get('/api/recruiters').expect(200);
    expect(Array.isArray(res.body.recruiters)).toBe(true);
    const r = res.body.recruiters[0];
    expect(r.company_name).toBe('Acme Corp');
    expect(r.user).toBeDefined();
  });

  test('GET /api/recruiters/:wallet_address returns 404 when not found', async () => {
    Recruiter.findOne.mockResolvedValueOnce(null);

    const res = await request(app).get('/api/recruiters/0x1234567890123456789012345678901234567890').expect(404);
    expect(res.body.error).toBe('Recruiter not found');
  });

  test('GET /api/recruiters/:wallet_address returns recruiter when found', async () => {
    Recruiter.findOne.mockResolvedValueOnce({
      id: 2,
      wallet_address: '0x2222222222222222222222222222222222222222',
      company_name: 'Hiring Co',
      User: { id: 20, wallet_address: '0x2222', name: 'Bob' },
      created_at: '2021-01-01'
    });

    const res = await request(app).get('/api/recruiters/0x2222222222222222222222222222222222222222').expect(200);
    expect(res.body.recruiter).toBeDefined();
    expect(res.body.recruiter.company_name).toBe('Hiring Co');
  });

  test("PUT /api/recruiters/:wallet_address returns 403 when modifying another recruiter's profile", async () => {
    // set auth wallet different
    auth.__setMockAuth({ wallet: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef', role: 'recruiter' });

    const res = await request(app).put('/api/recruiters/0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa').send({ company_name: 'X' }).expect(403);
    expect(res.body.error).toBe("Cannot modify another recruiter's profile");
  });

  test('PUT /api/recruiters/:wallet_address returns 404 when recruiter not found', async () => {
    // auth matches
    auth.__setMockAuth({ wallet: '0xabcabcabcabcabcabcabcabcabcabcabcabcabca', role: 'recruiter' });
    Recruiter.findOne.mockResolvedValueOnce(null);

    const res = await request(app).put('/api/recruiters/0xabcabcabcabcabcabcabcabcabcabcabcabcabca').send({ company_name: 'NewCo' }).expect(404);
    expect(res.body.error).toBe('Recruiter not found');
  });

  test('PUT /api/recruiters/:wallet_address updates when auth matches', async () => {
    const mockUpdate = jest.fn();
    const found = { update: mockUpdate };
    Recruiter.findOne.mockResolvedValueOnce(found);

    auth.__setMockAuth({ wallet: '0xabcabcabcabcabcabcabcabcabcabcabcabcabca', role: 'recruiter' });

    const res = await request(app).put('/api/recruiters/0xabcabcabcabcabcabcabcabcabcabcabcabcabca').send({ company_name: 'NewCo' }).expect(200);
    expect(res.body.message).toBe('Recruiter updated successfully');
    expect(mockUpdate).toHaveBeenCalledWith({ company_name: 'NewCo' });
  });

  test('POST /api/recruiters/dashboard returns 403 for non-recruiter role', async () => {
    auth.__setMockAuth({ wallet: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', role: 'student' });

    const res = await request(app).post('/api/recruiters/dashboard').send().expect(403);
    expect(res.body.error).toBe('Only recruiters can access the dashboard');
  });

  test('POST /api/recruiters/dashboard returns students list for recruiter', async () => {
    auth.__setMockAuth({ wallet: '0xfeedfeedfeedfeedfeedfeedfeedfeedfeedfeed', role: 'recruiter' });
    Recruiter.findOne.mockResolvedValueOnce({ id: 1, wallet_address: '0xfeedfeedfeedfeedfeedfeedfeedfeedfeedfeed' });
    Student.findAll.mockResolvedValueOnce([
      {
        field_of_study: 'CS',
        wallet_address: '0xstudent1',
        created_at: '2022-01-01',
        User: { name: 'Stu', lastname: 'Dent' }
      }
    ]);

    const res = await request(app).post('/api/recruiters/dashboard').send().expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].field_of_study).toBe('CS');
  });
});
