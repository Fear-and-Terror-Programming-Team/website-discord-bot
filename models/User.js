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
        values: ['', 'pending', 'recruit', 'member', 'leader', 'moderator', 'administrator', 'asst-manager', 'manager', 'director'],
    },
    roles: Sequelize.TEXT,
    avatar: Sequelize.STRING,
    ambassador: Sequelize.STRING,
    joindate: Sequelize.TIME,
    tz: Sequelize.STRING,
    military: Sequelize.STRING,
}, {
    indexes: [
        {fields: ['userId', 'guild']},
    ],
});
module.exports = User;
