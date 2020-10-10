const io = require('@pm2/io');
const User = require('../models/User');
const compareUserForUpdate = require('./compareUser');

const currentCreateUser = io.counter({
    name: 'Create Users',
    id: 'app/realtime/createUsers'
});

const createUser = member => {
    currentCreateUser.inc();

    // Build the roles array here
    let roles = [];
    member.roles.cache.forEach(role => {
        roles.push(role.id);
    });
    roles = JSON.stringify(roles);

    // Check if we know this user
    User.findAll({
        where: {
            userId: member.id,
            guild: member.guild.id,
        },
    }).then(res => {
        if (res.length < 1) {

            User.create({
                userId: member.id,
                username: member.user.username,
                nickname: member.nickname,
                guild: member.guild.id,
                avatar: member.avatar,
                roles,
            }).then(res => {
                currentCreateUser.dec();
            }).catch(err => {
                io.notifyError(new Error('[DB] Create User'), {
                    custom: {
                        error: err,
                        discordId: member.id,
                    }
                });
                currentCreateUser.dec();
            });

        } else {
            const result = res[0].dataValues;
            compareUserForUpdate(result, member, true);
            currentCreateUser.dec();
        }
    }).catch(err => {
        io.notifyError(new Error('[DB] Create User'), {
            custom: {
                error: err,
                discordId: member.id,
            }
        });
        currentCreateUser.dec();
    });
}

module.exports = createUser;
