'use strict';
/**
 * @ngdoc directive
 * @name hearth.directives.communityCreateEdit
 * @description
 * @restrict E
 */
angular.module('hearth.directives').directive('communityCreateEdit', [
	'$rootScope', '$location', '$stateParams', 'Community', 'CommunityMembers', 'CommunityDelegateAdmin', 'Notify', 'Auth', 'Validators', 'ProfileUtils', 'KeywordsService',
	function($rootScope, $location, $stateParams, Community, CommunityMembers, CommunityDelegateAdmin, Notify, Auth, Validators, ProfileUtils, KeywordsService) {
		return {
			restrict: 'E',
			replace: true,
			scope: {
				hideHeading: '=',
				close: "&"
			},
			templateUrl: 'assets/components/communityEditForm/communityEditForm.html',
			link: function($scope, element) {
				$scope.communityMembers = false;
				$scope.loaded = false;
				$scope.adminChangeId = null;
				$scope.errorLoading = false;
				$scope.sendingDelete = false;
				$scope.sendingDelegation = false;
				$scope.defaultCommunity = {
					name: '',
					locations: [],
					description: '',
					terms: '',
				};
				$scope.parameters = ProfileUtils.params;
				$scope.showError = {
					name: false,
					locations: false,
					description: false,
					social_networks: [],
				};

				$scope.community = {};

				$scope.confirmBox = $rootScope.confirmBox;

				$scope.fillDefaultCommunity = function() {
					$scope.community = angular.copy($scope.defaultCommunity);
					$scope.loaded = true;
				};

				$scope.queryKeywords = function($query) {
					return KeywordsService.queryKeywords($query);
				};

				/**
				 * Function will remove user from list
				 * @param  {string} id UserId to remove
				 * @param  {array} arr User list in array
				 * @return {array}     User list without me
				 */
				$scope.removeMemberFromList = function(arr, uId) {
					for (var i = 0; i < arr.length; i++) {
						if (arr[i]._id == uId) {
							arr.splice(i, 1);
							break;
						}
					}
					return arr;
				};

				$scope.checkOwnership = function(community) {
					return $scope.community.admin === $rootScope.loggedUser._id;
				};

				$scope.loadCommunity = function(id) {
					Community.get({
						_id: id
					}, function(data) {
						$scope.community = prepareDataIn(data);

						if (!data.locations || !data.locations.length || data.locations[0] === void 0) {
							data.locations = [];
						}

						// $scope.community = data;

						if ($scope.checkOwnership($scope.community)) {
							$scope.loaded = true;
						} else {
							$location.path('/community/' + $scope.community._id);
						}
					}, function(err) {
						$scope.errorLoading = err.status;
					});

					CommunityMembers.query({
						communityId: id
					}, function(data) {
						// remove myself from list
						$scope.communityMembers = $scope.removeMemberFromList(data, $rootScope.loggedUser._id);
						if ($scope.communityMembers.length) {
							$scope.adminChangeId = $scope.communityMembers[0]._id;
						}
					});
				};

				var prepareDataIn = function(data) {
					return ProfileUtils.transformDataForUsage({
						type: ProfileUtils.params.PROFILE_TYPES.COMMUNITY,
						profile: data
					});
				};

				var prepareDataOut = function(data) {
					var data = angular.copy(data);
					var prepareWebs = function(data) {
						var webs = [];
						data.webs.forEach(function(web) {
							if (web) webs.push(web);
						});
						data.webs = webs;
					}
					if (data.webs !== undefined) prepareWebs(data);
					ProfileUtils.single.joinInterests(data);
					return data;
				};

				$scope.updateUrl = function($event, model, key) {
					var input = $($event.target),
						url = input.val();

					if (url && !url.match(/http[s]?:\/\/.*/)) {
						url = 'http://' + url;
					}

					if (model !== $scope.community.webs) {
						// editing social network, not webs
						$scope.showError.social_networks[key] = !Validators.social(url, key);
					} else {
						// editing webs
						$scope.showError.social_networks['webs'] = !Validators.url(url);
					}

					model[key] = url;
				};

				$scope.validateSocialNetworks = function() {
					var isOk = true;
					var isWebsOk = true;
					var isLinkOk = true;
					['facebook', 'twitter', 'linkedin', 'googleplus'].forEach(function(networkName) {
						if ($scope.community[networkName]) {
							isLinkOk = Validators.social($scope.community[networkName], networkName);
							$scope.showError.social_networks[networkName] = !isLinkOk;
							isOk = isOk && isLinkOk;
						}
					});
					isWebsOk = Validators.urls($scope.community.webs);
					$scope.showError.social_networks['webs'] = !isWebsOk;

					return isOk && isWebsOk;
				};

				$scope.validate = function(data) {
					var err = false;

					if ($scope.communityForm.name.$invalid) {
						$scope.showError.name = err = true;
					}

					if ($scope.communityForm.description.$invalid) {
						$scope.showError.description = err = true;
					}

					if ($scope.communityForm.terms.$invalid) {
						$scope.showError.terms = err = true;
					}

					// interest as tags are no longer available to form
					// if ($scope.communityForm.interests.$invalid) {
					// 	$scope.showError.interests = err = true;
					// }

					if (!$scope.validateSocialNetworks()) {
						err = true;
					}

					return !err; // return true if valid
				};

				$scope.save = function() {
					var data = $scope.community;

					// validate data
					if (!$scope.validate(data)) {
						$rootScope.scrollToError();
						return false;
					}

					// lock
					if ($scope.sending) {
						return false
					};

					$scope.sending = true;
					$rootScope.globalLoading = true;

					Community[(data._id ? 'edit' : 'add')](prepareDataOut($scope.community), function(res) {
						$rootScope.globalLoading = false;
						$rootScope.$emit('reloadCommunities');
						$location.path('/community/' + res._id);

						Notify.addSingleTranslate('NOTIFY.COMMUNITY_' + ($scope.community._id ? 'UPDATE' : 'CREATE') + '_SUCCESS', Notify.T_SUCCESS);

					}, function(res) {
						$scope.sending = false;
						$rootScope.globalLoading = false;
					});
				};

				$scope.change = function(id, needReload) {
					if (!id || $scope.sendingDelegation) {
						return false;
					}
					$scope.sendingDelegation = true;
					$rootScope.globalLoading = true;

					CommunityDelegateAdmin.delegate({
							community_id: $scope.community._id,
							new_admin_id: id
						},
						function(res) {
							$rootScope.globalLoading = false;
							$scope.sendingDelegation = false;

							if (needReload) {
								Notify.addTranslateAfterRefresh('NOTIFY.COMMUNITY_DELEGATE_ADMIN_SUCCESS', Notify.T_SUCCESS);
							} else {
								$rootScope.$emit('reloadCommunities');
								Notify.addSingleTranslate('NOTIFY.COMMUNITY_DELEGATE_ADMIN_SUCCESS', Notify.T_SUCCESS);
							}

							$scope.reloadToPath('/community/' + $scope.community._id, needReload);
						},
						function(res) {
							$scope.sendingDelegation = false;
							$rootScope.globalLoading = false;
						});
				};

				$scope.reloadToPath = function(path, hard) {
					if (hard) {
						$rootScope.refreshToPath(path);
					} else {
						$rootScope.$emit('reloadCommunities');
						$location.path(path);
					}
				};

				$scope.delete = function(needReload) {
					if ($scope.sendingDelete) {
						return false
					};

					$scope.sendingDelete = true;
					$rootScope.globalLoading = true;

					Community.remove({
						_id: $scope.community._id
					}, function(res) {
						$rootScope.globalLoading = false;
						$scope.sendingDelete = false;

						if (!needReload) {
							Notify.addSingleTranslate('NOTIFY.COMMUNITY_DELETE_SUCCESS', Notify.T_SUCCESS);
							$rootScope.$emit('reloadCommunities');
						} else {
							Notify.addTranslateAfterRefresh('NOTIFY.COMMUNITY_DELETE_SUCCESS', Notify.T_SUCCESS);
						}

						$scope.reloadToPath('/communities', needReload);
					}, function(res) {
						$rootScope.globalLoading = false;
						$scope.sendingDelete = false;
					});
				};

				$scope.getCommunityId = function() {
					return $stateParams.id;
				};

				$scope.close2 = function() {
					$scope.close();
				};

				$scope.init = function() {
					$scope.pluralCat = $rootScope.pluralCat;

					if ($scope.getCommunityId()) {
						$scope.loadCommunity($scope.getCommunityId(), prepareDataIn);
					} else {
						$scope.fillDefaultCommunity();
					}
				};

				$scope.changeSelectValue = function(val) {
					$scope.adminChangeId = val;
				};

				$scope.$on('initFinished', $scope.init);
				$rootScope.initFinished && $scope.init();
			}
		};
	}
]);