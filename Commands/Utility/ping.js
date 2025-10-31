const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Affiche la latence du bot.'),
    
    async execute(interaction) {
        const sent = await interaction.reply({ content: '📡 Ping...', withResponse: true });
        const ping = Date.now() - interaction.createdTimestamp;
        
        await interaction.editReply({ content: `📡 Latence: \`${ping}\`ms` });
    },
};