/*
 * Kinoko Komori WhatsApp Bot
 * @version: 1.0.0
 * @author: Zaenishi
 * @website: https://zaenishi.xyz
 * 
 * @description: Bot WhatsApp ini diberi nama "Kinoko Komori", terinspirasi dari karakter di Boku no Hero Academia.
 * Bot menggunakan Baileys untuk berinteraksi dengan API WhatsApp dan memiliki berbagai fitur komunikasi.
*/

require('./setting');
const { 
    BufferJSON, 
    WA_DEFAULT_EPHEMERAL, 
    generateWAMessageFromContent, 
    proto, 
    generateWAMessageContent, 
    generateWAMessage, 
    prepareWAMessageMedia, 
    areJidsSameUser, 
    getContentType 
} = require('@whiskeysockets/baileys');
const fs = require('fs');
const util = require('util');
const chalk = require('chalk');
const axios = require('axios');
const moment = require('moment-timezone');
const toMs = require('ms');
const FormData = require("form-data");
const { fromBuffer } = require('file-type');
const fetch = require('node-fetch');
const { color, bgcolor, pickRandom, randomNomor } = require('./lib/console.js');
const { TelegraPh } = require('./lib/uploader');
const { smsg, fetchJson, getBuffer } = require('./lib/simple');
const {
    scrapeItchIoSearch,
    pasteBin,
    ligaKlasemen,
    infoSaluran,
    twitterDownloader,
    tiktokDown,
    videy,
    HoloLive,
    openAi
} = require('./lib/scraper');

const database = require('./database/function.js');

