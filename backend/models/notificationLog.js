module.exports = (sequelize, DataTypes) => {
  // Registro de notificaciones enviadas (BE-16), para evitar duplicados
  // si el cron corre más de una vez y para dejar trazabilidad.
  const NotificationLog = sequelize.define("NotificationLog", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    contribution_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'contributions', key: 'id' }
    },
    type: {
      type: DataTypes.ENUM('received', 'validated_or_rejected', 'tranche_released'),
      allowNull: false
    },
    tranche_number: { type: DataTypes.INTEGER, allowNull: true }, // solo para 'tranche_released'
    sent_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'notification_logs',
    underscored: true,
    timestamps: false,
    indexes: [
      // Evita mandar el mismo aviso dos veces para el mismo aporte/tramo.
      { unique: true, fields: ['contribution_id', 'type', 'tranche_number'] }
    ]
  });

  NotificationLog.associate = (models) => {
    NotificationLog.belongsTo(models.Contribution, { foreignKey: 'contribution_id' });
  };

  return NotificationLog;
};
