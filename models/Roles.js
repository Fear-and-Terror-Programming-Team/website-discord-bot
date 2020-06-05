const Sequelize = require('sequelize');

const Database = require('../structures/PostgreSQL');

const Roles = Database.db.define('roles', {
    guild: Sequelize.STRING,
    roleId: Sequelize.STRING,
    roleName: Sequelize.STRING,
}, {
    indexes: [
        {fields: ['roleId']},
    ],
});

module.exports = Roles;
