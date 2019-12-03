const steamIdRegex = /[0-9]{17}/g;

const parseSquadRconPlayers = rawRcon => {
  const players = [];
  const disconnected = [];
  let atDisconnected = false;

  const lines = rawRcon.split('\n');

  lines.forEach(line => {
    // We're in the disconnected player section now
    if (line.includes('Recently Disconnected Players')) {
      atDisconnected = true;
    }

    const steamId = line.match(steamIdRegex);
    if (steamId && steamId.length == 1) {

      if (!atDisconnected) {
        players.push(steamId[0]);
      } else {
        disconnected.push(steamId[0]);
      }
    }
  });

  return { players, disconnected };
}

module.exports = parseSquadRconPlayers;