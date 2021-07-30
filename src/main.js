// Import style
import './main.css'

// Import templates
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
let r = axios.create({
	baseURL: 'https://ugoira.huggy.moe/api',
	//withCredentials: true
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
let lastInput = null
let videoPlayers = [
	new IllustVideo(),
	new IllustVideo(),
	new IllustVideo(),
	new IllustVideo(),
	new IllustVideo()
]
/**
 * lazy load <video>
 * @param {*} sid 
 * @param {*} count 
 */
const videoLoader = (sid, count = 2) => {
	app.illust.forEach((illust, i) => {
		illust = illust.$data
		if (Math.abs(sid - i) <= count) {
			let ii = sid - i + 2
			if (!app.illust[i].video || !app.illust[i].video.$data.id) {
				app.illust[i].video = videoPlayers[ii]
				app.illust[i].video.$data.url = illust.url
				app.illust[i].video.$data.id = illust.id
			}
		} else {
			app.illust[i].video = new IllustVideoLoader()
		}
	})
}
const getIllusts = async ({ state, value }) => {
	if (value.includes('keyflag')) {
		app.$data.input += ' '
		app.$data.input += '\n'
	}
	if (value.length < 6) {
		app.description[0].$data.description = 'Invalid input'
		return false
	}
	if (app.$data.convertStatus == 'Play') {
		let videosDom = document.getElementsByTagName('video')
		for (let i = 0; i <= videosDom.length; i++) {
			if (videosDom[i]) {
				videosDom[i].play()
			}
		}
		app.$data.convertStatus = 'Convert'
		return
	}
	if (state || (app.$data.convertStatus !== 'Converting' && app.$data.convertStatus !== 'Play')) {
		app.description[0].$data.description = ''
		app.description[1].$data.description = ''
		app.$data.convertStatus = 'Converting'
		app.illust = []
		let data = {
			data: illustData,
			ids: illustIdsData
		}
		if (lastInput != value) {
			try {
				data = (await r.post('illusts', {
					id: value,
					type: 'ugoira'
				})).data
				illustIdsData = data.ids
				illustData = data.data
				lastInput = value
			} catch (error) {
				app.description[0].$data.description = 'Error, please contact me'
				app.description[1].$data.description = 'on Github issue or Telegram'
				alert('Something went wroing, try again later or contact me')
				console.error(error)
			}
		}
		console.log(data.ids)
		if (data.ids && data.ids.length > 0) {
			app.description[0].$data.description = 'Click video to download~'
			history.pushState('', 'Pixiv Ugoira Converter', '?' + data.ids.join('-'))
			illustData = data.data
			// lazy load with s**t method....
			data.data.forEach((illust, sid) => {
				illust.sid = sid
				app.illust.push(new Illust(illust))
				app.illust[sid].video = new IllustVideoLoader()
				// load 5 illusts in default
				setTimeout(() => {
					videoLoader(2, 2)
				}, 500);
				// // many browser support it
				// let preloadLink = document.createElement('link')
				// preloadLink.rel = 'preload'
				// preloadLink.href = illust.url
				// preloadLink.as = 'video'
				// preloadLink.type = 'video/mp4'
				// document.getElementsByTagName('head')[0].appendChild(preloadLink)
			})
		} else {
			app.description[0].$data.description = 'No pixiv ugoira link found'
		}
		app.$data.convertStatus = 'Convert'
	}
	if (!state) {
		app.description[1].$data.description = 'If the video does not play automatically, please click the Play button.'
		app.$data.convertStatus = 'Play'
	}
}
let scrollFlagger = true
document.addEventListener("scroll", function (x, xx) {
	let Y = window.scrollY
	if (Y.toString().split('.')[0].substr(-1, 1) % 2 == 0) {
		scrollFlagger = false
		let illustsDom = document.getElementsByClassName('illust')
		for (let i = 0; i < illustsDom.length; i++) {
			const illustDom = illustsDom[i]
			if (illustDom.offsetTop > Y) {
				videoLoader(i, 2)
				scrollFlagger = true
				break
			}
		}
	}
})


if (location.search !== '') {
	let hash = location.search.replace('?', '-')
	app.$data.input = hash.replace(/-/g, '\nhttps://www.pixiv.net/artworks/').replace('\n', '')
	// due to autoplay limit, need user click web content
	getIllusts({ value: hash })
}
app.$methods.getIllusts = getIllusts
// Mount app to document
app.$mount({ target: document.body })

// Resume rendering
exec()
async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array)
	}
}
