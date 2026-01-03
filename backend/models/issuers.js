module.exports = (sequelize, DataTypes) => {
  const Issuer = sequelize.define("Issuer", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    wallet_address: {
      type: DataTypes.STRING(42),
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'wallet_address'
      },
      onDelete: 'CASCADE',
    },
    organization_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    }
  }, {
    tableName: 'issuers',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Issuer.associate = (models) => {
    Issuer.belongsTo(models.User, {
      foreignKey: 'wallet_address',
      targetKey: 'wallet_address',
      onDelete: 'CASCADE'
    });
    Issuer.hasMany(models.Certificate, {
      foreignKey: 'issuer_wallet_address',
      sourceKey: 'wallet_address'
    });
  };

  return Issuer;
};
