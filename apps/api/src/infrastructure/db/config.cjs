'use strict';

require('dotenv').config({ path: require('node:path').resolve(__dirname, '../../../../../.env') });

const common = {
  username: process.env.MYSQL_USER ?? 'nex',
  password: process.env.MYSQL_PASSWORD ?? 'nex',
  database: process.env.MYSQL_DATABASE ?? 'nex',
  host: process.env.MYSQL_HOST ?? '127.0.0.1',
  port: Number(process.env.MYSQL_PORT ?? 3306),
  dialect: 'mysql',
  logging: false,
  define: { underscored: true, timestamps: true },
};

module.exports = {
  development: common,
  test: { ...common, database: `${common.database}_test` },
  production: common,
};
