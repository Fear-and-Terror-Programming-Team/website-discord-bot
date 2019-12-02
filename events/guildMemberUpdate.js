const updateUser = require('../util/updateUser');

const guildMemberUpdate = (oldUser, newUser) => {
  let changes = {};

  if (oldUser.nickname !== newUser.nickname) {
    changes = {
      ...changes,
      nickname: newUser.nickname,
    };
  }
  
  if (Object.keys(changes).length > 0) {
    updateUser(newUser, changes);
  }
}

module.exports = guildMemberUpdate;