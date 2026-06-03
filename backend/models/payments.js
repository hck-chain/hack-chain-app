// backend/models/payments.js
//
// Records of $HACK payments made by educators when issuing certificates.
// One row per on-chain transfer to the Treasury — see DS Section 4.
//
// `tx_hash` is unique: re-using the same transaction is rejected at the DB
// layer (replay protection). The `*_usd` columns capture the per-cert
// economics at the time of payment so historical revenue and Harjoot debt
// can be reconciled even if pricing changes later.

module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define("Payment", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tx_hash: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    from_wallet: {
      type: DataTypes.STRING(42),
      allowNull: false,
    },
    // Whole HACK units. 6,900 per cert at launch pricing.
    amount_hack: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    // What HackChain owes Harjoot per this payment.
    harjoot_price_usd: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
    },
    // What HackChain charged the educator.
    user_price_usd: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "confirmed",
    },
    purpose: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: "payments",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  });

  Payment.associate = (models) => {
    // A payment can have at most one queued treasury transfer.
    if (models.TreasuryTransfer) {
      Payment.hasOne(models.TreasuryTransfer, {
        foreignKey: "payment_id",
        sourceKey: "id",
      });
    }
    // A payment funds at most one certificate in the pay-per-mint model.
    if (models.Certificate) {
      Payment.hasOne(models.Certificate, {
        foreignKey: "payment_id",
        sourceKey: "id",
      });
    }
  };

  return Payment;
};
