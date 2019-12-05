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
        let roles = [];
        member.roles.forEach(role => {
          roles.push(role.id);
        });

        roles = JSON.stringify(roles);

        // Check for username changes
        if (result.username !== member.user.username) {
          changes = {
            ...changes,
            username: member.user.username,
          };
        }

        if (result.roles !== roles) {
          changes = {
            ...changes,
            roles,
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
          console.log(`Updating user: ${member.user.username} Changes: ${Object.keys(changes)}`)
          updateUser(member, changes);
        }
      }
    })
    .catch(err => {
      console.log(err);
    });
}

module.exports = createUser;