const LogEvent = require('../methods/LogEvent');

const guildMemberRemove = (member) => {
  member.guild.fetchAuditLogs({ type: 'MEMBER_KICK' })
    .then(audit => {
      const entry = audit.entries.first();

      if (entry) {
        if (member.id === entry.target.id) {
          // this user was kicked
          member.guild.fetchMember(entry.executor.id)
            .then(user => {
              LogEvent(member.id, user.id, user.nickname || user.username, 'kick-user', {
                reason: entry.reason,
              });
            })
            .catch(err => {
              console.error(err);
            });
        } else {
          // Assume the user left
          LogEvent(member.id, member.id, member.nickname || member.username, 'left-discord', {});
        }
      }
    });
};

module.exports = { guildMemberRemove };