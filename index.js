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
const JOGADORES_NECESSARIOS = 2; // 🔥 AGORA É FIXO 2 PRA TUDO

const valores = [
    "R$1","R$2","R$5","R$10","R$20",
    "R$30","R$50","R$75","R$100","R$200"
];

client.once("ready", async () => {
    console.log(`Bot online como ${client.user.tag}`);

    const guild = client.guilds.cache.first();

    for (const canal of guild.channels.cache.values()) {

        if (
            !canal.isTextBased() ||
            !(
                canal.name.includes("1v1") ||
                canal.name.includes("2v2") ||
                canal.name.includes("3v3") ||
                canal.name.includes("4v4")
            )
        ) continue;

        const mensagens = await canal.messages.fetch({ limit: 50 });

        const jaExistePainel = mensagens.find(msg =>
            msg.author.id === client.user.id &&
            msg.content === "PAINEL_ORG_ICE"
        );

        if (jaExistePainel) continue;

        await canal.send("PAINEL_ORG_ICE");

        for (const valor of valores) {

            const embed = new EmbedBuilder()
                .setTitle(`🎮 ${canal.name.toUpperCase()} - ORG ICE`)
                .setDescription(`💰 Valor da partida: **${valor}**\n\nEscolha sua modalidade:`)
                .setColor("Green");

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`full_${valor}`)
                    .setLabel("Full Capa")
                    .setStyle(ButtonStyle.Primary),

                    new ButtonBuilder()
                    .setCustomId(`normal_${valor}`)
                    .setLabel("Gelo Normal")
                    .setStyle(ButtonStyle.Success),

                    new ButtonBuilder()
                    .setCustomId(`infinito_${valor}`)
                    .setLabel("Gelo Infinito")
                    .setStyle(ButtonStyle.Danger)
            );

            await canal.send({ embeds: [embed], components: [row] });
        }
    }
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    const partes = interaction.customId.split("_");
    const tipo = partes[0];
    const valor = partes.slice(1).join("_");

    const canalId = interaction.channel.id;

    if (!filas[canalId]) filas[canalId] = {};

    const chaveFila = `${tipo}_${valor}`;

    if (!filas[canalId][chaveFila])
        filas[canalId][chaveFila] = [];

    if (filas[canalId][chaveFila].includes(interaction.user.id)) {
        return interaction.reply({
            content: "Você já está nessa fila!",
            ephemeral: true
        });
    }

    filas[canalId][chaveFila].push(interaction.user.id);

    await interaction.reply({
        content: `Você entrou na fila ${tipo} (${valor})!`,
        ephemeral: true
    });

    if (filas[canalId][chaveFila].length >= JOGADORES_NECESSARIOS) {

        const jogadores = filas[canalId][chaveFila].splice(0, JOGADORES_NECESSARIOS);

        const sala = await interaction.guild.channels.create({
            name: `sala-${tipo}-${valor}-${Date.now()}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel]
                },
                ...jogadores.map(id => ({
                    id,
                    allow: [PermissionsBitField.Flags.ViewChannel]
                }))
            ]
        });

        sala.send(
            `🔥 Sala criada (${valor}) para:\n` +
            jogadores.map(id => `<@${id}>`).join("\n")
        );
    }
});

client.login(process.env.TOKEN);
