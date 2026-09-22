module.exports = (sequelize, DataTypes) => {
  // Tabla central: unifica el "proof" que envía el comprador (POST /proofs)
  // y el registro final acreditado, con estado y auditoría.
  // Cubre BE-05, BE-06, BE-07, BE-09, BE-10, BE-11, BE-13.
  const Contribution = sequelize.define("Contribution", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    // Se referencia por wallet_address, igual que Issuer/Student/Recruiter
    // se vinculan a User. No es una FK dura a users: cualquier wallet
    // puede aportar, esté o no registrada en la plataforma.
    wallet_address: { type: DataTypes.STRING(42), allowNull: false },
    phase_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'presale_phases', key: 'id' }
    },
    // Hash de la transferencia. Índice único: impide acreditar
    // el mismo hash dos veces (BE-05).
    tx_hash: { type: DataTypes.STRING(66), allowNull: false, unique: true },
    paid_amount: { type: DataTypes.STRING(78), allowNull: false }, // BE-01/BE-06: texto, enteros
    tokens_assigned: { type: DataTypes.STRING(78), allowNull: true },
    block_date: { type: DataTypes.DATE, allowNull: false },
    status: {
      type: DataTypes.ENUM('pending', 'validated', 'rejected'),
      allowNull: false,
      defaultValue: 'pending'
    },
    // Motivo claro de rechazo (BE-07).
    rejection_reason: {
      type: DataTypes.ENUM(
        'wrong_network',
        'asset_not_accepted',
        'wrong_recipient',
        'insufficient_amount',
        'out_of_phase_window',
        'duplicate_hash'
      ),
      allowNull: true
    },
    // Metadata del archivo de proof subido (BE-09).
    proof_file_url: { type: DataTypes.STRING(255), allowNull: true },
    proof_file_mime: { type: DataTypes.STRING(100), allowNull: true },
    proof_file_size: { type: DataTypes.INTEGER, allowNull: true },
    // Auditoría de revisión (BE-13). reviewed_by referencia la wallet
    // del admin, igual que el resto del proyecto vincula por wallet_address.
    reviewed_by: { type: DataTypes.STRING(42), allowNull: true },
    reviewed_at: { type: DataTypes.DATE, allowNull: true },
    review_note: { type: DataTypes.TEXT, allowNull: true }
  }, {
    tableName: 'contributions',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { unique: true, fields: ['tx_hash'] },
      // Acelera el cálculo del tope acumulado por dirección y fase (BE-10).
      { fields: ['wallet_address', 'phase_id'] },
      { fields: ['status'] }
    ]
  });

  Contribution.associate = (models) => {
    Contribution.belongsTo(models.PresalePhase, { foreignKey: 'phase_id' });
    Contribution.belongsTo(models.User, {
      foreignKey: 'reviewed_by',
      targetKey: 'wallet_address',
      as: 'reviewer'
    });
    Contribution.hasMany(models.VestingTranche, { foreignKey: 'contribution_id' });
    Contribution.hasMany(models.NotificationLog, { foreignKey: 'contribution_id' });
  };

  return Contribution;
};
