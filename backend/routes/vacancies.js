const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const db = require("../models");
const { authenticate } = require("../middleware/auth");
const buildRateLimitStore = require("../lib/rateLimitStore");

const { createVacancy } = require("../usecases/vacancies/createVacancy");
const { updateVacancy } = require("../usecases/vacancies/updateVacancy");
const { closeVacancy } = require("../usecases/vacancies/closeVacancy");
const { listVacancies } = require("../usecases/vacancies/listVacancies");
const { getVacancyBySlug } = require("../usecases/vacancies/getVacancyBySlug");
const { listOwnVacancies } = require("../usecases/vacancies/listOwnVacancies");

const { createApplication } = require("../usecases/vacancyApplications/createApplication");
const { markApplicationViewed } = require("../usecases/vacancyApplications/markApplicationViewed");
const { getApplicationDetail } = require("../usecases/vacancyApplications/getApplicationDetail");
const { updateApplicationStatus } = require("../usecases/vacancyApplications/updateApplicationStatus");
const { listApplicationsForTalent } = require("../usecases/vacancyApplications/listApplicationsForTalent");
const { listApplicationsForVacancy } = require("../usecases/vacancyApplications/listApplicationsForVacancy");

const { notifyTalentVacancyApplicationUpdate } = require("../services/emailService");

const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: "Too many requests" },
  store: buildRateLimitStore("/api/vacancies-public"),
});

const createLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many requests" },
  store: buildRateLimitStore("/api/vacancies-create"),
});

// Fire-and-forget notification for RF-21 — failures must never fail the
// response that triggered them. Never reveals recruiter contact info (no
// chat module exists yet, see PR notes).
function notifyApplicationStatus({ studentWallet, position, company, status }) {
  db.User.findOne({ where: { wallet_address: studentWallet.toLowerCase() }, attributes: ["email", "name"] })
    .then((studentUser) => {
      if (!studentUser?.email) return;
      return notifyTalentVacancyApplicationUpdate({
        to: studentUser.email,
        studentName: studentUser.name || null,
        position,
        company,
        status,
      });
    })
    .catch((err) => console.error(`[email] vacancy-application-update (status=${status}): error:`, err));
}

// POST /api/vacancies — recruiter publishes a new vacancy.
router.post("/", authenticate, createLimiter, async (req, res) => {
  if (req.auth.role !== "recruiter") {
    return res.status(403).json({ error: "Only recruiters can create vacancies" });
  }

  try {
    const result = await createVacancy({
      models: db,
      recruiterWallet: req.auth.wallet,
      position: req.body.position,
      company: req.body.company,
      area: req.body.area,
      modality: req.body.modality,
      country: req.body.country,
      city: req.body.city,
      salaryMin: req.body.salary_min,
      salaryMax: req.body.salary_max,
      salaryCurrency: req.body.salary_currency,
      salaryPeriod: req.body.salary_period,
      description: req.body.description,
      requirements: req.body.requirements,
      closingDate: req.body.closing_date,
    });

    if (!result.ok) return res.status(result.httpStatus).json({ error: result.message });
    return res.status(201).json(result.data);
  } catch (err) {
    console.error("POST /api/vacancies error:", err);
    return res.status(500).json({ error: "Failed to create vacancy" });
  }
});

// GET /api/vacancies — public listing of open vacancies (RF-08, RF-09).
router.get("/", publicLimiter, async (req, res) => {
  try {
    const result = await listVacancies({
      models: db,
      area: req.query.area,
      // Query param is `modalidad`, matching the contract in the ticket exactly.
      modality: req.query.modalidad,
      q: req.query.q,
    });
    if (!result.ok) return res.status(result.httpStatus).json({ error: result.message });
    return res.json(result.data);
  } catch (err) {
    console.error("GET /api/vacancies error:", err);
    return res.status(500).json({ error: "Failed to list vacancies" });
  }
});

