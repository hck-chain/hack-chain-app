module.exports = (sequelize, DataTypes) => {
  const Recruiter = sequelize.define("Recruiter", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
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
    company_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'recruiters',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Recruiter.associate = (models) => {
    Recruiter.belongsTo(models.User, {
      foreignKey: 'wallet_address',
      targetKey: 'wallet_address',
      onDelete: 'CASCADE'
    });
  };

  return Recruiter;
};
