'use strict';

/**
 * @ngdoc controller
 * @name hearth.controllers.ProfileCtrl
 * @description
 */

angular.module('hearth.controllers').controller('ProfileEditCtrl', [
	'$scope', 'User', '$location', '$rootScope', '$timeout', 'Notify', 'UnauthReload', 'Auth', 'Validators', 'ProfileUtils',

	function($scope, User, $location, $rootScope, $timeout, Notify, UnauthReload, Auth, Validators, ProfileUtils) {
		$scope.loaded = false;
		$scope.sending = false;
		$scope.profile = false;
		$scope.showError = {
			locations: false,
			first_name: false,
			motto: false,
			email: false,
			phone: false,
			contact_email: false,
			message: false,
			social_networks: [],
		};

		$scope.parameters = ProfileUtils.params;
		console.log($scope.parameters.MAX_MOTTO_LENGTH, ProfileUtils.params)

		$scope.languageListDefault = ['cs', 'en', 'de', 'fr', 'es', 'ru'];
		$scope.languageList = ['cs', 'en', 'de', 'fr', 'es', 'ru', 'pt', 'ja', 'tr', 'it', 'uk', 'el', 'ro', 'eo', 'hr', 'sk', 'pl', 'bg', 'sv', 'no', 'nl', 'fi', 'tk', 'ar', 'ko', 'zh', 'he'];

		$scope.init = function() {

			UnauthReload.check();

			// $scope.initLocations();
			User.getFullInfo(function(res) {
				$scope.profile = transformDataIn(res);
				$scope.loaded = true;

			}, function(res) {});
		};

		function transformDataIn(data) {

			data = ProfileUtils.transformDataForUsage({
				type: ProfileUtils.params.PROFILE_TYPES.USER,
				profile: data
			});

			$scope.languageList.forEach(function(item) {
				if (!data.user_languages[item]) {
					data.user_languages[item] = false;
				}
			});

			$scope.showContactMail = data.contact_email && data.contact_email != '';
			return data;
		};

		$scope.avatarUploadFailed = function(err) {
			$scope.uploadingInProgress = false;
		};

		$scope.avatarUploadStarted = function(argument) {
			$scope.uploadingInProgress = true;
		};

		$scope.avatarUploadSucceeded = function(event) {
			$scope.profile.avatar = angular.fromJson(event.target.responseText);
			$scope.uploadingInProgress = false;
		};

		$scope.updateUrl = function($event, model, key) {
			var input = $($event.target),
				url = input.val();

			if (url && !url.match(/http[s]?:\/\/.*/)) {
				url = 'http://' + url;
			}

			if (model !== $scope.profile.webs) {
				// editing social network, not webs
				$scope.showError.social_networks[key] = !Validators.social(url, key);
			} else {
				// editing webs
				$scope.showError.social_networks['webs'] = !Validators.url(url);
			}

			model[key] = url;
		};

		$scope.validateSocialNetworks = function() {
			var isOk = true;
			var isWebsOk = true;
			var isLinkOk = true;
			['facebook', 'twitter', 'linkedin', 'googleplus'].forEach(function(networkName) {
				if ($scope.profile[networkName]) {
					isLinkOk = Validators.social($scope.profile[networkName], networkName);
					$scope.showError.social_networks[networkName] = !isLinkOk;
					isOk = isOk && isLinkOk;
				}
			});
			isWebsOk = !!Validators.urls($scope.profile.webs);
			$scope.showError.social_networks['webs'] = !isWebsOk;

			return isOk && isWebsOk;
		};

		$scope.switchLanguage = function(lang) {
			$scope.profile.user_languages[lang] = !$scope.profile.user_languages[lang];
		};

		$scope.disableErrorMsg = function(key) {
			$scope.showError[key] = false;
		};

		$scope.transferDataOut = function(data) {
			var webs = [];

			// remove empty webs
			data.webs.forEach(function(web) {
				if (web) webs.push(web);
			});

			data.webs = webs;
			data.interests = data.interests.split(",");
			return data;
		}

		$scope.validateData = function(data) {
			var res = true;

			if ($scope.profileEditForm.first_name.$invalid) {
				res = false;
				$scope.showError.first_name = true;
			}

			if (data.locations && data.locations.length) {
				data.locations.forEach(function(item) {
					if (item.address == '') {
						res = false;
						$scope.showError.locations = true;
					}
				});
			} else {
				data.locations = [];
			}

			if ($scope.profileEditForm.email.$invalid) {
				res = false;
				$scope.showError.email = true;
			}

			if ($scope.profileEditForm.phone.$invalid) {
				res = false;
				$scope.showError.phone = true;
			}

			if ($scope.showContactMail && $scope.profileEditForm.contact_email.$invalid) {
				res = false;
				$scope.showError.contact_email = true;
			}

			if (!$scope.validateSocialNetworks()) {
				res = false;
			}

			if ($scope.profileEditForm.about.$invalid || $scope.profileEditForm.interests.$invalid) {
				res = false;
			}

			return res;
		}

		$scope.update = function() {
			var transformedData;

			if (!$scope.validateData($scope.profile)) {
				Notify.addSingleTranslate('NOTIFY.USER_PROFILE_FORM_HAS_ERRORS', Notify.T_ERROR);
				$rootScope.scrollToError();
				return false;
			}

			if ($scope.sending) return false;
			$scope.sending = true;
			$rootScope.globalLoading = true;

			transformedData = $scope.transferDataOut(angular.copy($scope.profile));

			User.edit(transformedData, function(res) {
				$scope.sending = false;
				$rootScope.globalLoading = false;

				// refresh user info - for example avatar in navbar
				Auth.refreshUserInfo();
				$location.path('/profile/' + $scope.profile._id);
				Notify.addSingleTranslate('NOTIFY.USER_PROFILE_CHANGE_SUCCES', Notify.T_SUCCESS);

			}, function(res) {
				$rootScope.globalLoading = false;
				$scope.sending = false;
			});
		};

		// when blur event on input - wait with displaying errors - if we clicked also on remove contcat email
		// remove him instead
		$scope.contactEmailBlur = function() {
			$timeout(function() {
				$scope.showError.contact_email = true;
			});
		};

		$scope.hideContactEmail = function() {
			// hide input & set him empty and dont show any errors
			$scope.showContactMail = false;
			$scope.profile.contact_email = '';

			$timeout(function() {
				$scope.showError.contact_email = false;
			}, 100);
		};

		$scope.$on('initFinished', $scope.init);
		$rootScope.initFinished && $scope.init();
	}
]);