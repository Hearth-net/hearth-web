'use strict';

/**
 * @ngdoc service
 * @name hearth.services.Throttle
 * @description throttle function
 */

angular.module('hearth.services').factory('Throttle', [function() {

	const factory = {
		go
	}

	return factory

	//////////////

	function go(callback, limit = 10) {
		var wait = false
		return function() {
			if (wait) return
			callback.call()
			wait = true
			setTimeout(() => {
				wait = false

				// call the callback after waiting to make sure we didn't miss something
				callback.call()
			}, limit)
		}
	}

}])