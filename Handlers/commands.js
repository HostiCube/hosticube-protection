const { Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
var color = require('colors/safe');

module.exports = async (client) => {
    
    client.commands = new Collection();
    const commands = [];

    const commandsPath = path.join(__dirname, '..', 'Commands');

    if(!fs.existsSync(commandsPath)) { // verify if the Commands folder exists
        console.log(color.yellow("⚠️ ⟯ Le dossier 'Commands' n'existe pas. Création du dossier..."));
        fs.mkdirSync(commandsPath, { recursive: true });
        console.log(color.yellow("✅ ⟯ Dossier créer !"));
        return;
    }

    const commandsFolders = fs.readdirSync(commandsPath);

    for(const folder of commandsFolders) {
        const folderPath = path.join(commandsPath, folder);

        if(!fs.statSync(folderPath).isDirectory()) continue; // verify if is it a folder

        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

        for(const file of commandFiles) {
            const filePath = path.join(folderPath, file);
            const command = require(filePath);

            if('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                commands.push(command.data.toJSON()); // add the command to the array for Discord APIs
                console.log(color.green("✅ ⟯ Commande chargée: " + command.data.name));
            } else {
                console.log(color.red(`❎ ⟯ Erreur: La commande ${file} n'a pas les propriétés 'data' et 'execute' requises.`));
            }
        }
    }

    console.log(color.blue(`📦 ⟯ ${client.commands.size} commandes slash (/) chargées.`));
    if(commands.length > 0) {
        try {
            console.log(color.blue("🔄 ⟯ Déploiement des commandes (/) en cours..."));

            const rest = new REST({ version: 10 }).setToken(process.env.APP_TOKEN);
            // The command deploy can take 1 hour.
            // Here is a global command deploy (not for a server)

            await rest.put(
                // For a server deploy modify the line with : (don't forget to add you server ID in the env file)
                // Routes.applicationGuildCommands(process.env.APP_ID, process.env.GUILD_ID),
                Routes.applicationCommands(process.env.APP_ID),
                { body: commands }
            );

            console.log(color.green(`✅ ⟯ ${commands.length} commandes (/) deployées globalement.`))

        } catch (error) {
            console.log(color.red(`❎ ⟯ Erreur: une erreur lots du déploiement des commandes (/) : ${error}`));
        }
    } else {
        console.log(color.yellow("📦 ⟯ Aucune commande à déployer."));
        return
    }
}