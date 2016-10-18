'use strict';

/**
 * @ngdoc controller
 * @name hearth.controllers.CommunityDataFeedCtrl
 * @description
 */

angular.module('hearth.controllers').controller('CommunityDataFeedCtrl', [
	'$scope', '$stateParams', '$rootScope', 'Community', 'Fulltext', 'CommunityMembers', 'CommunityApplicants', 'CommunityActivityLog', 'Post', 'Notify', '$timeout', 'CommunityRatings', 'UniqueFilter', 'Activities', 'ItemServices', 'ProfileUtils', '$log', 'UsersCommunitiesService',
	function($scope, $stateParams, $rootScope, Community, Fulltext, CommunityMembers, CommunityApplicants, CommunityActivityLog, Post, Notify, $timeout, CommunityRatings, UniqueFilter, Activities, ItemServices, ProfileUtils, $log, UsersCommunitiesService) {
		angular.extend($scope, ItemServices);
		$scope.activityShow = false;
		$scope.loadingData = false;
		var ItemFilter = new UniqueFilter();
		var selectedAuthor = false;
		var inited = false;
		var loadServices = {
			'home': loadCommunityHome,
			'posts': loadCommunityPosts,
			'members': loadCommunityMember,
			'about': loadCommunityAbout,
			'applications': loadCommunityApplications,
			'activity': loadCommunityActivityLog,
			'received-ratings': loadReceivedRatings,
			'given-ratings': loadGivenRatings,
		};

		$scope.loadBottom = function() {
			$scope.loadingData = true;
			loadServices[$scope.pageSegment]($stateParams.id, processData, processDataErr);
		};

		$scope.openRatingReplyForm = function(rating) {
			if ($scope.data) $scope.data.forEach(function(item) {
				item.formOpened = false;
			});

			rating.formOpened = true;
		};

		function finishLoading(res) {
			$timeout(function() {
				$scope.subPageLoaded = true;

				if (!$scope.$parent)
					$scope.$parent = {};

				$scope.$parent.loaded = true;
				$rootScope.$emit("subPageLoaded");
			});

			if (res && res.length) {
				$scope.loadingData = false;
			}
		}

		function processData(res) {
			res = ItemFilter.filter(res);

			$scope.data = $scope.data.concat(res);
			finishLoading(res);
		}

		function processDataErr(res) {
			finishLoading([]);
		}

		function loadGivenRatings(id, done, doneErr) {
			var obj = {
				communityId: id,
				limit: 10,
				offset: $scope.data.length
			};

			CommunityRatings.given(obj, done, doneErr);
		}

		function loadReceivedRatings(id, done, doneErr) {
			var obj = {
				communityId: id,
				limit: 10,
				offset: $scope.data.length
			};

			$scope.loadedRatingPosts = false;
			$scope.ratingPosts = [];

			CommunityRatings.received(obj, function(res) {
				done(res);
				$rootScope.receivedRepliesAfterLoadHandler($scope.data, $scope);
			}, doneErr);

			$scope.$watch('rating.current_community_id', function(val) {
				if (val === selectedAuthor && $scope.loadedRatingPosts) return;
				selectedAuthor = val;

				$scope.rating.post_id = null;
				processRelevantPosts(id, val);
			});

			var removeListener = $scope.$on('$routeChangeStart', function() {
				$scope.closeUserRatingForm();
				removeListener();
			});
		}

		function processRelevantPosts(id, val) {
			$scope.loadingRatingPosts = true;
			CommunityRatings.possiblePosts({
				_id: id,
				current_community_id: val
			}, function(res, headers) {
				var posts = UsersCommunitiesService.alterPossiblePosts(res, headers);

				$scope.ratingPosts = posts;

				var ratingActivePosts = [];

				CommunityRatings.activePosts({
					_id: id,
					current_community_id: val
				}, function(res) {
					angular.forEach(res.data, function(post) {
						ratingActivePosts.push(post);
					});
				});

				CommunityRatings.activePosts({
					_id: $rootScope.loggedUser._id,
					current_community_id: val
				}, function(res) {
					angular.forEach(res.data, function(post) {
						ratingActivePosts.push(post);
					});
				});

				$scope.ratingActivePosts = ratingActivePosts;
				$scope.loadedRatingPosts = true;
				$scope.loadingRatingPosts = false;
			}, function(res) {
				$scope.loadedRatingPosts = true;
				$scope.loadingRatingPosts = false;
			});
		}

		function loadCommunityAbout(id, done, doneErr) {
			finishLoading([]);
		}

		function loadCommunityMember(id, doneErr) {
			var obj = {
				communityId: id,
				limit: 12,
				offset: $scope.data.length
			};

			CommunityMembers.query(obj, processData, doneErr);
		}

		function loadCommunityApplications(id, doneErr) {
			var obj = {
				communityId: id,
				limit: 12,
				offset: $scope.data.length
			};

			CommunityApplicants.query(obj, processData, doneErr);
		}

		function loadCommunityPosts(id, doneErr) {
			Community.getPosts({
				communityId: id
			}, function(res) {
				$scope.postsActive = [];
				$scope.postsInactive = [];

				res.data.forEach(function(item) {
					if ($rootScope.isPostActive(item)) {
						$scope.postsActive.push(item);
					} else {
						$scope.postsInactive.push(item);
					}
				});

				finishLoading();
			}, doneErr);
		}

		$scope.refreshItemInfo = function($event, itemNew) {
			$scope.posts.data.forEach(function(item, key) {
				if (item._id === itemNew._id) {
					$scope.posts.data.splice(key, 1);
				}
			});
		};

		function loadCommunityHome(id) {
			async.parallel([
				function(done) {
					CommunityActivityLog.get({
						communityId: id,
						limit: 5
					}, function(res) {

						$scope.activityShow = false;
						$scope.activityLog = [];
						$timeout(function() {

							res.map(function(activity) {
								activity.text = Activities.getActivityTranslation(activity);
								return activity;
							});

							$scope.activityLog = res;
							$scope.activityShow = true;
						});

						done(null);
					}, done);
				},
				function(done) {
					CommunityApplicants.query({
						communityId: id
					}, function(res) {
						$scope.applications = res;
						done(null);
					}, done);
				},
				function(done) {
					CommunityRatings.received({
						communityId: id,
						limit: 5,
						offset: 0
					}, function(res) {
						$scope.receivedRatings = res;
						done(null);
					}, done);
				},
				function(done) {
					Community.getPosts({
						communityId: id,
						limit: 5,
						offset: 0,
						state: 'active'
					}, function(res) {
						$scope.posts = res;
						done(null);
					}, done);
				}
			], finishLoading);

			$scope.$on('postUpdated', $scope.refreshItemInfo);
		}

		function loadCommunityActivityLog(id) {
			CommunityActivityLog.get({
				communityId: id
			}, processData, processDataErr);
		}

		// =================================== Public Methods ====================================

		$scope.remove = function(item) {
			Post.remove({
				postId: item._id
			}, function(res) {

				$scope.$emit('postCreated', item._id); // refresh post list
				$scope.cancel(item);
			}, processDataErr);
		};

		$scope.removeMember = function(id) {
			if ($scope.sendingRemoveMember) return false;
			$scope.sendingRemoveMember = true;

			CommunityMembers.remove({
				communityId: $scope.info._id,
				memberId: id
			}, function(res) {
				$scope.sendingRemoveMember = false;
				Notify.addSingleTranslate('NOTIFY.USER_KICKED_FROM_COMMUNITY_SUCCESS', Notify.T_SUCCESS);
				$scope.init();
			}, function(res) {
				$scope.sendingRemoveMember = false;
			});
		};

		// only hide post .. may be used later for delete revert
		$scope.removeItemFromList = function($event, item) {
			$("#post_" + item._id).slideUp("slow", function() {});
			$scope.init();
		};

		function init() {
			ItemFilter.clear();
			$scope.loadingData = true;
			$scope.data = [];
			$scope.pageSegment = $stateParams.page || 'home';
			var loadService = loadServices[$scope.pageSegment];

			$scope.debug && $log.log("Calling load service for segment ", $scope.pageSegment);
			loadService($stateParams.id, processData, processDataErr);

			// refresh after new post created
			if ($scope.pageSegment == 'community' || $scope.pageSegment == 'community.posts') {
				$scope.$on('postCreated', function() {
					// refresh whole page - load new counters, activity feed, posts list
					$scope.init();
					// loadServices[$scope.pageSegment]($stateParams.id, processData, processDataErr);
				});
			}

			// refresh after new post created
			if (!inited && ($scope.pageSegment == 'community' || $scope.pageSegment == 'community.posts')) {
				$scope.$on('postCreated', function() {
					loadService($stateParams.id, processData, processDataErr);
				});
				$scope.$on('postUpdated', function() {
					loadService($stateParams.id, processData, processDataErr);
				});

				// added event listeners - dont add them again
				inited = true;
			}
		}

		// will add new rating to data array
		$scope.addCommunityRating = function($event, item) {
			$scope.data.unshift(item);
			$scope.flashRatingBackground(item);
		};

		$scope.$on('refreshSubpage', init);
		$scope.$on('communityRatingsAdded', $scope.addCommunityRating);
		$scope.$on('itemDeleted', $scope.removeItemFromList);
		init();
	}
]);