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
    },
    photo_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    knowledge_areas: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    github_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    linkedin_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    twitter_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    instagram_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    share_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    tableName: 'students',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Todas las asociaciones en un solo bloque
  Student.associate = (models) => {
    // 1️⃣ Cada Student pertenece a un User
    Student.belongsTo(models.User, {
      foreignKey: 'wallet_address',
      targetKey: 'wallet_address',
      onDelete: 'CASCADE'
    });

    // 2️⃣ Cada Student puede tener muchos Certificates
    Student.hasMany(models.Certificate, {
      foreignKey: 'student_wallet_address',
      sourceKey: 'wallet_address',
      as: 'certificates'
    });
  };

  return Student;
};
