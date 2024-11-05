/*
 * Kinoko Komori WhatsApp Bot
 * @version: 1.0.0
 * @author: Zaenishi
 * @website: https://zaenishi.xyz
 * 
 * @description: Bot WhatsApp ini diberi nama "Kinoko Komori", terinspirasi dari karakter di Boku no Hero Academia.
 * Bot menggunakan Baileys untuk berinteraksi dengan API WhatsApp dan memiliki berbagai fitur komunikasi.
*/

const fs = require('fs')

global.pairing = true 

global.owner = ['6285380779466']
global.namaOwner = "XshopTopup"

global.sessionName = 'session'
global.prefa = ['-_-']

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Update ${__filename}`))
    delete require.cache[file]
    require(file)
})