// http://localhost:3000/?id=287637021969743872&guild=647252438516105232

const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');

module.exports = class LinkSteamCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'link-steam',
			aliases: ['steam'],
			group: 'user',
			memberName: 'link-steam',
			description: 'Link a steam account for FaT',
			details: `Link your steam account to FaT Systems`,
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			}
		});
	}

	async run(msg, args) {
    const member = msg.member;
    
    const linkedEmbed = new RichEmbed()
      .setColor(0x00AE86)
      .setTitle('Link Your Steam Account')
      .setURL(`http://localhost:3000/?id=${member.id}&guild=${member.guild.id}`)
      .setDescription('Click here to link your steam account to FaT.');

		return msg.say(linkedEmbed);

    // return msg.say('hello');
    // return msg.say(`http://localhost:3000/?id=${member.id}&guild=${member.guild.id}`);
	}
};