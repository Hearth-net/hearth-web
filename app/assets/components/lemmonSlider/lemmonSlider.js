'use strict';
/**
 * @ngdoc directive
 * @name hearth.directives.lemmonSlider
 * @description This will make slider from list of elements/images
 * @restrict A
 */
angular.module('hearth.directives').directive('lemmonSlider', ['$timeout',
	function($timeout) {
		return {
			restrict: 'A',
			scope: false,
			transclude: true,
			replace: true,
			template: ''
				+ '<div class="lemmon-slider">'
					+ '<div class="container">'
						+ '<ul ng-transclude></ul>'
					+ '</div>'
					+ '<div class="controll">'
						+ '<a class="prev-page" ng-click="prev()">'
							+ '<i class="fa fa-chevron-left"></i>'
						+ '</a>'
						+ '<a class="next-page" ng-click="next()">'
							+ '<i class="fa fa-chevron-right"></i>'
						+ '</a>'
					+ '</div>'
				+ '</div>',
			link: function(scope, element, attrs) {
				var slider = null;

				// var timeout = $timeout(init, 100);

				function init() {
					slider = $('.container', element);

					// if there are more images then we can show, init slider
					// if (scope.isOverflow()) {
					if (isOverflow()) {
						// show controll buttons only if we init slider
						$('.controll', element).fadeIn();
						$timeout(() => {
							console.log('initing');
							slider.lemmonSlider();
						}, 100);
					}
				}

				// test if we have more images than there is space
				// if yes, we will init slider
				// scope.isOverflow = function() {
				function isOverflow() {
					var width = 0;

					$('li', element).each(function() {
						width += $(this).outerWidth();
					});
					return width > slider.width();
				};


				scope.next = function() {
					slider.trigger('nextSlide');
				};

				scope.prev = function() {
					slider.trigger('prevSlide');
				};

				scope.$on('initLemmonSlider', (e, data) => {
					if (data.isLast) init();
					e.stopPropagation();
				});

				scope.$on('$destroy', function() {
					slider = null;
					$timeout.cancel(timeout);
				})
			}
		};
	}
]);