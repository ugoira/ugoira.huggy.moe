// Import style
import './main.css'

// Import templates
import App from './app.eft'
import Copyright from './components/copyright'
import Link from './components/link'
import Illust from './components/illust'
import Description from './components/description'
// Import helper function and version info from `ef-core`
import { inform, exec } from 'ef-core'
import axios from 'axios'
let r = axios.create({
	baseURL: 'https://ugoira.huggy.moe/api',
	//withCredentials: true
})
// Prepare a custom component scope for later use
const scope = { Copyright }

// Pause rendering
inform()

// Create an instance for template `Hello`
const app = new App({
}, scope)
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
const getIllusts = async ({ state, value }) => {
	if (value.length < 6) {
		app.description[0].$data.description = 'Invalid input'
		return false
	}
	if (!state || state.description[0].$data.description !== 'Converting') {
		app.description[0].$data.description = 'Converting'
		app.description[1].$data.description = ''
		app.$data.convertStatus = 'Converting'
		app.illust = []
		try {
			let data = (await r.post('illusts', {
				id: value,
				type: 'ugoira'
			})).data
			console.log(data.ids)
			if (data.ids && data.ids.length > 0) {
				app.description[0].$data.description = 'Click video to download~'
				data.data.forEach(d => {
					app.illust.push(new Illust(d))
				})
				history.pushState('', 'Pixiv Ugoira Converter', '?' + data.ids.join('-'))
			} else {
				app.description[0].$data.description = 'No pixiv ugoira link found'
			}
		} catch (error) {
			app.description[0].$data.description = 'Error, please contact me'
			app.description[0].$data.description = 'on Github issue or Telegram'
			alert('Something went wroing, try again later or contact me')
			console.error(error)
		}
		app.$data.convertStatus = 'Convert'
	}
	if(!state){
		app.description[1].$data.description = 'If the video does not play automatically, please click the Convert button.'
	}
}
if (location.search !== "") {
	let hash = location.search.replace('?', '')
	app.$data.input = hash
	// due to autoplay limit, need user click web content
	getIllusts({ value: hash })
}
app.$methods.getIllusts = getIllusts
// Mount app to document
app.$mount({ target: document.body })

// Resume rendering
exec()
