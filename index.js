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

const valores = [
    "R$1",
    "R$2",
    "R$5",
    "R$10",
    "R$20",
    "R$30",
    "R$50",
    "R$75",
    "R$100",
    "R$200"
];

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

            for (let valor of valores) {

                const embed = new EmbedBuilder()
                    .setTitle(🎮 ${canal.name.toUpperCase()} - ORG ICE)
                    .setDescription(💰 Valor da partida: **${valor}**\n\nEscolha sua modalidade:)
                    .setColor("Green");

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(full_${valor})
                        .setLabel("Full Capa")
                        .setStyle(ButtonStyle.Primary),

                    new ButtonBuilder()
                        .setCustomId(normal_${valor})
                        .setLabel("Gelo Normal")
                        .setStyle(ButtonStyle.Success),

                    new ButtonBuilder()
                        .setCustomId(infinito_${valor})
                        .setLabel("Gelo Infinito")
                        .setStyle(ButtonStyle.Danger)
                );

                await canal.send({ embeds: [embed], components: [row] });
            }
        }
    });
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    const partes = interaction.customId.split("_");
    const tipo = partes[0];
    const valor = partes.slice(1).join("_");

    const canalId = interaction.channel.id;
    const canalNome = interaction.channel.name;
    const necessario = jogadoresNecessarios(canalNome);

    if (!filas[canalId]) {
        filas[canalId] = {};
    }

    const chaveFila = ${tipo}_${valor};

    if (!filas[canalId][chaveFila]) {
        filas[canalId][chaveFila] = [];
    }

    if (filas[canalId][chaveFila].includes(interaction.user.id)) {
        return interaction.reply({ content: "Você já está nessa fila!", ephemeral: true });
    }

    filas[canalId][chaveFila].push(interaction.user.id);

    await interaction.reply({ 
        content: Você entrou na fila ${tipo} (${valor})!, 
        ephemeral: true 
    });

    if (filas[canalId][chaveFila].length >= necessario) {

        const jogadores = filas[canalId][chaveFila].splice(0, necessario);

        const sala = await interaction.guild.channels.create({
            name: sala-${tipo}-${valor}-${Date.now()},
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

        sala.send(🔥 Sala criada (${valor}) para:\n + jogadores.map(id => <@${id}>).join("\n"));
    }
});

client.login(process.env.TOKEN);

