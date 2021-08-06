import './main.css'

import App from './app.eft'
import Copyright from './components/copyright'
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
}, { Copyright })
// Add links
app.links.push(
	new Link('Github', 'https://github.com/makeding/ugoira.huggy.moe'),
	new Link('Telegram bot', 'https://t.me/Pixiv_bot'),
	new Link('Twitter', 'https://twitter.com/wosign'),
)
app.description = [
	new Description(''),
	new Description('')
]
let illustData = []
let illustIdsData = []
let lastInput = ''

// webStatus n => normal 
//			 p => show play button
//			 d => downloading
//			 c => converting
let webStatus = 'n'

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
			if (webStatus == 'p') {
				webStatus = 'n'
				app.$data.convertButtonText = 'Convert'
				app.description[1].$data.description = ''
			}
		}
	} catch (error) {

	}
}
const getIllusts = async ({ state, value }) => {
	if (['d', 'c', 'p'].includes(webStatus)) {
		return false
	}
	if (value.includes('keyflag')) {
		app.$data.input += ' '
		app.$data.input += '\n'
	}
	if (value.length < 6) {
		app.description[0].$data.description = 'Invalid input'
		return false
	}
	if (state || (webStatus == 'n')) {
		webStatus = 'c'
		app.description[0].$data.description = ''
		app.description[1].$data.description = ''
		app.$data.convertButtonText = 'Converting'
		app.illust = []
		let data = {
			data: illustData,
			ids: illustIdsData
		}
		if (lastInput != value.replace(/\s\n/g,'')) {
			try {
				data = (await r.post('illusts', {
					id: value,
					type: 'ugoira'
				})).data
				illustIdsData = data.ids
				illustData = data.data
				lastInput = value.replace(/\s\n/g,'')
			} catch (error) {
				app.description[0].$data.description = 'Error, please contact me'
				app.description[1].$data.description = 'on Github issue or Telegram'
				alert('Something went wroing, try again later or contact me')
				console.error(error)
			}
		}
		if (data.ids && data.ids.length > 0) {
			app.description[0].$data.description = 'Click video to download~'
			history.pushState('', 'Pixiv Ugoira Converter', '?' + data.ids.join('-'))
			illustData = data.data
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
			app.description[0].$data.description = 'No pixiv ugoira link found'
			app.description[1].$data.description = 'Make sure pixiv link\'s type is ugoira (動いら)'
		}
		webStatus = 'n'
		app.$data.convertButtonText = 'Convert'
	}
	if (!state) {
		webStatus = 'p'
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
	if (webStatus == 'd') {
		return true
	}
	webStatus = 'd'
	app.description[0].$data.description = 'Downloading files'
	app.description[1].$data.description = ''
	let zip = new JSZip()

	// generate readme.html
	// X S S
	zip.file('readme.html', `<html><head><meta charset="UTF-8" /><title>Pixiv Ugoira converter</title></head><body><p>This folder is converted & downloaded by <a target="_blank" href="https://ugoira.huggy.moe">ugoira.huggy.moe</a></p><br>illusts link:<br>${illustIdsData.map(u => {
		let url = `https://www.pixiv.net/artworks/${u}`
		return `<a target="_blank" href="${url}">${url}</a>`
	}).join('<br>')}<br><br>You can view this folder's all illusts online on <a href="https://ugoira.huggy.moe/?${illustIdsData.join('-')}">this link</a>`)

	// download *.mp4 in local browser and compress to *.zip
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
	zip.generateAsync({ type: 'blob' }).then(function (content) {
		saveAs(content, `ugoira.huggy.moe_${new Date().toLocaleString()}.zip`)
		webStatus = 'n'
		app.description[0].$data.description = 'Downloaded'
		app.description[1].$data.description = ''
	})
}

// when url with params => input data
if (location.search !== '') {
	let hash = location.search.replace('?', '-')
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

// copy from https://davidwalsh.name/javascript-zip
function saveAs(blob, filename) {
	if (typeof navigator.msSaveOrOpenBlob !== 'undefined') {
		return navigator.msSaveOrOpenBlob(blob, fileName)
	} else if (typeof navigator.msSaveBlob !== 'undefined') {
		return navigator.msSaveBlob(blob, fileName)
	} else {
		let elem = window.document.createElement('a')
		elem.href = window.URL.createObjectURL(blob)
		elem.download = filename
		elem.style = 'display:none;opacity:0;color:transparent;'
		document.body.appendChild(elem)
		if (typeof elem.click === 'function') {
			elem.click()
		} else {
			elem.target = '_blank'
			elem.dispatchEvent(new MouseEvent('click', {
				view: window,
				bubbles: true,
				cancelable: true
			}))
		}
		URL.revokeObjectURL(elem.href)
	}
}