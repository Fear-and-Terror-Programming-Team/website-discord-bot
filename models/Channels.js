const Sequelize = require('sequelize');
const Database = require('../structures/PostgreSQL');

const Channels = Database.db.define('channels', {
  channelId: Sequelize.STRING,
  name: Sequelize.STRING,
  guild: Sequelize.STRING,
});

module.exports = Channels;