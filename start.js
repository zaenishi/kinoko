/*
 * Kinoko Komori WhatsApp Bot
 * @version: 1.0.0
 * @author: Zaenishi
 * @website: https://zaenishi.xyz
 * 
 * @description: Bot WhatsApp ini diberi nama "Kinoko Komori", terinspirasi dari karakter di Boku no Hero Academia.
 * Bot menggunakan Baileys untuk berinteraksi dengan API WhatsApp dan memiliki berbagai fitur komunikasi.
*/

require('./setting')
const { default: makeWaSocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, generateForwardMessageContent, prepareWAMessageMedia, generateWAMessageFromContent, generateMessageID, downloadContentFromMessage, makeInMemoryStore, jidDecode, proto } = require('@whiskeysockets/baileys')
const pino = require('pino')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const axios = require('axios')
const FileType = require('file-type')
const PhoneNumber = require('awesome-phonenumber')
const { smsg, getBuffer, fetchJson } = require('./lib/simple')
const fetch = require('node-fetch')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid, writeExif } = require('./lib/exif')
const { toBuffer } = require('qrcode')
const express = require('express')
const app = express()
const { createServer } = require('http')
const server = createServer(app)
let _qr = 'invalid'
const PORT = process.env.PORT
const path = require('path')

const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })
const readline = require("readline");
const usePairingCode = global.pairing

const question = (text) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve) => rl.question(text, resolve));
};

async function Botstarted() {
    const auth = await useMultiFileAuthState("auth");
    const { state, saveCreds } = await useMultiFileAuthState('auth')
    const bot = makeWaSocket({
        printQRInTerminal: !usePairingCode,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        auth: auth.state,
        logger: pino({ level: "silent" }),
    });

    if (usePairingCode && !bot.authState.creds.registered) {
        console.log('Silahkan masukkan nomor sesuai kode negara:');
        const phoneNumber = await question('');
        const code = await bot.requestPairingCode(phoneNumber.trim());
        console.log(`Pairing Code : ${code}`);
    }

    bot.ev.on("creds.update", auth.saveCreds);

    bot.ev.on('messages.upsert', async chatUpdate => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek.message) return;
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;
            if (mek.key && mek.key.remoteJid === 'status@broadcast') return;
            if (!bot.public && !mek.key.fromMe && chatUpdate.type === 'notify') return;
            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return;
            const m = smsg(bot, mek, store);
            require("./msg")(bot, m, chatUpdate, store);
        } catch (err) {
            console.log(err);
        }
    });

    bot.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            const decode = jidDecode(jid) || {};
            return decode.user && decode.server ? decode.user + '@' + decode.server : jid;
        }
        return jid;
    };

    bot.ev.on('contacts.update', update => {
        for (let contact of update) {
            const id = bot.decodeJid(contact.id);
            if (store && store.contacts) store.contacts[id] = { id, name: contact.notify };
        }
    });

    bot.getName = (jid, withoutContact = false) => {
        const id = bot.decodeJid(jid);
        let v;
        if (id.endsWith("@g.us")) {
            return new Promise(async (resolve) => {
                v = store.contacts[id] || {};
                if (!(v.name || v.subject)) v = await bot.groupMetadata(id) || {};
                resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'));
            });
        } else {
            v = id === '0@s.whatsapp.net' ? { id, name: 'WhatsApp' }
                : id === bot.decodeJid(bot.user.id) ? bot.user : (store.contacts[id] || {});
            return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international');
        }
    };

    bot.sendContact = async (jid, kon, quoted = '', opts = {}) => {
        const list = [];
        for (let i of kon) {
            list.push({
                displayName: await bot.getName(i + '@s.whatsapp.net'),
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await bot.getName(i + '@s.whatsapp.net')}\nFN:${await bot.getName(i + '@s.whatsapp.net')}\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
            });
        }
        bot.sendMessage(jid, { contacts: { displayName: `${list.length} Kontak`, contacts: list }, ...opts }, { quoted });
    };

    bot.public = true;

    bot.serializeM = (m) => smsg(bot, m, store);

    bot.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            app.use(async (req, res) => {
                res.setHeader('content-type', 'image/png');
                res.end(await toBuffer(qr));
            });
            app.use(express.static(path.join(__dirname, 'views')));
            app.listen(PORT, () => console.log('Silahkan scan qr di bagian webview'));
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            switch (reason) {
                case DisconnectReason.badSession:
                    console.log('Bad Session File, Please Delete Session and Scan Again');
                    bot.logout();
                    break;
                case DisconnectReason.connectionClosed:
                case DisconnectReason.connectionLost:
                case DisconnectReason.connectionReplaced:
                case DisconnectReason.loggedOut:
                case DisconnectReason.restartRequired:
                case DisconnectReason.timedOut:
                    console.log("Reconnecting...");
                    Botstarted();
                    break;
                default:
                    bot.end(`Unknown DisconnectReason: ${reason}|${connection}`);
            }
        }

        if (update.connection == "open" || update.receivedPendingNotifications == "true") {
            await store.chats.all();
            console.log(`Connected to = ` + JSON.stringify(bot.user, null, 2));
        }
    });

    bot.sendText = (jid, text, quoted = '', options) => bot.sendMessage(jid, { text, ...options }, { quoted, ...options });

    bot.downloadMediaMessage = async (message) => {
        const mime = (message.msg || message).mimetype || '';
        const messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
        const stream = await downloadContentFromMessage(message, messageType);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        return buffer;
    };

    bot.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
        const quoted = message.msg || message;
        const mime = (message.msg || message).mimetype || '';
        const messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
        const stream = await downloadContentFromMessage(quoted, messageType);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        const type = await FileType.fromBuffer(buffer);
        const trueFileName = attachExtension ? (filename + '.' + type.ext) : filename;
        await fs.writeFileSync(trueFileName, buffer);
        return trueFileName;
    };

    bot.sendTextWithMentions = async (jid, text, quoted, options = {}) => {
        const mentions = [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net');
        bot.sendMessage(jid, { text, mentions, ...options }, { quoted });
    };

    bot.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
        const buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split(',')[1], 'base64') : /^https?:\/\//.test(path) ? await (await fetch(path)).buffer() : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
        const buffer = options && (options.packname || options.author) ? await writeExifImg(buff, options) : await imageToWebp(buff);
        await bot.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
        return buffer;
    };

    bot.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
        const buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split(',')[1], 'base64') : /^https?:\/\//.test(path) ? await getBuffer(path) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
        const buffer = options && (options.packname || options.author) ? await writeExifVid(buff, options) : await videoToWebp(buff);
        await bot.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
        return buffer;
    };

    return bot;
}

Botstarted();

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Update ${__filename}`))
    delete require.cache[file]
    require(file)
})