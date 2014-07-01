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
			value: '@',
			type: '@'
		},
		templateUrl: 'templates/checkbox.html',
		link: function(scope, el, attrs) {
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
					scope.model = scope.checked ? scope.value : undefined;
				}
			};

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