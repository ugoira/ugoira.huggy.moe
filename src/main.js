import './main.css'

import App from './app.eft'
import Link from './components/link'
import Illust from './components/illust'
import IllustVideo from './components/illust/video'
import IllustVideoLoader from './components/illust/loader'
import Description from './components/description'

// Import helper function and version info from `ef-core`
import { inform, exec } from 'ef-core'
import axios from 'axios'
import JSZip from "jszip"

const r = axios.create({
	baseURL: 'https://ugoira.huggy.moe/api',
	// withCredentials: true
})

// Pause rendering
inform()

// Create an instance for template `Hello`
const app = new App({
})
// Add links
app.links.push(
	new Link('Telegram bot', 'tg://resolve?domain=Pixiv_bot'),
	new Description(''),
	new Link('Github (web)', 'https://github.com/makeding/ugoira.huggy.moe'),
	new Link('Github (api)', 'https://github.com/my-telegram-bots/Pixiv_bot'),
	new Description(''),
	new Link('Twitter', 'https://twitter.com/wosign'),
	new Link('Telegram', 'tg://resolve?domain=makeding'),
	new Link('Email', 'mailto:ugoira@huggy.moe'),
)

app.description = [
	new Description(''),
	new Description('')
]
let illustData = []
let illustIdsData = []

// webState n => normal 
//			 p => show play button
//			 d => downloading
//			 c => converting
let webState = 'n'

let lastY = 0

let videoPlayers = [
	new IllustVideo(),
	new IllustVideo(),
	new IllustVideo(),
	new IllustVideo(),
	new IllustVideo(),
	new IllustVideo(),
	new IllustVideo(),
	new IllustVideo(),
	new IllustVideo(),
]
let videoPlayerLoaders = []
/**
 * lazy load <video>
 * @param {*} sid 
 * @param {*} count 
 */
