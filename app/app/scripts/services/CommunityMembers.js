'use strict';

/**
 * @ngdoc service
 * @name hearth.services.CommunityMembers
 * @description 
 */
 
angular.module('hearth.services').factory('CommunityMembers', [
	'$resource', 'appConfig',

	function($resource, appConfig) {
		return $resource(appConfig.apiPath + '/communities/:communityId/members/:memberId', {
			communityId: '@communityId',
			memberId: '@memberId'
		}, {
			add: {
				method: 'POST'
			},
			show: {
				method: 'GET'
			},
			remove: {
				method: 'DELETE'
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