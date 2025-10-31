// ./Handlers/commands.js
const { Events, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const color = require('colors/safe');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        if (process.env.DEPLOY_COMMANDS !== 'true') {
            console.log(color.yellow('⏭️ ⟯ Déploiement des commandes ignoré (DEPLOY_COMMANDS != "true").'));
            return;
        }

        if (!process.env.APP_TOKEN) {
            console.error(color.red('❎ ⟯ APP_TOKEN manquant dans .env.'));
            return;
        }
        if (!process.env.APP_ID) {
            console.error(color.red('❎ ⟯ APP_ID manquant dans .env.'));
            return;
        }
        if (process.env.DEPLOY_COMMANDS_SCOPE === 'guild' && !process.env.GUILD_ID) {
            console.error(color.red('❎ ⟯ GUILD_ID manquant pour un déploiement "guild".'));
            return;
        }

        client.commands = new Collection();
        const commands = [];

        const commandsPath = path.join(__dirname, '..', 'Commands');
        if (!fs.existsSync(commandsPath)) {
            console.log(color.yellow("⚠️ ⟯ Le dossier 'Commands' n'existe pas. Création du dossier..."));
            fs.mkdirSync(commandsPath, { recursive: true });
            console.log(color.yellow('✅ ⟯ Dossier créé !'));
            return;
        }

        const commandsFolders = fs.readdirSync(commandsPath);
        for (const folder of commandsFolders) {
            const folderPath = path.join(commandsPath, folder);
            if (!fs.statSync(folderPath).isDirectory()) continue;

            const commandFiles = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));
            for (const file of commandFiles) {
                const filePath = path.join(folderPath, file);
                try {
                    const command = require(filePath);
                    if ('data' in command && 'execute' in command) {
                        client.commands.set(command.data.name, command);
                        commands.push(command.data.toJSON());
                        console.log(color.blue('✅ ⟯ Commande chargée: ' + command.data.name));
                    } else {
                        console.log(color.red(`❎ ⟯ Erreur: La commande ${file} n'a pas les propriétés 'data' et 'execute' requises.`));
                    }
                } catch (e) {
                    console.log(color.red(`❎ ⟯ Erreur lors du chargement de ${file}: ${e.message}`));
                }
            }
        }

        console.log(color.blue(`📦 ⟯ ${client.commands.size} commandes slash (/) chargées.`));

        if (commands.length === 0) {
            console.log(color.yellow('📦 ⟯ Aucune commande à déployer.'));
            return;
        }

        const rest = new REST({ version: 10 }).setToken(process.env.APP_TOKEN);
        try {
            console.log(color.blue('🔄 ⟯ Déploiement des commandes (/) en cours...'));

            const body = { body: commands };
            if (process.env.DEPLOY_COMMANDS_SCOPE === 'guild' && process.env.GUILD_ID) {
                await rest.put(
                    Routes.applicationGuildCommands(process.env.APP_ID, process.env.GUILD_ID),
                    body
                );
                console.log(color.blue(`✅ ⟯ ${commands.length} commandes (/) déployées sur la guilde ${process.env.GUILD_ID}.`));
            } else {
                await rest.put(
                    Routes.applicationCommands(process.env.APP_ID),
                    body
                );
                console.log(color.blue(`✅ ⟯ ${commands.length} commandes (/) déployées globalement (propagation jusqu'à ~1h).`));
            }
        } catch (error) {
            console.log(color.red(`❎ ⟯ Erreur: une erreur lors du déploiement des commandes (/): ${error}`));
        }
    },
};
