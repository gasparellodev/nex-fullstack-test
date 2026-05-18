'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transactions', {
      id: { type: Sequelize.CHAR(36), primaryKey: true, allowNull: false },
      user_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      description: { type: Sequelize.STRING(255), allowNull: false },
      occurred_at: { type: Sequelize.DATEONLY, allowNull: false },
      points: { type: Sequelize.BIGINT, allowNull: false },
      amount_cents: { type: Sequelize.BIGINT, allowNull: false },
      status: {
        type: Sequelize.ENUM('approved', 'rejected', 'pending'),
        allowNull: false,
      },
      import_batch_id: { type: Sequelize.CHAR(36), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('transactions', ['user_id', 'status'], {
      name: 'tx_user_status_idx',
    });
    await queryInterface.addIndex('transactions', ['user_id', 'occurred_at'], {
      name: 'tx_user_date_idx',
    });
    await queryInterface.addIndex('transactions', ['occurred_at', 'status', 'amount_cents'], {
      name: 'tx_admin_filter_idx',
    });
    await queryInterface.sequelize.query(
      'CREATE FULLTEXT INDEX tx_description_fulltext ON transactions (description)',
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('transactions');
  },
};
