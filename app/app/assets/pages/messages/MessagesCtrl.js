'use strict';

/**
 * @ngdoc controller
 * @name hearth.controllers.MessagesCtrl
 * @description List of messages
 */

angular.module('hearth.controllers').controller('MessagesCtrl', [
	'$scope', '$rootScope', 'Conversations', 'UnauthReload', '$stateParams', '$location', '$timeout', 'PageTitle', '$translate', 'ResponsiveViewport',
	function($scope, $rootScope, Conversations, UnauthReload, $stateParams, $location, $timeout, PageTitle, $translate, ResponsiveViewport) {

		$scope.filter = $location.search();
		$scope.showNewMessageForm = false;
		$scope.loaded = false;
		$scope.conversations = false;
		$scope.notFound = false;
		$scope.showFulltext = false;
		$scope.detail = false;
		$scope.loadingBottom = false;

		var _loadLimit = 20; // pull requests interval in ms

		if (!Object.keys($scope.filter).length) {
			$scope.filter = {
				query: null,
				type: null,
				post_id: null
			}
		}

		$scope.toggleAddForm = function(conversation) {
			if (conversation) {
				$location.url("/messages/");
				$scope.filter = {
					query: null,
					type: null,
					post_id: null
				}
				$scope.loadConversations({}, function(list) {
					$scope.loadConversationDetail(conversation._id);
				});
				return;
			}

			$scope.showNewMessageForm = !$scope.showNewMessageForm;
		};

		$scope.getFilter = function() {
			var filter = angular.copy($location.search());

			if (!!~['archived', 'from_admin', 'as_replies', 'as_replies_post', 'from_community', 'users_posts'].indexOf(filter.type))
				filter[filter.type] = true;

			delete filter.type;
			return filter;
		};

		$scope.applyFilter = function(data) {
			$scope.filter.post_id = null;
			var type = data.type;
			var query = type.split(":");
			var post_id = query[1];

			if (post_id) {
				$scope.filter.post_id = post_id;
			}

			var filter = angular.copy($scope.filter);

			if (!filter.query)
				delete filter.query;
			if (!filter.type)
				delete filter.type;
			if (!filter.post_id)
				delete filter.post_id;

			$location.url("/messages?" + jQuery.param(filter));
			$scope.$broadcast('filterApplied', filter);
		};

		$scope.setCurrentConversationAsReadedSoft = function(event, conversation) {
			if (!$scope.detail || $scope.detail.read) {
				return false;
			}

			Conversations.setReaded({
				id: conversation._id
			});

			angular.forEach($scope.conversations, function(item, index) {
				if (item._id === conversation._id) {
					item.read = true;
					$scope.detail.read = true;
				}
			});
		};

		$scope.setCurrentConversationAsUnReadedSoft = function(event, conversation) {
			Conversations.setUnreaded({
				id: conversation._id
			});

			angular.forEach($scope.conversations, function(item, index) {
				if (item._id === conversation._id) {
					item.read = false;
					$scope.detail.read = false;
				}
			});
		};

		$scope.loadNewConversations = function() {
			$scope.$broadcast('loadNewMessages');

			if (!$scope.conversations.length) {
				return $scope.loadFirstConversations();
			}

			var conf = {
				newer: $scope.conversations[0].last_message_time,
				exclude_self: true
			};

			angular.extend(conf, $scope.getFilter());

			Conversations.get(conf, function(res) {
				if (res.conversations.length) {
					$scope.prependConversations($scope.deserialize(res.conversations));
				}
			});
		};

		$scope.removeDuplicitConversations = function(list) {
			list.forEach(function(item) {
				$scope.removeConversationFromList(null, item._id, true);
			});
		};

		$scope.prependConversations = function(conversations) {
			$scope.removeDuplicitConversations(conversations);
			Array.prototype.unshift.apply($scope.conversations, conversations);
			$scope.$broadcast("scrollbarResize");
			$scope.$broadcast("classIfOverflowContentResize");
		};

		$scope.searchConversation = function() {
			// if fulltext is hidden, first only show input
			if (!$scope.showFulltext || !$scope.filter.query)
				return $scope.showFulltext = !$scope.showFulltext;

			$scope.filter.query && $scope.applyFilter();
		};

		/**
		 * This will show requested conversation in right column
		 * and optionally mark it as readed
		 */
		$scope.$on('closeConversation', function() {
			$scope.detail = null;
		});

		/*
		   This will fetch the conversation and mark it as read
		*/
		$scope.showConversation = function(conversation, markAsRead) {
			var title;

			if ($scope.detail && conversation._id === $scope.detail._id) {
				return false;
			}

			$scope.showNewMessageForm = false;
			$scope.notFound = false;
			$scope.detail = conversation;

			// dont load counter when we click on conversation detail
			// (and change URL)
			$location.url('/messages/' + conversation._id + '?' + jQuery.param($location.search()));


			// enable counters loading after URL is changed
			$timeout(function() {
				$scope.$broadcast('updateTitle');
				if (markAsRead) {
					$scope.$broadcast('currentConversationAsReaded', $scope.detail);
				}
			});
		};

		$scope.deserializeConversation = function(conversation) {
			var post = conversation.post;
			conversation.maxAvatarCount = (conversation.participants_count > 4) ? 3 : 4; // print 4 avatars max or only 3 avatars and 4th will be +X counter

			// handle conversation title
			// if it is post reply conversation, add post type
			if (!conversation.title && post && post.title) {
				conversation.title = post.title;

				if (post.author._type == 'User') {
					post.type_code = (post.type == 'offer' ? 'OFFER' : 'NEED');
				} else {
					post.type_code = (post.type == 'offer' ? 'WE_OFFER' : 'WE_NEED');
				}

				post.type_translate = $translate.instant(post.type_code);
			}

			if (conversation.participants.length) {
				conversation.titlePersons = [];

				// if there is no title, build it from first 3 participants (index from 0 to 2)
				for (var i = 0; i < 2 && i < conversation.participants.length; i++) {
					conversation.titlePersons.push(conversation.participants[i].name);
				};

				conversation.titlePersons = conversation.titlePersons.join(", ");
			}

			return conversation;
		};

		/**
		 * Deserialize whole array of conversations
		 */
		$scope.deserialize = function(conversations) {
			var newArray = [];

			for (var i in conversations) {
				var conv = $scope.deserializeConversation(conversations[i]);

				if (conversations[i]._id === $scope.detail._id) {
					angular.copy(conv, $scope.detail);
				}
				newArray.push(conv);
			}
			return newArray;
		};

		$scope.loadPostConversations = function() {
			Conversations.getPosts(function(res) {
				$scope.postConversations = res;
			});
		};

		$scope.loadConversations = function(conf, done) {
			conf = conf || {};
			conf.exclude_self = true;
			angular.extend(conf, $scope.getFilter());

			Conversations.get(conf, function(res) {
				$scope.conversations = $scope.deserialize(res.conversations);
				done && done($scope.conversations);
			});
		};

		// if we have detail ID in url load it and display in detail box
		$scope.loadConversationDetail = function(id, dontMarkAsReaded) {
			// but first try to find it in list
			if ($scope.conversations && $scope.conversations.length) {
				for (var i = $scope.conversations.length; i--;) {
					if ($scope.conversations[i]._id === id) {
						return $scope.showConversation($scope.conversations[i]);
					}
				}
			}

			// if requested conversation is not in list, load it from API
			Conversations.get({
				exclude_self: true,
				no_read: !!dontMarkAsReaded,
				id: id
			}, function(res) {
				$scope.notFound = false;
				$scope.showConversation($scope.deserializeConversation(res));
			}, function() {
				$scope.notFound = true;
			});
		};

		$scope.findConversation = function(id) {
			for (var i in $scope.conversations) {
				if ($scope.conversations[i]._id == id)
					return i;
			}
			return false;
		};

		$scope.updateConversation = function(ev, conversation) {
			if (!$scope.conversations.length || $scope.conversations[0]._id != conversation._id) {
				$scope.prependConversations([$scope.deserializeConversation(conversation)]);
			}
		};

		$scope.updateDeepConversation = function(ev, conv) {
			$scope.deserializeConversation(conv);
		};

		// when we leave/delete conversation - remove it from conversation list
		$scope.removeConversationFromList = function(ev, id, dontSwitchConversation) {
			// find its position
			var index = $scope.findConversation(id);

			// remove it
			if (index !== false)
				$scope.conversations.splice(index, 1);

			// and if it is currently open, jump to top
			if (!dontSwitchConversation && id === $scope.detail._id) {
				if (!$scope.conversations.length) {
					$scope.detail = false;
					return $location.url("/messages");
				}
				// if we should switch to the first conversation at the top
				$scope.showConversation($scope.conversations[0]);
				$timeout(function() {
					$scope.$broadcast("scrollbarResize");
					$scope.$broadcast("classIfOverflowContentResize");
					$(".conversations .scroll-content").scrollTop(0);
				});
			}
		};

		$scope.loadFirstConversations = function() {
			$scope.loadConversations({}, function(list) {
				var paramId = $scope.getParamId();

				// load first conversation on init
				if (paramId) {
					$scope.loadConversationDetail(paramId);
				} else if (list.length) {
					$scope.showConversation(list[0]);
				}
			});
		};

		// add conversations to the bottom of the list
		// but only when they are not there yet (can be loaded also on top of list)
		$scope.addToBottom = function(arr) {
			arr.forEach(function(conv) {
				if ($scope.findConversation(conv._id) === false) {
					$scope.conversations.push($scope.deserializeConversation(conv));
				}
			});
		};

		// load another batch to the bottom of list when scrolled down
		$scope.loadBottom = function() {
			$scope.loadingBottom = true;
			var conf = {
				limit: _loadLimit,
				offset: $scope.conversations.length,
				exclude_self: true,
			};

			angular.extend(conf, $scope.getFilter());

			Conversations.get(conf, function(res) {
				$scope.addToBottom(res.conversations);

				// continue in loading only if there are more conversations
				if (res.conversations.length) {
					$scope.loadingBottom = false;
				}

				$timeout(function() {
					$scope.$broadcast("scrollbarResize");
					$scope.$broadcast("classIfOverflowContentResize");
				});
			});
		};

		// returns ID of conversation to load OR false, depending on url params
		$scope.getParamId = function() {
			var parts = $location.path().split('/');
			return parts.length > 2 ? parts[2] : false;
		};

		function init() {
			$scope.conversations = false;
			$scope.detail = false;
			$scope.notFound = false;
			$scope.showFulltext = false;
			$scope.showNewMessageForm = false;
			$scope.loadingBottom = false;

			$scope.loadPostConversations();
			$scope.loadConversations({
				limit: _loadLimit,
				offset: 0
			}, function(list) {
				$scope.loaded = true;

				var paramId = $scope.getParamId();

				// load first conversation on init
				if (paramId) {
					$scope.loadConversationDetail(paramId, true);
				} else if (list.length) {
					// do not load on small devices. Load on user request only.
					if (ResponsiveViewport.isSmall() || ResponsiveViewport.isMedium()) {
						return false;
					}

					$scope.showConversation(list[0]);
				}
			});
		};

		var changeDetail = function(ev, state, params) {
			// load first conversation on init
			if (params.id) {
				$scope.loadConversationDetail(params.id, true);
			} else if ($scope.conversations.length) {
				$scope.showConversation($scope.conversations[0]);
			}
		};

		$scope.$on('$stateChangeSuccess', changeDetail);

		UnauthReload.check();
		// After event WSNewMessage is recived call function that load new conversations
		$scope.$on('WSNewMessage', $scope.loadNewConversations);
		$scope.$on('conversationRemoved', $scope.removeConversationFromList);
		$scope.$on('conversationUpdated', $scope.updateConversation);
		$scope.$on('conversationCreated', $scope.loadCounters);
		$scope.$on('currentConversationAsReaded', $scope.setCurrentConversationAsReadedSoft);
		$scope.$on('currentConversationAsUnReaded', $scope.setCurrentConversationAsUnReadedSoft);
		$scope.$on('conversationDeepUpdate', $scope.updateDeepConversation);
		$scope.$on('filterApplied', init);
		$scope.$on('initFinished', init);
		$rootScope.initFinished && init();
	}
]);