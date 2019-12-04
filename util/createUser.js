const io = require('@pm2/io');
const User = require('../models/User');
const updateUser = require('./updateUser');

const currentCreateUser = io.counter({
  name: 'Create Users',
  id: 'app/realtime/createUsers'
});

const createUser = member => {
  currentCreateUser.inc();

  User.findOrCreate({
    where: {
      userId: member.id,
    },
    defaults: { // set the default properties if it doesn't exist
      userId: member.id,
      username: member.user.username,
      nickname: member.nickname,
      guild: member.guild.id,
    }
  })
    .then(([ result, created ]) => {
      currentCreateUser.dec();
      if (!created) {
        let changes = {};

        // Check for username changes
        if (result.username !== member.user.username) {
          changes = {
            ...changes,
            username: member.user.username,
          };
        }

        // Check for nickname changes
        if (result.nickname !== member.nickname) {
          changes = {
            ...changes,
            nickname: member.nickname,
          };
        }

        if (Object.keys(changes).length > 0) {
          updateUser(member, changes);
        }
      }
    })
    .catch(err => {
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