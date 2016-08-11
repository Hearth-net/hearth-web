'use strict';

/**
 * @ngdoc service
 * @name hearth.services.Notification
 * @description Notification service
 */

angular.module('hearth.services').service('Notify', ['$translate', '$log',
	function($translate, $log) {
		var tmpl = '<div data-alert class="alert-box $$type radius"><div class="alert-inner">$$text<i class="close">&times;</i></div></div>';
		var notifyTypes = {
			1: 'success',
			2: 'info',
			3: 'warning',
			4: 'error',
			5: ''
		};
		var self = this;
		var cookieNotifyCode = "notify.afterRefresh";
		var topPageOffsetContainer = '#notify-offset-container'; // for page padding when the notification appears
		this.T_SUCCESS = 1;
		this.T_INFO = 2;
		this.T_WARNING = 3;
		this.T_ERROR = 4;
		this.T_TEXT = 5;

		this.icons = {};
		this.icons[this.T_SUCCESS] = 'fa-check';
		this.icons[this.T_INFO] = 'fa-info-circle';
		this.icons[this.T_WARNING] = 'fa-exclamation-triangle';
		this.icons[this.T_ERROR] = 'fa-times';
		this.icons[this.T_TEXT] = '';

		this.TOP = '#notify-top';

		// add notification with plain text
		this.add = function(text, type, container, ttl, delay) {

			// if not set delay, set it to 0ms
			delay = delay || 0;
			// time to live - timeout to autoclose notify
			var ttlCustom = ttl || 4000;
			// default time is info box
			type = type || this.T_INFO;
			// default container is top center contaimer
			container = container || self.TOP;

			// if there is an error shown in its own container without ttl, we will show him for longer time
			if (container !== self.TOP && type == self.T_ERROR && !ttl) {
				ttlCustom = -1;
			}
			// add icon before text
			if (self.icons[type])
				text = '<i class="fa ' + self.icons[type] + '"></i>' + text;

			// create notify with given type and text
			var newNotify = $(tmpl.replace('$$type', notifyTypes[type]).replace('$$text', text))
				// hide it at start
				.css('display', 'none');
			var notifyFill = (container === self.TOP) ? newNotify.clone() : null;

			// also add trigger on click on cross icon
			newNotify.find('.close').click(function(ev) {
				self.closeNotify(newNotify, notifyFill);
				ev.stopPropagation();
			});

			// after delay show notification
			setTimeout(function() {

				// add notify
				newNotify.appendTo(container).slideDown(300);

				if (notifyFill)
					notifyFill.appendTo(topPageOffsetContainer).slideDown(300);

				// if timeout is set, trigger close event after given time
				if (ttlCustom >= 0) setTimeout(function() {
					self.closeNotify(newNotify, notifyFill);
				}, ttlCustom);

			}, delay);
		};

		// hide all messages in given container
		this.hideAll = function(container, cb) {
			if (!$(container).children().length)
				return cb && cb();

			$(container).children().slideUp(function() {
				$(this).remove();
				cb && cb();
			});

			if (container == self.TOP) {
				$(topPageOffsetContainer).children().slideUp(function() {
					$(this).remove();
				});
			}
		};

		// this will close all messages in given container and show given message
		this.addSingle = function(text, type, container, ttl, delay) {
			container = container || self.TOP;

			self.hideAll(container, function() {
				return self.add(text, type, container, ttl, delay);
			});
		};

		// this will close all messages in given container and show given message with translate
		this.addSingleTranslate = function(text, type, container, ttl, delay) {
			container = container || self.TOP;

			self.hideAll(container, function() {
				return self.addTranslate(text, type, container, ttl, delay);
			});
		};

		// add notification and translate given text with ng-translate
		this.addTranslate = function(text, type, container, ttl, delay) {
			return self.add(self.translate(text), type, container, ttl, delay);
		};

		// this will save message to cookies - will be retrieved after next refresh
		this.addTranslateAfterRefresh = function(text, type, container, ttl, delay) {
			$.cookie(cookieNotifyCode, JSON.stringify(arguments), {
				path: '/'
			});
		};

		// this will take cookie and if not empty - it will show containing notification
		this.checkRefreshMessage = function() {
			var cookieValue = decodeURIComponent($.cookie(cookieNotifyCode));

			// if not empty
			if ($.cookie(cookieNotifyCode)) {
				try {
					var cookie = JSON.parse(cookieValue);

					// take cookie and parse him to array
					var args = $.map(cookie, function(value, index) {
						return [value];
					});

					// apply given arguments on this function
					self.addSingleTranslate.apply(self, args);
				} catch (e) {
					$log.error('Error while parsing after-refresh-notify', e, cookieNotifyCode);

					Rollbar.error("HEARTH: Error parsing JSON from cookie for afterRefresh notify", {
						error: e,
						source: cookieNotifyCode
					});
				}

				// and delete cookie
				$.removeCookie(cookieNotifyCode, {
					path: '/'
				});
			}
		};

		// translate given message
		this.translate = function(text) {
			return $translate.instant(text);
		};

		// close notify on some event
		this.closeNotify = function(ev, fill) {
			ev.slideUp('fast', function() {
				ev.remove();
			});

			if (fill) fill.slideUp('fast', function() {
				fill.remove();
			});

			return false;
		};

		this.onResourceError = function(rejection) {
			var errorCodes = [500, 422];
			var config = (rejection.config ? (typeof rejection.config.errorNotify === "undefined" ? {} : rejection.config.errorNotify) : {});

			// allow interceptor only for few
			if (errorCodes.indexOf(rejection.status) < 0 || config === false) {
				$log.error('Rejecting interceptor - disabled or unallowed status code', rejection.status);
				return;
			}

			$log.warn('Config: ', config);
			$log.warn('Rejection: ', rejection);

			// if container does not exists, use default
			if (config.container && !$(config.container).is(':visible'))
				config.container = null;

			self.addSingleTranslate(config.code || 'NOTIFY.API_ERROR', config.type || self.T_ERROR, config.container || null);
		};

		return this;
	}
]);