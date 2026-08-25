const { VACANCY_AREAS, VACANCY_MODALITIES, VACANCY_SALARY_PERIODS, VACANCY_STATUSES } = require("../usecases/vacancies/constants");

module.exports = (sequelize, DataTypes) => {
  const Vacancy = sequelize.define("Vacancy", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    recruiter_wallet_address: {
      type: DataTypes.STRING(42),
      allowNull: false,
      references: { model: "users", key: "wallet_address" },
      onDelete: "CASCADE",
    },
    position: { type: DataTypes.STRING(80), allowNull: false },
    company: { type: DataTypes.STRING(80), allowNull: false },
    // ENUM real (no STRING + isIn como el resto del repo) — pedido explícito de Héctor para
    // que el filtro de área (RF-09) sea confiable. Sumar un área nueva requiere ALTER TYPE.
    area: {
      type: DataTypes.ENUM(...VACANCY_AREAS),
      allowNull: false,
    },
    modality: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: { isIn: [VACANCY_MODALITIES] },
    },
    // Required only when modality !== 'remoto' — enforced in usecases/vacancies (business
    // rule, not a DB-level constraint, same convention as the rest of the module).
    country: { type: DataTypes.STRING(100), allowNull: true },
    city: { type: DataTypes.STRING(100), allowNull: true },
    salary_min: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    salary_max: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    salary_currency: { type: DataTypes.STRING(10), allowNull: false },
    salary_period: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: { isIn: [VACANCY_SALARY_PERIODS] },
    },
    description: { type: DataTypes.TEXT, allowNull: false },
    requirements: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    closing_date: { type: DataTypes.DATEONLY, allowNull: false },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "abierta",
      validate: { isIn: [VACANCY_STATUSES] },
    },
    published_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    closed_at: { type: DataTypes.DATE, allowNull: true },
  }, {
    tableName: "vacancies",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  });

  Vacancy.associate = (models) => {
    Vacancy.belongsTo(models.User, {
      foreignKey: "recruiter_wallet_address",
      targetKey: "wallet_address",
      as: "recruiter",
    });
    Vacancy.hasMany(models.VacancyApplication, {
      foreignKey: "vacancy_id",
      as: "applications",
    });
  };

  return Vacancy;
};
