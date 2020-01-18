const express = require('express');
const server = express();
const port = 4500;

const User = require('./models/User');

// Config
const config = require('./config.json');

const startWebServer = client => {

  server.get('/', (req, res) => {
    res.status(200).send({
      online: true,
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
  
  server.listen(port, () => {
    console.log(`Listening on ${port}`);
  });
}

module.exports = {
  startWebServer,
};