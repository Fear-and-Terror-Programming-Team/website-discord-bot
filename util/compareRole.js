const io = require('@pm2/io');
const Roles = require('../models/Roles');

const compareRoleForUpdate = (oldRole, newRole, fromDB = false) => {
    let changes = {};

    if (oldRole.name !== newRole.name) {
        changes = {
            ...changes,
            roleName: newRole.name,
        };
    }

    if (Object.keys(changes).length > 0) {
        Roles.update(changes, {
            where: {
                roleId: newRole.id,
                guild: newRole.guild.id,
            },
        }).catch(err => {
            io.notifyError(new Error('[DB] Update Role'), {
                custom: {
                    error: err,
                    roleId: newRole.id,
                }
            });
        });
    }
}

module.exports = compareRoleForUpdate;
