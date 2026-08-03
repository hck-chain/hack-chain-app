
// Skeleton tests for updateStudentPhoto usecase
// - Mirrors pattern from existing issuer tests
// - Should be expanded with proper model stubs/mocks

describe('updateStudentPhoto usecase (skeleton)', () => {
  it('should validate inputs and return error when required params missing', async () => {
    const { updateStudentPhoto } = require('../../usecases/students/updateStudentPhoto');
    let threw = false;
    try {
      await updateStudentPhoto({});
    } catch (e) {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  it('should return PHOTO_URL_REQUIRED when photoUrl is undefined', async () => {
    const { updateStudentPhoto } = require('../../usecases/students/updateStudentPhoto');
    const res = await updateStudentPhoto({ models: {}, wallet: '0x123' });
    expect(res.ok).toBe(false);
    expect(res.code).toBe('PHOTO_URL_REQUIRED');
  });
});