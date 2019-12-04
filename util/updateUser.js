const io = require('@pm2/io');
const User = require('../models/User');

const updateUserPerSecond = io.counter({
  name: 'Update User',
  id: 'app/realtime/updateUsers'
});

const updateUser = (member, changes) => {
  updateUserPerSecond.inc();
  User.update(changes, { where: { userId: member.user.id, guild: member.guild.id } })
    .then(() => {
      updateUserPerSecond.dec();
    })
    .catch(err => {
      io.notifyError(new Error('[DB] Update User'), {
        custom: {
          error: err,
          discordId: member.id,
        }
      });
      updateUserPerSecond.dec();
    });
}

module.exports = updateUser;