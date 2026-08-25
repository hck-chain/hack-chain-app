const express = require("express");
const request = require("supertest");

// Mock the authenticate middleware used by the router
jest.mock("../middleware/auth", () => ({
  authenticate: jest.fn((req, res, next) => {
    // mark request to assert middleware ran
    req.authenticated = true;
    next();
  }),
}));

// Create mocks for the controller methods used by the router
jest.mock("../controllers/profileController", () => ({
  getMe: jest.fn((req, res) => res.status(200).json({ called: true, auth: !!req.authenticated })),
  updateMe: jest.fn((req, res) => res.status(200).json({ updated: true, body: req.body })),
}));

const profileController = require("../controllers/profileController");
const getMeMock = profileController.getMe;
const updateMeMock = profileController.updateMe;

// Require the router after mocks so requires inside the module use the mocks
const router = require("../routes/profile");

// Helper to mount router into an express app for testing
function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/profile", router);
  return app;
}

describe("backend/routes/profile router", () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET /me -> should run authenticate and call getMe", async () => {
    const res = await request(app).get("/api/profile/me");

    expect(res.status).toBe(200);
    expect(getMeMock).toHaveBeenCalledTimes(1);
    expect(res.body).toEqual({ called: true, auth: true });
  });

  test("PUT /me -> should run authenticate, accept JSON body and call updateMe", async () => {
    const payload = { name: "John", lastName: "Doe", age: 30, bio: "Hello", email: "john@example.com" };

    const res = await request(app).put("/api/profile/me").send(payload).set("Content-Type", "application/json");

    expect(res.status).toBe(200);
    expect(updateMeMock).toHaveBeenCalledTimes(1);
    expect(res.body).toHaveProperty("updated", true);
    expect(res.body.body).toMatchObject(payload);
  });

  test("GET /settings -> alias for /me and calls getMe", async () => {
    const res = await request(app).get("/api/profile/settings");

    expect(res.status).toBe(200);
    expect(getMeMock).toHaveBeenCalledTimes(1);
    expect(res.body).toEqual({ called: true, auth: true });
  });

  test("PUT /settings -> alias for /me and calls updateMe", async () => {
    const payload = { name: "Alice", bio: "About me" };

    const res = await request(app).put("/api/profile/settings").send(payload).set("Content-Type", "application/json");

    expect(res.status).toBe(200);
    expect(updateMeMock).toHaveBeenCalledTimes(1);
    expect(res.body.body).toMatchObject(payload);
  });
});