'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('presale_contributions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      wallet_address: { type: Sequelize.STRING(42), allowNull: false },
      phase_id: { type: Sequelize.INTEGER, allowNull: false },
      usdt_amount: { type: Sequelize.DECIMAL(18, 6), allowNull: false },
      hack_amount: { type: Sequelize.DECIMAL(38, 0), allowNull: false },
      tx_hash: { type: Sequelize.STRING(66), allowNull: true, unique: true },
      proof_cid: { type: Sequelize.STRING(100), allowNull: true },
      proof_uri: { type: Sequelize.STRING(255), allowNull: true },
      status: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'pending',
      },
      rejection_reason: { type: Sequelize.STRING(255), allowNull: true },
      validated_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    // Busqueda del aporte propio y del registro publico por direccion.
    await queryInterface.addIndex('presale_contributions', ['wallet_address'], {
      name: 'presale_contributions_wallet_address_idx',
    });
    // El listado publico filtra siempre por status='validated'.
    await queryInterface.addIndex('presale_contributions', ['status'], {
      name: 'presale_contributions_status_idx',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('presale_contributions');
  },
};
