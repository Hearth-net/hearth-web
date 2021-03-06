'use strict';

/**
 * @ngdoc service
 * @name hearth.services.CommunityApplicants
 * @description
 */

angular.module('hearth.services').factory('CommunityApplicants', [
	'$resource',

	function($resource) {
		return $resource($$config.apiPath + '/communities/:communityId/applicants/:applicantId', {
			communityId: '@communityId',
			applicantId: '@applicantId'
		}, {
			add: {
				method: 'POST',
				errorNotify: {
					code: 'COMMUNITY.NOTIFY.ERROR_APPLY'
				}
			},
			show: {
				method: 'GET'
			},
			remove: {
				method: 'DELETE',
				errorNotify: {
					code: 'COMMUNITY.NOTIFY.ERROR_REJECT'
				}
			},
			query: {
				method: 'GET',
				isArray: true,
			}
		});
	}
]);