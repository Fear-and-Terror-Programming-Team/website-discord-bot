const Sequelize = require('sequelize');
const Database = require('../structures/PostgreSQL');

const Channels = Database.db.define('channels', {
    channelId: Sequelize.STRING,
    name: Sequelize.STRING,
    guild: Sequelize.STRING,
    type: Sequelize.STRING,
    access: Sequelize.BOOLEAN,
});

module.exports = Channels;
