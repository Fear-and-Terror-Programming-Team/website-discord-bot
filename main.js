const {FriendlyError} = require('discord.js-commando');
const path = require('path');
const winston = require('winston');
const {oneLine} = require('common-tags');
const SequelizeProvider = require('./providers/Sequelize');
const CommandoClient = require('./structures/CommandoClient');
const io = require('@pm2/io');
const Log = require('./models/Log');
const Roles = require('./models/Roles');
const createUser = require('./util/createUser');
const createRole = require('./util/createRole');
const {trackVoiceActivity} = require('./events/trackVoiceActivity');
const trackMessageActivity = require('./events/trackMessageActivity');
const compareUserForUpdate = require('./util/compareUser');
const {startWebServer} = require('./webserver');
const startSquadRconMonitors = require('./structures/RconClient');
const compareRoleForUpdate = require('./util/compareRole');
const updateChannel = require('./util/updateChannel');
const moment = require('moment');
const {guildMemberUpdate} = require('./events/guildMemberUpdate');
const {guildMemberRemove} = require('./events/guildMemberRemove');
const {guildBanAdd} = require('./events/guildBanAdd');
const {Intents} = require('discord.js')

// Config
const config = require('./config.json');

// Discord Bot
const client = new CommandoClient({
    commandPrefix: config.discordBot.commandPrefix,
    unknownCommandResponse: false,
    disableEveryone: true,
    ws: {
        intents: new Intents(Intents.ALL),
    },
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

            client.guilds.fetch(config.guildId).then(g => {
                let guild = g;
                if (guild === undefined) {
                    console.warn(`Configured Discord guild (ID ${config.guildId} not found. `
                        `Skipping synchronization. `
                        `Has the bot not been added yet?`)
                    return;
                }


                console.log(`Starting synchronization of guild ${guild.name} with ${guild.memberCount} members.`)
                guild.members.cache.forEach(createUser);

                console.log(`Synchronized users.`);

                setTimeout(() => {
                    guild.roles.cache.forEach(createRole);
                    console.log(`Synchronized roles.`);

                    guild.channels.cache.array().forEach(channel => {
                        if (channel.type === 'text') {
                            channel.messages.fetch({limit: 2}, false, true)
                                .then(() => updateChannel(channel, true))
                                .catch(() => updateChannel(channel, false));
                        } else {
                            updateChannel(channel);
                        }
                    });
                    console.log(`Synchronized channels.`);
                    console.log(`Synchronization complete!`);
                }, 0);
            });

        }, 0);
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
        // TODO: Disabled commands for now, remove completely at some point
        /*
        if (msg.channel.type === 'dm') return;
        if (msg.author.bot) return;
        if (msg.content.split(msg.guild.commandPrefix)[1] === 'undefined') return;
        const args = {name: msg.content.split(msg.guild.commandPrefix)[1].toLowerCase()};
        client.registry.resolveCommand('tags:tag').run(msg, args);
         */
    })
    .on('message', async message => {
        // TODO: Disabled commands for now, remove completely at some point
        /*
        if (message.channel.type === 'dm') return;
        if (message.author.bot) return;

        const channelLocks = client.provider.get(message.guild.id, 'locks', []);
        if (channelLocks.includes(message.channel.id)) return;
        */
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

        guild.members.cache.forEach(member => {
            guild.members.cache.forEach(member => {
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
        channel.messages.fetch({limit: 2}, false, true)
            .then(() => updateChannel(channel, true))
            .catch(() => updateChannel(channel, false));
    } else {
        updateChannel(channel);
    }
});
client.on('channelUpdate', (old, channel) => {
    if (channel.type == 'text') {
        channel.messages.fetch({limit: 2}, false, true)
            .then(() => updateChannel(channel, true))
            .catch(() => updateChannel(channel, false));
    } else {
        updateChannel(channel);
    }
});

// TODO: Disabled commands for now, remove completely at some point
/*
client.registry
    .registerGroups([
        ['info', 'Info'],
        ['user', 'User'],
    ])
    .registerDefaults()
    .registerTypesIn(path.join(__dirname, 'types'))
    .registerCommandsIn(path.join(__dirname, 'commands'));
 */

client.login(config.discordBot.token);

// Side Processes
startWebServer(client);
// We don't use this atm
// startSquadRconMonitors();
