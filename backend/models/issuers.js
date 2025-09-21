// backend/models/issuers.js
// Issuer model. privateKey should not be persisted in production. Use allowNull:true for compatibility.

module.exports = (sequelize, DataTypes) => {
  const Issuer = sequelize.define(
    "Issuer",
    {
      name: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: { isEmail: true }
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: false
      },
      walletAddress: {
        type: DataTypes.STRING,
        allowNull: false
      },

    },
    {
      tableName: 'Issuers',
      timestamps: true
    }
  );

  Issuer.associate = (models) => {
    Issuer.hasMany(models.Certificate, { foreignKey: 'issuerId' });
  };

  return Issuer;
};
