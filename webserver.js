const express = require('express');
const passport = require('passport');
const session = require('express-session');
const SteamStrategy = require('passport-steam').Strategy;
const server = express();
const port = 3000;

const User = require('./models/User');

// Config
const config = require('./config.json');

const startWebServer = () => {

  passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
  passport.deserializeUser(function(obj, done) {
    done(null, obj);
  });

  passport.use(new SteamStrategy(
    {
      returnURL: 'http://localhost:3000/auth/steam/return',
      realm: 'http://localhost:3000/',
      apiKey: config.steamApiKey,
    },
    (identifier, profile, done) => {
      process.nextTick(() => {
        profile.identifier = identifier;
        return done(null, profile);
      });
    }
  ));

  server.use(session({
    secret: 'Lt*reR9Am(}Sp`JD42@xvK/N67EZ}e993Ss:hS54RfU"^smF!yb}uwmMH@R92[r!TgNd!jp6<_J.Ce_CsMb_-^f>&pxE]K5EpR+/',
    name: 'FaT-Steam-Auth',
    resave: true,
    saveUninitialized: true,
  }));
  
  server.use(passport.initialize());
  server.use(passport.session());

  server.get("/", (req, res, next) => {
    if (req.user) {
      const discordId = req.session.discordId;
      const guildId = req.session.guildId;
      const steamId = req.user._json.steamid;

      // Update the user here
      if (steamId && discordId && guildId) {
        User.update({ steamId }, { where: { userId: discordId, guild: guildId } })
          .catch(err => console.error(err));
      }

      return res.send(`
      <html>
        <head>
          <title>FaT Steam Auth</title>
        </head>
        <body>
          <h1 style="text-align: center;padding: 50px;">
            Hooray! We're done linking your steam account. Thanks!
          </h1>
        </body>
      </html>
      `);
    }

    const id = req.query.id;
    const guildId = req.query.guild;
    if (!id || !guildId) {
      return res.json({ error: 'Invalid ID or Guild' });
    }

    req.session.discordId = id;
    req.session.guildId = guildId;

    const state = id ? Buffer.from(JSON.stringify({ id })).toString('base64') : undefined;
    const authenticator = passport.authenticate('steam', { scope: [], state });
    return authenticator(req, res, next);
  });
  
  server.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
  });

  server.get('/auth/steam/return', passport.authenticate('steam', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/');
  });
  
  server.listen(port, () => {
      console.log(`Steam Auth Server listening on port ${port}`);
  });
}

module.exports = startWebServer;