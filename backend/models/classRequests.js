module.exports = (sequelize, DataTypes) => {
  const ClassRequest = sequelize.define("ClassRequest", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    student_wallet_address: {
      type: DataTypes.STRING(42),
      allowNull: false,
      references: { model: 'users', key: 'wallet_address' },
      onDelete: 'CASCADE',
    },
    issuer_wallet_address: {
      type: DataTypes.STRING(42),
      allowNull: false,
      references: { model: 'issuers', key: 'wallet_address' },
      onDelete: 'CASCADE',
    },
    requested_date: { type: DataTypes.DATEONLY, allowNull: false },
    start_time: { type: DataTypes.STRING(5), allowNull: false },
    duration_minutes: { type: DataTypes.INTEGER, allowNull: false },
    hourly_rate_usd: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    student_message: { type: DataTypes.TEXT, allowNull: true },
    issuer_class_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'issuer_classes', key: 'id' },
      onDelete: 'SET NULL',
    },
    class_name: { type: DataTypes.STRING(255), allowNull: true },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [['pending', 'confirmed', 'cancelled', 'completed']] },
    },
    // Manual payment workflow (deposit + final, proof-based confirmation).
    // escrow_tx_hash/release_tx_hash/amount_hack stay for when HackEscrow ships —
    // not read/written by the manual flow below.
    payment_status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'unpaid',
      validate: {
        isIn: [[
          'unpaid',
          'deposit_submitted',
          'deposit_confirmed',
          'deposit_disputed',
          'final_submitted',
          'paid',
          'final_disputed',
          // legacy values kept valid for rows written before this migration
          'escrowed',
          'released',
          'refunded',
        ]],
      },
    },
    amount_hack: {
      type: DataTypes.DECIMAL(28, 8),
      allowNull: true,
    },
    escrow_tx_hash: {
      type: DataTypes.STRING(66),
      allowNull: true,
    },
    release_tx_hash: {
      type: DataTypes.STRING(66),
      allowNull: true,
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'USDT',
    },
    amount: {
      type: DataTypes.DECIMAL(28, 8),
      allowNull: true,
    },
    payment_network: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    deposit_proof_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    deposit_proof_cid: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    final_proof_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    final_proof_cid: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    deposit_confirmed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    final_confirmed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // On-chain USDT wallet payment (verified via usdtPaymentService) — set
    // instead of deposit_proof_url/deposit_proof_cid when the talent pays
    // directly from their wallet rather than uploading a manual proof.
    deposit_tx_hash: {
      type: DataTypes.STRING(66),
      unique: true,
      allowNull: true,
    },
    final_tx_hash: {
      type: DataTypes.STRING(66),
      unique: true,
      allowNull: true,
    },
    // Set by the educator when confirming — a Meet/Zoom/Teams/etc. link the
    // talent uses to join the live session.
    meeting_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cancellation_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reminder_sent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  }, {
    tableName: 'class_requests',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  ClassRequest.associate = (models) => {
    ClassRequest.belongsTo(models.User, {
      foreignKey: 'student_wallet_address',
      targetKey: 'wallet_address',
      as: 'student',
    });
    ClassRequest.belongsTo(models.Issuer, {
      foreignKey: 'issuer_wallet_address',
      targetKey: 'wallet_address',
      as: 'issuer',
    });
    ClassRequest.belongsTo(models.IssuerClass, {
      foreignKey: 'issuer_class_id',
      as: 'issuerClass',
    });
    if (models.Certificate) {
      ClassRequest.hasOne(models.Certificate, {
        foreignKey: 'class_request_id',
        as: 'certificate',
      });
    }
    if (models.ClassPaymentDispute) {
      ClassRequest.hasMany(models.ClassPaymentDispute, {
        foreignKey: 'class_request_id',
        as: 'paymentDisputes',
      });
    }
  };

  return ClassRequest;
};