// GET /api/vacancies/mine — recruiter's own vacancies with applicant counts (RF-22).
// Must be registered before /:slug to avoid param capture.
router.get("/mine", authenticate, async (req, res) => {
  if (req.auth.role !== "recruiter") {
    return res.status(403).json({ error: "Only recruiters can access this endpoint" });
  }

  try {
    const result = await listOwnVacancies({ models: db, recruiterWallet: req.auth.wallet });
    if (!result.ok) return res.status(result.httpStatus).json({ error: result.message });
    return res.json(result.data);
  } catch (err) {
    console.error("GET /api/vacancies/mine error:", err);
    return res.status(500).json({ error: "Failed to fetch your vacancies" });
  }
});

// GET /api/vacancies/applications/mine — talent's own applications (RF-20).
// Must be registered before /:id/applications to avoid param capture.
router.get("/applications/mine", authenticate, async (req, res) => {
  if (req.auth.role !== "student") {
    return res.status(403).json({ error: "Only talent accounts can access this endpoint" });
  }

  try {
    const result = await listApplicationsForTalent({ models: db, studentWallet: req.auth.wallet });
    if (!result.ok) return res.status(result.httpStatus).json({ error: result.message });
    return res.json(result.data);
  } catch (err) {
    console.error("GET /api/vacancies/applications/mine error:", err);
    return res.status(500).json({ error: "Failed to fetch your applications" });
  }
});

// GET /api/vacancies/applications/:id — application detail for its recruiter
// owner; opening it for the first time marks it Vista (RF-24).
// Must be registered before /:id/applications to avoid param capture.
router.get("/applications/:id", authenticate, async (req, res) => {
  if (req.auth.role !== "recruiter") {
    return res.status(403).json({ error: "Only recruiters can access this endpoint" });
  }

  try {
    const result = await getApplicationDetail({
      models: db,
      applicationId: req.params.id,
      recruiterWallet: req.auth.wallet,
    });
    if (!result.ok) return res.status(result.httpStatus).json({ error: result.message });

    if (result.data.transitioned_to_viewed) {
      const vacancy = await db.Vacancy.findByPk(result.data.application.vacancy_id, { attributes: ["position", "company"] });
      notifyApplicationStatus({
        studentWallet: result.data.application.student_wallet_address,
        position: vacancy?.position,
        company: vacancy?.company,
        status: "vista",
      });
    }

    return res.json(result.data);
  } catch (err) {
    console.error("GET /api/vacancies/applications/:id error:", err);
    return res.status(500).json({ error: "Failed to fetch application" });
  }
});

// PUT /api/vacancies/applications/:id — recruiter marks Contactado/Descartada (RF-26).
router.put("/applications/:id", authenticate, async (req, res) => {
  if (req.auth.role !== "recruiter") {
    return res.status(403).json({ error: "Only recruiters can update application status" });
  }

  try {
    const result = await updateApplicationStatus({
      models: db,
      applicationId: req.params.id,
      recruiterWallet: req.auth.wallet,
      status: req.body.status,
    });
    if (!result.ok) return res.status(result.httpStatus).json({ error: result.message });

    const vacancy = await db.Vacancy.findByPk(result.data.application.vacancy_id, { attributes: ["position", "company"] });
    notifyApplicationStatus({
      studentWallet: result.data.application.student_wallet_address,
      position: vacancy?.position,
      company: vacancy?.company,
      status: result.data.application.status,
    });

    return res.json(result.data);
  } catch (err) {
    console.error("PUT /api/vacancies/applications/:id error:", err);
    return res.status(500).json({ error: "Failed to update application status" });
  }
});

// GET /api/vacancies/:slug — public vacancy detail (RF-12, RF-13).
router.get("/:slug", publicLimiter, async (req, res) => {
  try {
    const result = await getVacancyBySlug({ models: db, slug: req.params.slug });
    if (!result.ok) return res.status(result.httpStatus).json({ error: result.message });
    return res.json(result.data);
  } catch (err) {
    console.error("GET /api/vacancies/:slug error:", err);
    return res.status(500).json({ error: "Failed to fetch vacancy" });
  }
});

