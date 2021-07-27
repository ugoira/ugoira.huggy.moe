import Tpl from './template.eft'

export default class description extends Tpl {
	constructor(description) {
		super({
			$data: {description}
		})
	}
}
