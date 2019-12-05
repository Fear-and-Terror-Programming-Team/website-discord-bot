const Sequelize = require('sequelize');

const Database = require('../structures/PostgreSQL');

const MessageActivity = Database.db.define('messageActivity', {
  userId: Sequelize.STRING,
  guild: Sequelize.STRING,
  channelName: Sequelize.STRING,
  channelId: Sequelize.STRING,
  messageId: Sequelize.STRING,
}, {
  indexes: [
    { fields: ['userId','channelId'] },
  ],
});

module.exports = MessageActivity;