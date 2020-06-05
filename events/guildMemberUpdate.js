const LogEvent = require('../methods/LogEvent');

const guildMemberUpdate = (oldMember, newMember) => {
    const oldRoles = oldMember.roles.array();
    const newRoles = newMember.roles.array();

    // Roles have changed
    if (oldRoles.length !== newRoles.length) {
        newMember.guild.fetchAuditLogs({type: 'MEMBER_ROLE_UPDATE'})
            .then(audit => {
                const entry = audit.entries.first();

                if (entry) {
                    const target = entry.target.id;
                    const caller = entry.executor.id;

                    newMember.guild.fetchMember(caller)
                        .then(user => {
                            entry.changes.forEach(change => {
                                if (change.key === '$remove') {
                                    LogEvent(target, caller, user.nickname || user.username, 'remove-role', change.new);
                                }
                                if (change.key === '$add') {
                                    LogEvent(target, caller, user.nickname || user.username, 'add-role', change.new);
                                }
                            });
                        })
                        .catch(err => {
                            console.error(err);
                        });
                }
            });
    }
};

module.exports = {guildMemberUpdate};
