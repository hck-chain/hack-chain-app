module.exports = (sequelize, DataTypes) => {
  // Fila única con la configuración global de la preventa (BE-02).
  // Se sirve desde el backend para que la dirección de recepción
  // pueda cambiarse sin volver a publicar el frontend.
  const PresaleConfig = sequelize.define("PresaleConfig", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: false,
      defaultValue: 1 // fila única, siempre id=1
    },
    network: { type: DataTypes.STRING(50), allowNull: false },
    receiving_address: { type: DataTypes.STRING(42), allowNull: false },
    accepted_asset: { type: DataTypes.STRING(50), allowNull: false },
    // Montos como texto (BE-01): nunca FLOAT, para no perder precisión.
    min_purchase_amount: { type: DataTypes.STRING(78), allowNull: false }
  }, {
    tableName: 'presale_configs',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return PresaleConfig;
};
