const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('qs');
const yts = require('yt-search');
const { JSDOM } = require('jsdom');

async function scrapeItchIoSearch(query) {
    if (!query || typeof query !== 'string') {
        return 'Query tidak valid. Mohon berikan kata kunci pencarian yang valid.';
    }

    try {
        const { data } = await axios.get('https://itch.io/search?q=' + encodeURIComponent(query));
        const $ = cheerio.load(data);
        const games = [];

        $('div.game_title > a').each(function() {
            const Title = $(this).text().trim();
            const Link = $(this).attr('href');
            const Author = $(this).closest('div.game_author').find('a').text().trim();
            const Genre = $(this).closest('div.game_genre').text().trim();
            const Platform = $(this).closest('span.web_flag').text().trim();
            const Deskripsi = $(this).closest('div.game_text').text().trim();
            const Rating = $(this).closest('span.screenreader_only').text().trim();

            games.push({ Title, Link, Author, Genre, Platform, Deskripsi, Rating });
        });

        if (games.length === 0) {
            return `Tidak ada hasil untuk pencarian "${query}".`;
        }

        return {
            creator: { nama: 'Zaenishi', website: 'zaenishi.xyz' },
            results: games.slice(0, 3) // Hanya ambil 3 hasil
        };
    } catch (error) {
        return 'Terjadi kesalahan saat scraping: ' + error.message;
    }
}


async function pasteBin(url) {
    if (!url || typeof url !== 'string' || !url.startsWith('https://pastebin.com/')) {
        return 'URL tidak valid. Mohon berikan URL Pastebin yang valid.';
    }
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const pasteTitle = $('div.info-top h1').text().trim() || 'Judul tidak ditemukan';
        const rawLink = $('a[href^="/raw"]').attr('href');
        const downloadLink = $('a[href^="/dl"]').attr('href');

        const codeContent = [];
        $('.source.text ol li').each((i, el) => {
            codeContent.push($(el).text().trim());
        });

        const username = $('div.username a').text().trim() || 'Username tidak ditemukan';
        const datePosted = $('div.date span').text().trim() || 'Tanggal tidak ditemukan';
        const pasteViews = $('div.visits').text().trim() || 'Jumlah tampilan tidak ditemukan';

        return {
            creator: { nama: 'Zaenishi', website: 'zaenishi.xyz' },
            title: pasteTitle,
            rawLink: rawLink ? `https://pastebin.com${rawLink}` : 'Link raw tidak ditemukan',
            downloadLink: downloadLink ? `https://pastebin.com${downloadLink}` : 'Link unduh tidak ditemukan',
            content: codeContent.length ? codeContent : 'Konten kode tidak ditemukan',
            datePosted: datePosted,
            username: username,
            viewCount: pasteViews
        };
    } catch (error) {
        return 'Terjadi kesalahan saat scraping: ' + error.message;
    }
}

async function ligaKlasemen(liga) {
    try {
        const response = await axios.get(`https://www.bola.net/klasemen/${liga}.html`);
        const $ = cheerio.load(response.data);
        const options = [];

        $('.box-select #liga option').each((i, element) => {
            const value = $(element).attr('value');
            const nama = $(element).text();
            options.push({ value, nama });
        });

        const klasemen = [];

        $('.main-table tbody tr').each((i, element) => {
            const posisi = $(element).find('.team-row-pos').text();
            const namaTim = $(element).find('.team-row-name').text().trim();
            const main = $(element).find('td').eq(0).text();
            const poin = $(element).find('td').eq(1).text();
            const menang = $(element).find('td').eq(2).text();
            const seri = $(element).find('td').eq(3).text();
            const kalah = $(element).find('td').eq(4).text();
            const goal = $(element).find('td').eq(5).text();
            const selisihGoal = $(element).find('td').eq(6).text();

            klasemen.push({
                posisi,
                namaTim,
                main,
                poin,
                menang,
                seri,
                kalah,
                goal,
                selisihGoal
            });
        });

        if (klasemen.length === 0) {
            return `Data klasemen untuk liga ${liga} tidak ditemukan.`;
        }

        return {
            creator: { nama: 'Zaenishi', website: 'zaenishi.xyz' },
            liga: liga,
            options: options,
            klasemen: klasemen
        };

    } catch (error) {
        if (error.response && error.response.status === 404) {
            const response = await axios.get('https://www.bola.net/klasemen/inggris.html');
            const $ = cheerio.load(response.data);
            const options = [];

            $('.box-select #liga option').each((i, element) => {
                const nama = $(element).text();
                options.push(nama);
            });

            return {
                message: `Liga yang anda input salah, berikut liga yang benar:`,
                ligaBenar: options,
                creator: { nama: 'Zaenishi', website: 'zaenishi.xyz' }
            };
        } else {
            return `Terjadi kesalahan saat mengambil data liga ${liga}.`;
        }
    }
}

