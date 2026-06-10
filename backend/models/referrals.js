// backend/models/referrals.js
module.exports = (sequelize, DataTypes) => {
  const Referral = sequelize.define("Referral", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    referrer_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    referred_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true
    },
    referral_code_used: {
      type: DataTypes.STRING(8),
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'pending_stake',
      validate: {
        isIn: [['pending_stake', 'staking', 'eligible', 'queued_next_month', 'claimed', 'expired', 'cancelled']]
      }
    },
    staking_started_at: { type: DataTypes.DATE, allowNull: true },
    eligible_at: { type: DataTypes.DATE, allowNull: true },
    queued_for_month: { type: DataTypes.CHAR(7), allowNull: true },
    payout_tx_hash: { type: DataTypes.STRING(66), unique: true, allowNull: true },
    payout_amount_wei: { type: DataTypes.STRING(80), allowNull: true },
    claimed_at: { type: DataTypes.DATE, allowNull: true },
    referral_ip_hash: { type: DataTypes.STRING(64), allowNull: true },
    referral_user_agent_hash: { type: DataTypes.STRING(64), allowNull: true },
    requires_review: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    review_reason: { type: DataTypes.STRING(255), allowNull: true }
  }, {
    tableName: 'referrals',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    validate: {
      noSelfReferral() {
        if (this.referrer_user_id === this.referred_user_id) {
          throw new Error('referrer_user_id must differ from referred_user_id');
        }
      }
    }
  });

  Referral.associate = (models) => {
    Referral.belongsTo(models.User, { as: 'referrer', foreignKey: 'referrer_user_id' });
    Referral.belongsTo(models.User, { as: 'referred', foreignKey: 'referred_user_id' });
  };

  return Referral;
};
