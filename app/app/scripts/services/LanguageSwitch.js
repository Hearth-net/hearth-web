'use strict';

/**
 * @ngdoc service
 * @name hearth.services.LanguageSwitch
 * @description
 */
 
angular.module('hearth.services').service('LanguageSwitch', [
	'$feature', '$translate', '$http', 'ipCookie', '$rootScope', 'tmhDynamicLocale', 'Session', 'Notify',
	function($feature, $translate, $http, ipCookie, $rootScope, tmhDynamicLocale, Session, Notify) {
		var self = this,
			languages = [{
				code: 'en',
				name: 'English'
			}, {
				code: 'cs',
				name: 'Česky'
			}];

		this.init = function() {
			if ($feature.isEnabled('german')) {
				return languages.push({
					code: 'de',
					name: 'Deutsch'
				});
			}

			// console.log("Language Inited");
			$rootScope.languageInited = true;
			$rootScope.$broadcast("languageInited");
		};
		
		this.getLanguages = function() {
			return languages;
		};
		this.getLanguage = function(code) {

			for(var i = 0; i< languages.length; i++) {
				if(languages[i].code == code) {
					return languages[i];
				}
			}
			return false;
		};
		this.swicthTo = function(lang) {
			var lang = self.getLanguage(lang);

			if(lang) {
				self.setCookie(lang.code);
					
				Session.update({language: lang.code}, function(res) {
					
					location.reload();
					// return self.use(lang);
				}, function() {
					Notify.addSingleTranslate('NOTIFY.CHANGE_LANGUAGE_FAILED', Notify.T_ERROR);
				});
			}
			return false;
		}
		this.uses = function() {
			return $.map(languages, function(item) {
				if (item.code === $translate.use()) {
					return item;
				}
			})[0];
		};
		
		this.setCookie = function(lang) {
			ipCookie('language', lang, {expires: 21*30*100});
		};
		
		this.use = function(language) {
			self.setCookie(language.code);

			$http.defaults.headers.common['Accept-Language'] = language.code;
			$translate.use(language.code);
			tmhDynamicLocale.set(language.code);
			
			$rootScope.language = language.code;
			$rootScope.$broadcast("initLanguageSuccess", language.code);
			return language.code;
		};
		this.load = function() {
			return $.cookie('language');
		};
	}
]);