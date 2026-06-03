// backend/models/treasuryTransfers.js
//
// Async queue of pending HACK->USDT->Harjoot settlements drained by the
// treasury worker — see DS Section 13.
//
// Each row represents the USDT debt accrued from one Payment that still needs
// to be converted (HACK -> USDT via the chosen strategy) and transferred to
// Harjoot's wallet. The lifecycle is:
//   pending -> [awaiting_manual_conversion] -> sent | failed

module.exports = (sequelize, DataTypes) => {
  const TreasuryTransfer = sequelize.define("TreasuryTransfer", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    payment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "payments",
        key: "id",
      },
    },
    // USDT amount we owe Harjoot for this payment. Launch value: 0.20 per cert.
    amount_usdt_owed: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
    },
    destination: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "harjoot",
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "pending",
    },
    usdt_tx_hash: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    error: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: "treasury_transfers_queue",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    // No updatedAt: status transitions are captured by `sent_at` or by reading
    // the row's current `status` + `error`.
    updatedAt: false,
  });

  TreasuryTransfer.associate = (models) => {
    TreasuryTransfer.belongsTo(models.Payment, {
      foreignKey: "payment_id",
      targetKey: "id",
    });
  };

  return TreasuryTransfer;
};
