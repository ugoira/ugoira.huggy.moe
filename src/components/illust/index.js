import Tpl from './template.eft'

export default class Illust extends Tpl {
	constructor(illust) {
		super({
			$data: {
				...illust,
				// tags_joined: illust.tags.length > 0 ? `#${illust.tags.join(' #')}` : ''
				//Style: (illust.imgs_.size[0].height ? `max-height: ${illust.imgs_.size[0].height}px;` : '') + (illust.imgs_.size[0].width ? `max-width: ${illust.imgs_.size[0].width}px;` : '')
			}
		})
	}
}
