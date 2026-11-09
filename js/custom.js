/******************************************
	File Name: custom.js
	Site behaviour for portoadria.de:
	smooth scrolling, scrollspy, sticky header, nav state,
	menu tabs, gallery lightbox, WOW fade-ins.
/****************************************** */

(function ($) {
	"use strict";

	var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	/* ==============================================
		SMOOTH SCROLL (in-page anchors; not tabs/modals)
	=============================================== */
	$('a[href*="#"]:not([href="#"]):not([data-toggle])').on('click', function () {
		if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '')
			|| location.hostname == this.hostname) {

			var target = $(this.hash);
			target = target.length ? target : $('[name="' + this.hash.slice(1) + '"]');
			if (target.length) {
				$('html,body').animate({
					scrollTop: target.offset().top
				}, reduceMotion ? 0 : 1000);
				return false;
			}
		}
	});

	// Activate scrollspy to add active class to navbar items on scroll
	$('body').scrollspy({
		target: '#mainNav',
		offset: 54
	});

	/* =========================
		SCROLL MENU (sticky header)
	=========================*/
	var $header = $('.header-block-top');
	var headerFixed = $header.hasClass('fixed-menu');
	window.addEventListener('scroll', function () {
		var shouldBeFixed = (window.pageYOffset || document.documentElement.scrollTop) > 50;
		if (shouldBeFixed !== headerFixed) {
			headerFixed = shouldBeFixed;
			$header.toggleClass('fixed-menu', shouldBeFixed);
		}
	}, { passive: true });

	/* =========================
		NAV MENU
	=========================*/
	$('.navbar-nav li a').on('click', function () {
		$('.navbar-nav li').removeClass('active');
		$(this).parent().addClass('active');
		// close the mobile menu after choosing an item
		var $collapse = $('#navbar');
		if ($collapse.hasClass('in')) { $collapse.collapse('hide'); }
	});

	/* =========================
		MENU TABS (Speisekarte)
	=========================*/
	$('.menu-nav a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
		$(e.relatedTarget).attr('aria-selected', 'false');
		$(e.target).attr('aria-selected', 'true');
		// keep the active tab visible in the horizontally scrolling tab bar (mobile)
		var nav = this.parentNode.parentNode;
		var li = this.parentNode;
		if (nav.scrollWidth > nav.clientWidth) {
			nav.scrollLeft = li.offsetLeft - (nav.clientWidth - li.offsetWidth) / 2;
		}
	}).on('keydown', function (e) {
		// arrow keys move between tabs (WAI-ARIA tabs pattern)
		if (e.which !== 37 && e.which !== 39) { return; }
		var $tabs = $('.menu-nav a[data-toggle="tab"]');
		var i = $tabs.index(this) + (e.which === 39 ? 1 : -1);
		var $next = $tabs.eq((i + $tabs.length) % $tabs.length);
		$next.tab('show').trigger('focus');
		e.preventDefault();
	});

	/* =========================
		GALLERY LIGHTBOX
		One modal for all photos: arrows, keyboard (← →), swipe.
	=========================*/
	var $links = $('a.gal-link');
	var $box = $('#gallery-lightbox');
	if ($links.length && $box.length) {
		var $img = $box.find('.lightbox-img');
		var $cap = $box.find('.lightbox-caption');
		var $count = $box.find('.lightbox-counter');
		var current = 0;
		var preload = function (i) {
			var n = ($links.length + i) % $links.length;
			(new Image()).src = $links.eq(n).attr('href');
		};
		var show = function (i) {
			current = ($links.length + i) % $links.length;
			var $a = $links.eq(current);
			var alt = $a.find('img').attr('alt') || '';
			$img.attr({ src: $a.attr('href'), alt: alt });
			$cap.text(alt);
			$count.text((current + 1) + ' / ' + $links.length);
			preload(current + 1);
			preload(current - 1);
		};

		$links.each(function (i) {
			var link = this;
			$(link).on('click', function (e) {
				e.preventDefault();
				show(i);
				$box.modal('show');
			});
			// warm up the full-size image when the visitor points at / touches / focuses a thumbnail
			var warm = function () {
				(new Image()).src = link.getAttribute('href');
				['mouseenter', 'touchstart', 'focus'].forEach(function (type) {
					link.removeEventListener(type, warm);
				});
			};
			['mouseenter', 'touchstart', 'focus'].forEach(function (type) {
				link.addEventListener(type, warm, { passive: true });
			});
		});

		$box.find('.lightbox-prev').on('click', function () { show(current - 1); });
		$box.find('.lightbox-next').on('click', function () { show(current + 1); });

		$box.on('keydown', function (e) {
			if (e.which === 37) { show(current - 1); e.preventDefault(); }
			if (e.which === 39) { show(current + 1); e.preventDefault(); }
		});

		var touchX = null;
		$box[0].addEventListener('touchstart', function (e) {
			touchX = e.touches.length === 1 ? e.touches[0].clientX : null;
		}, { passive: true });
		$box[0].addEventListener('touchend', function (e) {
			if (touchX === null) { return; }
			var dx = e.changedTouches[0].clientX - touchX;
			if (Math.abs(dx) > 50) { show(current + (dx < 0 ? 1 : -1)); }
			touchX = null;
		}, { passive: true });

		// return focus to the thumbnail that was open last
		$box.on('hidden.bs.modal', function () {
			$links.eq(current).trigger('focus');
		});
	}

	/* =========================
		GALLERY CAROUSEL
		Native horizontal scrolling with scroll-snap (swipe / trackpad / keyboard);
		arrows and dots move one "page" (the photos currently visible).
	=========================*/
	var track = document.querySelector('.gal-track');
	if (track) {
		var carousel = track.parentNode;
		var slides = track.querySelectorAll('.gal-slide');
		var prevBtn = carousel.querySelector('.gal-prev');
		var nextBtn = carousel.querySelector('.gal-next');
		var dotsBox = carousel.querySelector('.gal-dots');
		var status = carousel.querySelector('.gal-status');
		var MAX_DOTS = 12; // more pages than this (phones: 1 photo per page) -> "3 / 24" counter instead of dots
		var perPage = 1, pages = 1, step = 0, lastPage = -1;

		var measure = function () {
			var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
			step = slides[0].getBoundingClientRect().width + gap;
			perPage = Math.max(1, Math.round((track.clientWidth + gap) / step));
			pages = Math.ceil(slides.length / perPage);
			dotsBox.innerHTML = '';
			if (pages <= MAX_DOTS) {
				for (var i = 0; i < pages; i++) {
					var d = document.createElement('button');
					d.type = 'button';
					d.className = 'gal-dot';
					d.tabIndex = -1;
					d.setAttribute('data-page', i);
					dotsBox.appendChild(d);
				}
			} else {
				var c = document.createElement('span');
				c.className = 'gal-counter';
				dotsBox.appendChild(c);
			}
			lastPage = -1;
			lastFirst = -1;
			update();
		};

		var lastFirst = -1;
		var update = function () {
			var maxScroll = track.scrollWidth - track.clientWidth;
			var atEnd = track.scrollLeft >= maxScroll - 2;
			var first = atEnd ? slides.length - perPage : Math.round(track.scrollLeft / step);
			var page = atEnd ? pages - 1 : Math.min(pages - 1, Math.round(first / perPage));
			prevBtn.disabled = track.scrollLeft <= 2;
			nextBtn.disabled = atEnd;
			if (first === lastFirst && page === lastPage) { return; }
			lastFirst = first;
			lastPage = page;
			var dots = dotsBox.querySelectorAll('.gal-dot');
			for (var i = 0; i < dots.length; i++) { dots[i].classList.toggle('active', i === page); }
			var counter = dotsBox.querySelector('.gal-counter');
			var from = Math.min(slides.length, first + 1);
			var to = Math.min(slides.length, first + perPage);
			if (counter) { counter.textContent = from + ' / ' + slides.length; }
			status.textContent = 'Fotos ' + from + (to > from ? ' bis ' + to : '') + ' von ' + slides.length;
		};

		var goTo = function (page) {
			page = Math.max(0, Math.min(pages - 1, page));
			track.scrollTo({ left: page * perPage * step, behavior: reduceMotion ? 'auto' : 'smooth' });
		};

		prevBtn.addEventListener('click', function () { goTo(lastPage - 1); });
		nextBtn.addEventListener('click', function () { goTo(lastPage + 1); });
		dotsBox.addEventListener('click', function (e) {
			var p = e.target.getAttribute && e.target.getAttribute('data-page');
			if (p !== null && p !== undefined) { goTo(parseInt(p, 10)); }
		});

		var ticking = false;
		track.addEventListener('scroll', function () {
			if (ticking) { return; }
			ticking = true;
			window.requestAnimationFrame(function () { ticking = false; update(); });
		}, { passive: true });

		var resizeTimer;
		window.addEventListener('resize', function () {
			clearTimeout(resizeTimer);
			resizeTimer = setTimeout(measure, 150);
		});

		// after browsing in the lightbox, bring the last viewed photo into the carousel view
		$('#gallery-lightbox').on('hide.bs.modal', function () {
			var link = $links.eq(current)[0];
			if (link) {
				var slide = link.parentNode;
				track.scrollTo({ left: slide.offsetLeft - track.offsetLeft - (parseFloat(getComputedStyle(track).paddingLeft) || 0), behavior: 'auto' });
			}
		});

		measure();
	}

	/* ========================
		WOW ANIMATION (skipped when the visitor prefers reduced motion)
	=============================*/
	if (!reduceMotion) {
		new WOW().init();
	}

})(jQuery);
