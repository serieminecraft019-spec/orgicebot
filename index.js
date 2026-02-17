const { 
    Client, 
    GatewayIntentBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder, 
    ChannelType, 
    PermissionsBitField 
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const filas = {};

function jogadoresNecessarios(channelName) {
    if (channelName.includes("1v1")) return 2;
    if (channelName.includes("2v2")) return 4;
    if (channelName.includes("3v3")) return 6;
    if (channelName.includes("4v4")) return 8;
    return 2;
}

client.on("clientReady", async () => {
    console.log(`Bot online como ${client.user.tag}`);

    const guild = client.guilds.cache.first();

    guild.channels.cache.forEach(async (canal) => {

        if (
            canal.name.includes("1v1") ||
            canal.name.includes("2v2") ||
            canal.name.includes("3v3") ||
            canal.name.includes("4v4")
        ) {

            const embed = new EmbedBuilder()
                .setTitle("🎮 PAINEL DE FILAS - ORG ICE")
                .setDescription("Escolha sua modalidade:");

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("full")
                    .setLabel("Full Capa")
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId("normal")
                    .setLabel("Gelo Normal")
                    .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                    .setCustomId("infinito")
                    .setLabel("Gelo Infinito")
                    .setStyle(ButtonStyle.Danger)
            );

            await canal.send({ embeds: [embed], components: [row] });
        }
    });
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    const tipo = interaction.customId;
    const canalId = interaction.channel.id;
    const canalNome = interaction.channel.name;
    const necessario = jogadoresNecessarios(canalNome);

    if (!filas[canalId]) {
        filas[canalId] = {
            full: [],
            normal: [],
            infinito: []
        };
    }

    if (filas[canalId][tipo].includes(interaction.user.id)) {
        return interaction.reply({ content: "Você já está nessa fila!", ephemeral: true });
    }

    filas[canalId][tipo].push(interaction.user.id);

    await interaction.reply({ content: `Você entrou na fila ${tipo}!`, ephemeral: true });

    if (filas[canalId][tipo].length >= necessario) {

        const jogadores = filas[canalId][tipo].splice(0, necessario);

        const sala = await interaction.guild.channels.create({
            name: `sala-${tipo}-${Date.now()}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel]
                },
                ...jogadores.map(id => ({
                    id: id,
                    allow: [PermissionsBitField.Flags.ViewChannel]
                }))
            ]
        });

        sala.send("🔥 Sala criada para:\n" + jogadores.map(id => `<@${id}>`).join("\n"));
    }
});

client.login(process.env.TOKEN);