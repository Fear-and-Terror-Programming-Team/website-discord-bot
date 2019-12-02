# FaT Activity Monitor

- Completely tracks a players activity pertaining to the **FaT** Organization
- Uses RCON to monitor SQUAD server activity
- Uses a custom Discord bot to monitor voice channel activity
- Builds a "player profile" for each individual user containing all their information, such as rank, steamid, discord names, discord id, etc.
- Creates a "single source of truth" for player information

### Install/Setup

1. Make sure you have **Node v10.0.0+** installed
1. Clone the repo
1. Run `npm install`
1. Copy `config.example.json` and rename it to `config.json`
1. Fill in `config.json` with your details
1. Run `npm start`