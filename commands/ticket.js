const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  ChannelType,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticketpanel')
    .setDescription('Send a ticket creation panel with dropdown'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🎟 Ticket System')
      .setDescription('Select your ticket type below.')
      .setColor(0x00ffcc)
      .setFooter({ text: 'Acid Esports Ticket System' })
      .setTimestamp();

    const menu = new StringSelectMenuBuilder()
      .setCustomId('ticketSelect')
      .setPlaceholder('Choose a ticket type...')
      .addOptions([
        { label: 'CCH/FS/NF', value: 'cchfsnf' },
        { label: 'VFX/GFX', value: 'vfxgfx' },
        { label: 'Content creator', value: 'contentcreator' },
        { label: 'Staff/Mod', value: 'staffmod' },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({ embeds: [embed], components: [row] });
  },

  async handleInteraction(interaction, client) {
    const guild = interaction.guild;
    const member = interaction.member;

    const supportRoleId = '1322024475692367903';
    const categoryId = '1343843636785320039';
    const logChannelId = '1346989465108746320'; // 🔁 Replace with your log channel ID

    // Handle dropdown selection (ticket creation)
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticketSelect') {
      const purpose = interaction.values[0];
      const username = member.user.username.toLowerCase().replace(/\s+/g, '-');
      const channelName = `${purpose}-${username}`;

      try {
        const ticketChannel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: categoryId,
          permissionOverwrites: [
            { id: guild.roles.everyone, deny: ['ViewChannel'] },
            { id: member.id, allow: ['ViewChannel', 'SendMessages'] },
            { id: client.user.id, allow: ['ViewChannel', 'SendMessages'] },
          ],
        });

        const closeButton = new ButtonBuilder()
          .setCustomId('closeTicket')
          .setLabel('❌ Close Ticket')
          .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(closeButton);

        const embed = new EmbedBuilder()
          .setTitle(`🎟 ${purpose.toUpperCase()} Ticket`)
          .setDescription(`Welcome <@${member.id}>! A staff member will be with you shortly.\n\nClick below when this ticket is resolved.`)
          .setColor(0x00ffcc)
          .setFooter({ text: 'Acid Esports Ticket System' })
          .setTimestamp();

        await ticketChannel.send(`<@&${supportRoleId}>`);
        await ticketChannel.send({ embeds: [embed], components: [row] });

        await interaction.reply({ content: `Ticket created: ${ticketChannel}`, ephemeral: true });

        // 📝 Log ticket creation
        const logChannel = guild.channels.cache.get(logChannelId);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle('📝 Ticket Created')
            .addFields(
              { name: 'User', value: `<@${member.id}>`, inline: true },
              { name: 'Type', value: purpose.toUpperCase(), inline: true },
              { name: 'Channel', value: `<#${ticketChannel.id}>`, inline: true }
            )
            .setColor(0x00ffcc)
            .setTimestamp();
          await logChannel.send({ embeds: [logEmbed] });
        }
      } catch (error) {
        console.error('❌ Error creating ticket channel:', error);
        await interaction.reply({ content: 'Failed to create ticket.', ephemeral: true });
      }
    }

    // Handle close button (ticket deletion)
    if (interaction.isButton() && interaction.customId === 'closeTicket') {
      try {
        const logChannel = guild.channels.cache.get(logChannelId);

        // 📝 Log ticket deletion before deleting
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle('🗑️ Ticket Closed')
            .addFields(
              { name: 'Closed By', value: `<@${interaction.user.id}>`, inline: true },
              { name: 'Channel', value: `${interaction.channel.name}`, inline: true }
            )
            .setColor(0xff0000)
            .setTimestamp();
          await logChannel.send({ embeds: [logEmbed] });
        }

        await interaction.channel.delete();
      } catch (error) {
        console.error('❌ Error closing ticket channel:', error);
        await interaction.reply({ content: 'Failed to close ticket.', ephemeral: true });
      }
    }
  },
};
