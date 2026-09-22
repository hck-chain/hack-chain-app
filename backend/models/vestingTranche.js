module.exports = (sequelize, DataTypes) => {
  // Tramos de liberación derivados de cada contribución validada.
  // Regla fija (PV-09): 1 mes de bloqueo + 3 tramos mensuales de un tercio.
  const VestingTranche = sequelize.define("VestingTranche", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    contribution_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'contributions', key: 'id' }
    },
    tranche_number: { type: DataTypes.INTEGER, allowNull: false }, // 1, 2 o 3
    amount: { type: DataTypes.STRING(78), allowNull: false }, // BE-01: texto
    release_date: { type: DataTypes.DATE, allowNull: false },
    released: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    released_at: { type: DataTypes.DATE, allowNull: true }
  }, {
    tableName: 'vesting_tranches',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { unique: true, fields: ['contribution_id', 'tranche_number'] },
      { fields: ['release_date'] }
    ]
  });

  VestingTranche.associate = (models) => {
    VestingTranche.belongsTo(models.Contribution, { foreignKey: 'contribution_id' });
  };

  return VestingTranche;
};
