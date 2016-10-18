'use strict';

/**
 * @ngdoc service
 * @name hearth.services.ItemServices
 * @description
 */

angular.module('hearth.services').factory('ItemServices', ['$rootScope', 'Filter', 'Bubble', 'ItemAux',

	function($rootScope, Filter, Bubble, ItemAux) {
		return {
			showMore: false,
			expanded: false,
			isActive: false,
			showListener: false,
			toggleTag: Filter.toggleTag,

			postTypes: $$config.postTypes,
			replyLabel: $$config.replyLabels,
			replyCountTexts: $$config.replyCountTexts,

			loggedUser: $rootScope.loggedUser,
			isPostActive: $rootScope.isPostActive,
			showLoginBox: $rootScope.showLoginBox,
			pauseToggle: $rootScope.pauseToggle,
			pluralCat: $rootScope.pluralCat,
			deleteItem: $rootScope.deleteItem,
			hideItem: $rootScope.hideItem,
			confirmBox: $rootScope.confirmBox,
			DATETIME_FORMATS: $rootScope.DATETIME_FORMATS,
			toggleReportNotLoggedIn: $rootScope.showLoginBox,
			replyItem: $rootScope.replyItem,
			edit: $rootScope.editItem,
			socialLinks: $rootScope.socialLinks,
			getProfileLink: $rootScope.getProfileLink,
			openReportBox: $rootScope.openReportBox,
			openEmailSharingBox: $rootScope.openEmailSharingBox,
			openLinkSharingBox: $rootScope.openLinkSharingBox,
			removeItemFromCommunity: $rootScope.removeItemFromCommunity,
			removeItemFromBookmarks: $rootScope.removeItemFromBookmarks,
			addItemToBookmarks: $rootScope.addItemToBookmarks,
			followItem: $rootScope.followItem,
			unfollowItem: $rootScope.unfollowItem,
			removeReminder: Bubble.removeReminder,
			scrollToElement: $rootScope.scrollToElement,
			userHasRight: $rootScope.userHasRight,
			ItemAux: ItemAux,
		};
	}
]);