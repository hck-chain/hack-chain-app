// backend/harjoot/usecases/__tests__/ensureReferralCode.test.js
const { ensureReferralCode, generateCode } = require("../ensureReferralCode");

describe("ensureReferralCode", () => {
  let models;

  beforeEach(() => {
    models = {
      User: {
        update: jest.fn().mockResolvedValue([1])
      }
    };
  });

  it("should return the existing code if the user already has one", async () => {
    const user = { id: 1, referral_code: "EXISTING" };
    const result = await ensureReferralCode({ models, user });
    
    expect(result.ok).toBe(true);
    expect(result.code).toBe("EXISTING");
    expect(models.User.update).not.toHaveBeenCalled();
  });

  it("should generate and save a new code if the user does not have one", async () => {
    const user = { id: 1 };
    const result = await ensureReferralCode({ models, user });
    
    expect(result.ok).toBe(true);
    expect(result.code).toMatch(/^[0-9A-HJ-NP-TV-Z]{8}$/);
    expect(models.User.update).toHaveBeenCalledWith(
      { referral_code: result.code },
      { where: { id: 1 } }
    );
    expect(user.referral_code).toBe(result.code); // should update instance
  });

  it("should retry on unique constraint violation", async () => {
    const user = { id: 1 };
    
    const uniqueError = new Error("Unique constraint");
    uniqueError.name = "SequelizeUniqueConstraintError";
    
    models.User.update
      .mockRejectedValueOnce(uniqueError)
      .mockResolvedValueOnce([1]); // success on 2nd try

    const result = await ensureReferralCode({ models, user });
    
    expect(result.ok).toBe(true);
    expect(models.User.update).toHaveBeenCalledTimes(2);
  });

  it("should fail after max retries", async () => {
    const user = { id: 1 };
    
    const uniqueError = new Error("Unique constraint");
    uniqueError.name = "SequelizeUniqueConstraintError";
    
    models.User.update.mockRejectedValue(uniqueError);

    const result = await ensureReferralCode({ models, user });
    
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("max_retries_exceeded");
    expect(models.User.update).toHaveBeenCalledTimes(3);
  });
});
