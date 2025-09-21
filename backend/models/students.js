// backend/models/students.js
// Student model. Note: privateKey field is set to allowNull: true for compatibility,
// but storing private keys in the DB is NOT recommended. Prefer to remove column via migration.

module.exports = (sequelize, DataTypes) => {
  const Student = sequelize.define(
    "Student",
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      age: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 0 }
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
      tableName: 'Students',
      timestamps: true
    }
  );

  Student.associate = (models) => {
    Student.hasMany(models.Certificate, { foreignKey: 'studentId' });
  };

  return Student;
};
