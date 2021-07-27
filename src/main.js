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
const getIllusts = async ({ state, value }) => {
	if (state.description.length == 0 || state.description[0].$data && state.description[0].$data.description !== 'Converting') {
		app.illust = []
		app.description = [
			new Description('Converting')
		]
		try {
			let data = (await r.post('illusts', {
				id: value
			})).data
			console.log(data.ids)
			app.description = []
			if (data.ids && data.ids.length > 0) {
				app.description.push(new Description("Click video to download~"))
				data.data.forEach(d => {
					app.illust.push(new Illust(d))
				})
			} else {
				app.description.push(new Description("No pixiv link found"))
			}
		} catch (error) {
			alert('Something went wroing, try again later')
			console.error(error)
		}
	}
}
app.$methods.getIllusts = getIllusts
// Mount app to document
app.$mount({ target: document.body })

// Resume rendering
exec()
