const io = require('@pm2/io');
const Channels = require('../models/Channels');

const updateChannel = (channel, access = true) => {
  if (channel.type === 'dm') {
    return;
  }

  Channels.findAll({
    where: {
      channelId: channel.id,
    },
  }).then(result => {
    // create channel if it does not exist in DB
    if (result.length < 1) {
      Channels.create({
        channelId: channel.id,
        name: channel.name,
        guild: channel.guild.id,
        type: channel.type,
        access,
      }).catch(err => {
        io.notifyError(new Error('[DB] Create Channel'), {
          custom: {
            error: err,
            channelId: channel.id,
          }
        });
      });
      return;
    }

    // update name and access
    Channels.update({
      name: channel.name,
      access: access,
    }, {
      where: {
        channelId: channel.id,
      },
    }).catch(err => {
      io.notifyError(new Error('[DB] Update Channel'), {
        custom: {
          error: err,
          channelId: channel.id,
        }
      });
    });

  }).catch(err => {
    io.notifyError(new Error('[DB] Find Channel'), {
      custom: {
        error: err,
        channelId: channel.id,
      }
    });
  });
};

module.exports = updateChannel;
