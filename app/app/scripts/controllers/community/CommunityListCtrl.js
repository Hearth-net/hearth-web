'use strict';

/**
 * @ngdoc controller
 * @name hearth.controllers.CommunityListCtrl
 * @description 
 */
 
angular.module('hearth.controllers').controller('CommunityListCtrl', [
	'$scope', '$rootScope', 'CommunityMemberships', 'Communities', 'UnauthReload',
	function($scope, $rootScope, CommunityMemberships, Communities, UnauthReload) {
		$scope.randomCommunities = [];
		// my communities are loaded already in BaseCtrl for top navigation

		$scope.fetchRandomCommunities = function() {
			
			Communities.random({}, function(res) {
				$scope.randomCommunities = res;
			});
		};

		$scope.toggleForm = function() {
			$(".community-list-add-button").slideToggle();
			$(".community-list-add-form").toggle();
		};

		$scope.init = function() {

			UnauthReload.check();
			$scope.fetchRandomCommunities();
		};

		$scope.$on('initFinished', $scope.init);
		$rootScope.initFinished && $scope.init();
	}
]);