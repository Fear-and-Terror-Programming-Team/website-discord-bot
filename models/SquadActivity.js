const Sequelize = require('sequelize');

const Database = require('../structures/PostgreSQL');

const SquadActivity = Database.db.define('squadActivity', {
    steamId: Sequelize.STRING,
    serverId: Sequelize.STRING,
    time: Sequelize.BIGINT,
}, {
    indexes: [
        {fields: ['steamId']},
    ],
});

module.exports = SquadActivity;
