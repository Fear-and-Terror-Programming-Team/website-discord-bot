// Authentication
const crypto = require('crypto');
const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const Authentication = require('../../models/Authentication');

module.exports = class LinkSteamCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'signup',
			group: 'user',
			memberName: 'signup',
			description: 'Signup on the FaT Website',
			details: `Being the signup process for the FaT Website`,
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			}
		});
	}

	async run(msg, args) {
    const member = msg.member;

    Authentication.findAll({
      where: {
        discordId: member.id,
      },
    }).then(result => {
      if (result.length > 0) {
        const acc = result[0].dataValues;
        if (acc.active) {
          return member.send(`You already have an account!`);
        }
        
        return member.send(`Signup Already Pending! CreationKey: ${acc.createKey}`);
      }

      const createKey = crypto.createHash('md5').update(`${member.id}${Date.now()}`).digest("hex");

      Authentication.create({
        createKey,
        discordId: member.id,
        active: false,
        permissions: "[]",
      }).then(result => {
        console.log(result);
      }).catch(err => {
        console.log(err);
      });
  
      return member.send(`Created Pending Account, CreateKey: ${createKey}`);
    }).catch(err => {
      console.log(err);
    });
    
    // const linkedEmbed = new RichEmbed()
    //   .setColor(0x00AE86)
    //   .setTitle('Link Your Steam Account')
    //   .setURL(`http://localhost:3000/?id=${member.id}&guild=${member.guild.id}`)
    //   .setDescription('Click here to link your steam account to FaT.');

		// return msg.say(linkedEmbed);

    // return msg.say('hello');
    // return msg.say(`http://localhost:3000/?id=${member.id}&guild=${member.guild.id}`);
	}
};