'use strict';

/**
 * @ngdoc service
 * @name hearth.services.Errors
 * @description 
 */

angular.module('hearth.services').factory('Errors', function() {
	return {
		process: function(error, targetObject) {
			var data, result, _ref, _ref1;
			if (!error) {
				return null;
			}
			if (error.status === 400) {
				data = error.data;
				result = {};
				if (data.errors) {
					Object.keys(data.errors).forEach(function(key) {
						var e;
						e = data.errors[key];
						if (e && e.name === 'ValidatorError') {
							result[key] = e.type;
							return result[key];
						}
					});
				}
				if (targetObject) {
					targetObject.errors = result;
				}
			} else if (error.status === 500) {
				window.alert('Application error: ' + (_ref = error.data ? _ref.message : void 0));
			}
			_ref1 = error.data ? _ref1.message : void 0;

			return _ref1;
		}
	};
});