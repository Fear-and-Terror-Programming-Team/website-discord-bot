const User = require('../models/User');

const updateUser = (member, changes) => {

  User.update(changes, { where: { userId: member.user.id, guild: member.guild.id } })
    .catch(err => console.error(err));
}

module.exports = updateUser;