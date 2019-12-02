const Sequelize = require('sequelize');

const Database = require('../structures/PostgreSQL');

const Log = Database.db.define('logs', {
  caller: Sequelize.STRING,
  guild: Sequelize.STRING,
  command: Sequelize.STRING,
	args: Sequelize.STRING,
});

module.exports = Log;