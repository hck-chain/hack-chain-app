const { updateStudentPhoto } = require('../usecases/students/updateStudentPhoto');

describe('updateStudentPhoto usecase - additional cases', () => {
  it('returns INVALID_PHOTO_URL for non-ipfs url', async () => {
    const studentModel = {
      findOne: jest.fn().mockResolvedValue({ update: jest.fn() })
    };

    const res = await updateStudentPhoto({ models: { Student: studentModel }, wallet: '0x0000000000000000000000000000000000000001', photoUrl: 'https://example.com/img.png' });
    expect(res.ok).toBe(false);
    expect(res.code).toBe('INVALID_PHOTO_URL');
  });

  it('allows clearing photo with null', async () => {
    const student = { photo_url: 'ipfs://QmOld', update: jest.fn(function (data) { this.photo_url = data.photo_url; return Promise.resolve(this); }) };
    const studentModel = { findOne: jest.fn().mockResolvedValue(student) };

    const res = await updateStudentPhoto({ models: { Student: studentModel }, wallet: '0x0000000000000000000000000000000000000001', photoUrl: null });
    expect(res.ok).toBe(true);
    expect(res.data.photo_url).toBeNull();
    expect(student.update).toHaveBeenCalledWith({ photo_url: null });
  });

  it('accepts valid ipfs uri and updates student', async () => {
    const student = { photo_url: null, update: jest.fn(function (data) { this.photo_url = data.photo_url; return Promise.resolve(this); }) };
    const studentModel = { findOne: jest.fn().mockResolvedValue(student) };

    const res = await updateStudentPhoto({ models: { Student: studentModel }, wallet: '0x0000000000000000000000000000000000000001', photoUrl: 'ipfs://QmNew' });
    expect(res.ok).toBe(true);
    expect(res.data.photo_url).toBe('ipfs://QmNew');
    expect(student.update).toHaveBeenCalledWith({ photo_url: 'ipfs://QmNew' });
  });
});
