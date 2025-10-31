const { ActivityType, Events } = require('discord.js');
var color = require('colors/safe');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(color.blue(`🌐 ⟯ ${client.user.username} has been started !`));
	},
};