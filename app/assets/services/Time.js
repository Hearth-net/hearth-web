'use strict';

/**
 * @ngdoc service
 * @name hearth.services.Time
 * @description
 */

angular.module('hearth.services').service('Time', [
	'$translate', '$interval', '$rootScope',
	function($translate, $interval, $rootScope) {
		var self = this;

		this.getMomentTimeObject = function(datetime, format) {

			// make dates format same as moment.js format
			// create moment object from our date and add 1 hour because of timezones and return iso string
			format = format.toUpperCase();
			format = format.replace(/([^Y]|Y)YY(?!Y)/g, '$1YYYY');
			format = format.replace(/([^Y]|^)Y(?!Y)/g, '$1YYYY');

			return moment(datetime, format);
		};

		this.convertDateToIso = function(datetime, format) {
			return self.getMomentTimeObject(datetime, format).format();
		};

		this.getDateDiffFromNow = function(datetime, format) {
			var today = moment(moment().format('DD.MM.YYYY'), 'DD.MM.YYYY');
			return self.getMomentTimeObject(datetime, format).diff(today, 'minutes');
		};

		// this will return count of days/minutes/seconds/etc.. from given date to now
		this.getDateDiffToNow = function(date, type) {
			return moment().diff(moment(date), type || 'days')
		};

		return this;
	}
]);