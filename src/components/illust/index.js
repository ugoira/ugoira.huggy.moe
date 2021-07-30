import Tpl from './template.eft'

export default class Illust extends Tpl {
	constructor(illust) {
		super({
			$data: {
				...illust,
				tags_joined: '#' + illust.tags.join(' #'),
				// Style: (illust.imgs_.size[0].height ? `height: ${illust.imgs_.size[0].height}px;` : '') + (illust.imgs_.size[0].width ? `width: ${illust.imgs_.size[0].width}px;` : '')
			}
		})
	}
}
