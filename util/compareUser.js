const updateUser = require('./updateUser');

const compareUserForUpdate = (oldMember, newMember, fromDB = false) => {
  let changes = {};

  // Old member roles
  let oldRoles = [];
  if (fromDB) {
    oldRoles = oldMember.roles;
  } else {
    oldMember.roles.forEach(role => {
      oldRoles.push(role.id);
    });
    oldRoles = JSON.stringify(oldRoles);
  }

  // New member roles
  let newRoles = [];
  newMember.roles.forEach(role => {
    newRoles.push(role.id);
  });
  newRoles = JSON.stringify(newRoles);
  
  // Check for username changes
  const oldUsername = fromDB ? oldMember.username : oldMember.user.username;
  if (oldUsername !== newMember.user.username) {
    changes = {
      ...changes,
      username: newMember.user.username,
    };
  }

  // Check for role changes
  if (oldRoles !== newRoles) {
    changes = {
      ...changes,
      roles: newRoles,
    };
  }

  // Check for nickname changes
  if (oldMember.nickname !== newMember.nickname) {
    changes = {
      ...changes,
      nickname: newMember.nickname,
    };
  }

  if (Object.keys(changes).length > 0) {
    updateUser(newMember, changes);
  }
}

module.exports = compareUserForUpdate;