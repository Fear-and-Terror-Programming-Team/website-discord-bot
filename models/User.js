const Sequelize = require('sequelize');

const Database = require('../structures/PostgreSQL');

const User = Database.db.define('user', {
	userId: Sequelize.STRING,
  username: Sequelize.STRING,
  nickname: Sequelize.STRING,
	guild: Sequelize.STRING,
	steamId: Sequelize.STRING,
	rank: {
		type: Sequelize.ENUM,
		values: [ '','pending','recruit','member','leader','moderator','administrator','asst-manager','manager','director' ],
	},
}, {
	indexes: [
		{ fields: ['userId','guild'] },
		{
			fields: ['userId', 'username'],
			unique: true
    },
	],
});

module.exports = User;