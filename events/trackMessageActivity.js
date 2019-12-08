const io = require('@pm2/io');
const MessageActivity = require('../models/MessageActivity');

const trackMessageActivity = message => {
  if (message.channel.type !== 'dm') {
    MessageActivity.create({
      userId: message.author.id,
      guild: message.channel.guild.id,
      channelName: message.channel.name,
      channelId: message.channel.id,
      messageId: message.id,
    }).catch(err => {
      io.notifyError(new Error('[DB] Log Message Activity'), {
        custom: {
          error: err,
          messageId: message.id,
        }
      });
    });
  }
}

module.exports = trackMessageActivity;