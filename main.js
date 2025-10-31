const { Client, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');
const color = require('colors/safe')
require('dotenv').config({ quiet: true });

if (!process.env.APP_TOKEN) {
    console.error(color.red('❎ ⟯ APP_TOKEN manquant dans .env ou mal importé.'));
    process.exit(1);
}
if (!process.env.GUILD_ID) {
    console.warn(color.yellow('❎ ⟯ GUILD_ID manquant ou mal importé: le logger filtrera mal la guilde'));
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
});

const eventsPath = path.join(__dirname, 'Handlers');
const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));

for (const file of eventFiles) {
    try {
        const event = require(path.join(eventsPath, file));
        if (!event?.name || !event?.execute) {
            console.warn(color.yellow(`⚠️ ⟯ Handler ignoré (mauvais format): ${file}`));
            continue;
        }
        event.once
            ? client.once(event.name, (...a) => event.execute(...a))
            : client.on(event.name, (...a) => event.execute(...a));
    } catch (e) {
        console.error(color.red(`❎ ⟯ Erreur au chargement de ${file}:`, e.message));
    }
}

console.log(color.blue(`✅ ⟯ ${eventFiles.length} handlers chargés depuis ./Handlers`));

process.on('unhandledRejection', (err) => {
    console.error('[unhandledRejection]', err);
});
process.on('uncaughtException', (err) => {
    console.error('[uncaughtException]', err);
});

client.login(process.env.APP_TOKEN);
