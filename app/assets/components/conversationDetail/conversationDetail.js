'use strict';

/**
 * @ngdoc directive
 * @name hearth.directives.conversationDetail
 * @description
 * @restrict E
 */
angular.module('hearth.directives').directive('conversationDetail', [
	'$rootScope', 'Conversations', '$timeout', 'Notify', 'Viewport', 'Messenger', 'PageTitle', '$translate', 'ResponsiveViewport', 'ConversationAux', '$state', 'DOMTraversalService', '$location',
	function($rootScope, Conversations, $timeout, Notify, Viewport, Messenger, PageTitle, $translate, ResponsiveViewport, ConversationAux, $state, DOMTraversalService, $location) {
		return {
			restrict: 'E',
			replace: true,
			scope: {},
			templateUrl: 'assets/components/conversationDetail/conversationDetail.html',
			link: function($scope, element) {
				// PSEUDO INJECTS
				$scope.getProfileLink = $rootScope.getProfileLink;
				$scope.loggedUser = $rootScope.loggedUser;
				$scope.DATETIME_FORMATS = $rootScope.DATETIME_FORMATS;
				$scope.pluralCat = $rootScope.pluralCat;
				$scope.confirmBox = $rootScope.confirmBox;

				// INIT VARIABLES
				$scope.showParticipants = false;
				$scope.showParticipantsForm = false;
				$scope.sendingActionRequest = false;
				$scope.info = {};

				var conversationOptionsSelector = '[conversation-options]';
				var _scrollInited = false;
				var _loadOlderMessagesEnd = false;
				var _loadingOlderMessages = false;

				/**
				 * If we have space on top, load older messages
				 * also add parameter to dont mark conversation as readed when loading messages
				 */
				function testOlderMessagesLoading(dontMarkAsRead) {
					if (!$rootScope.$$phase) $rootScope.$apply();
					if ($('.nano-content', element).scrollTop() < 100) {
						loadOlderMessages(dontMarkAsRead);
					}
				}

				function onContentScrolling() {
					testOlderMessagesLoading();
				}

				/**
				 * If user is on bottom, keep user there after added more content
				 */
				function testScrollBottom() {
					var outer = $('.nano', element);
					var inner = $('.nano-content', outer);
					var pos = Math.ceil(inner.scrollTop() + inner.height());

					if (pos <= inner.prop('scrollHeight')) {
						scrollBottom();
					}
				}

				/**
				 * Scroll to bottom
				 */
				function scrollBottom() {
					$timeout(function() {
						if ($('.nano-content', element).length > 0) {
							setTimeout(function () {
								var scrollHeight = $('.nano-content', element)[0].scrollHeight || 1000;
								$('.nano-content', element).scrollTop(scrollHeight * 1000);
							},100);
							resizeTMessagesBox();
						}
					}, 50);
				}

				$rootScope.$on('messageAddedToConversation', function(event, conversation) {
					if (conversation && conversation.conversation && $scope.info._id === conversation.conversation._id) scrollBottom();
				});

				/**
				 * Send action request to archive/delete/leave conversation
				 * This always ends with removing a conversation from the list
				 * @param  {string} id       ID of conversation
				 * @param  {type} type     type of request DELETE/ARCHIVE/LEAVE
				 * @param  {resource} resource resource function to call
				 */
				function sendActionRequest(id, type, resourceFunc) {
					if ($scope.sendingActionRequest) return false;
					$scope.sendingActionRequest = true;
					// returns the removed conversation and its index to return it to the list in case something goes wrong
					var backup = ConversationAux.removeConversationFromList(id, {
						redirectIfActiveWindow: true
					});

					resourceFunc({
						id: id
					}, function(res) {
						$scope.sendingActionRequest = false;

						Notify.addSingleTranslate('MESSAGING.NOTIFY.SUCCESS_CONVERSATION_' + type + '', Notify.T_SUCCESS);
					}, function(err) {
						$scope.sendingActionRequest = false;

						if (backup.removed && backup.removed.length) ConversationAux.addConversationToList({
							conversation: backup.removed[0],
							index: backup.index
						});
					});
				}

				// use sendActionRequest to delete conversation
				$scope.deleteConversation = function(conversation) {
          markConversationAsRead(conversation, null);
					sendActionRequest(conversation._id, 'DELETE', Conversations.delete);
				};

				// use sendActionRequest to archive conversation
				$scope.archiveConversation = function(conversation) {
				  markConversationAsRead(conversation, null);
					sendActionRequest(conversation._id, 'ARCHIVE', Conversations.archive);
				};

				// use sendActionRequest to leave conversation
				$scope.leaveConversation = function(conversation) {
          markConversationAsRead(conversation, null);
					sendActionRequest(conversation._id, 'LEAVE', Conversations.leave);
				};

				/**
				 * Keep user on his position when added more messages to top
				 */
				function scrollToCurrentPosition(done) {
					var content = $('.nano-content', element);
					var height = content.prop('scrollHeight');
					var scrollTop = content.scrollTop();

					$timeout(function() {
						$scope.$broadcast('scrollbarResize');
						$('.nano-content', element).scrollTop($('.nano-content', element).prop('scrollHeight') - height + scrollTop);

						done && done();
					});
				}

				function markConversationAsRead(conversation, event) {
					if (!conversation || conversation.read) return false;

					// don't trigger conversation read on clicking the 'mark as unread button' or similar
					if (event && event.target && DOMTraversalService.findParentBySelector(event.target, conversationOptionsSelector)) return false;

					Messenger.decreaseUnread();
					conversation.read = true;

					// $state.go('.', {'mark-as-read': ''}, {reload: false, notify: false});
					$location.search('mark-as-read', null);

					Conversations.markAsRead({
						id: conversation._id
					});
				}

				$scope.markConversationAsUnread = function(conversation) {
					// don't wait for server to respond, makes for better UX
					Messenger.increaseUnread();
					conversation.read = false;

					// $state.go('.', {'mark-as-read': ''}, {reload: false, notify: false});
					$location.search('mark-as-read', null);

					Conversations.markAsUnread({
						id: conversation._id
					});
				};

				/**
				 * Load older messages when we scrolled to top
				 */
				function loadOlderMessages(loadOlderMessages) {
					if (_loadingOlderMessages || $scope.info.messages[0].first_message || !$scope.info.messages.length) return false;
					_loadingOlderMessages = true;

					ConversationAux.loadConversationMessages({
						conversation: $scope.info,
						prepend: true,
						params: {
							older: $scope.info.messages[0] ? $scope.info.messages[0].created_at : undefined
						}
					}).then(conversation => {
						_loadingOlderMessages = false;

						scrollToCurrentPosition();
						if (loadOlderMessages !== true) markConversationAsRead(conversation);
					}, error => {
						_loadingOlderMessages = false;
					});
				}

				/**
				 * Resize box with timeout
				 * - this will let view to render first
				 */
				function resizeTMessagesBox() {
					$timeout(resizeMessagesBox);
				}

				function resizeMessagesBox() {
					var container = $('.messages-container', element);
					var offset = -50;
					var measureContainer = $('.messages-container');

					if (ResponsiveViewport.isSmall()) {
						// box needs to be tall on mobile devices, so we count on whole-page-height
						measureContainer = $('#homepage-hero');
						offset = 0;
					}
					var maxBoxHeight = measureContainer.height() - element.find('.conversation-detail-top').outerHeight() - element.find('.messages-reply').outerHeight() + offset;
					container.css('max-height', maxBoxHeight);
					container.fadeIn();

					$timeout(function() {
						// resize scrollbar
						$scope.$broadcast('scrollbarResize');
						$scope.$broadcast('classIfOverflowContentResize');
					});
				}

				$scope.toggleParticipantsForm = function() {
					$scope.showParticipantsForm = !$scope.showParticipantsForm;
					resizeTMessagesBox();
				};

				/**
				 * Show/hide participants list & load from API
				 */
				$scope.toggleParticipants = function() {
					$scope.showParticipants = !$scope.showParticipants;
					resizeTMessagesBox();

					if ($scope.info.participants.length === $scope.info.participants_count) $scope.info.allParticipants = $scope.info.participants;

					if ($scope.showParticipants && !$scope.info.allParticipants) {
						ConversationAux.addConversationParticipants({
							conversation: $scope.info
						}).then(conversation => {
							resizeTMessagesBox();
						});
					};
				};

				function bindActionHandlers() {
					element.bind('click', event => {
						markConversationAsRead($scope.info, event);
					});
					element.bind('keypress', event => {
						markConversationAsRead($scope.info, event);
					});
					var ev = $scope.$on('scrollbarResize', () => {
						ev();
						$('.nano-content', element).bind('scroll mousedown wheel DOMMouseScroll mousewheel keyup', e => {
							if (e.which > 0 || e.type == 'mousedown' || e.type == 'mousewheel') markConversationAsRead($scope.info, e);
						});
					});
				}

				function setTitle() {
					var title = ($scope.info.post) ? $translate.instant($scope.info.post.type_code) + ' ' + $scope.info.titleDetail : $scope.info.titleDetail;
					PageTitle.setTranslate('TITLE.messages.detail', title);
				}

				/**
				 * Config init variables deserialize conversation
				 * and load messages
				 */
				function init(conversationId) {
					_loadOlderMessagesEnd = false;
					_scrollInited = false;
					$scope.showParticipants = false;
					$scope.showParticipantsForm = false;

					$timeout(bindActionHandlers, 10);

					ConversationAux.loadConversation(conversationId).then(conversation => {
						$scope.info = conversation;
						if ($state.params['mark-as-read']) {
						  markConversationAsRead(conversation);
						  conversation.read = true;
            }
						setTitle();
						$scope.loaded = true;

						$timeout(() => {
							// binding here so that even 'ng-if'-ed things are done
							$('.nano-content', element).scroll(onContentScrolling);
							testScrollBottom();
						}, 50);
					}, console.info);
				}

				init($state.params.id);

				// resize box when needed
				$(window).resize(resizeMessagesBox);
				$scope.$on('conversationReplyFormResized', resizeMessagesBox);
				$scope.$on('$destroy', function() {
					$(window).off('resize', resizeMessagesBox);
				});
			}
		};
	}
]);
