const express = require('express');
const server = express();
const port = 4500;
const { UserVoiceState, logVoiceChannelActivity } = require('./events/trackVoiceActivity');

const Applications = require('./models/Applications');
const User = require('./models/User');

// Config
const config = require('./config.json');

const startWebServer = client => {

  server.use(function (req, res, next) {
    const token = req.query.token;
    
    if (token !== config.apiToken) {
      return res.status(500).send({
        error: true,
        message: 'Invalid Token',
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

    const guild = client.guilds.find(g => g.id === '398543362476605441');
    const channel = guild.channels.find(c => c.id === '602969331269369856');

    channel.fetchMessage(id)
      .then(msg => {
        msg.delete();
        return res.status(200).send({
          complete: true,
        });
      })
      .catch(err => {
        return res.status(500).send({
          complete: false,
        });
      });
  });

  // A new application is ready for voting
  server.get('/application', (req, res) => {
    const uid = req.query.uid;
    const id = req.query.id;

    if (!uid) {
      return res.status(500).send({
        error: true,
        message: 'Invalid UID',
      });
    }

    const guild = client.guilds.find(g => g.id === '398543362476605441');
    const channel = guild.channels.find(c => c.id === '602969331269369856'); // application-voting-test
    
    if (channel) {
      return channel.send(`<@&491656150073475082> \n A new application has been posted by <@${uid}>. Please place your votes!\n http://personnel.fearandterror.com/applications/${id}`)
        .then(message => {

          // Update the application w/ the message id so we can delete it later
          return Applications.update({
            votemessage: message.id,
          }, {
            where: {
              id,
            },
          })
            .then(result => {
              console.log(result);
              return res.status(200).send({
                complete: true,
              });
            }, err => {
              console.log(err);
              
              return res.status(500).send({
                complete: false,
              });
            });


          // 672146165554348062
          // 602969331269369856 - Channel ID
        })
        .catch(err => {
          console.log(err);
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
    const uid = req.query.uid;

    if (!uid) {
      return res.status(500).send({
        error: true,
        message: 'Invalid UID',
      });
    }

    const guild = client.guilds.find(g => g.id === '398543362476605441');
    const channel = guild.channels.find(c => c.id === '556582292110180360'); // applicant-general channel
    const role = guild.roles.find(r => r.id === '555959863872716813'); // Applicant role
    const user = guild.members.find(m => m.id === uid);

    if (user && role && channel) {
      user.addRole(role).catch(console.log);
      
      channel.send(`<@${uid}> your application has been APPROVED! Please refer to the <#577622870440673280> channel on how to proceed on becoming a member of Fear and Terror!`);

      return res.status(200).send({
        complete: true,
      });
    }

    res.status(500).send({
      complete: false,
    });
  });

  // Gives the applicants recruit tags, removes 
  server.get('/applicant/accepted', (req, res) => {
    const uid = req.query.uid;

    if (!uid) {
      return res.status(500).send({
        error: true,
        message: 'Invalid UID',
      });
    }

    const guild = client.guilds.find(g => g.id === '398543362476605441');
    
    if (!guild) {
      return res.status(500).send({
        error: true,
        message: 'Guild not found',
      });
    }

    const applicant = guild.roles.find(r => r.id === '555959863872716813'); // Applicant role
    const recruit = guild.roles.find(r => r.id === '398547748900831234'); // Recruit role
    const user = guild.members.find(m => m.id === uid);

    if (user && applicant && recruit) {
      user.removeRole(applicant).catch(console.log);
      user.addRole(recruit).catch(console.log);

      user.send(`Hey ${user.displayName}, welcome to Fear and Terror! Here's a link to Fear and Terrors Steam Group https://steamcommunity.com/groups/FearandTerror`)
        .catch(console.log);

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

    res.status(500).send({
      complete: false,
    });
  });

  server.get('/applicant/denied', (req, res) => {
    const uid = req.query.uid;

    if (!uid) {
      return res.status(500).send({
        error: true,
        message: 'Invalid UID',
      });
    }

    const guild = client.guilds.find(g => g.id === '398543362476605441');
    
    if (!guild) {
      return res.status(500).send({
        error: true,
        message: 'Guild not found',
      });
    }

    const user = guild.members.find(m => m.id === uid);

    if (user) {
      user.send(`Hey ${user.displayName}, after review by our Ambassador Team, your application has been denied. Please feel free to try again after a 2 week waiting period.`)
        .catch(console.log);

      return res.status(200).send({
        complete: true,
      });
    }

    res.status(500).send({
      complete: false,
    });
  });

  // Pings a recruit in the channel-signups for tags
  server.get('/applicant/channel-signup', (req, res) => {
    const uid = req.query.uid;

    if (!uid) {
      return res.status(500).send({
        error: true,
        message: 'Invalid UID',
      });
    }

    const guild = client.guilds.find(g => g.id === '398543362476605441');
    
    if (!guild) {
      return res.status(500).send({
        error: true,
        message: 'Guild not found',
      });
    }
    
    const user = guild.members.find(m => m.id === uid);
    const channel = guild.channels.find(c => c.id === '603283885442334758');

    if (user && channel) {
      channel.send(`<@${uid}> Review this channel to signup for your main games and channels! This message will auto-delete in 10 seconds.`)
        .then(message => {
          message.delete(10000);
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
  
  server.listen(port, () => {
    console.log(`Listening on ${port}`);
  });
}

module.exports = {
  startWebServer,
};