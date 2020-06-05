const {Command} = require('discord.js-commando');
const {stripIndents} = require('common-tags');

const VoiceActivity = require('../../models/VoiceActivity');

module.exports = class UserActivityCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'user-activity',
            aliases: ['activity'],
            group: 'info',
            memberName: 'activity',
            description: 'Get activity of a user.',
            details: `Get detailed activity information on the specified user.`,
            guildOnly: true,
            throttling: {
                usages: 2,
                duration: 3
            },
            args: [
                {
                    key: 'duration',
                    prompt: 'For what length of time are we checking? day, week, month, all\n',
                    type: 'string',
                    default: 'day'
                },
                {
                    key: 'member',
                    prompt: 'what user would you like to have information on?\n',
                    type: 'member',
                    default: ''
                }
            ]
        });
    }

    async run(msg, args) {
        const duration = args.duration;
        const member = args.member || msg.member;
        const {user} = member;

        const activity = await VoiceActivity.findAll({where: {userId: user.id}});

        let voiceTotal = 0;

        activity.forEach(a => {
            voiceTotal += a.time;
        });

        const voiceDays = Math.floor(voiceTotal / (3600 * 24));
        voiceTotal -= voiceDays * 3600 * 24;
        const voiceHours = Math.floor(voiceTotal / 3600);
        voiceTotal -= voiceHours * 3600;
        const voiceMinutes = Math.floor(voiceTotal / 60);
        voiceTotal -= voiceMinutes * 60;

        return msg.embed({
            color: 3447003,
            fields: [
                {
                    name: '❯ Member Activity',
                    value: stripIndents`
						• Duration: ${duration}
						• Voice: ${voiceDays} Days ${voiceHours} Hours ${voiceMinutes} Mins
					`
                }
            ],
            thumbnail: {url: user.avatarURL}
        });
    }
};
