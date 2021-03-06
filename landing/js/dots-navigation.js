/**
 * menu.js v1.0.0
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Copyright 2014, Codrops
 * http://www.codrops.com
 */
;( function( window, lib ) {
	'use strict';

	function extend( a, b ) {
		for( var key in b ) {
			if( b.hasOwnProperty( key ) ) {
				a[key] = b[key];
			}
		}
		return a;
	}

	function DotNav( el, options ) {
		this.nav = el;
		this.options = extend( {}, this.options );
  		extend( this.options, options );
  		this._init();
	}

	DotNav.prototype.options = {};

	DotNav.prototype._init = function() {

		// special case "dotstyle-hop"
		var hop = this.nav.parentNode.className.indexOf( 'dotstyle-hop' ) !== -1;

		var dots = [].slice.call( this.nav.querySelectorAll( '.dotstyle > ul > li' ) ),
			current = 0,
			defaultInterval = 7000,
			defaultIntervalWrapper = null,
			self = this;

		/////////////////////////////
		// window click handler trick var
		var timeoutClick;
		/////////////////////////////

		dots.forEach( function( dot, idx ) {
			dot.addEventListener( 'click', function( ev ) {

				window.clearInterval(defaultIntervalWrapper);
				defaultIntervalWrapper = setInterval( defaultIntervalFn, defaultInterval );

				ev.preventDefault();
				/////////////////////////////
				// required because it triggers the window click event handler
				if (timeoutClick) {
					ev.stopImmediatePropagation();
					timeoutClick = false;
				}
				/////////////////////////////
				if( idx !== current ) {
					dots[ current ].className = '';

					// special case
					if( hop && idx < current ) {
						dot.className += ' current-from-right';
					}

					setTimeout( function() {
						dot.className += ' current';
						current = idx;

						/////////////////////////////
						// Image slideshow addition
						var slides = self.nav.getElementsByClassName('jumbo-show');
						// clear opacity of all slides
						for (var q = 0, w = slides.length;q < w;q++) {
						  slides[q].style.opacity = 0;
						}
						// assign opacity to the correct element
						slides[current].style.opacity = 1;
						/////////////////////////////

						if( typeof self.options.callback === 'function' ) {
							self.options.callback( current, dot );
						}
					}, 5 );
				}
			} );
		} );

		function defaultIntervalFn ( forceIndex ) {
			/////////////////////////////
			// window click handler trick var
			timeoutClick = true;
			/////////////////////////////
			dots[ ( forceIndex !== void 0 ? forceIndex : ( current != dots.length - 2 ) ? current + 1 : 0 ) ].click();
		}

		defaultIntervalWrapper = setInterval( defaultIntervalFn, defaultInterval );

	}

	// add to global namespace
	window.DotNav = DotNav;

})( window, window.aeg );