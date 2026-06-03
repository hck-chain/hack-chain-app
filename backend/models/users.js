module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    wallet_address: {
      type: DataTypes.STRING(42),
      unique: true,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('student', 'issuer', 'recruiter'),
      allowNull: false
    },
    name: { type: DataTypes.STRING(50), allowNull: true },
    lastname: { type: DataTypes.STRING(50), allowNull: true },
    email: { type: DataTypes.STRING(255), allowNull: true },
    nonce: { type: DataTypes.STRING(32), allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    email_verified: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
    verification_token: { type: DataTypes.STRING(128), allowNull: true },
    verification_token_expires_at: { type: DataTypes.DATE, allowNull: true },

    // ---- Phase 1 (Harjoot integration) — see scripts/migrate-harjoot-phase1.js ----
    harjoot_membership_expires_at: { type: DataTypes.DATE, allowNull: true },
    educator_approval_status:      { type: DataTypes.STRING, allowNull: true },
    approved_at:                   { type: DataTypes.DATE, allowNull: true },
    approved_by:                   { type: DataTypes.INTEGER, allowNull: true },
    rejection_reason:              { type: DataTypes.TEXT, allowNull: true }
  }, {
    tableName: 'users',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  User.associate = (models) => {
    User.hasOne(models.Issuer, {
      foreignKey: 'wallet_address',
      sourceKey: 'wallet_address',
      onDelete: 'CASCADE'
    });
    User.hasOne(models.Student, {
      foreignKey: 'wallet_address',
      sourceKey: 'wallet_address',
      onDelete: 'CASCADE'
    });
    User.hasOne(models.Recruiter, {
      foreignKey: 'wallet_address',
      sourceKey: 'wallet_address',
      onDelete: 'CASCADE'
    });
    User.hasMany(models.UserSession, {
      foreignKey: 'wallet_address',
      sourceKey: 'wallet_address',
      onDelete: 'CASCADE'
    });
  };

  return User;
};