const videoLoader = (sid, count = 4) => {
	app.illust.forEach((illust, i) => {
		illust = illust.$data
		if (Math.abs(sid - i) <= count) {
			let ii = sid - i + count
			if (!app.illust[i].video || !app.illust[i].video.$data.id) {
				app.illust[i].video = videoPlayers[ii]
				app.illust[i].video.$data.url = illust.url
				app.illust[i].video.$data.id = illust.id
			}
		} else if (!app.illust[i].video || !app.illust[i].video.$data.loaderStyle) {
			if (!videoPlayerLoaders[i]) {
				videoPlayerLoaders[i] = new IllustVideoLoader()
			}
			illustData[i].width = `${document.getElementById(`s${i}`).clientWidth}px`
			illustData[i].height = `${document.getElementById(`s${i}`).clientHeight}px`
			videoPlayerLoaders[i].$data.loaderStyle = `width: ${illustData[i].width};height: ${illustData[i].height};`
			app.illust[i].video = videoPlayerLoaders[i]
		}
	})
	return true
}
const play = () => {
	try {
		let videosDom = document.getElementsByTagName('video')
		if (videosDom.length > 0) {
			for (let i = 0; i <= videosDom.length; i++) {
				if (videosDom[i] && videosDom[i].paused) {
					videosDom[i].play()
				}
			}
			document.removeEventListener('click', clickPlayEvent)
			if (webState == 'p') {
				webState = 'n'
				app.$data.convertButtonText = 'Convert'
				app.description[1].$data.description = ''
			}
		}
	} catch (error) {

	}
}
const getIllusts = async ({ state, value }) => {
	if (['d', 'c', 'p'].includes(webState)) {
		return false
	}
	if (value.includes('keyflag')) {
		app.$data.input += ' '
		app.$data.input += '\n'
	}
	let localIllustIdsData = get_pixiv_ids(value).illust
	if (localIllustIdsData.length === 0) {
		app.description[0].$data.description = 'Invalid input'
		app.description[1].$data.description = 'Check that the content you entered contain pixiv\'s ugoira link(s).'
		return false
	}

	if (state || webState == 'n') {
		webState = 'c'
		app.description[0].$data.description = ''
		app.description[1].$data.description = ''
		app.$data.convertButtonText = 'Converting'
		// user clicked covert button but no ids changed
		// maybe videos are still not autoplay, so I exec .play()
		if (JSON.stringify(localIllustIdsData) === JSON.stringify(illustIdsData)) {
			// play
			play()
			// fake processing convert button
			setTimeout(() => {
				webState = 'n'
				app.$data.convertButtonText = 'Convert'
			}, 500)
			return
		}

		let data = {
			data: [],
			ids: []
		}
		try {
			data = (await r.post('illusts', {
				id: localIllustIdsData.join('-'),
				type: 'ugoira'
			})).data
		} catch (error) {
			app.description[0].$data.description = 'Error, please contact me'
			app.description[1].$data.description = 'on Github issue or Telegram'
			alert('Something went wroing, try again later or contact me')
			console.error(error)
		}
		if (data.ids && data.ids.length > 0) {
			illustIdsData = data.ids
			illustData = data.data
			app.illust = []

			app.description[0].$data.description = 'Click video to download~'
			history.pushState('', 'Pixiv Ugoira Converter', '?ids=' + data.ids.join('-'))
			// lazy load with s**t method....
			data.data.forEach((illust, sid) => {
				illust.sid = sid
				app.illust.push(new Illust(illust))
				if (data.ids.length > 9) {
					app.illust[sid].video = new IllustVideoLoader()
				}
				videoLoader(4)
				// just Firefox full support it
				// and maybe cost user's a lot of mobile data
				// let preloadLink = document.createElement('link')
				// preloadLink.rel = 'preload'
				// preloadLink.href = illust.url
				// preloadLink.as = 'video'
				// preloadLink.type = 'video/mp4'
				// document.getElementsByTagName('head')[0].appendChild(preloadLink)
			})
			if (data.ids.length > 1) {
				document.getElementById('download').style = 'display:inline-block;'
			} else {
				document.getElementById('download').style = ''
			}
		} else {
			app.illust = []
			app.description[0].$data.description = 'No pixiv ugoira link found'
			app.description[1].$data.description = 'Make sure pixiv link\'s type is ugoira (動いら)'
		}
		webState = 'n'
		app.$data.convertButtonText = 'Convert'
	}
	if (!state) {
		webState = 'p'
		app.description[1].$data.description = 'If the video does not play automatically, please click the Play button.'
		app.$data.convertButtonText = 'Play'
	}
}
const download_file = async (url, tryTime = 0) => {
	if (tryTime > 5) {
		return false
	}
	try {
		let data = await (await axios.get(url, {
			responseType: 'blob'
		})).data
		return data
	} catch (error) {
		console.error(error)
		return await download_file(url, tryTime + 1)
	}
}

const downloadAllIllusts = async () => {
	if (webState == 'd') {
		return true
	}
	webState = 'd'
	app.description[0].$data.description = 'Downloading files'
	app.description[1].$data.description = ''
	let zip = new JSZip()

	// generate readme.html
	// X S S
	zip.file('readme.html', `<html><head><meta charset="UTF-8" /><title>Pixiv Ugoira converter</title></head><body><p>This folder is converted & downloaded by <a target="_blank" href="https://ugoira.huggy.moe">ugoira.huggy.moe</a></p><br>illusts link:<br>${illustIdsData.map(u => {
		let url = `https://www.pixiv.net/artworks/${u}`
		return `<a target="_blank" href="${url}">${url}</a>`
	}).join('<br>')}<br><br>You can view this folder's all illusts online on <a href="https://ugoira.huggy.moe/?ids=${illustIdsData.join('-')}">this link</a>`)

	// download *.mp4 in local browser and compress to *.zip
	// single thread
	await asyncForEach(illustData, async (illust, i) => {
		app.description[1].$data.description = `${i}/${illustIdsData.length}`
		let ugoira_data = await download_file(illust.url)
		if (!ugoira_data) {
			alert('Some files cannot be downloaded\nYou other try agian or contact me.')
		}
		zip.file(`${illust.id}-${illust.title}.mp4`, ugoira_data)
	})
	app.description[1].$data.description = 'Compressing'
	// no need await ? // .then is OK
	zip.generateAsync({ type: 'blob' }).then(function (zipbolb) {
		let dwDom = document.createElement("a")
		dwDom.setAttribute("href", URL.createObjectURL(zipbolb))
		dwDom.setAttribute("download", `${location.hostname}_${new Date().toLocaleString()}.zip`)
		dwDom.setAttribute("style", "display:none;")
		dwDom.appendChild(document.createTextNode("dw"))
		document.body.appendChild(dwDom)
		dwDom.click()
		setTimeout(() => {
			document.body.removeChild(dwDom)
		}, 2000)
		webState = 'n'
		app.description[0].$data.description = 'Downloaded'
		app.description[1].$data.description = ''
	})
}

