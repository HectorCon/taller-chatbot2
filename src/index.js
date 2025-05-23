const { useMultiFileAuthState, default: makeWASocket, DisconnectReason } = require("baileys")
global.crypto = require("crypto");
const qrcode = require("qrcode-terminal");

const userContext = {}; 

async function connectToWhatsApp () {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')


    const sock = makeWASocket({
        auth: state
    });

   // ✅ Mostrar QR y manejar conexión
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            qrcode.generate(qr, { small: true });
        }

        if (connection === "close") {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log("Conexión cerrada por", lastDisconnect?.error, ", reconectando:", shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === "open") {
            console.log("✅ CONEXIÓN ABIERTA!!!");
        }
    });
    
    /* const sock = makeWASocket({
        // can provide additional config here
        auth: state,
        printQRInTerminal: true
    })
    
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect)
            // reconnect if not logged out
            if(shouldReconnect) {
                connectToWhatsApp()
            }
        } else if(connection === 'open') {
            console.log('CONEXION ABIERTA!!!')
        }
    }); */

    sock.ev.on('messages.upsert', async event => {
        for (const m of event.messages) {

            const id = m.key.remoteJid;

            if(event.type != "notify" || m.key.fromMe || id.includes("@g.us") || id.includes("@broadcast")){
                return;
            }

            console.log(JSON.stringify(m, undefined, 2));

            // contruir el bot (59176501385)
            const mensaje = m.message?.conversation || m.message?.extendedTextMessage?.text;
            const nombre = m.pushName;

            if(!userContext[id]){
                userContext[id] = {menuActual: "main"};

                enviarMenu(sock, id, "main");
                return;
            }

            const menuActual = userContext[id].menuActual;
            const menu = menuData[menuActual];

            const opcionSeleccionada = menu.options[mensaje];

            if(opcionSeleccionada){
                if(opcionSeleccionada.respuesta){
                    if(opcionSeleccionada.respuesta.tipo == "text"){
                        await sock.sendMessage(id, { text: opcionSeleccionada.respuesta.msg })
                    }
                    if(opcionSeleccionada.respuesta.tipo == "image"){
                        await sock.sendMessage(id, { image: {url: opcionSeleccionada.respuesta.msg} })
                    }
                    if(opcionSeleccionada.respuesta.tipo == "location"){
                        await sock.sendMessage(id, { location: opcionSeleccionada.respuesta.msg })
                    }
                }
                if(opcionSeleccionada.submenu){
                    userContext[id].menuActual = opcionSeleccionada.submenu;
                    
                    enviarMenu(sock, id, opcionSeleccionada.submenu)
                }
            }else{
                await sock.sendMessage(id, { text: 'Por favor, elige una opción valida del menu de opciones' })
            }

        }
    });

    // to storage creds (session info) when it updates
    sock.ev.on('creds.update', saveCreds)
}
// run in main file
connectToWhatsApp()

async function enviarMenu(sock, id, menukey){

    const menu = menuData[menukey];

    const optionText = Object.entries(menu.options)
                .map(([key, option]) => `- 👉 *${key}*: ${option.text}`)
                .join("\n");
    
    const menuMensaje = `${menu.mensaje}\n${optionText}\n\n> *Indícanos qué opción te interesa conocer 😊!* `

    await sock.sendMessage(id, {text: menuMensaje});

} 

const menuData = {
    main: {
        mensaje: "👋 ¡Bienvenido a nuestra Importadora! ¿Cómo podemos ayudarte? 🤔",
        options: {
            A: {
                text: "ℹ️ Información sobre productos importados",
                respuesta: {
                    tipo: "text",
                    msg: "🛍️ Contamos con productos de diversas categorías. ¿Te gustaría conocer más sobre alguno en específico?"
                }
            },
            B: {
                text: "📦 Ver catálogo de productos",
                respuesta: {
                    tipo: "image",
                    msg: "https://visme.co/blog/wp-content/uploads/2021/11/sales-catalog-template.jpg"
                }
            },
            C: {
                text: "🚚 Información sobre envíos",
                respuesta: {
                    tipo: "text",
                    msg: "🌍 Realizamos envíos internacionales. ¿Te gustaría saber sobre las opciones y costos de envío?"
                }
            },
            D: {
                text: "💳 Condiciones de pago",
                respuesta: {
                    tipo: "text",
                    msg: "💰 Ofrecemos varias formas de pago, incluyendo transferencias bancarias, tarjetas de crédito, y pagos a través de plataformas digitales."
                }
            },
            E: {
                text: "🛠️ Ver nuestros servicios",
                submenu: "servicios"
            }
        }
    },
    servicios: {
        mensaje: "🔧 Observa *Nuestros Servicios* 👇",
        options: {
            1: {
                text: "💼 Asesoramiento en importación",
                respuesta: {
                    tipo: "text",
                    msg: "📝 Brindamos asesoramiento en el proceso de importación para asegurar que todo se haga de manera eficiente y legal."
                }
            },
            2: {
                text: "📦 Logística y Gestión de Envíos",
                respuesta: {
                    tipo: "text",
                    msg: "🚚 Gestionamos todo el proceso logístico, desde la compra hasta la entrega final en tu ubicación."
                }
            },
            3: {
                text: "🔙 Volver al menú",
                submenu: "main"
            }
        }
    }
};
/*
const menuData = {
    main: {
        mensaje: "Bienvenido a nuestra empresa! ¿Cómo podemos ayudarte?",
        options: {
            A: {
                text: "Información sobre reservas",
                respuesta: {
                    tipo: "text",
                    msg: "Puedes hacer una reserva llamando al *+59173277937* o visitando nuestra página web."
                }
            },
            B: {
                text: "Ver catalogo",
                respuesta: {
                    tipo: "image",
                    msg: "https://visme.co/blog/wp-content/uploads/2021/11/sales-catalog-template.jpg"
                }
            },
            C: {
                text: "Nuestra ubicación",
                respuesta: {
                    tipo: "location",
                    msg: {
                        address: "Av. 6 de Agosto, Zona ABC",
                        degreesLatitude: -16.489689,
                        degreesLongitude: -68.119293
                    }
                }
            },
            D: {
                text: "Ver nuestros Servicios",
                submenu: "servicios"
            }
        }
    },
    servicios: {
        mensaje: "Observe *Nuestros Servicios*",
        options: {
            1: {
                text: "Asesoramiento",
                respuesta: {
                    tipo: "text",
                    msg: "Brinadamos asesoramiento para..."
                }
            },
            2: {
                text: "Desarrollo Software",
                respuesta: {
                    tipo: "text",
                    msg: "Desarrollamos software a medida"
                }
            },
            3: {
                text: "Volver al menu",
                submenu: "main"
            }
        }

    }
}
    */