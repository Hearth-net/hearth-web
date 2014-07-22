'use strict';

/**
 * @ngdoc controller
 * @name hearth.controllers.SearchCtrl
 * @description
 */

angular.module('hearth.controllers').controller('MapCtrl', [
	'$scope', '$location', 'Post',

	function($scope, $location, Post) {
		var self = this;

		this.getFilterParams = function() {
			return $location.search();
		};

		this.getMapParams = function(searchParams) {
			return {
				sort: 'distance',
				'bounding_box[top_left][lat]': 85,
				'bounding_box[top_left][lon]': -170,
				'bounding_box[bottom_right][lat]': -85,
				'bounding_box[bottom_right][lon]': 175,
				offset: 0,
				r: 0
			};
		};

		this.getSearchParams = function() {

			return angular.extend(self.getFilterParams(), self.getMapParams());
		};

		this.search = function(options) {
			Post.query(self.getSearchParams(), function(data) {
				$scope.$broadcast("showMarkersOnMap", data);
			});
		};

		$scope.$on('searchMap', this.search);
		$scope.$on('$routeUpdate', this.search);
	}
]);