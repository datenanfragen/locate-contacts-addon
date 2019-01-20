const contentBox = document.querySelector('#content');

let emails;
let phone_ranges = {};

let email_elems = {};
let phone_elems = {};

function renderContent() {
	let email_ul = document.createElement('ul');
	let phone_ul = document.createElement('ul');

	let createLi = (elem_id, text) => {
		let li = document.createElement('li');

		let locate_button = document.createElement('img');
		locate_button.src = '../icons/locate.svg';
		locate_button.onclick = () => {
			browser.tabs.executeScript({
				code:
					'var elem = document.getElementById("' +
					elem_id +
					'"); elem.scrollIntoView({behavior: "smooth", block: "center" }); setTimeout(function() { elem.classList.add("dade-lca-flash"); setTimeout(function() { elem.classList.remove("dade-lca-flash"); }, 200); }, 500);'
			});
		};
		locate_button.title = 'Locate on page';

		let copy_btn = document.createElement('img');
		copy_btn.src = '../icons/copy.svg';
		copy_btn.onclick = async () => {
			await navigator.clipboard.writeText(text);
			li.classList.add('flash');
			setTimeout(function() {
				li.classList.remove('flash');
			}, 100);
		};
		copy_btn.title = 'Copy to clipboard';

		let span = document.createElement('span');
		span.textContent = text;

		li.appendChild(locate_button);
		li.appendChild(copy_btn);
		li.appendChild(span);

		return li;
	};

	Object.keys(email_elems).forEach(email => {
		email_ul.appendChild(createLi(email_elems[email], email));
	});

	Object.keys(phone_elems).forEach(range => {
		phone_ul.appendChild(createLi(phone_elems[range], phone_ranges[range]));
	});

	document.getElementById('emails').innerHTML = '';
	if (Object.keys(email_elems).length > 0) document.getElementById('emails').appendChild(email_ul);
	else document.getElementById('emails').textContent = 'None found.';

	document.getElementById('phones').innerHTML = '';
	if (Object.keys(phone_elems).length > 0) document.getElementById('phones').appendChild(phone_ul);
	else document.getElementById('phones').textContent = 'None found.';
}

async function locateDetails() {
	document.getElementById('emails').textContent = 'Loading…';
	document.getElementById('phones').textContent = 'Loading…';

	let tabs = await browser.tabs.query({ active: true, currentWindow: true });
	let tab_id = tabs[0].id;

	await browser.tabs.executeScript({ file: '/mark.min.js' });
	await browser.tabs.insertCSS({
		code:
			'mark.dade-lca-email { background-color: #FFBABA; padding: 0.3em; } mark.dade-lca-phone { background-color: #DFF2BF; padding: 0.3em; } @keyframes dade-lca-flash { 0%, 100% { opacity: 1; } 50% { opacity: 0; } } .dade-lca-flash { -webkit-animation-duration: 0.1s; animation-duration: 0.1s; -webkit-animation-fill-mode: both; animation-fill-mode: both; animation-name: dade-lca-flash; }'
	});

	emails = await browser.tabs.sendMessage(tab_id, { command: 'emails' });

	let content = await browser.tabs.sendMessage(tab_id, { command: 'content' });
	let phones = new libphonenumber.findNumbers(
		content,
		document.getElementById('phone-fallback-country').value.toUpperCase(),
		{ v2: true }
	);
	let phone_positions = phones.map(phone => ({ start: phone.startsAt, length: phone.endsAt - phone.startsAt }));
	phones.forEach(phone => {
		phone_ranges[phone.startsAt + '_' + phone.endsAt] = phone.number.format('INTERNATIONAL');
	});

	if (!(await browser.tabs.sendMessage(tab_id, { command: 'mark', mark: emails, mark_range: phone_positions }))) {
		console.error('Failed to mark contact details.');
	}

	renderContent();
}

document.getElementById('phone-fallback-country').onchange = locateDetails;

browser.tabs.onActivated.addListener(locateDetails);
browser.tabs.onUpdated.addListener(locateDetails);

window.onload = locateDetails;

browser.runtime.onMessage.addListener(request => {
	let response = true;

	switch (request.command) {
		case 'email_elems':
			if (request.email_elems) email_elems = request.email_elems;
			break;
		case 'phone_elems':
			if (request.phone_elems) phone_elems = request.phone_elems;
			break;
	}

	return Promise.resolve(response);
});
