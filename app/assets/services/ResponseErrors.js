'use strict';

/**
 * @ngdoc service
 * @name hearth.services.ResponseErrors
 * @description
 */

angular.module('hearth.services').factory('ResponseErrors', function() {
	return function(res) {
		var exposeErrors, init, isClientError, isServerError, parseServerErrors, parseValidationErrors, responseClassCode, responseErrors;
		responseErrors = this;
		isClientError = function() {
			return responseClassCode() === 4;
		};
		isServerError = function() {
			return responseClassCode() === 5;
		};
		responseClassCode = function() {
			if (!(res && res.status)) {
				return 0;
			}
			return 1 * res.status.toString()[0];
		};
		parseValidationErrors = function() {
			var errors;
			errors = {};
			if (!(res && res.data)) {
				return errors;
			}
			Object.keys(res.data.errors || {}).map(function(key) {
				return {
					key: key,
					name: res.data.errors[key].name,
					type: res.data.errors[key].type
				};
			}).filter(function(error) {
				return error.name === 'ValidatorError';
			}).reduce(function(errors, error) {
				errors[error.key] = error.type;
				if (!errors.base) {
					errors.base = error.type;
				}
				return errors;
			}, errors);
			if (res.data.name === 'ValidationError' && res.data.message && !errors.base) {
				errors.base = res.data.message;
			}

			if (res.status === 403 && res.data.error === "email blocked") {
				errors.blockedUserByEmail = 'true';
			}
			return errors;
		};
		parseServerErrors = function() {
			if (!(res && res.data && res.data.message)) {
				return {};
			}
			return {
				base: res.data.message
			};
		};
		exposeErrors = function(errors) {
			return Object.keys(errors).forEach(function(key) {
				responseErrors[key] = errors[key];
				return responseErrors[key];
			});
		};
		init = function() {
			if (isClientError()) {
				return exposeErrors(parseValidationErrors());
			} else if (isServerError()) {
				return exposeErrors(parseServerErrors());
			}
		};
		return init();
	};
});