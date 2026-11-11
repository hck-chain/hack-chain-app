'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('presale_contributions', 'reviewed_by', {
      type: Sequelize.STRING(42), allowNull: true,
    });
    await queryInterface.addColumn('presale_contributions', 'reviewed_at', {
      type: Sequelize.DATE, allowNull: true,
    });
    await queryInterface.addColumn('presale_contributions', 'onchain_amount_usdt', {
      type: Sequelize.DECIMAL(18, 6), allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('presale_contributions', 'onchain_amount_usdt');
    await queryInterface.removeColumn('presale_contributions', 'reviewed_at');
    await queryInterface.removeColumn('presale_contributions', 'reviewed_by');
  },
};
