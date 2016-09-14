'use strict';

/**
 * @ngdoc service
 * @name hearth.services.Filter
 * @description
 */

angular.module('hearth.services').factory('Filter', [
	'$q', '$location', '$state', '$rootScope', 'User', 'KeywordsService', 'Post',
	function($q, $location, $state, $rootScope, User, KeywordsService, Post) {
		return {
			_commonKeywords: [],
			getCommonKeywords: function(cb) {
				var self = this;
				cb = cb || function() {};

				if (this._commonKeywords.length)
					return cb(this._commonKeywords);
				else
					KeywordsService.queryKeywords().then(function(res) {
						cb(self._commonKeywords = res);
					});
			},
			queryCommonKeywords: function($query) {
				var deferred = $q.defer();
				deferred.resolve(this._commonKeywords);
				return deferred.promise;
			},
			toggleTag: function(tag) {
				var params, index;
				tag = tag.toLowerCase();

				params = $location.search();
				params.keywords = params.keywords || [];
				if (!$.isArray(params.keywords))
					params.keywords = params.keywords.split(",");

				index = params.keywords.indexOf(tag);
				if (index == -1)
					params.keywords.push(tag);
				else {
					params.keywords.splice(index, 1);
				}

				params.keywords = params.keywords.join(",");
				if (params.keywords == "")
					delete params.keywords;

				$location.search(params);
				$rootScope.$broadcast("filterApplied", params);
			},
			getActiveTags: function() {
				var params = $location.search();

				if (!params.keywords)
					return [];
				if (!$.isArray(params.keywords))
					return angular.copy(params.keywords).split(",");
				else
					return params.keywords;

				$rootScope.$broadcast("filterApplied", filterData);
			},
			getFilterCount: function(filter, cb) {
				filter = filter || {};
				filter.counters = true;

				Post.query(filter, function(res) {
					var count = 0;
					var counter = res.counters;
					Object.keys(counter).forEach(function(key) {
						count += counter[key];
					});
					cb(count);
				});
			},
			get: function() {
				return $location.search();
			},
			getParams: function() {
				var params = this.get();
				if ($.isArray(params.keywords))
					params.keywords = params.keywords.join(',');

				return $.param(params);
			},
			isSet: function() {
				return !$.isEmptyObject($location.search());
			},
			apply: function(filterData, save, applySave) {
				$location.search(filterData);
				if (applySave && $rootScope.loggedUser._id) {
					if (save) {
						this.setUserFilter(filterData);
					} else {
						this.deleteUserFilter();
					}
				}

				$rootScope.$broadcast("filterApplied", filterData);
			},
			checkUserFilter: function() {
				// if user has saved filter, load it
				if ($rootScope.user && $rootScope.user.filter && Object.keys($rootScope.user.filter).length) {
					this.apply($rootScope.user.filter);
				}
			},
			setUserFilter: function(filterObject) {
				User.updateFilter({
					_id: $rootScope.loggedUser._id,
					user_filter: filterObject
				});
				$rootScope.user.filter = filterObject;
			},
			deleteUserFilter: function() {
				this.setUserFilter({});
			},
			reset: function() {
				$rootScope.$broadcast("filterReseted");
				this.deleteUserFilter();

				// on search page there is query param mandatory
				var query = ($state.current.name == "search") ? $state.params.query : null;

				$state.go($state.current.name, {
					query: query,
					type: null
				}, {
					reload: true
				});
			},
			isSaved: function() {
				return !!($rootScope.user && $rootScope.user.filter && Object.keys($rootScope.user.filter).length);
			},
			applySaved: function() {
				this.apply($rootScope.user.filter);
			},
			getOptionsShow: function(configName) {
				var opts = $$config.filterOptions;
				var conf = (typeof opts[configName] !== 'undefined') ? $$config.filterOptions[configName] : $$config.filterOptions.default;
				var confObj = {};

				conf.forEach(function(o) {
					confObj[o] = true;
				});
				return confObj;
			}
		};
	}
]);