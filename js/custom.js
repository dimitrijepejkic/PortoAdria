/******************************************
	File Name: custom.js
	Based on: Landigoo template (MelodyThemes)

	Only the behaviour the page actually uses is kept here:
	smooth scrolling, scrollspy, sticky header, nav active state, WOW.
	Unused template code (carousel, sliders, date/time pickers,
	selectpicker, preloader, scroll-to-top button, color switcher,
	parallax, contact form) was removed. That code never executed
	before either: it sat behind a script error, so removing it
	does not change what visitors see.
/****************************************** */

(function ($) {
	"use strict";

	/* ==============================================
		SMOOTH SCROLL
	=============================================== */
	$('a[href*="#"]:not([href="#"])').on('click', function () {
		if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '')
			|| location.hostname == this.hostname) {

			var target = $(this.hash);
			target = target.length ? target : $('[name="' + this.hash.slice(1) + '"]');
			if (target.length) {
				$('html,body').animate({
					scrollTop: target.offset().top
				}, 1000);
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
	});

	/* =========================
		GALLERY: warm up the full-size image
		Modal images are lazy-loaded; start loading the one behind a
		thumbnail as soon as the visitor points at / touches / focuses it,
		so the modal opens with the image already available.
	=========================*/
	$('.gal-item a[data-toggle="modal"]').each(function () {
		var link = this;
		var warm = function () {
			var img = $(link.getAttribute('data-target')).find('img')[0];
			if (img) { img.loading = 'eager'; }
			['mouseenter', 'touchstart', 'focus'].forEach(function (type) {
				link.removeEventListener(type, warm);
			});
		};
		['mouseenter', 'touchstart', 'focus'].forEach(function (type) {
			link.addEventListener(type, warm, { passive: true });
		});
	});

	/* ========================
		WOW ANIMATION
	=============================*/
	new WOW().init();

})(jQuery);