async function infoSaluran(url) {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const img = $('img._9vx6').attr('src');
        const title = $('h3._9vd5._9t2_').text().trim();
        const pengikutText = $('h5._9vd5._9scy').text().trim();
        const pengikut = pengikutText.match(/\d+/)[0];
        const deskripsi = $('h4._9vd5._9scb').text().trim();
        const linkSaluran = $('a#action-button').attr('href');

        return {
            creator: { nama: 'Zaenishi', website: 'zaenishi.xyz' },
            img,
            title,
            pengikut,
            deskripsi,
            linkSaluran
        };
    } catch (error) {
        return 'Terjadi kesalahan saat mendapatkan informasi saluran.';
    }
}

async function twitterDownloader(tweetUrl) {
    const url = 'https://x2twitter.com/api/ajaxSearch';

    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': '*/*',
        'X-Requested-With': 'XMLHttpRequest'
    };

    const data = qs.stringify({
        'q': tweetUrl,
        'lang': 'id'
    });

    try {
        const response = await axios.post(url, data, { headers });
        const html = response.data.data;

        const $ = cheerio.load(html);

        const thumbnail = $('div.image-tw img').attr('src');
        const mp4_1080p = $('a:contains("Unduh MP4 (1080p)")').attr('href');
        const mp4_720p = $('a:contains("Unduh MP4 (720p)")').attr('href');

        return {
            creator: { nama: 'Zaenishi', website: 'zaenishi.xyz' },
            thumbnail,
            mp4_1080p,
            mp4_720p
        };
    } catch (error) {
        return null;
    }
}

async function tiktokDown(videoId) {
    const url = `https://api.twitterpicker.com/tiktok/mediav2?id=${videoId}`;
    try {
        const response = await axios.get(url);
        const data = response.data;

        return {
            creator: { nama: 'Zaenishi', website: 'zaenishi.xyz' },
            videoId: data.id,
            user: {
                username: data.user.username,
                name: data.user.name,
                image: data.user.image,
                imageSmall: data.user.image_small,
            },
            videoDuration: data.video_duration_seconds,
            downloadLinks: {
                videoNoWatermark: data.video_no_watermark.url,
                videoWithWatermark: data.video_watermark.url,
                audio: data.audio.url,
            },
            thumbnailLinks: {
                thumbnail: data.thumbnail,
                animatedThumbnail: data.thumbnail_animated,
            },
        };
    } catch (error) {
        throw new Error("Error fetching video details: " + error.message);
    }
}

async function videy(url) {
    try {
        const parsedUrl = new URL(url);
        const id = parsedUrl.searchParams.get('id');
        
        if (!id || id.length !== 9) {
            throw new Error('ID video tidak valid.');
        }
        
        let tipeFile = id[8] === '2' ? '.mov' : '.mp4';

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);

        const tautanVideo = `https://cdn.videy.co/${id}${tipeFile}`;
        return tautanVideo;
    } catch (error) {
        console.error('Kesalahan saat mengambil tautan video:', error.message);
        return null;
    }
}

class HoloLive {
  async searchTalent(talents) {
    try {
      const { data } = await axios.get(`https://hololive.hololivepro.com/en/talents/${talents}/`);
      const $ = cheerio.load(data);
      
      let mediaSosial = [];
      let video = [];
      let talentData = {};

      $('.right_box .t_sns.clearfix li a').each((index, element) => {
        const platform = $(element).text().trim();
        const url = $(element).attr('href');
        mediaSosial.push({ platform, url });
      });

      $('.five.video ul li').each((index, element) => {
        const url = $(element).find('a').attr('href');
        const thumbnail = $(element).find('img').attr('src');
        const tag = $(element).find('.v_cat').text().trim();
        const judul = $(element).find('.txt').text().trim();
        video.push({ url, thumbnail, judul, tag });
      });

      $('.talent_data .left dl').each((index, element) => {
        const key = $(element).find('dt').text().trim();
        const value = $(element).find('dd').html().trim();

        if (key === 'Illustrator') {
          const illustratorName = $(element).find('a').text().trim();
          const illustratorUrl = $(element).find('a').attr('href');
          talentData[key] = { name: illustratorName, url: illustratorUrl };
        } else {
          talentData[key] = value.replace(/<br\s*\/?>/g, ', ');
        }
      });

      const results = {
        creator: { nama: "zaenishi", website: "zaenishi.xyz" },
        gambar: $('.talent_top figure img').attr('src'),
        nama: $('.talent_top .bg_box h1').contents().not('span').text().trim() + 
              ` (` + $('.talent_top .bg_box h1 span').text().trim() + `)`,
        deskripsi: $('.talent_top .bg_box p').text().trim(),
        mediaSosial: mediaSosial,
        video: video,
        talentData: talentData
      };

      return results;
    } catch (error) {
      console.error("Error fetching talent data:", error);
      return { creator: "zaenishi", message: "error" };
    }
  }

  async news(pageId = 1, country = 'en') {
    try {
      const { data } = await axios.get(`https://hololive.hololivepro.com/${country}/news/?paged=${pageId}`);
      const $ = cheerio.load(data);

      const news = [];

      $('.in_news ul li').each((i, element) => {
        const newsItem = {};
        newsItem.url = $(element).find('a').attr('href');
        newsItem.tanggal = $(element).find('.date').text().trim();
        newsItem.judul = $(element).find('dt').contents().not('.date').text().trim();
        newsItem.deskripsi = $(element).find('dd').text().trim();
        newsItem.thumbnail = $(element).find('img').attr('src');

        news.push(newsItem);
      });

      return { creator: "zaenishi", news };
    } catch (error) {
      console.error("Error fetching news:", error);
      return { creator: "zaenishi", message: "error" };
    }
  }
}

const OPENAI_API_KEY = "lolo";

const sisi = `Anda adalah KinokoKomori, ubah gaya bicaramu seperti KinokoKomori.

Tujuan anda adalah menjawab pertanyaan bantuan, selain itu maka jawab saja "maap saya tidak dapat membantu tentang hal itu" dengan gaya bicaramu.

Jika ada yang menanyakan tentang sesuatu bantuan, jawab memakai itu sesuai dengan pertanyaannya:

1. Siapakah kamu?: Aku adalah Kinoko Komori bot WhatsApp yang diprogram oleh Zaenishi.
2. Fiturnya apa aja?: Fitur saya berguna dan menyenangkan, lihat saja di !menu.
3. Dimana nomer pembuat kamu?: Ini nomer pembuat saya, 62-831-8822-9366.
4. Fitur saya ini aja:
   - videy (untuk mendownload video videy)
   - tiktok (untuk mendownload video tiktok)
   - twitter (untuk mendownload video twitter)
   - pastebin (untuk mendapatkan teks dari pastebin)
   - saluran (untuk mendapatkan informasi saluran WhatsApp berdasarkan URL)
   - itchio (search game)
   - menu (mendapatkan semua menu)
   - hololive (search dan news, search untuk mendapatkan informasi talent, news untuk mendapatkan berita terkini)

Bagaimana cara penggunaan kamu?: Cukup dengan mengetik perintah terlebih dahulu.

Itulah beberapa pertanyaan yang bisa anda jawab, gunakan gaya bicaramu, jika anda tidak tahu jawaban pertanyaannya cukup katakan "g ngrti". Buat jawabanmu harus cocok dengan tampilan pesan WhatsApp, karena kamu sedang diprogram di dalam WhatsApp, jadi pesanmu harus rapi berdasarkan struktur WhatsApp.`;

function addSpaceAfterExclamation(text) {
  return text.replace(/!(\w)/g, ' !$1');
}

async function respon(userInput) {
  
  const messages = [
    { role: 'system', content: sisi },
    { role: 'assistant', content: 'Halo! saya adalah kinoko, butuh bantuan apa??' },
    { role: 'user', content: userInput }
  ];

  try {
    if (!OPENAI_API_KEY) {
      throw new Error('API Key OpenAI tidak disetel');
    }

    const response = await fetch('https://proxy.gaurish.xyz/api/cerebras/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama3.1-8b',
        messages: messages.map(({ role, content }) => ({ role, content })),
        stream: false,
      }),
    });

    const data = await response.json();
    const result = addSpaceAfterExclamation(data.choices[0].message.content);
    if (response.ok) {
      return result;
    } else {
      console.error('Error:', data);
      throw new Error('Terjadi kesalahan pada API');
    }
  } catch (error) {
    console.error('API Error:', error);
    return 'Oh tidak! Sepertinya ada yang salah... mungkin coba lagi nanti ya?🌸';
  }
}

const openAi = {
respon: respon
}

module.exports = {
    scrapeItchIoSearch,
    pasteBin,
    ligaKlasemen,
    infoSaluran,
    twitterDownloader,
    tiktokDown,
    videy,
    HoloLive,
    openAi
};