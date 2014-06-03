'use strict';

/**
 * @ngdoc controller
 * @name hearth.controllers.SearchCtrl
 * @description
 */

angular.module('hearth.controllers').controller('SearchCtrl', [
	'$scope', 'UsersService', 'PostsService', '$routeParams', 'flash', '$timeout', '$rootScope', 'Auth', '$location', '$window', 'ipCookie', 'Errors', 'FulltextService', 'FolloweesPostsService', 'FolloweesSearchService', 'KeywordsService', '$analytics', 'geo',

	function($scope, UsersService, PostsService, $routeParams, flash, $timeout, $rootScope, Auth, $location, $window, ipCookie, Errors, FulltextService, FolloweesPostsService, FolloweesSearchService, KeywordsService, $analytics, geo) {

		$scope.adEditing = false;
		$scope.location = $location;
		$scope.timeout = null;
		$scope.limit = 15;
		$scope.offset = 0;
		$scope.keywords = [];
		$scope.filterExpanded = false;
		$scope.lastQueryReturnedCount = 0;
		$scope.filter = {
			type: ''
		};
		$scope.srch = {
			query: '',
			filters: [{
				type: 'need',
				name: 'PLURAL_NEEDS'
			}, {
				type: 'offer',
				name: 'PLURAL_OFFERS'
			}, {
				type: 'user',
				name: 'PLURAL_USERS'
			}]
		};
		$scope.sent = false;
		$scope.items = [];

		$scope.go = function(where, itemId, authorId) {
			var path;
			if ($scope.loggedEntity && authorId === $scope.loggedEntity._id) {
				return $location.search('id', null);
			} else {
				if (where === 'detail' && (itemId != null)) {
					if (($location.search().id != null) && $location.search().id === itemId) {
						return $location.search('id', null);
					} else {
						return $location.search('id', itemId);
					}
				} else {
					path = '/' + where + '/' + itemId;
					return $location.path(path);
				}
			}
		};

		$scope.refreshSearch = function() {
			return $scope.$broadcast('searchWithRefresh');
		};

		$scope.setOrderBy = function(order) {
			if (order !== 'relevance') {
				$location.search('q', null);
			}
			$scope.initMyLocation();
			$scope.orderBy = order;
			$scope.offset = 0;
			ipCookie('orderBy', order);
			$rootScope.$broadcast('cancelCreatingAd');
			$rootScope.$broadcast('cancelReplyingAd');
			$rootScope.$broadcast('cancelEditingAd');
			return $scope.$broadcast('searchWithRefresh');
		};

		$scope.updateLocation = function(location) {
			$scope.myLocation = location;
			$scope.offset = 0;
			$rootScope.$broadcast('cancelCreatingAd');
			$rootScope.$broadcast('cancelReplyingAd');
			return $scope.$broadcast('searchWithRefresh');
		};

		$scope.initMyLocation = function() {
			if (!$scope.myLocation) {
				if ($scope.loggedUser) {
					return UsersService.get($scope.loggedUser._id).then(function(data) {
						if (data.locations && data.locations.length > 0) {
							$scope.myLocation = geo.getLocationFromCoords(data.locations[0].coordinates);
						}
					});
				} else {
					geo.getCurrentLocation().then(function(location) {
						$scope.myLocation = location;
					});
				}
			}
		};

		$scope.initMyFollowers = function() {
			return UsersService.queryFollowees($scope.loggedUser._id).then(function(result) {
				$scope.myFollowees = result || [];
				return UsersService.queryFriends($scope.loggedUser._id);
			}).then(function(result) {
				$scope.myFriends = result || [];
				return $scope.unifyRelations();
			});
		};

		$scope.unifyRelations = function() {
			var item, i, j,
				myFollowees = $scope.myFollowees,
				myFriends = $scope.myFriends,
				results = [];

			$scope.myRelations = [];
			for (i = 0; i < myFollowees.length; i++) {
				item = myFollowees[i];
				$scope.myRelations.push({
					userId: item.userId,
					relation: 'followee'
				});
			}
			for (j = 0; j < myFriends.length; j++) {
				item = myFriends[j];
				results.push($scope.myRelations.push({
					userId: item.userId,
					relation: 'friend'
				}));
			}
			return results;
		};

		$scope.updateRelations = function(newval) {
			newval = newval || $scope.myRelations || [];

			return $scope.items.map(function(item) {
				var relation, i, j;

				if (item.type === 'user') {
					item.relation = null;
					for (i = 0; i < newval.length; i++) {
						relation = newval[i];
						if (relation.userId === item._id) {
							item.relation = relation.relation;
						}
					}
				} else if (item.author != null && item.author) {
					item.author.relation = null;
					for (j = 0; j < newval.length; j++) {
						relation = newval[j];
						if (relation.userId === item.author._id) {
							item.author.relation = relation.relation;
						}
					}
				}
				return item;
			});
		};

		$scope.$watch('myRelations', function(newval) {
			return $scope.updateRelations(newval);
		});

		$scope.getRelationship = function(userId) {
			if ($scope.myRelations && $scope.myRelations.length > 0) {
				return $scope.myRelations.map(function(item) {
					if (item.userId === userId) {
						return item.relation;
					}
				});
			}
		};

		$scope.getSearchService = function() {
			var param,
				searchParams = {
					limit: $scope.limit,
					offset: $scope.offset,
					r: Math.random(),
					type: $scope.filter.type,
					days: $scope.filter.date,
					distance: $scope.filter.distance,
					lat: $scope.filter.lat,
					lon: $scope.filter.lon
				};

			for (param in searchParams) {
				if (searchParams[param] === undefined) {
					delete searchParams[param];
				}
			}

			if (($scope.keywords != null) && $scope.keywords.length) {
				searchParams.keywords = $scope.keywords.join(',');
			}

			function searchParamsByMyLocation(searchParams) {
				return angular.extend(searchParams, {
					sort: 'distance',
					lat: $scope.myLocation.lat(),
					lon: $scope.myLocation.lng()
				});
			}

			function getMyHearthService() {
				var service = FolloweesPostsService;

				if ($scope.orderBy === 'location' && $scope.myLocation) {
					searchParams = searchParamsByMyLocation(searchParams);
				}
				if ($scope.orderBy === 'relevance' && (($scope.srch != null ? $scope.srch.query : void 0) != null) && $scope.srch.query) {
					searchParams.query = $scope.srch.query;
					searchParams.type = $scope.srch.type || searchParams.type;
					$location.search('q', searchParams.query);
					service = FolloweesSearchService;
				}
				searchParams.userId = $scope.loggedUser._id;
				return service;
			}

			function getMarketplaceService() {
				if ($scope.orderBy === 'relevance' && (($scope.srch != null ? $scope.srch.query : void 0) != null) && $scope.srch.query) {
					searchParams.query = $scope.srch.query;
					if ($scope.srch.type != null) {
						searchParams.type = $scope.srch.type;
					}
					$location.search('q', searchParams.query);
					return FulltextService;
				} else if ($scope.orderBy === 'location' && $scope.myLocation) {
					searchParams = searchParamsByMyLocation(searchParams);
					return PostsService;
				} else {
					return PostsService;
				}
			};

			return {
				service: $scope.pageType === 'my' ? getMyHearthService() : getMarketplaceService(),
				params: searchParams
			};
		};

		function processRow(value) {
			var distances = [],
				id = $location.search().id;

			value.type = value.type || 'user';
			value.locations = value.locations || [{
				name: ''
			}];
			if ($scope.orderBy === 'location') {
				distances = $.map(value.locations, function(location) {
					try {
						return Math.ceil(geo.getDistance($scope.myLocation, geo.getLocationFromCoords(location.coordinates)));
					} catch (e) {
						console.error(e);
					}
				});
				if (distances.length) {
					value.distance = Math.min.apply(this, distances);
				}
			}
			if (id && id === value._id) {
				$scope.expandAd(value);
			}
			return $scope.items.push(value);
		}

		$scope.search = function(options) {
			var search = $scope.getSearchService();

			$scope.sent = false;
			$scope.searchOptions = options;
			$scope.items = ($scope.searchOptions || {}).add === false ? [] : $scope.items;

			return search.service.query(search.params).then(function(data) {
				var i, len = data.length;
				if (search.params.query) {
					$analytics.eventTrack('search by keyword', {
						category: $scope.pageType === 'search' ? 'Marketplace' : 'My Hearth'
					});
				}
				for (i = 0; i < len; i++) {
					processRow(data[i]);
				}
				$scope.lastQueryReturnedCount = len;
				$scope.sent = true;
				return $scope.updateRelations();
			});
		};

		$scope.setSearchType = function(type) {
			$scope.srch.type = type;
			return $scope.srch.type;
		};

		$scope.loadMoreAds = function() {
			if ($scope.lastQueryReturnedCount > 0) {
				$scope.offset = $scope.offset + $scope.limit;
				return $scope.$broadcast('search');
			}
		};

		$scope.follow = function(userId, unfollow) {
			if (userId !== $scope.loggedUser._id) {
				var promise = UsersService[unfollow ? 'removeFollower' : 'addFollower'](userId, $scope.loggedUser._id);

				return promise.then(function() {
					return $scope.initMyFollowers();
				});
			}
		};

		$scope.searchByKeyword = function($event, keyword, reset) {
			if (reset == null) {
				reset = false;
			}
			if ($event) {
				$event.preventDefault();
				$event.stopPropagation();
			}
			$scope.offset = 0;
			if ($scope.keywords.indexOf(keyword) === -1) {
				if (reset) {
					$scope.keywords = [];
				}
				$scope.keywords.push(keyword);
			} else {
				$scope.keywords.splice($scope.keywords.indexOf(keyword), 1);
			}
			return $scope.search({
				add: false
			});
		};

		$scope.listKeywords = function() {
			return KeywordsService.listKeywords().then(function(data) {
				$scope.allKeywords = data;
				return $scope.allKeywords;
			});
		};

		$scope.queryKeywords = function($query) {
			return KeywordsService.queryKeywords($query);
		};

		$scope.$on('$routeUpdate', function() {
			if (($routeParams.id == null) || !$routeParams.id) {
				return $scope.expandAd(null);
			}
		});

		$scope.$on('$routeChangeSuccess', function() {
			var orderCookie;
			orderCookie = ipCookie('orderBy') || 'time';
			return $scope.setOrderBy(orderCookie);
		});

		$scope.$watch('location.search().id', function(newval) {
			var item, i, len,
				results = [],
				items = $scope.items;

			if (newval === undefined || newval === null) {
				return $scope.expandAd(null, true);
			} else {
				for (i = 0; i < items.length; i++) {
					item = items[i];
					if (item._id === newval) {
						results.push($scope.expandAd(item));
					}
				}
				return results;
			}
		});

		$scope.$watch('location.search().q', function(newval) {
			if ((newval != null) && newval) {
				$scope.srch.query = newval;
				return $rootScope.$broadcast('searchWithRefresh');
			}
		});

		$scope.$on('search', function() {
			if ($scope.timeout) {
				$timeout.clear($scope.timeout);
			}
			return $timeout(function() {
				return $scope.search();
			}, 100);
		});

		$scope.$on('searchWithRefresh', function() {
			$scope.offset = 0;
			return $scope.search({
				add: false
			});
		});

		$scope.setLastAddedId(null);
		if (($scope.loggedUser != null ? $scope.loggedUser._id : void 0) != null) {
			$scope.initMyFollowers();
		}
		return $scope.listKeywords();
	}
]);