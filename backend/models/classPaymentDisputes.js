module.exports = (sequelize, DataTypes) => {
  const ClassPaymentDispute = sequelize.define("ClassPaymentDispute", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    class_request_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'class_requests', key: 'id' },
      onDelete: 'CASCADE',
    },
    dispute_type: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: { isIn: [['deposit', 'final']] },
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'open',
      validate: { isIn: [['open', 'resolved_paid', 'resolved_unpaid']] },
    },
    opened_by_wallet: {
      type: DataTypes.STRING(42),
      allowNull: false,
    },
    resolution_note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    resolved_by_wallet: {
      type: DataTypes.STRING(42),
      allowNull: true,
    },
    resolved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'class_payment_disputes',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  ClassPaymentDispute.associate = (models) => {
    ClassPaymentDispute.belongsTo(models.ClassRequest, {
      foreignKey: 'class_request_id',
      as: 'classRequest',
    });
  };

  return ClassPaymentDispute;
};
