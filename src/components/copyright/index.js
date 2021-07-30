import Tpl from './template.eft'

export default class Copyright extends Tpl {
    constructor(copyright) {
		super({
			$data: {
                year: new Date().getFullYear()
            }
		})
	}
}
