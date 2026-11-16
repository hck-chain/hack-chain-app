'use strict';

// Lo acreditado sale de la cadena (fase por fecha del bloque, HACK por monto
// transferido); lo declarado por el comprador se guarda aparte para auditoria.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('presale_contributions', 'declared_phase_id', { type: Sequelize.INTEGER, allowNull: true });
    await queryInterface.addColumn('presale_contributions', 'declared_hack_amount', { type: Sequelize.DECIMAL(38, 0), allowNull: true });
    await queryInterface.addColumn('presale_contributions', 'payment_block_time', { type: Sequelize.DATE, allowNull: true });
    await queryInterface.addColumn('presale_contributions', 'payment_sender', { type: Sequelize.STRING(42), allowNull: true });
    await queryInterface.addColumn('presale_contributions', 'manual_review_note', { type: Sequelize.STRING(500), allowNull: true });
  },

  down: async (queryInterface) => {
    for (const col of ['manual_review_note', 'payment_sender', 'payment_block_time', 'declared_hack_amount', 'declared_phase_id']) {
      await queryInterface.removeColumn('presale_contributions', col);
    }
  },
};
