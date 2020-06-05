const io = require('@pm2/io');
const Roles = require('../models/Roles');
const compareRoleForUpdate = require('./compareRole');

const createRole = role => {

    // Check if we know this role
    Roles.findAll({
        where: {
            roleId: role.id,
            guild: role.guild.id,
        },
    }).then(res => {
        if (res.length < 1) {

            // This is a new role, create it
            Roles.create({
                roleId: role.id,
                guild: role.guild.id,
                roleName: role.name,
            }).catch(err => {
                io.notifyError(new Error('[DB] Create Role'), {
                    custom: {
                        error: err,
                        roleId: role.id,
                    },
                });
            });

        } else {
            const result = res[0].dataValues;
            compareRoleForUpdate(result, role, true);
        }
    }).catch(err => {
        io.notifyError(new Error('[DB] Create Role'), {
            custom: {
                error: err,
                roleId: role.id,
            }
        });
    });
}

module.exports = createRole;
