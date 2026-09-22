module.exports = (sequelize, DataTypes) => {
  // Cada fase de la preventa: precio, cupo, disponible y ventana de fechas.
  const PresalePhase = sequelize.define("PresalePhase", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // "order" es palabra reservada en SQL, se usa phase_order.
    phase_order: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    price: { type: DataTypes.STRING(78), allowNull: false }, // BE-01: texto, no float
    cap: { type: DataTypes.STRING(78), allowNull: false },
    available: { type: DataTypes.STRING(78), allowNull: false },
    start_date: { type: DataTypes.DATE, allowNull: false },
    end_date: { type: DataTypes.DATE, allowNull: false }
  }, {
    tableName: 'presale_phases',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['start_date', 'end_date'] }
    ]
  });

  PresalePhase.associate = (models) => {
    PresalePhase.hasMany(models.Contribution, { foreignKey: 'phase_id' });
  };

  return PresalePhase;
};
