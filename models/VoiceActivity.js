const Sequelize = require('sequelize');

const Database = require('../structures/PostgreSQL');

const VoiceActivity = Database.db.define('voiceActivity', {
  userId: Sequelize.STRING,
  guild: Sequelize.STRING,
  channelName: Sequelize.STRING,
  channelId: Sequelize.STRING,
  time: Sequelize.BIGINT,
  jointime: Sequelize.TIME,
  leavetime: Sequelize.TIME,
}, {
  indexes: [
    { fields: ['userId'] },
  ],
});

module.exports = VoiceActivity;