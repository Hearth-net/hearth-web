'use strict';

/**
 * @ngdoc controller
 * @name hearth.controllers.CommunityCreateCtrl
 * @description 
 */

angular.module('hearth.controllers').controller('CommunityCreateCtrl', [
	'$scope', '$rootScope', '$location', '$routeParams', 'Community', 'CommunityMembers', 'CommunityDelegateAdmin',
	function($scope, $rootScope, $location, $routeParams, Community, CommunityMembers, CommunityDelegateAdmin) {
		$scope.communityMembers = false;
		$scope.sendingDelete = false;
		$scope.defaultCommunity = {
			name: '',
			location: {name:''},
			description: '',
			terms: '',
		};
		$scope.showError = {
			location: false,
			name: false,
			description: false,
			terms: false,
		};
		$scope.community = {};

		$scope.fillDefaultCommunity = function() {
			
			$scope.community = angular.copy($scope.defaultCommunity);
			$scope.loaded = true;
		};

		$scope.transformDataOut = function(data) {

			data.location = data.location[0];
			return data;
		};

		$scope.transformDataIn = function(data) {

			if(data.location === null) {
				data.location = [{name:''}];
			} else {
				data.location = [data.location];
			}
			return data;
		};

		/**
		 * Function will remove user from list
		 * @param  {string} id UserId to remove
		 * @param  {array} arr User list in array
		 * @return {array}     User list without me
		 */
		$scope.removeMemberFromList = function(arr, uId) {

			for(var i = 0; i < arr.length; i++) {

				if(arr[i]._id == uId) {
					arr.splice(i, 1);
					break;
				}
			}
			return arr;
		};

		$scope.loadCommunity = function(id) {

			Community.get({communityId: id}, function(res) {
				$scope.community = $scope.transformDataIn(res);
				$scope.loaded = true;
			});

			CommunityMembers.query({communityId: id}, function(res) {
				// remove myself from list
				$scope.communityMembers = $scope.removeMemberFromList(res, $rootScope.loggedUser._id);
				if($scope.communityMembers.length) {
					$scope.adminChangeId = $scope.communityMembers[0]._id;
				}
			});
		};

		$scope.getCommunityId = function() {
			return $routeParams.id;
		};

		$scope.validate = function(data) {
			var err = false;

			if($scope.communityForm.name.$invalid) {
				$scope.showError.name = err = true;
			}
			
			if($scope.communityForm.terms.$invalid) {
				$scope.showError.terms = err = true;
			}

			if($scope.communityForm.description.$invalid) {
				$scope.showError.description = err = true;
			}

			if(data.location[0].name == '') {
				$scope.showError.location = err = true;
			}

			return ! err; // return true if valid
		}

		$scope.save = function() {
			// if we have community ID - then edit
			var service = ($scope.community._id) ? Community.edit : Community.add;
			var transformedData;
			// validate data
			if(!$scope.validate($scope.community)) return false;

			// lock
			if($scope.sending) return false;
			$scope.sending = true;

			transformedData = $scope.transformDataOut(angular.copy($scope.community));
			service(transformedData, function(res) {
	            $rootScope.$broadcast("reloadCommunities");
	            $location.path('/community/'+res._id);
			}, function(res) {
				alert("Operace se nezdařila :-(");
				$scope.sending = false;;
			});
		};
		
		$scope.change = function(id) {

			if(!id) {

				alert("Musíte vybrat člena komunity.");
				return false;
			}

			CommunityDelegateAdmin.delegate({community_id: $scope.community._id, new_admin_id: id},
				function(res) {
		            $rootScope.$broadcast("reloadCommunities");
					$location.path('/community/'+$scope.community._id);
				}, function(res) {

					alert("There was an error while processing this request");
				});
		}

		$scope.delete = function() {

			if($scope.sendingDelete) return false;
			$scope.sendingDelete = true;
			Community.remove({communityId: $scope.community._id}, function(res) {

				$scope.sendingDelete = false;
				alert("KOMUNITA BYLA SMAZANA");

	            $rootScope.$broadcast("reloadCommunities");
				$location.path("/communities");
			}, function(res) {

				alert("Při mazání komunity došlo k chybě.");
				$scope.sendingDelete = false;
			});
		};

		$scope.init = function() {

			if($scope.getCommunityId()) {
				$scope.loadCommunity($scope.getCommunityId());
			} else {
				$scope.fillDefaultCommunity();
			}
		};

		$scope.$on('initFinished', $scope.init);
        $rootScope.initFinished && $scope.init();
	}
]);