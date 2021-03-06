'use strict';

/**
 * @ngdoc controller
 * @name hearth.controllers.NewMessage
 * @description
 */

angular.module('hearth.controllers').controller('NewMessage', [
	'$scope', '$rootScope', 'Notify', '$timeout',
	function($scope, $rootScope, Notify, $timeout) {
		var timeout = null;

		$scope.onSuccess = function() {};

		$scope.close = function(res) {
			$timeout.cancel(timeout);

			if (!res) return $scope.closeThisDialog();
			$scope.showFinished();
		};

		$scope.showFinished = function() {

			$(".toggle-content").slideToggle();
			timeout = $timeout(function() {
				$scope.closeThisDialog();
			}, 5000);
		};


	}
]);