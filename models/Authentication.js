const Sequelize = require('sequelize');
const Database = require('../structures/PostgreSQL');

const Authentication = Database.db.define('accounts', {
  createKey: Sequelize.STRING,
  discordId: Sequelize.STRING,
  username: { type: Sequelize.STRING, unique: true },
  password: Sequelize.STRING,
  active: Sequelize.BOOLEAN,
  permissions: Sequelize.TEXT,
}, {
	indexes: [
		{ fields: ['username'] },
	],
});

module.exports = Authentication;
