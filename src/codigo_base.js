const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
  } = require("baileys");
  const { text } = require("stream/consumers");
  global.crypto = require("crypto");
  
  async function conectarWhatsapp() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
  
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
    });
  
    sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect } = update;
  
      if (connection === "close") {
        const volverAConectar =
          lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
        if (volverAConectar) {
          conectarWhatsapp();
        }
      } else if (connection == "open") {
        console.log("CONEXION ABIERTA!!!");
      }
    });
  
    sock.ev.on("creds.update", saveCreds);
  
    // Recibir mensajes
    sock.ev.on("messages.upsert", async function (event) {
      const type = event.type;
      const message = event.messages[0];
      const id = message.key.remoteJid;
      console.log(id);
  
      if (
        message.key.fromMe ||
        type != "notify" ||
        id.includes("@g.us") ||
        id.includes("@broadcast")
      ) {
        return;
      }
      console.log(message);
  
      // nombre de contacto
      const nombre = message.pushName;
  
      // leer mensajes
      await sock.readMessages([message.key], id);
  
      // sleep
      await sleep(200);
      // animación (escrbiendo..);
      await sock.sendPresenceUpdate("composing", id);
      await sleep(2000);
  
      // mensaje de respuesta
      await sock.sendMessage(
        id,
        { text: "Hola " + nombre + ", saludos, Soy un BOT" },
        { quoted: message }
      );
  
      // enviar mensaje de Texto
      await sock.sendMessage(id, { text: "Hola saludos Humano, Soy un BOT" });
  
      // menciones
      await sock.sendMessage(id, {
        text: `Hola ${nombre}, Puedes comunicarte con: @59173277937`,
        mentions: ["59173277937@s.whatsapp.net"],
      });
  
      // ubicacion
      await sock.sendMessage(id, {
        location: {
          address: "Av. 6 de Agosto, Zona ABC",
          degreesLatitude: -16.489689,
          degreesLongitude: -68.119293,
        },
      });
  
      // contacto
      const vcard =
        "BEGIN:VCARD\n" + // metadata of the contact card
        "VERSION:3.0\n" +
        "FN:Cristian\n" + // full name
        "ORG:Ashoka Uni;\n" + // the organization of the contact
        "TEL;type=CELL;type=VOICE;waid=59173277937:+59173277937\n" + // WhatsApp ID + phone number
        "END:VCARD";
  
      await sock.sendMessage(id, {
        contacts: {
          displayName: "Cristian",
          contacts: [{ vcard }],
        },
      });
  
      // reaction
      await sock.sendMessage(id, {
        react: {
          text: "💖",
          key: message.key,
        },
      });
  
      // enviar vista previa de enlaces
      await sock.sendMessage(id, {
        text: "Puedes visitar mi repositorio en: https://github.com/cchura94 \n cualquier otra consulta. escribeme",
      });
  
      // imagenes
      await sock.sendMessage(id, {
        image: {
          url: "https://cdn.pixabay.com/photo/2022/04/04/16/42/technology-7111804_640.jpg",
        },
        // caption: 'hello word'
      });
  
      // imagenes
      await sock.sendMessage(id, {
        image: {
          url: "https://cdn.pixabay.com/photo/2022/04/04/16/42/technology-7111804_640.jpg",
        },
        caption:
          "Hola le envío la información solicitada...\n\n> _*visita nuetra pagina*_",
      });
  
      
      // 59176501385
    });
  }
  
  conectarWhatsapp();
  
  function sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }
  