// PUT /api/vacancies/:id — recruiter edits their own vacancy (RF-06).
router.put("/:id", authenticate, async (req, res) => {
  if (req.auth.role !== "recruiter") {
    return res.status(403).json({ error: "Only recruiters can edit vacancies" });
  }

  try {
    const result = await updateVacancy({
      models: db,
      vacancyId: req.params.id,
      recruiterWallet: req.auth.wallet,
      position: req.body.position,
      company: req.body.company,
      area: req.body.area,
      modality: req.body.modality,
      country: req.body.country,
      city: req.body.city,
      salaryMin: req.body.salary_min,
      salaryMax: req.body.salary_max,
      salaryCurrency: req.body.salary_currency,
      salaryPeriod: req.body.salary_period,
      description: req.body.description,
      requirements: req.body.requirements,
    });
    if (!result.ok) return res.status(result.httpStatus).json({ error: result.message });
    return res.json(result.data);
  } catch (err) {
    console.error("PUT /api/vacancies/:id error:", err);
    return res.status(500).json({ error: "Failed to update vacancy" });
  }
});

// POST /api/vacancies/:id/close — recruiter closes their own vacancy (RF-07).
router.post("/:id/close", authenticate, async (req, res) => {
  if (req.auth.role !== "recruiter") {
    return res.status(403).json({ error: "Only recruiters can close vacancies" });
  }

  try {
    const result = await closeVacancy({ models: db, vacancyId: req.params.id, recruiterWallet: req.auth.wallet });
    if (!result.ok) return res.status(result.httpStatus).json({ error: result.message });

    if (result.data.notified_applications.length > 0) {
      const vacancy = await db.Vacancy.findByPk(req.params.id, { attributes: ["position", "company"] });
      for (const app of result.data.notified_applications) {
        notifyApplicationStatus({
          studentWallet: app.student_wallet_address,
          position: vacancy?.position,
          company: vacancy?.company,
          status: "cerrada_sin_respuesta",
        });
      }
    }

    return res.json({ vacancy: result.data.vacancy });
  } catch (err) {
    console.error("POST /api/vacancies/:id/close error:", err);
    return res.status(500).json({ error: "Failed to close vacancy" });
  }
});

// POST /api/vacancies/:id/applications — talent applies (RF-15).
router.post("/:id/applications", authenticate, createLimiter, async (req, res) => {
  if (req.auth.role !== "student") {
    return res.status(403).json({ error: "Only talent accounts can apply to vacancies" });
  }

  try {
    const result = await createApplication({
      models: db,
      vacancyId: req.params.id,
      studentWallet: req.auth.wallet,
      sharedCertificates: req.body.shared_certificates,
      message: req.body.message,
    });
    if (!result.ok) return res.status(result.httpStatus).json({ error: result.message });
    return res.status(201).json(result.data);
  } catch (err) {
    console.error("POST /api/vacancies/:id/applications error:", err);
    return res.status(500).json({ error: "Failed to submit application" });
  }
});

// GET /api/vacancies/:id/applications — recruiter views applicants (RF-22, RF-23, RF-25).
router.get("/:id/applications", authenticate, async (req, res) => {
  if (req.auth.role !== "recruiter") {
    return res.status(403).json({ error: "Only recruiters can view applicants" });
  }

  try {
    const result = await listApplicationsForVacancy({ models: db, vacancyId: req.params.id, recruiterWallet: req.auth.wallet });
    if (!result.ok) return res.status(result.httpStatus).json({ error: result.message });
    return res.json(result.data);
  } catch (err) {
    console.error("GET /api/vacancies/:id/applications error:", err);
    return res.status(500).json({ error: "Failed to fetch applicants" });
  }
});

module.exports = router;
