'use strict';

angular.module('hearth.directives').directive('signedIn', function($session) {
	return {
		link: function(scope, element, attrs) {
			return $session.then(function(session) {
				if (!session._id) {
					return element.css('display', 'none');
				}
			}, function() {
				return element.css('display', 'none');
			});
		}
	};
});