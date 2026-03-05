module.exports = (sequelize, DataTypes) => {
  const Certificate = sequelize.define("Certificate", {

    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    issuer_wallet_address: {
      type: DataTypes.STRING(42),
      allowNull: false,
      references: {
        model: 'issuers',
        key: 'wallet_address'
      }
    },
    student_wallet_address: {        // <-- NUEVO
      type: DataTypes.STRING(42),
      allowNull: false,
      references: {
        model: 'students',
        key: 'wallet_address'
      },
      onDelete: 'CASCADE'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    certificate_hash: {
      type: DataTypes.STRING(128),
      unique: true,
      allowNull: false
    },
    blockchain_tx_hash: {
      type: DataTypes.STRING(128),
      allowNull: true
    },
    token_id: {
      type: DataTypes.STRING(78),
      allowNull: false
    },
    issue_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    is_revoked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'certificates',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Certificate.associate = (models) => {
    Certificate.belongsTo(models.Issuer, {
      foreignKey: 'issuer_wallet_address',
      targetKey: 'wallet_address'
    });
    Certificate.belongsTo(models.Student, {   // <-- NUEVO
      foreignKey: 'student_wallet_address',
      targetKey: 'wallet_address',
      as: 'student'
    });
  };

  return Certificate;
};