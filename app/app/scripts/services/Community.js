'use strict';

/**
 * @ngdoc service
 * @name hearth.services.Community
 * @description 
 */
 
angular.module('hearth.services').factory('Community', [
	'$resource', 'appConfig',
	
	function($resource, appConfig) {
		return $resource(appConfig.apiPath + '/communities/:communityId', {
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
			remove: {
				method: 'DELETE'
			},
			add: {
				method: 'POST'
			}
		});
	}
]);