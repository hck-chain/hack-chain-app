module.exports = (sequelize, DataTypes) => {
  const IssuerClass = sequelize.define("IssuerClass", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    issuer_wallet_address: {
      type: DataTypes.STRING(42),
      allowNull: false,
      references: { model: 'issuers', key: 'wallet_address' },
      onDelete: 'CASCADE',
    },
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    topics: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, {
    tableName: 'issuer_classes',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  IssuerClass.associate = (models) => {
    IssuerClass.belongsTo(models.Issuer, {
      foreignKey: 'issuer_wallet_address',
      targetKey: 'wallet_address',
    });
    IssuerClass.hasMany(models.ClassRequest, {
      foreignKey: 'issuer_class_id',
      as: 'classRequests',
    });
  };

  return IssuerClass;
};
