const { Client, GatewayIntentBits, Partials, EmbedBuilder, PermissionFlagsBits, PermissionBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');
var color = require('colors/safe');
require('dotenv').config({ quiet: true });

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel],
});

const commandsHandler = require("./Handlers/commands.js");
commandsHandler(client);

const eventsPath = path.join(__dirname, "Handlers");
const eventFiles = fs
    .readdirSync(eventsPath)
    .filter((file) => file.endsWith(".js"));

for(const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    if(event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

client.login(process.env.APP_TOKEN);