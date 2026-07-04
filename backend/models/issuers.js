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
    organization_name: { type: DataTypes.STRING(255), allowNull: false },
    certificates_issued: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
    share_count: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
    photo_url: { type: DataTypes.STRING(500), allowNull: true },
    bio: { type: DataTypes.TEXT, allowNull: true },
    knowledge_areas: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
    website_url: { type: DataTypes.STRING(500), allowNull: true },
    linkedin_url: { type: DataTypes.STRING(500), allowNull: true },
    twitter_url: { type: DataTypes.STRING(500), allowNull: true },
    class_settings: { type: DataTypes.JSONB, allowNull: true, defaultValue: null }
  }, {
    tableName: 'issuers',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Issuer.associate = (models) => {
    // Asociar con User
    Issuer.belongsTo(models.User, {
      foreignKey: 'wallet_address',
      targetKey: 'wallet_address',
      onDelete: 'CASCADE'
    });

    // Asociaciones con certificados
    Issuer.hasMany(models.Certificate, {
      foreignKey: 'issuer_wallet_address',
      sourceKey: 'wallet_address'
    });

  };

  return Issuer;
};
