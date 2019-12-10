const io = require('@pm2/io');
const Channels = require('../models/Channels');

const updateChannel = (channel, access = true) => {
  Channels.findAll({
    where: {
      channelId: channel.id,
      guild: channel.guild.id,
    },
  }).then(result => {
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
    
    if (result[0].name !== channel.name || result[0].type !== channel.type) {
      Channels.update({
        name: channel.name,
        type: channel.type,
        access,
      }, {
        where: {
          channelId: channel.id,
          guild: channel.guild.id,
        },
      }).catch(err => {
        io.notifyError(new Error('[DB] Update Channel'), {
          custom: {
            error: err,
            channelId: channel.id,
          }
        });
      });
    }

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