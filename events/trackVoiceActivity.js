const VoiceActivity = require('../models/VoiceActivity');

const MIN_TRACK_TIME = 60 * 1000; // 60 seconds

// Tracks time spent in voice channels
const UserVoiceState = {};

const logVoiceChannelActivity = (member, time, channel) => {
  // Don't track anything under set time
  if (time >= MIN_TRACK_TIME) {
    VoiceActivity.create({
      userId: member.id,
      guild: member.guild.id,
      channelName: channel.name,
      channelId: channel.id,
      time,
    });
  } else {
    console.log('User was only in channel for ', time);
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
        const currentTime = Date.now();

        logVoiceChannelActivity(newMember, (currentTime - session.joinTime), oldUserChannel);

        // We should have this already, update their channel id...
        UserVoiceState[newMember.id].channel = {
          channel: newUserChannel.id,
          joinTime: currentTime,
        };

      } else {
        // Somehow we don't have any stored channels... maybe they were in when the bot turned on? Define it.
        UserVoiceState[newMember.id] = {
          channel: newUserChannel.id,
          joinTime: Date.now(),
        };
      }
    
    // The user is leaving from a voice channel going nowhere new
    } else {
      if (UserVoiceState[newMember.id]) {
        const session = UserVoiceState[newMember.id];

        logVoiceChannelActivity(newMember, (Date.now() - session.joinTime), oldUserChannel);
        
        delete UserVoiceState[newMember.id];
      }
    }
  } else {
    // User joined a channel from nowhere
    if (newUserChannel !== undefined) {
      UserVoiceState[newMember.id] = {
        channel: newUserChannel.id,
        joinTime: Date.now(),
      };
    }
  }

  // console.log(oldUserChannel ? oldUserChannel.name : null, newUserChannel ? newUserChannel.name : null);
  // console.log(newUserChannel);
  
  if(oldUserChannel === undefined && newUserChannel !== undefined) {

     // User Joins a voice channel

  } else if(newUserChannel === undefined){

    // User leaves a voice channel

  }
}

module.exports = trackVoiceActivity;