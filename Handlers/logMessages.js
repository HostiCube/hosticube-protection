const { Events } = require('discord.js');
require('dotenv').config();
const color = require('colors/safe');

const pool = require('../Scripts/database.js');
const formatDate = require('../Scripts/getDate.js');

const IGNORE_CATEGORIES = (process.env.LOG_IGNORE_CATEGORIES || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .map(s => s.toLowerCase());

module.exports = {
    name: Events.MessageCreate,
    once: false,

    async execute(message) {
        const serverId = process.env.GUILD_ID;
        if (!serverId) {
            console.warn(color.yellow("⚠️ ⟯ GUILD_ID manquant dans .env ou mal importé."));
            return;
        }

        if (!message.inGuild()) return;
        if (message.guildId !== serverId) return;
        if (message.author?.bot) return;

        const p1 = message.channel.parent ?? null;
        const p2 = p1?.parent ?? null;
        const category = p2 ?? p1 ?? null;
        const catId = category?.id ?? null;
        const catName = category?.name?.toLowerCase() ?? null;
        if ((catId && IGNORE_CATEGORIES.includes(catId)) || (catName && IGNORE_CATEGORIES.includes(catName))) return;

        const createdAt = new Date(message.createdTimestamp);
        const record = {
            message_id: message.id,
            guild_id: message.guildId,
            channel_id: message.channel.id,
            author_id: message.author.id,
            content: message.content ?? '',
            discord_created_at: createdAt,
            created_at_display: formatDate(createdAt),
            has_attachments: message.attachments?.size > 0 ? 1 : 0,
            attachments_json: JSON.stringify(
                [...message.attachments.values()].map(a => ({
                    id: a.id,
                    name: a.name,
                    url: a.url,
                    contentType: a.contentType ?? null,
                    size: a.size ?? null
                }))
            )
        };

        const sql = `
            INSERT INTO messages (message_id, guild_id, channel_id, author_id, content, discord_created_at, created_at_display, has_attachments, attachments_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE content = VALUES(content), discord_created_at = VALUES(discord_created_at),
            created_at_display = VALUES(created_at_display), has_attachments = VALUES(has_attachments), attachments_json = VALUES(attachments_json)
        `;

        const params = [
            record.message_id,
            record.guild_id,
            record.channel_id,
            record.author_id,
            record.content,
            record.discord_created_at,
            record.created_at_display,
            record.has_attachments,
            record.attachments_json
        ];

        try {
            await pool.execute(sql, params);
        } catch (err) {
            console.error(color.red('❎ ⟯ insert messages log failed:', {
                message_id: record.message_id,
                channel_id: record.channel_id,
                error: err?.message || err
            }));
        }
    }
};
