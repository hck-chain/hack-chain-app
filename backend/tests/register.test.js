// backend/tests/register.test.js
const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");
const SequelizePkg = require("sequelize");

jest.setTimeout(20000);

describe("Register endpoints (Student)", () => {
  let sequelize;
  let Student, Issuer, Recruiter;
  let app;

  beforeAll(async () => {
    // 1) Crear Sequelize en memoria (sqlite)
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", { logging: false });

    // 2) Definir modelos usando los archivos de models (devuelven factory: (sequelize, DataTypes) => Model)
    const DataTypes = SequelizePkg.DataTypes;
    Student = require("../models/students")(sequelize, DataTypes);
    Issuer = require("../models/issuers")(sequelize, DataTypes);
    Recruiter = require("../models/recruiters")(sequelize, DataTypes);

    // 3) Montamos un objeto parecido a backend/models para mockear
    const modelsMock = {
      Student,
      Issuer,
      Recruiter,
      sequelize,
      Sequelize: SequelizePkg,
    };

    // 4) Antes de cargar la ruta, mockeamos ../models para que las rutas usen nuestros modelos en memoria
    jest.isolateModules(() => {
      jest.doMock("../models", () => modelsMock);
      // require after the mock
      const studentRoute = require("../routes/students");
      app = express();
      app.use(bodyParser.json());
      app.use("/api/student", studentRoute);
    });

    // 5) Sync DB
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    // quitar mock y cerrar conexión
    jest.resetModules();
    if (sequelize) await sequelize.close();
  });

  test("POST /api/student/register creates a student and doesn't return sensitive fields", async () => {
    const payload = {
      email: "test@example.com",
      password: "Passw0rd!",
      name: "Ana",
      lastName: "Lopez",
      age: 21,
    };

    const res = await request(app).post("/api/student/register").send(payload).expect(201);

    expect(res.body).toHaveProperty("message", "Student registered");
    expect(res.body).toHaveProperty("student");
    expect(res.body.student).toHaveProperty("walletAddress");
    // No exponer campos sensibles
    expect(res.body.student).not.toHaveProperty("passwordHash");
    expect(res.body.student).not.toHaveProperty("privateKey");

    // Verificar en DB que user existe y passwordHash está hasheado
    const studentInDb = await Student.findOne({ where: { email: payload.email } });
    expect(studentInDb).not.toBeNull();
    expect(typeof studentInDb.passwordHash).toBe("string");
    expect(studentInDb.passwordHash.startsWith("$2")).toBeTruthy(); // bcrypt prefix $2b$/$2a$
    // privateKey debe ser null o undefined (no almacenado)
    expect(studentInDb.privateKey == null).toBeTruthy();
  });
});
