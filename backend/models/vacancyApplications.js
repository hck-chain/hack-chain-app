const { APPLICATION_STATUSES } = require("../usecases/vacancies/constants");

module.exports = (sequelize, DataTypes) => {
  const VacancyApplication = sequelize.define("VacancyApplication", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    vacancy_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "vacancies", key: "id" },
      onDelete: "CASCADE",
    },
    student_wallet_address: {
      type: DataTypes.STRING(42),
      allowNull: false,
      references: { model: "users", key: "wallet_address" },
      onDelete: "CASCADE",
    },
    // Array of Certificate.token_id (string) — the talent dashboard only knows certificates
    // in their OpenSea shape (token_id), same reasoning as POST /certificates/:id/share.
    shared_certificates: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    message: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "enviada",
      validate: { isIn: [APPLICATION_STATUSES] },
    },
    submitted_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    viewed_at: { type: DataTypes.DATE, allowNull: true },
    // RNF-06 — every state change is recorded with author and date.
    status_changed_at: { type: DataTypes.DATE, allowNull: true },
    status_changed_by: { type: DataTypes.STRING(42), allowNull: true },
  }, {
    tableName: "vacancy_applications",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  });

  VacancyApplication.associate = (models) => {
    VacancyApplication.belongsTo(models.Vacancy, {
      foreignKey: "vacancy_id",
      as: "vacancy",
    });
    VacancyApplication.belongsTo(models.User, {
      foreignKey: "student_wallet_address",
      targetKey: "wallet_address",
      as: "student",
    });
  };

  return VacancyApplication;
};
