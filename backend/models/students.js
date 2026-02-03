module.exports = (sequelize, DataTypes) => {
  const Student = sequelize.define("Student", {
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
    field_of_study: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'students',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Student.associate = (models) => {
    Student.belongsTo(models.User, {
      foreignKey: 'wallet_address',
      targetKey: 'wallet_address',
      onDelete: 'CASCADE'
    });
    Student.hasMany(models.Certificate, {  
      foreignKey: 'student_wallet_address',
      sourceKey: 'wallet_address',
      as: 'certificates'
    });
  };

  // Relate students with certificates
  Student.associate = (models) => {
    Student.hasMany(models.Certificate, { foreignKey: 'studentId' });
  }

  return Student;
};
