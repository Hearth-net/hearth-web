'use strict';

angular.module('hearth.services').factory('Community', [
	'$resource',
	function($resource) {
		return $resource($$config.apiPath + '/communities/:communityId', {
			communityId: '@_id'
		}, {
			get: {
				method: 'GET',
				params: {
					r: Math.random()
				}
			},
			query: {
				method: 'GET',
				isArray: true,
				params: {
					r: Math.random()
				}
			},
			edit: {
				method: 'PUT'
			},
			add: {
				method: 'POST'
			}
		});
	}
]);