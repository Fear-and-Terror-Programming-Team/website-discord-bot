const LogEvent = require('../methods/LogEvent');

const guildBanAdd = (guild, member) => {
    guild.fetchAuditLogs({type: 'MEMBER_BAN_ADD'})
        .then(audit => {
            const entry = audit.entries.first();

            if (entry) {
                // this user was banned
                guild.fetchMember(entry.executor.id)
                    .then(user => {
                        LogEvent(member.id, user.id, user.nickname || user.username, 'ban-user', {
                            reason: entry.reason,
                        });
                    })
                    .catch(err => {
                        console.error(err);
                    });
            }
        });
};

module.exports = {guildBanAdd};
