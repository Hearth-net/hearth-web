/**
 * @ngdoc service
 * @name hearth.services.ApiMaintenanceInterceptor
 * @description
 */

angular.module('hearth.services').factory('ApiMaintenanceInterceptor', ['$q', '$location', '$timeout', '$rootScope', 'ApiHealthChecker', '$injector', function($q, $location, $timeout, $rootScope, ApiHealthChecker, $injector) {

	return {

		request: function(config) {
			return config
		},
		responseError: function(rejection) {

			// if (!rejection.config.nointercept) {}
			if ([503, 0, -1].indexOf(rejection.status) >= 0) {
				var deferred = $q.defer()
				ApiHealthChecker.sendFirstHealthCheck()
				const evListener = $rootScope.$on('ev:online', () => {
					evListener() // turn off event
					if (rejection.config.method == 'GET') retryHttpRequest(rejection.config, deferred)
				})

				if (rejection.config.method == 'GET') {
					return deferred.promise
				} else {
					return $q.reject(rejection)
				}
			} else {
				return $q.reject(rejection)
			}
		}

	}

	function retryHttpRequest(config, deferred) {

		function successCallback(response) {
			deferred.resolve(response)
		}

		function errorCallback(response) {
			deferred.reject(response)
		}

		const $http = $injector.get('$http')
		$http(config).then(successCallback, errorCallback)
	}

}])