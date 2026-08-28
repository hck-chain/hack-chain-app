
// Skeleton tests for registerStudentProfileShare usecase
// - Needs model stubs to be fully operational

describe('registerStudentProfileShare usecase (skeleton)', () => {
  it('should validate walletAddress and return error for invalid address', async () => {
    const { registerStudentProfileShare } = require('../../usecases/students/registerStudentProfileShare');
    const res = await registerStudentProfileShare({ models: {}, walletAddress: 'not-a-wallet' });
    expect(res.ok).toBe(false);
    expect(res.httpStatus).toBe(400);
  });

  it('should require models to be provided', async () => {
    const { registerStudentProfileShare } = require('../../usecases/students/registerStudentProfileShare');
    let threw = false;
    try {
      await registerStudentProfileShare({});
    } catch (e) {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});