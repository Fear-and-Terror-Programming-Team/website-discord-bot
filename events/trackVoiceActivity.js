const io = require('@pm2/io');
const moment = require('moment');
const VoiceActivity = require('../models/VoiceActivity');

const MIN_TRACK_TIME = 15; // time in seconds

// Tracks time spent in voice channels
let UserVoiceState = {};

const trackedVoiceUsers = io.metric({
    name: 'Tracked Voice Users',
    id: 'app/realtime/voiceUsers',
});

const logVoiceChannelActivity = (userId, time, channel, guild = config.guildId) => {
    // Don't track anything under set time
    if (time >= MIN_TRACK_TIME) {
        VoiceActivity.create({
            userId,
            guild,
            channelName: channel.name,
            channelId: channel.id,
            time: Math.floor(time),
            jointime: moment().utc().subtract(Math.floor(time), 'seconds').toDate(),
            leavetime: moment().utc().toDate(),
        });
    }
}

const trackVoiceActivity = (oldMember, newMember) => {
    let newUserChannel = newMember.channel;
    let oldUserChannel = oldMember.channel;


    console.log(`${newMember.member.user.username}: ${oldUserChannel} -> ${newUserChannel}`);
    // Leaving a channel
    if (oldUserChannel !== null) {

        // Both channel objects are set, check to see if they're going to a different channel
        if (newUserChannel !== null) {

            // Channel is the same, abort
            if (oldUserChannel.id === newUserChannel.id) {
                return;
            }

            // Going to a different channel
            if (UserVoiceState[newMember.id]) {
                const session = UserVoiceState[newMember.id];
                const currentTime = (Date.now() / 1000);

                logVoiceChannelActivity(newMember.id, (currentTime - session.joinTime), oldUserChannel, newMember.guild.id);

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

                console.log("COMMIT");

                logVoiceChannelActivity(newMember.id, ((Date.now() / 1000) - session.joinTime), oldUserChannel, newMember.guild.id);

                delete UserVoiceState[newMember.id];

                trackedVoiceUsers.set(Object.values(UserVoiceState).length);
            }
        }
    } else {
        // User joined a channel from nowhere
        if (newUserChannel !== null) {
            UserVoiceState[newMember.id] = {
                channel: newUserChannel.id,
                joinTime: (Date.now() / 1000),
            };

            trackedVoiceUsers.set(Object.values(UserVoiceState).length);
        }
    }
}

module.exports = {trackVoiceActivity, UserVoiceState, logVoiceChannelActivity};
