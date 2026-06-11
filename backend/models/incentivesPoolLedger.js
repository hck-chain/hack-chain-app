// backend/models/incentivesPoolLedger.js
module.exports = (sequelize, DataTypes) => {
  const IncentivesPoolLedger = sequelize.define("IncentivesPoolLedger", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    referral_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    amount_wei: {
      type: DataTypes.STRING(80),
      allowNull: false
    },
    tx_hash: {
      type: DataTypes.STRING(66),
      allowNull: false,
      unique: true
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'referral_reward'
    }
  }, {
    tableName: 'incentives_pool_ledger',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  IncentivesPoolLedger.associate = (models) => {
    IncentivesPoolLedger.belongsTo(models.Referral, { foreignKey: 'referral_id' });
    IncentivesPoolLedger.belongsTo(models.User, { foreignKey: 'user_id' });
  };

  return IncentivesPoolLedger;
};
