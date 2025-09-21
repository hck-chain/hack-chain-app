module.exports = (sequelize, DataTypes) => {
  const UserSession = sequelize.define("UserSession", {
    id: {
      type: DataTypes.STRING(128),
      primaryKey: true
    },
    wallet_address: {
      type: DataTypes.STRING(42),
      allowNull: false,
      references: {
        model: 'users',
        key: 'wallet_address'
      },
      onDelete: 'CASCADE'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'user_sessions',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  UserSession.associate = (models) => {
    UserSession.belongsTo(models.User, {
      foreignKey: 'wallet_address',
      targetKey: 'wallet_address',
      onDelete: 'CASCADE'
    });
  };

  return UserSession;
};