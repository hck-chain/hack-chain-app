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
    // Payment fields — populated when HackEscrow contract is deployed
    payment_status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'unpaid',
      validate: { isIn: [['unpaid', 'escrowed', 'released', 'refunded']] },
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
    cancellation_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
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
  };

  return ClassRequest;
};
