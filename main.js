  
const { FriendlyError } = require('discord.js-commando');
const path = require('path');
const winston = require('winston');
const { oneLine } = require('common-tags');
const SequelizeProvider = require('./providers/Sequelize');
const CommandoClient = require('./structures/CommandoClient');
const io = require('@pm2/io');
const Log = require('./models/Log');
const Roles = require('./models/Roles');
const createUser = require('./util/createUser');
const createRole = require('./util/createRole');
const { trackVoiceActivity } = require('./events/trackVoiceActivity');
const trackMessageActivity = require('./events/trackMessageActivity');
const compareUserForUpdate = require('./util/compareUser');
const { startWebServer } = require('./webserver');
const startSquadRconMonitors = require('./structures/RconClient');
const compareRoleForUpdate = require('./util/compareRole');
const updateChannel = require('./util/updateChannel');
const moment = require('moment');
const { guildMemberUpdate } = require('./events/guildMemberUpdate');
const { guildMemberRemove } = require('./events/guildMemberRemove');
const { guildBanAdd } = require('./events/guildBanAdd');

// Config
const config = require('./config.json');

// Discord Bot
const client = new CommandoClient({
	owner: config.owners,
	commandPrefix: config.prefix,
	unknownCommandResponse: false,
	disableEveryone: true,
});

// Log to console only for now
const myconsole = new winston.transports.Console();
winston.add(myconsole);

client.setProvider(new SequelizeProvider(client.database));

client.on('error', winston.error)
	.on('warn', winston.warn)
	.once('ready', () => {
		client.user.setActivity('Monitoring Activity...');
	
		setTimeout(() => {
			// Go through all our guilds, create new members for people we've missed while offline...
			console.log('Starting to sync all users...');

			client.guilds.forEach(guild => {
				let userCount = 0;
				
				guild.members.forEach(member => {
					createUser(member);
					userCount += 1;
				});

				console.log(`Tried to sync ${userCount} members - Guild Members: ${guild.memberCount}`);
			});

			setTimeout(() => {
				client.guilds.forEach(guild => {
					guild.roles.forEach(role => {
						createRole(role);
					});

					guild.channels.forEach(channel => {
						if (channel.type == 'text') {
							channel.fetchMessages({ limit: 2 })
								.then(() => updateChannel(channel, true))
								.catch(() => updateChannel(channel, false));
						} else {
							updateChannel(channel);
						}
					});
				});
			}, 5000);
			
		}, 10000);
  })
	.on('ready', () => {
		winston.info(oneLine`
			[DISCORD]: Client ready...
			Logged in as ${client.user.tag} (${client.user.id})
		`);
	})
	.on('disconnect', () => winston.warn('[DISCORD]: Disconnected!'))
	.on('reconnect', () => winston.warn('[DISCORD]: Reconnecting...'))
	.on('commandRun', (cmd, promise, msg, args) => {
		Log.create({
			caller: msg.author.id,
			guild: msg.guild ? msg.guild.id : 'DirectMessage',
			command: `${cmd.groupID}:${cmd.memberName}`,
			args: Object.values(args).length ? `${Object.values(args)}` : '',
		}).catch(err => null);

		winston.info(oneLine`
		[DISCORD]: ${msg.author.tag} (${msg.author.id})
		> ${msg.guild ? `${msg.guild.name} (${msg.guild.id})` : 'DM'}
		>> ${cmd.groupID}:${cmd.memberName}
		${Object.values(args).length ? `>>> ${Object.values(args)}` : ''}
	`);
	})
	.on('unknownCommand', msg => {
		if (msg.channel.type === 'dm') return;
		if (msg.author.bot) return;
		if (msg.content.split(msg.guild.commandPrefix)[1] === 'undefined') return;
		const args = { name: msg.content.split(msg.guild.commandPrefix)[1].toLowerCase() };
		client.registry.resolveCommand('tags:tag').run(msg, args);
	})
	.on('message', async message => {
		if (message.channel.type === 'dm') return;
		if (message.author.bot) return;

		const channelLocks = client.provider.get(message.guild.id, 'locks', []);
		if (channelLocks.includes(message.channel.id)) return;
	})
	.on('voiceStateUpdate', trackVoiceActivity)
	.on('commandError', (cmd, err) => {
		if (err instanceof FriendlyError) return;
		winston.error(`[DISCORD]: Error in command ${cmd.groupID}:${cmd.memberName}`, err);
	})
	.on('commandBlocked', (msg, reason) => {
		winston.info(oneLine`
			[DISCORD]: Command ${msg.command ? `${msg.command.groupID}:${msg.command.memberName}` : ''}
			blocked; User ${msg.author.tag} (${msg.author.id}): ${reason}
		`);
	})
  .on('guildCreate', guild => {
    winston.info('[TODO]: Add settings creation here for guilds');

    guild.members.forEach(member => {
			guild.members.forEach(member => {
				createUser(member);
			});
    });
  })
  .on('guildMemberAdd', createUser)
	.on('guildMemberUpdate', compareUserForUpdate);

client.on('message', trackMessageActivity);
client.on('guildMemberUpdate', guildMemberUpdate);

// Todo: Write ban logging...
client.on('guildBanAdd', guildBanAdd);

client.on('guildMemberRemove', guildMemberRemove);

client.on('roleCreate', role => {
	Roles.create({
		guild: role.guild.id,
		roleId: role.id,
		roleName: role.name,
	}).catch(err => {
		io.notifyError(new Error('[DB] Create Role'), {
			custom: {
				error: err,
				roleId: role.id,
			}
		});
	});
});
client.on('roleUpdate', compareRoleForUpdate);
client.on('roleDelete', role => {
	Roles.destroy({
		where: {
			roleId: role.id,
			guild: role.guild.id,
		},
	}).catch(err => {
		io.notifyError(new Error('[DB] Delete Role'), {
			custom: {
				error: err,
				roleId: role.id,
			}
		});
	});
});
client.on('channelCreate', channel => {	
	if (channel.type == 'text') {
		channel.fetchMessages({ limit: 2 })
			.then(() => updateChannel(channel, true))
			.catch(() => updateChannel(channel, false));
	} else {
		updateChannel(channel);
	}
});
client.on('channelUpdate', (old, channel) => {
	if (channel.type == 'text') {
		channel.fetchMessages({ limit: 2 })
			.then(() => updateChannel(channel, true))
			.catch(() => updateChannel(channel, false));
	} else {
		updateChannel(channel);
	}
});

client.registry
	.registerGroups([
		['info', 'Info'],
		['user', 'User'],
	])
	.registerDefaults()
	.registerTypesIn(path.join(__dirname, 'types'))
	.registerCommandsIn(path.join(__dirname, 'commands'));

client.login(config.token);

// Side Processes
startWebServer(client);
// We don't use this atm
// startSquadRconMonitors();
