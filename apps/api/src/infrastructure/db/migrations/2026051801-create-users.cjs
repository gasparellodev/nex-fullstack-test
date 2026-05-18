'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.CHAR(36), primaryKey: true, allowNull: false },
      name: { type: Sequelize.STRING(120), allowNull: false },
      email: { type: Sequelize.STRING(180), allowNull: false },
      cpf_encrypted: { type: Sequelize.BLOB('medium'), allowNull: false },
      cpf_hash: { type: Sequelize.CHAR(64), allowNull: false },
      password_hash: { type: Sequelize.STRING(72), allowNull: false },
      role: {
        type: Sequelize.ENUM('admin', 'user'),
        allowNull: false,
        defaultValue: 'user',
      },
      consent_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('users', ['email'], {
      unique: true,
      name: 'users_email_unique',
    });
    await queryInterface.addIndex('users', ['cpf_hash'], {
      unique: true,
      name: 'users_cpf_hash_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
