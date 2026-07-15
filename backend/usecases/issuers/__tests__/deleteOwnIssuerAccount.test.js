const { deleteOwnIssuerAccount } = require("../deleteOwnIssuerAccount");

describe("deleteOwnIssuerAccount", () => {
  const wallet = "0x" + "bb".repeat(20);

  test("throws TypeError when required deps are missing", async () => {
    await expect(deleteOwnIssuerAccount({ wallet })).rejects.toThrow(TypeError);
  });

  test("returns MISSING_SIGNATURE when signature or message is absent", async () => {
    const result = await deleteOwnIssuerAccount({
      wallet,
      validateDeletionMessage: jest.fn(),
      deleteIssuerAccount: jest.fn(),
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("MISSING_SIGNATURE");
    expect(result.httpStatus).toBe(400);
  });

  test("returns INVALID_SIGNATURE when validation fails, without deleting", async () => {
    const deleteIssuerAccount = jest.fn();
    const validateDeletionMessage = jest.fn().mockReturnValue({ ok: false, error: "Signature mismatch" });

    const result = await deleteOwnIssuerAccount({
      wallet, signature: "0xsig", message: "msg",
      validateDeletionMessage, deleteIssuerAccount,
    });

    expect(result.ok).toBe(false);
    expect(result.code).toBe("INVALID_SIGNATURE");
    expect(result.httpStatus).toBe(401);
    expect(result.message).toBe("Signature mismatch");
    expect(deleteIssuerAccount).not.toHaveBeenCalled();
  });

  test("deletes the account when the signature is valid", async () => {
    const deleteIssuerAccount = jest.fn().mockResolvedValue(undefined);
    const validateDeletionMessage = jest.fn().mockReturnValue({ ok: true });

    const result = await deleteOwnIssuerAccount({
      wallet, signature: "0xsig", message: "msg",
      validateDeletionMessage, deleteIssuerAccount,
    });

    expect(result.ok).toBe(true);
    expect(deleteIssuerAccount).toHaveBeenCalledWith(wallet);
  });
});
