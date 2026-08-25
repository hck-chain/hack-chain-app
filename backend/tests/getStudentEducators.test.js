const { getStudentEducators } = require('../usecases/students/getStudentEducators');

describe('getStudentEducators usecase', () => {
  it('groups issuers and counts certificates correctly', async () => {
    const models = {
      User: {},
      Issuer: {},
      Certificate: {
        findAll: jest.fn().mockResolvedValue([
          { issuer_wallet_address: '0xAAA', Issuer: { wallet_address: '0xAAA', organization_name: 'Org A', photo_url: null, bio: null, knowledge_areas: [], certificates_issued: 5, User: { name: 'Alice', lastname: 'A', created_at: '2020-01-01' } } },
          { issuer_wallet_address: '0xBBB', Issuer: { wallet_address: '0xBBB', organization_name: 'Org B', photo_url: 'ipfs://Qm', bio: 'bio', knowledge_areas: ['X'], certificates_issued: 2, User: { name: 'Bob', lastname: 'B', created_at: '2021-02-02' } } },
          { issuer_wallet_address: '0xAAA', Issuer: { wallet_address: '0xAAA', organization_name: 'Org A', photo_url: null, bio: null, knowledge_areas: [], certificates_issued: 5, User: { name: 'Alice', lastname: 'A', created_at: '2020-01-01' } } },
        ])
      }
    };

    const res = await getStudentEducators({ models, wallet: '0x0000000000000000000000000000000000000001' });
    expect(res.ok).toBe(true);
    expect(res.data).toBeDefined();
    const { educators } = res.data;
    // Should have two educators grouped
    expect(educators.length).toBe(2);
    const a = educators.find(e => e.wallet_address === '0xAAA');
    const b = educators.find(e => e.wallet_address === '0xBBB');
    expect(a.certs_to_me).toBe(2);
    expect(b.certs_to_me).toBe(1);
  });

  it('returns 400 for invalid wallet', async () => {
    const res = await getStudentEducators({ models: { Certificate: { findAll: jest.fn() } }, wallet: 'not-a-wallet' });
    expect(res.ok).toBe(false);
    expect(res.httpStatus).toBe(400);
  });
});
