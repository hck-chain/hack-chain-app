// backend/harjoot/usecases/__tests__/validateReferralCode.test.js
const { validateReferralCode } = require("../validateReferralCode");

describe("validateReferralCode", () => {
  let models;

  beforeEach(() => {
    models = {
      User: {
        findOne: jest.fn()
      }
    };
  });

  it("should return valid=false for invalid formats", async () => {
    expect(await validateReferralCode({ models, code: null })).toEqual({ valid: false });
    expect(await validateReferralCode({ models, code: "SHORT" })).toEqual({ valid: false });
    expect(await validateReferralCode({ models, code: "LONGCODE123" })).toEqual({ valid: false });
    // Contains invalid chars (O and I)
    expect(await validateReferralCode({ models, code: "OOOOIIII" })).toEqual({ valid: false });
    
    expect(models.User.findOne).not.toHaveBeenCalled();
  });

  it("should return valid=false if code not found", async () => {
    models.User.findOne.mockResolvedValue(null);
    
    const result = await validateReferralCode({ models, code: "AB3D5678" });
    expect(result).toEqual({ valid: false });
    expect(models.User.findOne).toHaveBeenCalledWith({
      where: { referral_code: "AB3D5678" },
      attributes: ['name']
    });
  });

  it("should return valid=true and referrerName if found", async () => {
    models.User.findOne.mockResolvedValue({ name: "Hector" });

    const result = await validateReferralCode({ models, code: "AB3D5678" });
    expect(result).toEqual({ valid: true, referrerName: "Hector" });
  });

  it("should clean and uppercase the code before querying", async () => {
    models.User.findOne.mockResolvedValue({ name: "Alice" });

    await validateReferralCode({ models, code: " ab3d5678 " });

    expect(models.User.findOne).toHaveBeenCalledWith({
      where: { referral_code: "AB3D5678" },
      attributes: ['name']
    });
  });

  it("should default to 'Usuario' if referrer has no name", async () => {
    models.User.findOne.mockResolvedValue({ name: null }); // user with no name

    const result = await validateReferralCode({ models, code: "AB3D5678" });
    expect(result).toEqual({ valid: true, referrerName: "Usuario" });
  });
});
