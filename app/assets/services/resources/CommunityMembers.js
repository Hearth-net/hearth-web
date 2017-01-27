'use strict';

/**
 * @ngdoc service
 * @name hearth.services.CommunityMembers
 * @description 
 */

angular.module('hearth.services').factory('CommunityMembers', [
	'$resource',

	function($resource) {
		return $resource($$config.apiPath + '/communities/:communityId/members/:memberId', {
			communityId: '@communityId',
			memberId: '@memberId'
		}, {
			add: {
				method: 'POST',
				errorNotify: {
					code: 'NOTIFY.COMMUNITY_APPROVE_APPLICATION_FAILED'
				}
			},
			show: {
				method: 'GET'
			},
			remove: {
				method: 'DELETE',
				errorNotify: {
					code: 'NOTIFY.USER_KICKED_FROM_COMMUNITY_FAILED'
				}
			},
			query: {
				method: 'GET',
				isArray: true,
				params: {
					r: Math.random()
				}
			}
		});
	}
]);