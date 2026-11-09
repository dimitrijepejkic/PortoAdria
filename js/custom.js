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
	var $links = $('.gal-item a.gal-link');
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

	/* ========================
		WOW ANIMATION (skipped when the visitor prefers reduced motion)
	=============================*/
	if (!reduceMotion) {
		new WOW().init();
	}

})(jQuery);
