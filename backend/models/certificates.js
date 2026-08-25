module.exports = (sequelize, DataTypes) => {
  const Certificate = sequelize.define("Certificate", {

    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    issuer_wallet_address: {
      type: DataTypes.STRING(42),
      allowNull: false,
      references: {
        model: 'issuers',
        key: 'wallet_address'
      }
    },
    student_wallet_address: {        // <-- NUEVO
      type: DataTypes.STRING(42),
      allowNull: false,
      references: {
        model: 'students',
        key: 'wallet_address'
      },
      onDelete: 'CASCADE'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    certificate_hash: {
      // Nullable: a certificate is reserved (status: 'pending') before it has
      // real chain data — see usecases/certificates/reserveCertificate.js.
      type: DataTypes.STRING(128),
      unique: true,
      allowNull: true
    },
    blockchain_tx_hash: {
      type: DataTypes.STRING(128),
      allowNull: true
    },
    token_id: {
      type: DataTypes.STRING(78),
      allowNull: true
    },
    issue_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    is_revoked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    share_count: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },

    // ---- Phase 1 (Harjoot integration) — see scripts/migrate-harjoot-phase1.js ----
    harjoot_verification_id:  { type: DataTypes.STRING, allowNull: true },
    harjoot_verification_url: { type: DataTypes.STRING, allowNull: true },
    harjoot_qr_url:           { type: DataTypes.STRING, allowNull: true },
    payment_id:               { type: DataTypes.INTEGER, allowNull: true },
    status:                   { type: DataTypes.STRING, allowNull: true, defaultValue: 'issued' },
    class_request_id:         { type: DataTypes.INTEGER, allowNull: true },

    // ---- Talent confirmation window (step 11-12 of the class-payment workflow) ----
    confirmation_deadline:    { type: DataTypes.DATE, allowNull: true },
    flag_reason:              { type: DataTypes.TEXT, allowNull: true }
  }, {
    tableName: 'certificates',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Certificate.associate = (models) => {
    Certificate.belongsTo(models.Issuer, {
      foreignKey: 'issuer_wallet_address',
      targetKey: 'wallet_address'
    });
    Certificate.belongsTo(models.Student, {   // <-- NUEVO
      foreignKey: 'student_wallet_address',
      targetKey: 'wallet_address',
      as: 'student'
    });

    // Phase 1 (Harjoot integration): each issued cert may be funded by a payment.
    if (models.Payment) {
      Certificate.belongsTo(models.Payment, {
        foreignKey: 'payment_id',
        targetKey: 'id',
      });
    }

    if (models.ClassRequest) {
      Certificate.belongsTo(models.ClassRequest, {
        foreignKey: 'class_request_id',
        as: 'classRequest',
      });
    }
  };

  return Certificate;
};