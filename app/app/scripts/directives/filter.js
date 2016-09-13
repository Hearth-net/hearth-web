'use strict';
/**
 * @ngdoc directive
 * @name hearth.directives.filter
 * @description Filter rules for search
 * @restrict E
 */

angular.module('hearth.directives').directive('filter', [
	'$state', 'geo', '$location', 'Auth', '$timeout', 'Filter', '$rootScope', 'KeywordsService',
	function($state, geo, $location, Auth, $timeout, Filter, $rootScope, KeywordsService) {
		return {
			restrict: 'E',
			replace: true,
			scope: {
				type: '@',
				filterShown: '=',
				filterSelected: '='
			},
			templateUrl: 'templates/directives/filter.html',
			link: function(scope, element) {
				var options = {
					types: ['geocode']
				};
				var input = $('input#geolocation', element);
				var autocomplete = new google.maps.places.Autocomplete(input[0], options);

				var filterDefault = {
					query: null,
					type: null,
					post_type: null,
					distance: 25,
					inactive: null,
					keywords: [],
					days: null,
					lang: null,
				};

				scope.configOptionsShow = Filter.getOptionsShow($state.current.name);
				if (!scope.type) scope.type = 'post';

				var timeout = $timeout(function() {
					$(".tags input", element).keypress(function(e) {
						if ($(e.target).val() != '') {
							if (e.keyCode == 9) {
								var self = this;
								setTimeout(function() {
									$(".tags input", element).focus();
								});
							}
						}
					});
				});

				scope.loggedUser = Auth.isLoggedIn();
				scope.inited = false;
				scope.filterCount = false;

				scope.queryKeywords = function($query) {
					if ($query === '' || $query.length < 3) {
						return Filter.queryCommonKeywords($query);
					}
					return KeywordsService.queryKeywords($query);
				};

				scope.applyFilter = function() {

					if ($.isEmptyObject(scope.filter)) {
						scope.reset();
					} else {
						Filter.apply(scope.convertFilterToParams(scope.filter), scope.filterSave, true);
						scope.close();
					}
				};

				// when (un)checked checkbox for save filter - send request also to api
				scope.toggleSaveFilter = function(save) {

					if (!$rootScope.loggedUser._id)
						return false;

					if (save)
						Filter.setUserFilter(scope.convertFilterToParams(scope.filter));
					else
						Filter.deleteUserFilter();
				};

				scope.convertFilterToParams = function(filter) {
					var fields = ['query', 'type', 'inactive', 'post_type', 'days', 'lang', 'r_lang', 'my_section'],
						related = [],
						character = [],
						params = {},
						currentParams = $location.search();

					fields.forEach(function(name) {
						if (typeof filter[name] !== 'undefined' && filter[name] !== null) params[name] = filter[name];
					});

					if (filter.energy) {
						character.push('energy');
					}
					if (filter.mass) {
						character.push('mass');
					}
					if (filter.information) {
						character.push('information');
					}
					if (character.length) {
						params['character[]'] = character;
					}

					if (filter.user) {
						related.push('user');
					}
					if (filter.community) {
						related.push('community');
					}
					if (related.length) {
						params.related = related.join(',');
					}
					if (filter.keywords.length) {
						params.keywords = $.map(filter.keywords || [], function(item) {
							return item.text;
						}).join(',');
					}
					if (filter.lon && filter.lat && filter.name) {
						params.lon = filter.lon;
						params.lat = filter.lat;
						params.name = filter.name;
						params.distance = parseInt(filter.distance) + $$config.lengthUnit;
					}
					return params;
				};

				scope.convertParamsToFilter = function(params) {
					if (params.keywords && !$.isArray(params.keywords)) {
						params.keywords = params.keywords.split(",");
					}

					var filter = {
						query: params.query || filterDefault.query,
						inactive: params.inactive || filterDefault.inactive,
						type: params.type || filterDefault.type,
						post_type: params.post_type || filterDefault.post_type,
						days: params.days || filterDefault.days,
						lang: params.lang,
						r_lang: params.r_lang,
						my_section: params.my_section,
						energy: (params['character[]'] || '').indexOf('energy') > -1 ? true : undefined,
						mass: (params['character[]'] || '').indexOf('mass') > -1 ? true : undefined,
						information: (params['character[]'] || '').indexOf('information') > -1 ? true : undefined,
						user: (params.related || '').indexOf('user') > -1 ? true : undefined,
						community: (params.related || '').indexOf('community') > -1 ? true : undefined,
						keywords: $.map(params.keywords || {}, function(keyword) {
							return {
								text: keyword
							};
						}),
						lon: params.lon,
						lat: params.lat,
						name: params.name,
						distance: parseInt((params.distance || filterDefault.distance)),
					};

					if (filter.name === '') {

						delete filter.lon;
						delete filter.lat;
						delete filter.name;
						delete filter.distance;
					}
					return filter;
				};

				scope.close = function() {
					scope.$emit('filterClose');
				};

				scope.reset = function() {
					Filter.reset();
				};

				scope.insertKeyword = function(keyword) {
					var exists = false;

					if (scope.filter.keywords) {
						scope.filter.keywords.forEach(function(val) {
							if (val.text === keyword)
								exists = true;
						});
					}

					if (!exists)
						scope.filter.keywords.push({
							text: keyword
						})
				};

				scope.loadKeywords = function() {
					Filter.getCommonKeywords(function(res) {
						scope.commonKeywords = res;
					});
				};

				scope.$on('filterReseted', function() {
					$rootScope.searchQuery.query = null;
					scope.filter = angular.copy(filterDefault);
					scope.filterSave = false;
					scope.close();
				});

				google.maps.event.addListener(autocomplete, 'place_changed', function() {
					var place = autocomplete.getPlace();

					if (typeof place === "undefined" || !place.address_components) {
						$(input).val('');
						return false;
					}

					if (place && place.address_components) {
						var location = place.geometry.location;
						var name = place.formatted_address;

						scope.$apply(function() {
							scope.filter.name = name;
							scope.filter.lat = location.lat();
							scope.filter.lon = location.lng();
						});
					}
				});

				scope.$on('filterApplied', function() {
					scope.updateFilterByRoute();
				});

				scope.recountPosts = function() {
					var f = scope.convertFilterToParams(scope.filter);
					if (!f.type) f.type = scope.type;

					Filter.getFilterCount(f, function(count) {
						scope.filterCount = count;
					});
				};

				scope.updateFilterByRoute = function() {
					var search = $location.search();
					scope.filter = $.isEmptyObject(search) ? angular.copy(filterDefault) : scope.convertParamsToFilter(search);
				};
				scope.updateFilterByRoute();

				scope.init = function() {
					scope.inited = true;
					scope.loadKeywords();
					scope.filterSave = Filter.isSaved();
				};

				scope.$watch('filter', scope.recountPosts, true);
				scope.$watch('filterShown', function(isShown) {
					if (isShown) scope.recountPosts();
				});
				// scope.$watch('filterSave', scope.toggleSaveFilter);

				scope.$on('initFinished', scope.init);
				$rootScope.initFinished && scope.init();

				scope.$on('$destroy', function() {
					scope.input = null;
					scope.autocomplete = null;
					$timeout.cancel(timeout);
					$(".tags input", element).unbind('keypress');
				})
			}
		};
	}
]);