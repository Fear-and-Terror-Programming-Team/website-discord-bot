const Rcon = require('simple-rcon');
const config = require('../config.json');
const parseSquadRconPlayers = require('../util/parseSquadRconPlayers');
const SquadActivity = require('../models/SquadActivity');

const connections = {};
const servers = {};

const SQUAD_PLAYER_CHECK_INTERVAL = 15 * 1000; // 60 seconds

const startSquadRconMonitors = () => {

  if (config.squad.length > 0) {
    config.squad.forEach(server => {
      startConnection(server);
    });

    setInterval(checkPlayers, SQUAD_PLAYER_CHECK_INTERVAL);
  }

}

const startConnection = server => {

  const client = new Rcon({
    ...server,
    timeout: 60 * 1000,
  }).connect();

  connections[server.id] = {
    server,
    client,
    connected: false,
  };

  servers[server.id] = {
    players: {},
  };
  
  client.on('connected', () => {
    connections[server.id].connected = true;
  });

  client.on('disconnected', () => {
    connections[server.id] = {
      ...connections[server.id],
      client: null,
      connected: false
    };
  });

}

const checkPlayers = () => {
  Object.values(connections).forEach(conn => {
    if (!conn.connected || conn.client === null) {
      return startConnection(conn.server);
    }

    conn.client.exec('ListPlayers', res => {
      const players = parseSquadRconPlayers(res.body);
      processPlayers(conn.server.id, players);
    });
  });

  // TODO: Implement a cleanup that loops through all players on each server and checks
  //       if their last scene time is greater than a set amount (5 minutes or something)

  // cleanupOldPlayers();
}

const processPlayers = (server, clients) => {
  clients.players.forEach(player => {

    // It's a new un-tracked player, track them!
    if (!servers[server][player]) {
      return servers[server][player] = {
        steamId: player,
        joinTime: Date.now(),
        lastSeen: Date.now(),
      };
    }

    // Update the last time we saw this player
    servers[server][player].lastSeen = Date.now();
  });

  clients.disconnected.forEach(player => {
    // We only care about disconnected players if we're actively tracking them
    if (servers[server][player]) {
      // We're currently tracking this player....
      const timeOnServer = Math.floor((Date.now() - servers[server][player].joinTime) / 1000);

      SquadActivity.create({
        steamId: player,
        serverId: server,
        time: timeOnServer,
      });

      // TODO: Insert a log into the database to track this players playtime.

      delete servers[server][player];
    }
  });
}

module.exports = startSquadRconMonitors;