module.exports = zns = async (zns, m, chatUpdate, store) => {
    try {
        const body = m.mtype === 'conversation' ? m.message.conversation 
            : m.mtype === 'imageMessage' ? m.message.imageMessage.caption 
            : m.mtype === 'videoMessage' ? m.message.videoMessage.caption 
            : m.mtype === 'extendedTextMessage' ? m.message.extendedTextMessage.text 
            : m.mtype === 'buttonsResponseMessage' ? m.message.buttonsResponseMessage.selectedButtonId 
            : m.mtype === 'listResponseMessage' ? m.message.listResponseMessage.singleSelectReply.selectedRowId 
            : m.mtype === 'templateButtonReplyMessage' ? m.message.templateButtonReplyMessage.selectedId 
            : m.mtype === 'messageContextInfo' ? (m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectReply.selectedRowId || m.text) 
            : '';

        const budy = typeof m.text === 'string' ? m.text : '';
        const prefix = prefa ? /^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi.test(body) ? body.match(/^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi)[0] : "" : prefa ?? global.prefix;
        const isCmd = body.startsWith(prefix);
        const command = body.replace(prefix, '').trim().split(/ +/).shift().toLowerCase();
        const args = body.trim().split(/ +/).slice(1);
        const pushname = m.pushName || "No Name";
        const botNumber = await zns.decodeJid(zns.user.id);
        const isCreator = ["6283188229366@s.whatsapp.net", botNumber, ...global.owner]
            .map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender);
        const text = args.join(" ");
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';
        const isMedia = /image|video|sticker|audio/.test(mime);
        const groupMetadata = m.isGroup ? await zns.groupMetadata(m.chat).catch(e => {}) : '';
        const groupName = m.isGroup ? groupMetadata.subject : '';
        const participants = m.isGroup ? await groupMetadata.participants : '';
        const groupAdmins = m.isGroup ? participants.filter(v => v.admin === 'admin' || v.admin === 'superadmin') : [];
        const isBotAdmins = m.isGroup ? groupAdmins.includes(botNumber) : false;
        const isAdmins = m.isGroup ? groupAdmins.includes(m.sender) : false;

        const reply = (text) => {
            m.reply(text);
        }

        if (m.message) {
            const waktu = new Date().toLocaleTimeString();
    
            console.log(chalk.cyan(`📩 Dari: ${pushname} (${m.sender.split('@')[0]})`));
            console.log(chalk.yellow(`🗨️ Pesan: ${text || m.mtype} (${m.isGroup ? 'Obrolan Grup' : 'Obrolan Pribadi'})`));
            console.log(chalk.gray(`⏰ Waktu: ${waktu}`));
            console.log(chalk.gray('-'.repeat(40)));
        }        
        
        if (!isCreator) {
        return
        }
                
        if (m.text.toLowerCase() === "bantuan") {
            const pengguna = database.bacaPengguna(m.sender);
        
            if (pengguna && pengguna.sesiBantuan) {
                reply(`Sesi bantuan anda masih ada, tapi sekarang saya sudah hapus sesi anda, ulangi perintah *"bantuan"* untuk mendapatkan sesi baru`);
                database.hapusKey(m.sender, "sesiBantuan");
                database.hapusKey(m.sender, "sisaBantuan");
                return;
            }
        
            reply(`Anda sekarang sedang di sesi bantuan, silahkan ${m.isGroup ? 'cek private chat anda' : 'ajukan pertanyaan anda'}${m.isGroup ? ', untuk menanyakan sesuatu' : ''}`);
            
            if (m.isGroup) {
                const openAiLoad = await openAi.respon('Halo');
                zns.sendMessage(m.sender, { text: openAiLoad }, { quoted: m });
            }
        
            database.tambah(m.sender, { "sesiBantuan": true });
            database.tambah(m.sender, { "sisaBantuan": 0 });
        }
        
        if (database.bacaPengguna(m.sender) && database.bacaPengguna(m.sender).sesiBantuan && !m.isGroup && m.text) {
            console.log('Mengambil data ai');
            const openAiLoad = await openAi.respon(m.text);
            reply(openAiLoad);
        
            let currentSisaBantuan = pengguna.sisaBantuan || 0;
            currentSisaBantuan += 1;
        
            database.ubah(m.sender, 'sisaBantuan', currentSisaBantuan);
        
            if (currentSisaBantuan >= 3) {
                database.hapusKey(m.sender, "sesiBantuan");
                database.hapusKey(m.sender, "sisaBantuan");
                reply('Sesi bantuan anda telah selesai karena sudah mencapai batas maksimum.');
            } else {
                return reply('Jika anda membutuhkan bantuan lagi, silahkan ketik saja "bantuan" maka sesi bantuan akan dibuat lagi');
            }
        }
        
        switch (command) {
            case 'ping': 
                m.reply('pong');
                break;
            
            case 'videy': {
                if (args.length < 1) {
                    reply('🔗 Mohon berikan URL video dari Videy.');
                    return;
                }
                const videyUrl = args[0];
                videy(videyUrl).then(result => {
                    zns.sendMessage(m.chat, { 
                        video: { url: result }, 
                        caption: '*🎥 Videy Downloader*\n\nIkuti instagram Pembuat @zaenishi, thx 💖' 
                    });
                });
                }
                break;

            case 'twitter': {
                if (args.length < 1) {
                    reply('🔗 Mohon berikan URL tweet.');
                    return;
                }
                const tweetUrl = args[0];
                twitterDownloader(tweetUrl).then(result => {
                    if (!result) {
                        reply('Gagal mendapatkan data dari tweet tersebut.');
                        return;
                    }
                    if (result.mp4_1080p) {
                        zns.sendMessage(m.chat, { 
                            video: { url: result.mp4_1080p }, 
                            caption: '*🐦 Twitter Downloader*\n\nIkuti instagram pembuat *@zaenishi*, thx 💖' 
                        });
                    } else if (result.mp4_720p) {
                        zns.sendMessage(m.chat, { 
                            video: { url: result.mp4_720p }, 
                            caption: '*🐦 Twitter Downloader*\n\nIkuti instagram pembuat *@zaenishi*, thx 💖' 
                        });              
                    } else {
                        reply('Gagal mendapatkan data dari tweet tersebut.');
                    }
                });
                }
                break;

            case 'tiktok': {
                if (args.length < 1) {
                    reply('🔗 Mohon berikan URL video TikTok.');
                    return;
                }
                const videoId = args[0].match(/\/([^\/]+)\/?$/)[1];
                tiktokDown(videoId).then(result => {
                    if (!result) {
                        reply('Gagal mendapatkan data dari video TikTok tersebut.');
                    } else {
                        let responseMessage = `👤 *Pengguna:* ${result.user.name} (@${result.user.username})\n`;
                        responseMessage += `⏰ *Durasi Video:* ${result.videoDuration} detik\n\n`;
                        responseMessage += `📑 *Catatan:* ${m.isGroup ? 'Video akan saya kirim lewat private chat, untuk menjaga privasi anda.' : 'Video akan dikirimkan setelah pesan ini'}`;
                        
                        reply(responseMessage);
                        if (m.isGroup) {
                        zns.sendMessage(m.sender, { video: { url: result.downloadLinks.videoNoWatermark }, caption: '*🎥 Tiktok Downloader*\n\nIkuti instagram pembuat *@zaenishi*, thx 💖' })
                    } else {
                        zns.sendMessage(m.chat, { video: { url: result.downloadLinks.videoNoWatermark }, caption: '*🎥 Tiktok Downloader*\n\nIkuti instagram pembuat *@zaenishi*, thx 💖' })
                        }
                }
                })
                }
                break;            

            case 'pastebin': {
                if (args.length < 1) {
                    reply('🔗 Mohon berikan URL Pastebin.');
                    return;
                }
                const pasteUrl = args[0];
                pasteBin(pasteUrl).then(result => {
                    if (typeof result === 'string') {
                        reply(result);
                    } else {
                        let responseMessage = `🔍 *Judul:* ${result.title}\n`;
                        responseMessage += `📝 *Username:* ${result.username}\n`;
                        responseMessage += `📅 *Tanggal:* ${result.datePosted}\n`;
                        responseMessage += `👀 *Jumlah Tampilan:* ${result.viewCount}\n`;
                        responseMessage += `📥 *Link Raw:* ${result.rawLink}\n`;
                        responseMessage += `📥 *Link Download:* ${result.downloadLink}\n`;
                        responseMessage += `\n*Konten:*\n\`\`\`\n${result.content.join('\n')}\n\`\`\``;
                        reply(responseMessage);
                    }
                })
                }
                break;                
                
            case 'saluran': {
                if (args.length < 1) {
                    reply('🔍 Mohon berikan URL saluran.');
                    return;
                }
                const channelUrl = args[0];
                infoSaluran(channelUrl).then(result => {
                    if (typeof result === 'string') {
                        reply(result);
                    } else {
                        let responseMessage = `🎥 *Saluran:* ${result.title}\n`;
                        responseMessage += `👤 *Pengikut:* ${result.pengikut}\n`;
                        responseMessage += `📜 *Deskripsi:* ${result.deskripsi}\n`;
                        responseMessage += `🔗 *Link Saluran:* ${result.linkSaluran}\n`;
                        responseMessage += `🖼️ *Gambar:* ${result.img}`;
                        reply(responseMessage);
                    }
                });
                }
                break;                
                
            case 'itchio': {
                if (args.length < 1) {
                    reply('🔍 Mohon berikan kata kunci pencarian game.');
                    return;
                }
                const query = args.join(' ');
                scrapeItchIoSearch(query).then(result => {
                    if (typeof result === 'string') {
                        reply(result);
                    } else {
                        let responseMessage = `🎮 *Hasil Pencarian untuk:* ${query}\n`;
                        result.results.forEach((game, index) => {
                            responseMessage += `\n${index + 1}. *${game.Title}*\n`;
                            responseMessage += `- ${game.Link}\n`;
                        });
                        reply(responseMessage);
                    }
                });
                }
                break;
                
            case 'help': 
            case 'menu': {
const menuCaption = `🌸 *Salam, saya Kinoko Komori!*  
🍄 *Selamat datang di Bot Dashboard!*

 *— P E N G A N T A R A N —*

*Perkenalan*  
Saya adalah asisten virtualmu, *Kinoko*, yang siap membantu kamu di WhatsApp dengan berbagai fitur menarik!

 *— I N F O R M A S I - B O T —*

┌  ◦  *Nama*: Kinoko Komori  
│  ◦  *Sekolah*: U.A. High School  
│  ◦  *Kelas*: 1-B  
│  ◦  *Kapasitas Fitur*: Banyak fitur seru untuk kamu coba  
└  ◦  *Versi Bot*: 1.0

 *— D A F T A R - F I T U R —*

1. *!videy*  
   - Dengan ini, kamu bisa mendownload video dari Videy!
   
2. *!twitter*  
   - Mau download video dari Twitter? Cukup ketik perintah ini!
   
3. *!tiktok*  
   - Gampang banget, aku bisa bantu kamu download video dari TikTok!
   
4. *!pastebin*  
   - Ada link Pastebin? Aku akan tunjukkan isi teksnya di sini!
   
5. *!saluran*  
   - Butuh info tentang saluran WhatsApp? Aku bisa kasih tahu!
   
6. *!itchio*  
   - Cari game indie di Itch.io? Aku siap membantu kamu temukan dan download game favorit!

Jangan khawatir jika ada yang kurang jelas, ketik saja *bantuan*. Aku di sini untuk membantumu!`
zns.sendMessage(m.chat, {
    text: menuCaption,
    contextInfo: {
      externalAdReply: {
        showAdAttribution: false,
        title: 'Kinoko Komori',
        body: 'Dibuat Dengan 💖 Oleh Zaenishi',
        sourceUrl: 'https://whatsapp.com/channel/0029Va9scP6CxoAqmRtHG73T',
        thumbnail: fs.readFileSync('./image/thumbnail.jpeg'),
        mediaType: 1,
        renderLargerThumbnail: true
      }
    }
   })   
   }
            break;
                    
        case 'hololive': {
            const command = args[0] ? args[0].toLowerCase() : null;
            const input = args[1] ? args[1].toLowerCase() : null;
            if (command === null) {
            return reply(`Perintah yang tersedia, ada search dan news, ini contoh penggunaanya:\n1. !hololive search kobo-kanaeru\n2. !hololive news 1 id (angka itu buat page, kalo "id" itu buat bahasanya)`)
            }
            switch (command) {
                case 'search':
                    if (!input) return reply(`Eh, kasih tahu dong nama talent yang mau dicari! 😔`);
        
                    const holoLive = new HoloLive();
                    const talentData = await holoLive.searchTalent(input);
        
                    if (!talentData) {
                        return reply(`Aduh, talent-nya nggak ketemu atau ada yang error saat nyari data, hiks.. 😢`);
                    }
        
                    let response = `*🌸 H O L O  L I V E*\n\n*✨ Nama:* ${talentData.nama}\n`;
                    response += `*📝 Deskripsi:* ${talentData.deskripsi}\n\n`;
        
                    if (talentData.mediaSosial.length > 0) {
                        response += `*🌐 Media Sosial:*\n`;
                        talentData.mediaSosial.forEach(sns => {
                            response += `- ${sns.platform}: ${sns.url}\n`;
                        });
                        response += `\n`;
                    }
        
                    if (talentData.video.length > 0) {
                        response += `*🎥 Video:*\n`;
                        talentData.video.forEach(video => {
                            response += `- *${video.judul}* (${video.url}) - *Tag:* ${video.tag}\n`;
                        });
                    }
        
                    response += `\n*🛠️ Info Tambahan:*\n`;
                    for (const key in talentData.talentData) {
                        const value = talentData.talentData[key];
                        if (typeof value === 'object') {
                            response += `- ${key}: [${value.name}](${value.url})\n`;
                        } else {
                            response += `- ${key}: ${value}\n`;
                        }
                    }
        
                    zns.sendMessage(m.chat, { image: { url: talentData.gambar }, caption: response });
                    break;
        
                case 'news':
                    const holoLiveNews = new HoloLive();
                    const newsData = await holoLiveNews.news(input ? input : 1, args[2] ? args[2].toLowerCase() : 'en');
        
                    if (!newsData || newsData.length === 0) {
                        return reply(`Nggak ada berita terbaru`);
                    }
                    let newsResponse = `*📰 Berita Terbaru:*\n`;
                    newsData.news.forEach(newsItem => {
                        newsResponse += `- ${newsItem.judul} (${newsItem.url})\n`;
                        newsResponse += `  *📅 Tanggal:* ${newsItem.tanggal}\n`;
                        newsResponse += `  *🗒️ Deskripsi:* ${newsItem.deskripsi}\n`;
                        if (newsItem.thumbnail) {
                            newsResponse += `  *🖼️ Thumbnail: ${newsItem.thumbnail}*\n`;
                        }
                        newsResponse += `\n`;
                    });
        
                    reply(newsResponse);
                    break;
        
                default:
                    return reply(`Eh, perintahnya nggak jelas! Coba pakai search atau news, kaya gini contohnya *.hololive search kobo-kanaeru*`);
            }
            }
            break
            
            default:
                if (budy.startsWith('|') && isCreator) {
                    try {
                        let evaled = await eval(budy.slice(2));
                        if (typeof evaled !== 'string') evaled = require('util').inspect(evaled);
                        await m.reply(evaled);
                    } catch (err) {
                        await m.reply(util.format(err));
                    }
                }
        }
        
    } catch (err) {
        console.log(util.format(err));
    }
};

let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.redBright(`Update ${__filename}`));
    delete require.cache[file];
    require(file);
});