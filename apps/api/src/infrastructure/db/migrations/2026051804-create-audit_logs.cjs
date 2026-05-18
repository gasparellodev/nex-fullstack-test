'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('audit_logs', {
      id: { type: Sequelize.CHAR(36), primaryKey: true, allowNull: false },
      actor_id: { type: Sequelize.CHAR(36), allowNull: false },
      action: { type: Sequelize.STRING(80), allowNull: false },
      target_user_id: { type: Sequelize.CHAR(36), allowNull: true },
      metadata: { type: Sequelize.JSON, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('audit_logs', ['actor_id', 'action'], {
      name: 'audit_actor_action_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('audit_logs');
  },
};
