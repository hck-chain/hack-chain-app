// backend/models/presaleContributions.js
//
// Libro de aportes de la preventa de HACK.
//
// La compra ocurre fuera de la cadena: el comprador transfiere USDT a la
// direccion oficial y sube el comprobante. Esta tabla es el registro de esos
// aportes mientras la venta esta abierta. Al cerrarla, las filas en estado
// 'validated' se exportan como el par beneficiario -> cantidad que el multisig
// escribe en PresaleAllocation.allocateBatch (ver contracts/src).
//
// El comprobante NO se guarda aca ni en disco: viaja de la memoria del
// servidor a Pinata (IPFS) y lo unico que persiste es el CID.
module.exports = (sequelize, DataTypes) => {
  const PresaleContribution = sequelize.define("PresaleContribution", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // Siempre en minusculas: es la clave con la que el comprador vuelve a
    // encontrar su aporte, y la que termina en allocateBatch.
    wallet_address: {
      type: DataTypes.STRING(42),
      allowNull: false,
    },
    phase_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // DECIMAL y no FLOAT: son montos de dinero, no toleran el redondeo binario.
    usdt_amount: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: false,
    },
    // HACK enteros (no wei). La conversion a 18 decimales se hace al exportar
    // el lote para el contrato, que es el unico lugar que necesita esa unidad.
    hack_amount: {
      type: DataTypes.DECIMAL(38, 0),
      allowNull: false,
    },
    // Hash de la transferencia de USDT. Unico: impide que el mismo pago se
    // registre dos veces, que es el modo de abuso evidente de un alta manual.
    tx_hash: {
      type: DataTypes.STRING(66),
      allowNull: true,
      unique: true,
    },
    // CID que devuelve Pinata. El archivo vive en IPFS, no en el servidor.
    proof_cid: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    // Link al comprobante tal como lo guardamos (ipfs://<cid>).
    proof_uri: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'validated', 'rejected']],
      },
    },
    rejection_reason: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    validated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Auditoria de la revision: quien la hizo (wallet admin) y cuando. Vale
    // tanto para validar como para rechazar. En un flujo que aprueba dinero
    // no puede faltar quien tomo cada decision.
    reviewed_by: {
      type: DataTypes.STRING(42),
      allowNull: true,
    },
    reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Lo que realmente se movio en cadena segun la verificacion, que puede
    // ser mas que lo declarado. La asignacion se calcula sobre lo declarado.
    onchain_amount_usdt: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: true,
    },
  }, {
    tableName: 'presale_contributions',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['wallet_address'] },
      { fields: ['status'] },
    ],
  });

  return PresaleContribution;
};
