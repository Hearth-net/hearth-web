'use strict';

/**
 * @ngdoc service
 * @name hearth.services.PostServices
 * @description
 */

angular.module('hearth.services').factory('PostServices', ['$rootScope', 'Filter', 'Bubble', 'PostAux',

	function($rootScope, Filter, Bubble, PostAux) {
		return {
			showMore: false,
			expanded: false,
			isActive: false,
			showListener: false,
			toggleTag: Filter.toggleTag,

			postTypes: $$config.postTypes,
			replyLabel: $$config.replyLabels,
			replyCountTexts: $$config.replyCountTexts,
      postCharacter: $$config.postCharacter,

			loggedUser: $rootScope.loggedUser,
			isPostActive: $rootScope.isPostActive,
			showLoginBox: $rootScope.showLoginBox,
			pauseToggle: $rootScope.pauseToggle,
			pluralCat: $rootScope.pluralCat,
			deleteItem: $rootScope.deleteItem,
			confirmBox: $rootScope.confirmBox,
			DATETIME_FORMATS: $rootScope.DATETIME_FORMATS,
			toggleReportNotLoggedIn: $rootScope.showLoginBox,
			edit: $rootScope.editItem,
			socialLinks: $rootScope.socialLinks,
			getProfileLink: $rootScope.getProfileLink,
			openReportBox: $rootScope.openReportBox,
			openEmailSharingBox: $rootScope.openEmailSharingBox,
			openLinkSharingBox: $rootScope.openLinkSharingBox,
			postRemoveFromCommunity: $rootScope.postRemoveFromCommunity,
			followItem: $rootScope.followItem,
			unfollowItem: $rootScope.unfollowItem,
			removeReminder: Bubble.removeReminder,
			scrollToElement: $rootScope.scrollToElement,
			userHasRight: $rootScope.userHasRight,
			PostAux: PostAux,
		};
	}
]);
