'use strict';

/**
 * @ngdoc directive
 * @name hearth.geo.locations
 * @description Renders fields for selecting location, and allows to select location.
 * @restrict E
 *
 * @requires $timeout
 * @requires geo
 */
angular.module('hearth.geo').directive('locations', [
	'geo', '$timeout', '$rootScope', 'Viewport', '$analytics', '$state',
	function(geo, $timeout, $rootScope, Viewport, $analytics, $state) {
		return {
			restrict: 'E',
			replace: true,
			scope: {
				locations: "=",
				required: "=isRequired",
				disabled: "=limit",
				showError: "=",
				errorCode: "@",
				base: "@"
			},
			templateUrl: 'templates/geo/locations.html',
			link: function($scope, baseElement) {
				var map, sBox, tagsInput, marker = false;
				$scope.mapPoint = false;
				$scope.mapPointShowName = true; // due to chrome bug with rerendering
				$scope.errorWrongPlace = false;
				$scope.initFinished = $rootScope.initFinished;
				$scope.mapIsVisible = false;

				if (!$scope.errorCode)
					$scope.errorCode = 'LOCATIONS_ARE_EMPTY';

				// @kamil - NOT FUNCTIONAL
				$scope.$watch("locations", function(val) {
					console.log(val);
					// 	$scope.locations = (val) ? filterUniqueLocations(val) : [];
				});

				var markerImage = {
					url: 'images/pin.png',
					size: new google.maps.Size(49, 49),
					origin: new google.maps.Point(0, 0),
					anchor: new google.maps.Point(14, 34)
				};

				// @kamil - NOT FUNCTIONAL
				// function filterUniqueLocations(locations) {
				// 	var arr = [];
				// 	var item;
				//
				// 	// remove duplicit locations
				// 	for (var i = 0; i < locations.length; i++) {
				// 		if (!locations[i].origin_address)
				// 			locations[i].origin_address = locations[i].address;
				//
				// 		for (var j = 0; j < i; j++) {
				// 			if (locations[j].address == locations[i].address) {
				// 				locations.splice(i--, 1);
				// 				break;
				// 			}
				// 		}
				// 	}
				//
				// 	return locations;
				// }

				// init google places search box
				function addPlacesAutocompleteListener(input) {
					var sBox = new google.maps.places.SearchBox(input);
					google.maps.event.addListener(sBox, 'places_changed', function() {
						var places = sBox.getPlaces();
						$scope.showError = false;

						if (!places.length || !places[0].address_components) {
							$(input).val('');
							return false;
						}

						if (places && places.length) {
							$scope.errorWrongPlace = false;
							var location = places[0].geometry.location,
								name = places[0].formatted_address,
								info = translateLocation(places[0].address_components);
							fillLocation(location, name, info, JSON.parse(JSON.stringify(places)));
						} else {
							$scope.errorWrongPlace = true;
						}
					});

					$(input).on('keyup keypress', function(e) {
						if (e.keyCode == 13 && $(input).val() != '') {
							e.preventDefault();
							return false;
						}
					});

					/**
					 * When user fills some location and clicks enter (does not select option in autocomplete)
					 * simulate key down and enter to select first item in autocomplete
					 */
					function pacSelectFirst(input) {
						// store the original event binding function
						if (typeof input === 'undefined') return;
						var _addEventListener = (input.addEventListener) ? input.addEventListener : input.attachEvent;

						function addEventListenerWrapper(type, listener) {
							// Simulate a 'down arrow' keypress on hitting 'return' when no pac suggestion is selected,
							// and then trigger the original listener.
							if (type == "keydown") {
								var orig_listener = listener;
								listener = function(event) {
									var suggestion_selected = $(".pac-item-selected").length > 0;
									if (event.which == 13 && !suggestion_selected) {
										var simulated_downarrow = $.Event("keydown", {
											keyCode: 40,
											which: 40
										});
										orig_listener.apply(input, [simulated_downarrow]);
									}

									orig_listener.apply(input, [event]);
								};
							}

							_addEventListener.apply(input, [type, listener]);
						}

						input.addEventListener = addEventListenerWrapper;
						input.attachEvent = addEventListenerWrapper;
					}

					$timeout(function() {
						pacSelectFirst(input);
					});


					$(document).on('focusout', input, function(e) {
						$timeout(function() {
							tagsInput.val('');
						});
					});

					$(document).on('focusin', input, function(e) {
						$scope.errorWrongPlace = false;
					});

					return sBox;
				};

				// this will translate info from location to used format
				function translateLocation(loc) {
					var short = {},
						long = {};

					if (loc) {
						Object.keys(loc).forEach(function(key) {
							short[loc[key].types[0]] = loc[key].short_name;
							long[loc[key].types[0]] = loc[key].long_name;
						});
					}
					return {
						street_number: long.street_number, // house number
						street_premise: long.premise, // descriptive number
						street: long.route, // street
						country: long.country, // country
						country_code: short.country, // country code - CZ
						zipcode: long.postal_code, // postal code
						city: long.postal_town || long.locality || long.administrative_area_level_1, // mestska cast nebo jen mesto nebo kraj
						area: long.administrative_area_level_1, // kraj
					};
				};


				// go throught all places and compare them with new location
				// if there is duplicity - dont add it
				$scope.locationExists = function(lng, lat) {
					var precision = 7;

					for (var loc in $scope.locations) {
						var latlng = $scope.locations[loc].coordinates;
						if (
							latlng[0].toFixed(precision) == lng.toFixed(precision) &&
							latlng[1].toFixed(precision) == lat.toFixed(precision)
						)
							return true;
					}
					return false;
				};

				// add location to list
				/**
				 *	@param {Object} pos -	latitude & longitude
				 *	@param {String} addr -	formatted address
				 *	@param {Object} info -	object with standardized format (by translateLocation fn)
				 *	@param {Object} all -	the whole object returned by MAPS API
				 */
				function fillLocation(pos, addr, info, all) {
					// but only when it is now added yet
					if (!$scope.locationExists(pos.lng(), pos.lat())) {

						info.origin_address = addr;
						info.address = addr;
						info.coordinates = [pos.lng(), pos.lat()];
						info.all = all;
						$timeout(function() {
							$scope.locations.push(info);
							tagsInput.focus();
						});
					}

					// and erase input for next location
					tagsInput.val('');
				};

				var MAP_TOGGLE_CLICK = 'Ad map toggled';
				var MAP_LOCATION_SELECTED = 'Ad map location selected';

				function trackMapEvents(paramObj) {
					$analytics.eventTrack(paramObj.eventName, {
						'action': paramObj.action,
						'state': $scope.$parent.post.state,
						'context': $state.current.name
					});
				}

				// slide down
				$scope.showMap = function() {
					trackMapEvents({
						eventName: MAP_TOGGLE_CLICK,
						action: 'show'
					});

					$(".mapIcon .fa-times", baseElement).show();
					$(".location-map", baseElement).slideDown();
					$scope.mapIsVisible = true;
					$timeout($scope.initMap, 100);
				};

				// slide up
				/**
				 *	@param {Object} paramObj -	locationChosen {Bool}
				 *								suppressTracking {Bool}
				 */
				$scope.closeMap = function(paramObj) {
					paramObj = paramObj || {};
					if (!paramObj.suppressTracking) {
						trackMapEvents({
							eventName: (paramObj.locationChosen ? MAP_LOCATION_SELECTED : MAP_TOGGLE_CLICK),
							action: 'hide'
						});
					}
					if (marker) {
						marker.setMap(null);
						marker = false;
					}

					$scope.mapPoint = false;
					$scope.mapIsVisible = false;

					$(".location-map", baseElement).slideUp();
					$(".mapIcon .fa-times", baseElement).hide();
				};

				$scope.chooseMapLocation = function() {
					if (!$scope.mapPoint)
						return false;

					fillLocation($scope.mapPoint.latLng, $scope.mapPoint.name, $scope.mapPoint.info);
					$scope.closeMap({
						locationChosen: true
					});
				};

				$scope.refreshMapPoint = function() {
					geo.getAddress(marker.getPosition()).then(function(info) {
						$scope.mapPointShowName = false;

						$scope.mapPoint = {
							latLng: marker.getPosition(),
							name: info.formatted_address,
							info: translateLocation(info.address_components),
						};

						// chrome has problem with rerendering point
						// after location change - hide location and show again after.
						$timeout(function() {
							$scope.mapPointShowName = true;

							// let address to display on page and then scroll to it if it is not visible
							/*$timeout(function() {
							    Viewport.scrollIfHidden(".map-point", 60, $scope.base);
							});*/
						});
					});
				};

				$scope.initMap = function() {

					if ($(".location-map", baseElement).hasClass("inited"))
						return false;

					map = geo.createMap($(".map-container", baseElement)[0], {
						draggableCursor: 'url(images/pin.png) 14 34, default',
						scrollwheel: false
					});
					google.maps.event.addListener(map, 'click', function(e) {
						map.panTo(e.latLng);

						if (marker) {
							return marker.setPosition(e.latLng);
						}

						marker = new google.maps.Marker({
							map: map,
							draggable: true,
							animation: google.maps.Animation.DROP,
							position: e.latLng,
							icon: markerImage
						});

						$scope.refreshMapPoint();
						google.maps.event.addListener(marker, "position_changed", $scope.refreshMapPoint);
					});

					$(".location-map", baseElement).addClass("inited");
				};

				$scope.toggleMap = function() {
					if ($scope.disabled) return false;

					if ($(".location-map", baseElement).is(":visible")) {
						$scope.closeMap({
							suppressTracking: true
						});
					} else {
						$scope.showMap();
					}
				};

				function locationDoesNotMatter(val, suppressTracking) {
					$scope.errorWrongPlace = false;
					$scope.closeMap({
						suppressTracking: suppressTracking
					});
					$scope.showError = false;

					if ($scope.disabled) {
						$scope.locations = [];
						tagsInput.attr("disabled", "disabled");
					} else {
						tagsInput.removeAttr("disabled");
					}
				}

				function init() {
					tagsInput = $(".tags input", baseElement);
					sBox = addPlacesAutocompleteListener($('.tags input', baseElement)[0]);
					$scope.$watch('disabled', function(val) {
						locationDoesNotMatter(val, true);
					});
				}

				$scope.$watch("showError", function(val) {
					if (!val)
						$scope.showError = false;
					if (val)
						$scope.errorWrongPlace = false;
				});
				$timeout(init);



				$scope.$on("$destroy", function() {
					$(document).unbind("focusin");
					$(document).unbind("focusout");
				})
			}
		};
	}
]);