// when url with params => input data
if (location.search !== '') {
	let hash = location.search.replace('?ids=', '-').replace('?', '-')
	app.$data.input = hash.replace(/-/g, '\nhttps://www.pixiv.net/artworks/').replace('\n', '')
	getIllusts({ value: hash })
}

const clickPlayEvent = () => {
	play()
}
document.addEventListener('click', clickPlayEvent)
/**
 * listen scroll event
 */
const scrollEventTimerF = () => {
	if (webState === 'c') {
		return
	}
	let Y = Math.floor(window.scrollY)
	lastY = Y
	setTimeout(() => {
		if (Y == lastY) {
			if (illustIdsData.length > 9) {
				let illustsDom = document.getElementsByClassName('illust')
				for (let i = 0; i < illustsDom.length; i++) {
					const illustDom = illustsDom[i]
					if (illustDom.offsetTop > Y) {
						lastY = Y
						videoLoader(i, 4)
						break
					}
				}
			}
		}
	}, 300)
}
document.addEventListener('scroll', scrollEventTimerF)

app.$methods.getIllusts = getIllusts
app.$methods.downloadAllIllusts = downloadAllIllusts

// Mount app to document
app.$mount({ target: document.body })

// Resume rendering
exec()

async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array)
	}
}

/**
 * get pixiv ids from text
 * lite version (only have illust link)
 * src: https://github.com/my-telegram-bots/Pixiv_bot/blob/master/handlers/telegram/pre_handle.js#L11
 * @param {*} text 
 * @returns {}
 */
function get_pixiv_ids(text) {
	let ids = {
		illust: [],
		author: [],
		novel: [],
		// fanbox: [],
	}
	if (text) {
		let t = text.replace(/-_-/g, ' ').replace(/www\./ig, '').replace(/http:\/\//ig, 'https://').replace(/https:\/\//ig, '\nhttps://').replace(/  /g, ' ').replace(/\+/g, ' ').replace(/\-/g, ' ').replace(/ /g, '\n').replace(/\/en/ig, '/').split('\n')
		t.forEach(u => {
			try {
				if (!u || u.length < 6) {
					return []
					// Match url(s)
				}
				if (u.includes('novel')) {
					if (!isNaN(parseInt(u.replace('https://pixiv.net/novel/show.php?id=', '').split('&')[0]))) {
						ids.novel.push(parseInt(u.replace('https://pixiv.net/novel/show.php?id=', '').split('&')[0]))
					}
				}
				if (u.includes('user')) {
					if (!isNaN(parseInt(u.replace('https://pixiv.net/users/', '').split('?')[0].split('&')[0]))) {
						ids.author.push(parseInt(u.replace('https://pixiv.net/users/', '').split('?')[0].split('&')[0]))
					}
				}
				// general search
				try {
					let uu = new URL(u).searchParams
					if (uu.get('illust_id')) {
						ids.illust.push(parseInt(uu.get('illust_id')))
					}
				} catch (error) {
				}
				if (u.length > 7 && !isNaN(parseInt(u.replace('#', '').replace('id=', '').replace('id', '')))) {
					// match #idxxxxxxx #xxxxxxx
					ids.illust.push(parseInt(u.replace('#', '').replace('id', '').replace('=', '')))
				} else {
					throw 'switch to general id matcher'
				}
			} catch (error) {
				let t = u.replace('https://', '').replace('pixiv.net', '').replace('artworks', '').replace('i', '').replace(/\//g, '').split('?')[0].split('#')[0]
				if (!isNaN(t) && t && t.length === 8) {
					ids.illust.push(parseInt(t))
				}
			}
		})
	}
	return { ...ids }
}