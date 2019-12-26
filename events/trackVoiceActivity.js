const io = require('@pm2/io');
const moment = require('moment');
const VoiceActivity = require('../models/VoiceActivity');

const MIN_TRACK_TIME = 15; // time in seconds

// Tracks time spent in voice channels
const UserVoiceState = {};

const trackedVoiceUsers = io.metric({
  name: 'Tracked Voice Users',
  id: 'app/realtime/voiceUsers',
});

const logVoiceChannelActivity = (member, time, channel) => {
  // Don't track anything under set time
  if (time >= MIN_TRACK_TIME) {
    VoiceActivity.create({
      userId: member.id,
      guild: member.guild.id,
      channelName: channel.name,
      channelId: channel.id,
      time: Math.floor(time),
      jointime: moment().utc().subtract(Math.floor(time), 'seconds').toDate(),
      leavetime: moment().utc().toDate(),
    });
  }
}

const trackVoiceActivity = (oldMember, newMember) => {
  let newUserChannel = newMember.voiceChannel;
  let oldUserChannel = oldMember.voiceChannel;

  // Leaving a channel
  if (oldUserChannel !== undefined) {
    
    // Both channel objects are set, check to see if they're going to a different channel
    if (newUserChannel !== undefined) {

      // Channel is the same, abort
      if (oldUserChannel.id === newUserChannel.id) {
        return;
      }

      // Going to a different channel
      if (UserVoiceState[newMember.id]) {
        const session = UserVoiceState[newMember.id];
        const currentTime = (Date.now() / 1000);

        logVoiceChannelActivity(newMember, (currentTime - session.joinTime), oldUserChannel);

        // We should have this already, update their channel id...
        UserVoiceState[newMember.id] = {
          channel: newUserChannel.id,
          joinTime: currentTime,
        };

      } else {
        // Somehow we don't have any stored channels... maybe they were in when the bot turned on? Define it.
        UserVoiceState[newMember.id] = {
          channel: newUserChannel.id,
          joinTime: (Date.now() / 1000),
        };
      }
    
    // The user is leaving from a voice channel going nowhere new
    } else {
      if (UserVoiceState[newMember.id]) {
        const session = UserVoiceState[newMember.id];

        logVoiceChannelActivity(newMember, ((Date.now() / 1000) - session.joinTime), oldUserChannel);
        
        delete UserVoiceState[newMember.id];

        trackedVoiceUsers.set(Object.values(UserVoiceState).length);
      }
    }
  } else {
    // User joined a channel from nowhere
    if (newUserChannel !== undefined) {
      UserVoiceState[newMember.id] = {
        channel: newUserChannel.id,
        joinTime: (Date.now() / 1000),
      };

      trackedVoiceUsers.set(Object.values(UserVoiceState).length);
    }
  }
}

module.exports = trackVoiceActivity;