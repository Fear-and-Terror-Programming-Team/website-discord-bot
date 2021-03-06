const express = require('express');
const server = express();
const port = 4500;
const {UserVoiceState, logVoiceChannelActivity} = require('./events/trackVoiceActivity');
const io = require('@pm2/io');
const {MessageEmbed} = require("discord.js");


const Applications = require('./models/Applications');

// Config
const config = require('./config.json');

const startWebServer = client => {

    server.use(express.json());
    server.use(function (req, res, next) {
        let secret = req.query.secret;
        if (secret === undefined) {
            secret = req.body.secret;
        }

        if (secret !== config.applicationSecret) {  // TODO: BETTER SECURITY
            console.log(`${secret} != ${config.applicationSecret}`)
            return res.status(500).send({
                error: true,
                message: 'Invalid Application Secret. d0n7 h4ck pl0x',
            });
        }

        next()
    });

    server.get('/', (req, res) => {
        res.status(200).send({
            online: true,
        });
    });

    // Delete old application voting messages
    server.get('/application/voting/delete', (req, res) => {

        const id = req.query.id;

        const guild = client.guilds.cache.find(g => g.id === config.guildId);
        const channel = guild.channels.cache.find(c => c.id === config.discordChannels.votingChannel);

        try {
            channel.messages.fetch(id)
                .then(msg => {
                    msg.delete()
                        .then(() => {
                            return res.status(200).send({
                                complete: true,
                            });
                        });
                })
                .catch(err => {
                    return res.status(200).send({
                        complete: false,
                        message: 'message doesnt exist',
                    });
                });
        } catch (e) {
            return res.status(200).send({
                complete: false,
            });
        }
    });

    // A new application is ready for voting
    server.get('/application', (req, res) => {
        const uid = req.query.userId;
        const userId = req.query.userId;

        console.log(`GOT APPLICATION: ${userId} -- ${uid}`);

        if (!uid) {
            return res.status(500).send({
                error: true,
                message: 'Invalid UID',
            });
        }

        const guild = client.guilds.cache.find(g => g.id === config.guildId);
        const channel = guild.channels.cache.find(c => c.id === config.discordChannels.votingChannel); // application-voting-test

        if (channel) {
            return channel.send(`<@&${config.discordRoles.ambassador}> \n A new application has been posted by <@${uid}>. Please place your votes!\n http://${config.urls.personnel}/applications/${userId}`)
                .then(message => {

                    // Update the application w/ the message id so we can delete it later
                    return Applications.update({
                        votemessage: message.id,
                    }, {
                        where: {
                            userId,
                        },
                    })
                        .then(result => {
                            return res.status(200).send({
                                complete: true,
                            });
                        }, err => {
                            console.error(err);

                            return res.status(500).send({
                                complete: false,
                            });
                        });


                    // 672146165554348062
                    // 602969331269369856 - Channel ID
                })
                .catch(err => {
                    console.error(err);
                    res.status(500).send({
                        complete: false,
                    });
                });
        }

        res.status(500).send({
            complete: false,
        });
    });

    // A new applicant passed voting
    server.get('/applicant/welcome', (req, res) => {
        const uid = req.query.userId;

        if (!uid) {
            return res.status(500).send({
                error: true,
                message: 'Invalid UID',
            });
        }

        const guild = client.guilds.cache.find(g => g.id === config.guildId);
        const channel = guild.channels.cache.find(c => c.id === config.discordChannels.applicantsGeneral);
        const role = guild.roles.cache.find(r => r.id === config.discordRoles.applicant);

        guild.members.fetch(uid)
            .then(user => {
                if (user && role && channel) {
                    user.roles.add(role).catch(console.error);

                    channel.send(`<@${uid}> your application has been APPROVED! Please refer to the <#${config.discordChannels.applicantInformation}> channel on how to proceed on becoming a member of Fear and Terror!`);

                    return res.status(200).send({
                        complete: true,
                    });
                }

                if (!user) {
                    io.notifyError(new Error('[Application] User Application Approval failed'), {
                        custom: {
                            error: 'Failed to find user for promotion to applicant',
                            userId: uid,
                        }
                    });
                }

                res.status(500).send({
                    complete: false,
                });
            })
            .catch(err => {
                console.error(err);
                res.status(500).send({
                    complete: false,
                });
            });
    });

    server.get('/applicant/completed', (req, res) => {
        const uid = req.query.userId;
        const steamId = req.query.steamId;
        const military = req.query.military;
        const tz = req.query.tz;
        const ambassador = req.query.ambassador;

        if (!uid) {
            return res.status(500).send({
                error: true,
                message: 'Invalid UID',
            });
        }

        const guild = client.guilds.cache.find(g => g.id === config.guildId);

        if (!guild) {
            return res.status(500).send({
                error: true,
                message: 'Guild not found',
            });
        }

        const records = guild.channels.cache.find(c => c.id === config.discordChannels.fatRecords); // FaT-Records Channel

        if (records) {
            guild.members.fetch(ambassador)
                .then(ambassador => {
                    const embed = new MessageEmbed()
                        .setAuthor(ambassador.nickname || ambassador.username)
                        .setImage(ambassador.avatarURL)
                        .addField('Recruit', `<@${uid}>`, false)
                        .addField('Steam ID', steamId, false)
                        .addField('Military', military, false)
                        .addField('Timezone', tz, false)
                        .addField('Profile', `http://${config.urls.personnel}/user/${uid}`, false)
                        .setColor(0x00AE86)
                        .setTimestamp();

                    records.send(embed);

                    return res.status(200).send({
                        complete: true,
                    });
                }).catch(err => {
                console.error(err);
                return res.status(500).send({
                    complete: false,
                });
            });
        }
    });

    // Gives the applicants recruit tags, removes
    server.get('/applicant/accepted', (req, res) => {
        const uid = req.query.userId;

        if (!uid) {
            return res.status(500).send({
                error: true,
                message: 'Invalid UID',
            });
        }

        const guild = client.guilds.cache.find(g => g.id === config.guildId);

        if (!guild) {
            return res.status(500).send({
                error: true,
                message: 'Guild not found',
            });
        }

        const applicant = guild.roles.cache.find(r => r.id === config.discordRoles.applicant);
        const recruit = guild.roles.cache.find(r => r.id === config.discordRoles.recruit);

        guild.members.fetch(uid)
            .then(user => {
                if (user && applicant && recruit) {
                    user.roles.remove(applicant).catch(console.error);
                    user.roles.add(recruit).catch(console.error);

                    user.send(`Hey ${user.displayName}, welcome to Fear and Terror! Here's a link to Fear and Terrors Steam Group https://steamcommunity.com/groups/FearandTerror`)
                        .catch(console.error);

                    if (!user.displayName.includes('[FaTr]')) {
                        user.setNickname(`[FaTr] ${user.displayName}`)
                            .then(() => {
                                return res.status(200).send({
                                    complete: true,
                                });
                            })
                            .catch(err => {
                                return res.status(500).send({
                                    error: true,
                                    message: 'No permissions',
                                });
                            });

                        return;
                    }
                }

                if (!user) {
                    io.notifyError(new Error('[Application] Recruit Promotion'), {
                        custom: {
                            error: 'Failed to find user for promotion to recruit',
                            userId: uid,
                        }
                    });
                }

                res.status(500).send({
                    complete: false,
                });
            })
            .catch(err => {
                console.error(err);
                res.status(500).send({
                    complete: false,
                });
            });
    });

    server.get('/applicant/denied', (req, res) => {
        const uid = req.query.userId;

        if (!uid) {
            return res.status(500).send({
                error: true,
                message: 'Invalid UID',
            });
        }

        const guild = client.guilds.cache.find(g => g.id === config.guildId);

        if (!guild) {
            return res.status(500).send({
                error: true,
                message: 'Guild not found',
            });
        }

        guild.members.fetch(uid)
            .then(user => {
                if (user) {
                    user.send(`Hey ${user.displayName}, after review by our Ambassador Team, your application has been denied. Please feel free to try again after a 2 week waiting period.`)
                        .catch(console.error);

                    return res.status(200).send({
                        complete: true,
                    });
                }

                res.status(500).send({
                    complete: false,
                });
            })
            .catch(err => {
                console.error(err);
                res.status(500).send({
                    complete: false,
                });
            });
    });

    // Pings a recruit in the channel-signups for tags
    server.get('/applicant/channel-signup', (req, res) => {
        const uid = req.query.userId;

        if (!uid) {
            return res.status(500).send({
                error: true,
                message: 'Invalid UID',
            });
        }

        const guild = client.guilds.cache.find(g => g.id === config.guildId);

        if (!guild) {
            return res.status(500).send({
                error: true,
                message: 'Guild not found',
            });
        }

        const channel = guild.channels.cache.find(c => c.id === config.discordChannels.channelSignups);

        if (channel) {
            channel.send(`<@${uid}> Review this channel to signup for your main games and channels! This message will auto-delete in 10 seconds.`)
                .then(message => {
                    message.delete({ timeout: 10000 });
                });

            return res.status(200).send({
                complete: true,
            });
        }

        res.status(500).send({
            complete: false,
        });
    });

    server.get('/update', (req, res) => {
        let count = 0;

        Object.keys(UserVoiceState).forEach(key => {
            const session = UserVoiceState[key];
            const currentTime = (Date.now() / 1000);
            logVoiceChannelActivity(key, (currentTime - session.joinTime), session.channel);
            delete UserVoiceState[key];
            count++;
        });

        res.status(200).send({
            completed: true,
            users: count,
        });
    });

    // Gives the applicants recruit tags, removes
    server.post('/activity-check/assign-warning-role', (req, res) => {
        const userIdsRaw = req.body.userIds;

        if (!userIdsRaw) {
            return res.status(400).send({
                error: true,
                message: 'userIds must be supplied',
            });
        }
        const userIds = new Set(userIdsRaw
            .replace('"', '')
            .replace('[', '')
            .replace(']', '')
            .replace(' ', '')
            .split(','));

        const guild = client.guilds.cache.find(g => g.id === config.guildId);

        if (!guild) {
            return res.status(500).send({
                error: true,
                message: 'Guild not found',
            });
        }

        const inactivityWarningRole = guild.roles.cache.find(r => r.id === config.discordRoles["inactivity-warning"]);

        userIds.forEach((userId) => {
            guild.members.fetch(userId)
            .then(member => {
                console.log(`${member.displayName} got ${inactivityWarningRole.name}`);
                // TODO: arm
                member.roles.add(inactivityWarningRole).catch(console.error);
            }).catch(err => {
                console.error(err);
                console.log(`Can't get user with ID ${userId}`)
            });
        });
        res.status(200).send();
    });

    // Gives the applicants recruit tags, removes
    server.post('/activity-check/strip-roles', (req, res) => {
        const userIdsRaw = req.body.userIds;

        if (!userIdsRaw) {
            return res.status(400).send({
                error: true,
                message: 'userIds must be supplied',
            });
        }
        const userIds = new Set(userIdsRaw
            .replace('"', '')
            .replace('[', '')
            .replace(']', '')
            .replace(' ', '')
            .split(','));

        const guild = client.guilds.cache.find(g => g.id === config.guildId);

        if (!guild) {
            return res.status(500).send({
                error: true,
                message: 'Guild not found',
            });
        }

        const inactiveRole = guild.roles.cache.find(r => r.id === config.discordRoles.inactive);

        userIds.forEach((userId) => {
            guild.members.fetch(userId)
                .then(member => {
                    console.log(`${member.displayName} was stripped of their roles`);
                    member.roles.remove(member.roles.cache).then(() => {
                        member.roles.add(inactiveRole).then(() => {
                            let name = member.displayName;
                            name = name.replace(new RegExp("^\\[FaTr?\\] ?"), "");
                            member.setNickname(name)
                            .then(() => {
                                console.log(`${member.displayName} was stripped of their roles`);
                                member.createDM().then(channel => {
                                    channel.send(
                                        // TODO: extract string
                                        "Hello, You are being contacted by the Fear and Terror Personnel Team. \n" +
                                        "\n" +
                                        "> We regret to inform you that you will be removed as an official Fear and Terror Member. Because you did not meet the 1 hour of voice activity per 2 week period, we have found you to be inactive within our clan. \n" +
                                        "\n" +
                                        " ***You will not be removed from the Fear and Terror Discord***, only things that will be removed is your **`Rank, Roles, Whitelists, and FaT Tag.`**\n" +
                                        "\n" +
                                        "> **If you feel you have been removed wrongly because you are on a leaving-notice please feel free to ping @FaT- Personnel in help-desk or if you have an extreme circumstance that you believe should make you exempt please DM Kilrim or the Personnel Manager.**\n" +
                                        "\n" +
                                        "Fear and Terror wants Active members, with an Active playerbase. \n" +
                                        "If you wish to rejoin Fear and Terror, **you will need to reapply in #inactive-rejoin-the-group and follow the directions in that channel.** If you have any questions, comments, or concerns, please go to Help-Desk under Staff Contact and tag @FaT-Personnel and or @Kilrim.\n" +
                                        "\n" +
                                        "We apologize if this comes as an inconvenience,\n" +
                                        "Fear and Terror Personnel Team/Kilrim"
                                    ).then(() => {
                                        console.log(`${member.displayName} was notified of their removal`);
                                    }).catch(err => {
                                        console.log(`${member.displayName} has DMs blocked`);
                                    })
                                })
                            })
                            .catch(err => {
                                console.error(err);
                                console.error(`Could not rename ${member.displayName}`)
                            });
                        }).catch(err => {
                            console.error(err);
                            console.error(`Could not assign inactive role to ${member.displayName}`);
                        });
                    }).catch(err => {
                        console.error(err);
                        console.error(`Could not strip roles of ${member.displayName}`)
                    });
                });
        });
        res.status(200).send();
    });

    server.listen(port, () => {
        console.log(`Listening on ${port}`);
    });
}

module.exports = {
    startWebServer,
};
