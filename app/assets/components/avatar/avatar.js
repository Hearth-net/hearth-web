'use strict';

/**
 * @ngdoc directive
 * @name hearth.directives.avatar
 * @description component that creates an avatar (user or community)
 * @opts
 *		src - url to avatar
 *		size - css class - see avatar.scss
 *		type - community or user
 *		href - if present, the avatar will be a link with its value as its href, div otherwise
 *		dynamic - if present, the template will not be one time bound
 * @restrict E
 */
angular.module('hearth.directives').directive('avatar', [function() {

	return {
		restrict: 'E',
		replace: true,
		scope: {
			'src': '=',
			'size': '@',
			'type': '=',
			'href': '=',
			'thanks': '=',
			'showThanks': '=',
			'showGlow': '=',
		},
		templateUrl: (el, attrs) => {
			const template = attrs.dynamic !== void 0 ? 'avatar-dynamic' : 'avatar'
			return `assets/components/avatar/${template}.html`
		},
		link: function($scope, $element, $attrs) {

			// compute box shadow (spread and blur)
			// based on number of upvotes
			function getBoxShadow(upvotes) {
				var spread = 0;
				if (upvotes > 0 && 5 / upvotes >= 1) spread = 5;
				if (upvotes > 5 && upvotes <= 20) spread = 10;
				if (upvotes > 20 && upvotes <= 50) spread = 15;
				if (upvotes > 50) spread = 20 + (Math.floor((upvotes - 50) / 50) * 5);
				
				return '0 0 ' + (upvotes > 0 ? '40px' : '0') + ' ' + spread + 'px #FFF09C';
			}

			$scope.class = "avatar-" + ($scope.size || 'normal') + ' ' + (($scope.type === 'Community') ? 'avatar-community' : 'avatar-user') + ' ' + ($attrs.showThanks ? 'with-thanks':'');
			$scope.style = {};
			if ($attrs.src && typeof $scope.src != 'undefined') $scope.style['background-image'] = 'url(' + $scope.src + ')';
			//if ($attrs.thanks && $scope.showGlow === true) $scope.style['box-shadow'] = getBoxShadow($scope.thanks);
		}
	}

}])