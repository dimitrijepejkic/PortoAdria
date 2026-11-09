/******************************************
	File Name: consent.js
	Cookie consent for portoadria.de (TDDDG § 25 / DSGVO Art. 6 (1) a)

	- Google Analytics is NOT loaded before consent ("basic" Google Consent Mode:
	  no Google request at all until the visitor clicks "Alle akzeptieren" or
	  enables "Statistik" and saves).
	- "Alle akzeptieren" and "Alle ablehnen" are equal buttons on the first layer.
	- Categories: Notwendig (always on: stores this choice), Statistik (GA4).
	  There are no marketing scripts on this site, so there is no marketing category.
	- The choice is stored in localStorage ("pa_consent") for 12 months, then asked again.
	- Withdrawal: "Cookie-Einstellungen" link in the footer (any element with
	  [data-consent-open]); withdrawing deletes the _ga cookies and reloads the page.
/****************************************** */

(function () {
	"use strict";

	var GA_ID = 'G-PEY0WJDTB4';
	var KEY = 'pa_consent';
	var VERSION = 1;                        // bump when categories/purposes change -> asks again
	var MAX_AGE = 365 * 24 * 60 * 60 * 1000; // re-ask after 12 months
	var GA_COOKIE_SECONDS = 395 * 24 * 60 * 60; // ~13 months

	// Google Consent Mode defaults: everything denied. Nothing is sent, because gtag.js is not loaded yet.
	window.dataLayer = window.dataLayer || [];
	window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
	window.gtag('consent', 'default', {
		ad_storage: 'denied',
		ad_user_data: 'denied',
		ad_personalization: 'denied',
		analytics_storage: 'denied',
		functionality_storage: 'granted',
		security_storage: 'granted'
	});

	function readChoice() {
		try {
			var c = JSON.parse(window.localStorage.getItem(KEY));
			if (c && c.v === VERSION && (Date.now() - c.ts) < MAX_AGE) { return c; }
		} catch (e) { /* storage blocked or invalid -> ask again */ }
		return null;
	}

	function saveChoice(analytics) {
		var c = { v: VERSION, ts: Date.now(), analytics: !!analytics };
		try { window.localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) { /* ignore */ }
		return c;
	}

	var gaLoaded = false;
	function loadAnalytics() {
		if (gaLoaded) { return; }
		gaLoaded = true;
		window.gtag('consent', 'update', { analytics_storage: 'granted' });
		window.gtag('js', new Date());
		window.gtag('config', GA_ID, {
			allow_google_signals: false,
			allow_ad_personalization_signals: false,
			cookie_expires: GA_COOKIE_SECONDS
		});
		var s = document.createElement('script');
		s.async = true;
		s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
		document.head.appendChild(s);
	}

	function deleteAnalyticsCookies() {
		var host = window.location.hostname;
		var domains = ['', host, '.' + host];
		var parts = host.split('.');
		if (parts.length > 2) { domains.push('.' + parts.slice(-2).join('.')); }
		document.cookie.split(';').forEach(function (raw) {
			var name = raw.split('=')[0].trim();
			if (name === '_ga' || name.indexOf('_ga_') === 0 || name === '_gid' || name === '_gat') {
				domains.forEach(function (d) {
					document.cookie = name + '=; Max-Age=0; path=/' + (d ? '; domain=' + d : '');
				});
			}
		});
	}

	/* ---------- UI ---------- */

	var banner, details, statToggle, saveBtn, settingsBtn;

	function el(tag, attrs, html) {
		var n = document.createElement(tag);
		for (var k in attrs) { if (attrs.hasOwnProperty(k)) { n.setAttribute(k, attrs[k]); } }
		if (html) { n.innerHTML = html; }
		return n;
	}

	function build() {
		banner = el('div', {
			'class': 'cc-banner', role: 'dialog', 'aria-modal': 'false',
			'aria-labelledby': 'cc-title', 'aria-describedby': 'cc-text', tabindex: '-1'
		});
		banner.innerHTML =
			'<div class="cc-inner">' +
				'<p class="cc-title" id="cc-title">Datenschutz-Einstellungen</p>' +
				'<p class="cc-text" id="cc-text">Wir verwenden technisch notwendige Speicherungen, damit diese Website funktioniert. ' +
				'Mit Ihrer Einwilligung nutzen wir zusätzlich <strong>Google Analytics</strong>, um zu verstehen, wie unsere Website genutzt wird. ' +
				'Dabei werden Cookies gesetzt und Daten an Google (auch in die USA) übermittelt. ' +
				'Ihre Einwilligung ist freiwillig und kann jederzeit über „Cookie-Einstellungen“ am Seitenende widerrufen werden. ' +
				'Mehr dazu in unserer <a href="datenschutz.html">Datenschutzerklärung</a>.</p>' +
				'<div class="cc-details" id="cc-details" hidden>' +
					'<div class="cc-cat">' +
						'<label class="cc-switch"><input type="checkbox" checked disabled> <span>Notwendig</span> <em>immer aktiv</em></label>' +
						'<p>Speichert Ihre Auswahl in diesem Dialog im lokalen Speicher Ihres Browsers (Schlüssel „pa_consent“, 12 Monate). Keine Weitergabe an Dritte.</p>' +
					'</div>' +
					'<div class="cc-cat">' +
						'<label class="cc-switch"><input type="checkbox" id="cc-stat"> <span>Statistik</span></label>' +
						'<p>Google Analytics 4 (Google Ireland Limited; Google LLC, USA): Reichweitenmessung, Cookies „_ga“ und „_ga_*“ (bis 13 Monate). ' +
						'Google Signals und Werbefunktionen sind deaktiviert.</p>' +
					'</div>' +
				'</div>' +
				'<div class="cc-actions">' +
					'<button type="button" class="cc-btn" data-cc="reject">Alle ablehnen</button>' +
					'<button type="button" class="cc-btn cc-btn-plain" data-cc="settings" aria-expanded="false" aria-controls="cc-details">Einstellungen</button>' +
					'<button type="button" class="cc-btn cc-btn-plain" data-cc="save" hidden>Auswahl speichern</button>' +
					'<button type="button" class="cc-btn" data-cc="accept">Alle akzeptieren</button>' +
				'</div>' +
			'</div>';
		document.body.insertBefore(banner, document.body.firstChild);
		details = banner.querySelector('#cc-details');
		statToggle = banner.querySelector('#cc-stat');
		saveBtn = banner.querySelector('[data-cc="save"]');
		settingsBtn = banner.querySelector('[data-cc="settings"]');

		banner.addEventListener('click', function (e) {
			var b = e.target.closest ? e.target.closest('[data-cc]') : null;
			if (!b) { return; }
			var a = b.getAttribute('data-cc');
			if (a === 'accept') { decide(true); }
			if (a === 'reject') { decide(false); }
			if (a === 'save') { decide(statToggle.checked); }
			if (a === 'settings') { showDetails(true); }
		});
	}

	function showDetails(open) {
		details.hidden = !open;
		saveBtn.hidden = !open;
		settingsBtn.hidden = open;
		settingsBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
		if (open) { statToggle.focus(); }
	}

	function open(withDetails, focus) {
		if (!banner) { build(); }
		var c = readChoice();
		statToggle.checked = !!(c && c.analytics);
		showDetails(!!withDetails);
		banner.classList.add('cc-visible');
		if (focus) { banner.focus(); }
	}

	function close() {
		if (banner) { banner.classList.remove('cc-visible'); }
	}

	function decide(analytics) {
		var before = readChoice();
		saveChoice(analytics);
		close();
		if (analytics) {
			loadAnalytics();
		} else {
			window.gtag('consent', 'update', { analytics_storage: 'denied' });
			deleteAnalyticsCookies();
			// GA was running on this page -> reload so no Google script stays active
			if (gaLoaded || (before && before.analytics)) { window.location.reload(); }
		}
	}

	function init() {
		var c = readChoice();
		if (c && c.analytics) { loadAnalytics(); }
		if (!c) { open(false, false); }
		document.addEventListener('click', function (e) {
			var t = e.target.closest ? e.target.closest('[data-consent-open]') : null;
			if (t) { e.preventDefault(); open(true, true); }
		});
	}

	window.portoConsent = { open: function () { open(true, true); } };

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
