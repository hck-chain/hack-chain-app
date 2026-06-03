// backend/models/talentInvitations.js
//
// Pending and claimed talent invitations triggered when an educator tries to
// issue a certificate to an unregistered wallet — see DS Section 5.
//
// `student_wallet_address` is a string, not a foreign key, because the invited
// wallet may not yet have a `users` row (that's the whole point of the
// invitation). When the talent registers, the registration use case looks up
// pending invitations by wallet and marks them claimed.

module.exports = (sequelize, DataTypes) => {
  const TalentInvitation = sequelize.define("TalentInvitation", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    educator_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    // Lowercase 0x-prefixed Ethereum address. Not an FK — the wallet may not
    // exist as a user yet.
    student_wallet_address: {
      type: DataTypes.STRING(42),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "pending",
    },
    claimed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: "talent_invitations",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    // No updatedAt: invitations transition pending -> claimed once and we
    // capture the timestamp explicitly in `claimed_at`.
    updatedAt: false,
  });

  TalentInvitation.associate = (models) => {
    TalentInvitation.belongsTo(models.User, {
      foreignKey: "educator_user_id",
      targetKey: "id",
      as: "educator",
    });
  };

  return TalentInvitation;
};
