'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('import_batches', {
      id: { type: Sequelize.CHAR(36), primaryKey: true, allowNull: false },
      admin_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      filename: { type: Sequelize.STRING(255), allowNull: false },
      file_sha256: { type: Sequelize.CHAR(64), allowNull: false },
      total_rows: { type: Sequelize.INTEGER, allowNull: false },
      imported_rows: { type: Sequelize.INTEGER, allowNull: false },
      skipped_rows: { type: Sequelize.JSON, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('import_batches', ['file_sha256'], {
      unique: true,
      name: 'import_batches_sha256_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('import_batches');
  },
};
