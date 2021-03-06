'use strict';

/**
 * @ngdoc service
 * @name hearth.services.Interests
 * @description functions for caching and working with user interests
 */

angular.module('hearth.services').factory('Interests', ['$q', 'User', '$rootScope', '$cacheFactory', 
	function($q, User, $rootScope, $cacheFactory) {

        var Cache = $cacheFactory('UserInterestsCache');
        $rootScope.$on("profileSaved", function () {
            Cache.removeAll();
        })

		const factory = {
            queryCurrentUser: query
		}
		return factory

		/////////////////////

		function query() {
            var deferred = $q.defer();
            if (!$rootScope.loggedUser || !$rootScope.loggedUser._id) deferred.reject("No user id");
            
            var cacheKey = "interests-" + $rootScope.loggedUser._id;

            if (angular.isUndefined(Cache.get(cacheKey))) {
                User.get({_id: $rootScope.loggedUser._id}).$promise.then(function (profile) {
                    let interests = profile.interests;
                    // remove those weird ones:
                    if (interests.length == 1 && interests[0].length > 10) { interests = []; }
                    if (interests.length) {
                        interests = interests.filter(function (interest) {
                            if (interest.length > 20) return false;
                            if (interest.indexOf("-") > -1) return false;
                            return true;
                        })
                        interests = interests.map(function (interest) {
                            return interest.trim();
                        })
                    }
                    Cache.put(cacheKey, interests);
                    deferred.resolve(interests);
                });
            } else {
                deferred.resolve(Cache.get(cacheKey));
            }
            return deferred.promise;
		}
	}
])
