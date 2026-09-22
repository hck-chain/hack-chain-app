module.exports = (sequelize, DataTypes) => {
  // Cursor de progreso del escaneo periódico de la dirección de recepción
  // (BE-08), para que el cron sepa desde qué bloque seguir.
  const ScanState = sequelize.define("ScanState", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: false,
      defaultValue: 1 // fila única
    },
    last_scanned_block: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 }
  }, {
    tableName: 'scan_states',
    underscored: true,
    timestamps: true, // updated_at sirve como "última corrida"
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return ScanState;
};
