const Sequelize = require('sequelize');
const Database = require('../structures/PostgreSQL');

const Applications = Database.db.define('applications', {
  userId: Sequelize.STRING,
  username: Sequelize.STRING,
  age: Sequelize.INTEGER,
  why: Sequelize.TEXT,
  what: Sequelize.TEXT,
  games: Sequelize.TEXT,
  bring: Sequelize.TEXT,
  skills: Sequelize.TEXT,
  length: Sequelize.TEXT,
  found: Sequelize.TEXT,
	status: {
    type: Sequelize.ENUM,
		values: [ 'voting', 'vote-review', 'pending-interview', 'paused', 'accepted', 'denied' ],
  },
  votes: Sequelize.JSONB,
  upvotes: Sequelize.INTEGER,
  downvotes: Sequelize.INTEGER,
  notes: Sequelize.JSONB,
  dateAccepted: Sequelize.DATE,
  votemessage: Sequelize.TEXT,
});

module.exports = Applications;