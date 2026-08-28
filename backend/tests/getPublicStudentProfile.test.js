jest.mock('../usecases/students/getStudentEducators');
const { getStudentEducators } = require('../usecases/students/getStudentEducators');
const { getPublicStudentProfile } = require('../usecases/students/getPublicStudentProfile');

describe('getPublicStudentProfile usecase', () => {
  it('returns privacy-first public profile and educators', async () => {
    // Mock student model
    const Student = {
      findOne: jest.fn().mockResolvedValue({
        id: 1,
        wallet_address: '0xstudent',
        field_of_study: 'Computer Science',
        photo_url: 'ipfs://QmStudent',
        created_at: '2022-01-01',
        User: { name: 'Name', lastname: 'Last', created_at: '2022-01-01' }
      })
    };
    const Certificate = { count: jest.fn().mockResolvedValue(3) };
    // Mock getStudentEducators to return a known educators list
    getStudentEducators.mockResolvedValue({ ok: true, data: { educators: [{ wallet_address: '0xAAA', certs_to_me: 2 }] } });

    const models = { Student, User: {}, Certificate, Issuer: {} };
    const res = await getPublicStudentProfile({ models, walletAddress: '0x0000000000000000000000000000000000000001' });
    expect(res.ok).toBe(true);
    expect(res.data).toBeDefined();
    expect(res.data.student.field_of_study).toBe('Computer Science');
    expect(res.data.student.photo_url).toBe('ipfs://QmStudent');
    expect(res.data.student.total_certificates).toBe(3);
    expect(Array.isArray(res.data.educators)).toBe(true);
  });

  it('returns 404 when student not found', async () => {
    const Student = { findOne: jest.fn().mockResolvedValue(null) };
    const Certificate = { count: jest.fn() };
    getStudentEducators.mockResolvedValue({ ok: true, data: { educators: [] } });
    const res = await getPublicStudentProfile({ models: { Student, Certificate, User: {}, Issuer: {} }, walletAddress: '0x0000000000000000000000000000000000000002' });
    expect(res.ok).toBe(false);
    expect(res.httpStatus).toBe(404);
  });
});
