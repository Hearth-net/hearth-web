'use strict';

/**
 * @ngdoc directive
 * @name hearth.directives.checkbox
 * @description
 * @restrict E
 */

angular.module('hearth.directives').directive('checkbox', function() {
	return {
		restrict: 'E',
		replace: true,
		transclude: true,
		scope: {
			model: '=',
			value: '=',
			valueOff: '=',
			onUpdate: '&'
		},
		templateUrl: 'templates/directives/checkbox.html',
		link: function(scope, el) {
			scope.checked = false;

			scope.toggle = function() {
				scope.checked = !scope.checked;

				if (angular.isArray(scope.model)) {
					var index = scope.model.indexOf(scope.value);
					if (index > -1) {
						scope.model.splice(index, 1);
					} else {
						scope.model.push(scope.value);
					}
				} else {
					// if(typeof scope.model !== 'undefined') {
					scope.model = scope.checked ? scope.value : scope.valueOff;
					// }
				}

				if (scope.onUpdate)
					scope.onUpdate({
						value: scope.model
					});
			};

			var SPACE = 32;
			el[0].querySelector('.qs-keypress-event-handle').addEventListener('keypress', function(event) {
				if (event.keyCode === SPACE) {
					scope.toggle();
					if (!scope.$$phase) scope.$apply();
				}
			});

			scope.$watch('model', function(value) {
				if (angular.isArray(scope.model)) {
					var index = scope.model.indexOf(value);
					scope.checked = index > -1;
				} else {
					scope.checked = value === scope.value;
				}
			});

		}
	};
});