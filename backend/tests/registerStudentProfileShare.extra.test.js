const { registerStudentProfileShare } = require('../usecases/students/registerStudentProfileShare');

describe('registerStudentProfileShare usecase - additional cases', () => {
  it('returns INVALID_WALLET_ADDRESS for bad wallet', async () => {
    const res = await registerStudentProfileShare({ models: { Student: {} }, walletAddress: 'not-a-wallet' });
    expect(res.ok).toBe(false);
    expect(res.httpStatus).toBe(400);
  });

  it('returns STUDENT_NOT_FOUND when student missing', async () => {
    const studentModel = { findOne: jest.fn().mockResolvedValue(null) };
    const res = await registerStudentProfileShare({ models: { Student: studentModel }, walletAddress: '0x0000000000000000000000000000000000000002' });
    expect(res.ok).toBe(false);
    expect(res.httpStatus).toBe(404);
  });

  it('increments share_count when student exists', async () => {
    const student = { share_count: 2, increment: jest.fn(function(field) { this.share_count += 1; return Promise.resolve(); }), reload: jest.fn().mockResolvedValue(), };
    const studentModel = { findOne: jest.fn().mockResolvedValue(student) };

    const res = await registerStudentProfileShare({ models: { Student: studentModel }, walletAddress: '0x0000000000000000000000000000000000000003' });
    expect(res.ok).toBe(true);
    expect(res.data.share_count).toBe(3);
    expect(student.increment).toHaveBeenCalledWith('share_count');
  });
});
