/*
 * Kinoko Komori WhatsApp Bot
 * @version: 1.0.0
 * @author: Zaenishi
 * @website: https://zaenishi.xyz
 * 
 * @description: Bot WhatsApp ini diberi nama "Kinoko Komori", terinspirasi dari karakter di Boku no Hero Academia.
 * Bot menggunakan Baileys untuk berinteraksi dengan API WhatsApp dan memiliki berbagai fitur komunikasi.
*/

const {
   spawn
} = require('child_process')
const path = require('path')

function start() {
   let args = [path.join(__dirname, 'start.js'), ...process.argv.slice(2)]
   console.log([process.argv[0], ...args].join('\n'))
   let p = spawn(process.argv[0], args, {
         stdio: ['inherit', 'inherit', 'inherit', 'ipc']
      })
      .on('message', data => {
         if (data == 'reset') {
            console.log('Restarting Bot...')
            p.kill()
            start()
            delete p
         }
      })
      .on('exit', code => {
         console.error('Exited with code:', code)
         if (code == '.' || code == 1 || code == 0 || code == null) start()
      })
}
start()