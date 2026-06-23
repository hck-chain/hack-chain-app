// backend/services/__tests__/adminService.test.js
//
// Unit tests for getAdminEmails. Mocks listAdmins() and User.findAll so
// no real DB or env parsing is needed.

const { __resetCache } = require("../../middleware/requireAdmin");

jest.mock("../../middleware/requireAdmin", () => {
  const original = jest.requireActual("../../middleware/requireAdmin");
  return { ...original, listAdmins: jest.fn() };
});

const { listAdmins } = require("../../middleware/requireAdmin");
const { getAdminEmails } = require("../adminService");

const ADMIN_A = "0x" + "aa".repeat(20);
const ADMIN_B = "0x" + "bb".repeat(20);

function makeUser(rows) {
  return {
    findAll: jest.fn().mockResolvedValue(rows.map((r) => ({ email: r }))),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getAdminEmails", () => {
  test("returns empty array when no admin wallets are configured", async () => {
    listAdmins.mockReturnValue([]);
    const User = makeUser(["should-not-appear@x.com"]);
    const result = await getAdminEmails(User);
    expect(result).toEqual([]);
    expect(User.findAll).not.toHaveBeenCalled();
  });

  test("returns emails for all admins that have a registered user with email", async () => {
    listAdmins.mockReturnValue([ADMIN_A, ADMIN_B]);
    const User = makeUser(["admin1@hackchain.app", "admin2@hackchain.app"]);
    const result = await getAdminEmails(User);
    expect(result).toEqual(["admin1@hackchain.app", "admin2@hackchain.app"]);
    expect(User.findAll).toHaveBeenCalledTimes(1);
  });

  test("returns empty array when no admin has a registered account with email", async () => {
    listAdmins.mockReturnValue([ADMIN_A]);
    const User = makeUser([]);
    const result = await getAdminEmails(User);
    expect(result).toEqual([]);
  });

  test("filters out null/undefined emails from the returned rows", async () => {
    listAdmins.mockReturnValue([ADMIN_A, ADMIN_B]);
    const User = {
      findAll: jest.fn().mockResolvedValue([{ email: "real@x.com" }, { email: null }]),
    };
    const result = await getAdminEmails(User);
    expect(result).toEqual(["real@x.com"]);
  });

  test("queries only with the configured admin wallets (not all users)", async () => {
    listAdmins.mockReturnValue([ADMIN_A]);
    const User = makeUser(["a@x.com"]);
    await getAdminEmails(User);
    const callArg = User.findAll.mock.calls[0][0];
    // The where clause must restrict by wallet_address
    expect(callArg.where).toBeDefined();
    expect(callArg.where.wallet_address).toBeDefined();
    // Must also filter for non-null email
    expect(callArg.where.email).toBeDefined();
  });

  test("handles a single admin wallet gracefully", async () => {
    listAdmins.mockReturnValue([ADMIN_A]);
    const User = makeUser(["solo@hackchain.app"]);
    const result = await getAdminEmails(User);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("solo@hackchain.app");
  });
});
