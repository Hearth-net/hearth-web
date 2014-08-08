'use strict';

/**
 * @ngdoc directive
 * @name hearth.geo.map
 * @description Renders Map with pins
 *
 * @restrict E
 * @requires geo
 * @requires $interpolate
 * @requires $templateCache
 */
angular.module('hearth.geo').directive('map', [
    'geo', '$interpolate', '$templateCache', 'Post', '$location', '$route',

    function(geo, $interpolate, $templateCache, Post, $location, $route) {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            link: function(scope, element) {
                var markerCluster,
                    oms,
                    map = null,
                    infoWindow = new google.maps.InfoWindow(),
                    template = $interpolate($templateCache.get('templates/geo/markerTooltip.html')[1]),
                    markerClusterMaxZoom = 12,
                    markers = [],
                    markerLimitActive = true,
                    markerLimit = 20,
                    markerLimitValues = {},
                    markerClusterStyles = [{
                        url: "images/marker/circle.png",
                        textColor: "white",
                        width: 27,
                        height: 27,
                    }, {
                        url: "images/marker/circle.png",
                        textColor: "white",
                        width: 27,
                        height: 27,
                    }, {
                        url: "images/marker/circle2.png",
                        textColor: "white",
                        width: 34,
                        height: 34,
                    }, {
                        url: "images/marker/circle3.png",
                        textColor: "white",
                        width: 40,
                        height: 40,
                    }, {
                        url: "images/marker/circle3.png",
                        textColor: "white",
                        width: 40,
                        height: 40,
                    }],
                    initMap = function() {

                        map = geo.createMap(element[0], {
                            zoom: 11
                        });

                        oms = new OverlappingMarkerSpiderfier(map, {
                            markersWontMove: true,
                            markersWontHide: true,
                            keepSpiderfied: true,
                        });

                        markerCluster = new MarkerClusterer(map, [], {
                            ignoreHidden: true,
                            maxZoom: markerClusterMaxZoom,
                            zoomOnClick: true,
                            // size: 20,
                            gridSize: 40,
                            averageCenter: true,
                            styles: markerClusterStyles
                        });

                        markerCluster.addListener('click', zoomMarkerClusterer);
                        oms.addListener('click', onMarkerClick);
                        geo.focusCurrentLocation();

                    },
                    testPositionLimit = function(loc) {

                        function roundPos(l) {

                            return parseFloat(l).toFixed(4);
                        }

                        var lat = roundPos(loc[0]),
                            lng = roundPos(loc[1]),
                            key = "" + lat + ":" + lng;

                        if (markerLimitValues[key])
                            markerLimitValues[key]++;
                        else
                            markerLimitValues[key] = 1;

                        if (markerLimitValues[key] > markerLimit)
                            return true;

                        return false;
                    },
                    placeMarker = function(location, ad) {
                        var marker = geo.placeMarker(geo.getLocationFromCoords(location), ad.type, ad);

                        oms.addMarker(marker);
                        markers.push(marker);
                    },
                    showMarkerWindow = function(content, marker) {
                        var width = $(".gm-style").css("width");

                        infoWindow.setOptions({
                            maxWidth: (parseInt(width) - 200)
                        });

                        content = '<div style="min-height: 100px; min-width: 200px;">' + content + '</div>';
                        infoWindow.setContent(content);
                        infoWindow.open(map, marker);

                        $('.marker-tooltip').click(function() {
                            var itemId = $(this).attr('itemid');

                            scope.$apply(function() {
                                var path = $location.path('ad/' + itemId);
                            });
                        });
                    },
                    onMarkerClick = function(marker) {

                        Post.get({
                            postId: marker.info._id
                        }, function(data) {

                            data.author.avatar.normal = data.author.avatar.normal || EMPTY_AVATAR_URL;
                            map.panTo(marker.position);

                            if (data.community_id) {
                                data.adType = data.type === 'need' ? 'WE_NEED' : 'WE_GIVE';
                            } else {
                                data.adType = data.type;
                            }

                            showMarkerWindow(template(data), marker);

                        }, function(err) {});
                    },
                    createPins = function(e, ads) {
                        var i, j, ad, location;
                        ads = ads || [];
                        markers = [];

                        if(map === null) {

                        	return setTimeout(function() {
                        		createPins(e, ads);
                        	}, 100);
                        }

                        markerCluster.clearMarkers();
                        oms.clearMarkers();

                        console.log("Nacitam.." + ads.length);
                        for (i = 0; i < ads.length; i++) {
                            ad = ads[i];
                            for (j = 0; j < ad.locations.length; j++) {
                                var loc = ad.locations[j];
                                if (loc && !$.isArray(loc) && loc.coordinates)
                                    loc = loc.coordinates;

                                if (loc) {

                                    if (markerLimit && testPositionLimit(loc))
                                        continue;

                                    placeMarker(loc, ad);
                                }
                            }
                        }

                        markerCluster.addMarkers(markers);
                        markerCluster.repaint();
                    },
                    hideMarkers = function() {
                        for (var i = 0; i < markers.length; i++) {
                            markers[i].setVisible(false);
                        }
                    },
                    zoomMarkerClusterer = function(cluster) {
                        // var zoom,
                        // 	maxZoom = markerClusterMaxZoom + 1;

                        map.fitBounds(cluster.getBounds());
                        map.setZoom(markerClusterMaxZoom + 1);
                    };

                setTimeout(initMap, 200);

                scope.$on('keywordSearch', hideMarkers);
                scope.$on('searchByLoc', createPins);

            }
        };
    }
]);