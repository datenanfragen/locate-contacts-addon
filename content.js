browser.runtime.onMessage.addListener(async request => {
	let response = '';
	switch (request.command) {
		case 'emails':
			response = document.body.innerText.match(
				/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*\s*(?:@|[\(\[\{]\s*[aäAÄ][tT]\s*[\)\]\}])\s*(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g
			);
			break;
		case 'content':
			response = document.body.textContent;
			break;
		case 'mark':
			let mark = new Mark(document.body);
			mark.unmark();

			let email_elems = {};
			let phone_elems = {};

			mark.mark(request.mark || [], {
				className: 'dade-lca-email',
				iframes: true,
				acrossElements: true,
				ignoreJoiners: true,
				ignorePunctuation: ':;.,-–—‒_(){}[]!\'"+='.split(''),
				each: elem => {
					elem.id =
						'dade-lca-email-' +
						Math.random()
							.toString(36)
							.substr(2, 9);
					email_elems[elem.textContent] = elem.id;
				},
				done: async () => {
					let a = await browser.runtime.sendMessage({ command: 'email_elems', email_elems: email_elems });
				}
			});

			mark.markRanges(request.mark_range, {
				className: 'dade-lca-phone',
				iframes: true,
				each: (elem, range) => {
					elem.id =
						'dade-lca-phone-' +
						Math.random()
							.toString(36)
							.substr(2, 9);
					phone_elems[range.start + '_' + (range.start + range.length)] = elem.id;
				},
				done: async () => {
					let a = await browser.runtime.sendMessage({ command: 'phone_elems', phone_elems: phone_elems });
				}
			});

			response = true;
			break;
	}

	return Promise.resolve(response);
});
