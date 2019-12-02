const User = require('../models/User');
const updateUser = require('./updateUser');

const createUser = member => {

  console.log(`Creating New User: ${member.user.username}`);

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
    .catch(err => console.error(err));
}

module.exports = createUser;