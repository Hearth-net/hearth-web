'use strict';

/**
 * @ngdoc controller
 * @name hearth.controllers.LoginCtrl
 * @description
 */

angular.module('hearth.controllers').controller('LoginCtrl', [
	'$scope', '$location', 'Auth', '$rootScope', 'UnauthReload', 'LanguageSwitch', '$auth', 'Notify',
	function($scope, $location, Auth, $rootScope, UnauthReload, LanguageSwitch, $auth, Notify) {
		var resendingEmail = false;
		var invalidEmail = null;
		$scope.data = {
			username: '',
			password: ''
		};

		$scope.loginError = false;
		$scope.showError = {
			badCredentials: false,
			inactiveAccount: false,
			noOauthAccountFound: false,
		};


		$scope.twitterAuthUrl = Auth.getTwitterAuthUrl('login');

		function processLoginResult(res) {
			if (res.ok === true) {
				Auth.processLoginResponse(res);
			}
		}

		function processLoginErrorResult(err) {
			showErrorCredentials(err.data);
		}

		$scope.oauthLogin = function(provider) {
			$auth.authenticate(provider, {
				language: preferredLanguage
			}).then(function(response) {
				if (response.status == 200) {
					Auth.setOAuth(true);
					processLoginResult(response.data);
				} else {
					$scope.loginError = true;
				}
			}).catch(function(response) {
				if (response.status == 400) {
					$scope.showError.noOauthAccountFound = true;
				}
			});
		};

		$scope.resendActivationEmail = function() {
			if (resendingEmail) return;
			resendingEmail = true;

			User.resendActivationEmail({
				user: {
					email: invalidEmail
				}
			}, res => {
				resendingEmail = false;

				if (res.ok === true) {
					Notify.addSingleTranslate('AUTH.NOTIFY.SUCCESS_RESEND_EMAIL', Notify.T_SUCCESS);
					$scope.showError.inactiveAccount = false;
				}
			}, err => {
				resendingEmail = false;
			});
		};

		function showErrorCredentials(res) {
			if (res && res.error && res.error == 'account_not_confirmed') {
				invalidEmail = $scope.data.username;
				$scope.showError.inactiveAccount = true;
				$scope.showError.badCredentials = false;
			} else {

				// focus to password field
				$(".login_password").focus();

				// show top error message
				$scope.showError.badCredentials = true;
				$scope.showError.inactiveAccount = false;
			}

			// set blank password - try it again
			$scope.showMsgOnlyLogged = false;
			$scope.data.password = '';
		}

		$scope.validateLogin = function(data) {
			return data.username != '' && data.password != '' && !$scope.loginForm.username.$error.email;
		};

		// if login is opened in modal window, close him
		$scope.closeModal = function() {
			if ($scope.closeThisDialog) $scope.closeThisDialog();
		};

		$scope.login = function(data) {
			$scope.loginError = false;
			// $scope.showError.badCredentials = false;
			if (!$scope.validateLogin(data)) {
				return showErrorCredentials();
			}

			Auth.setOAuth(false);
			Auth.login(data, processLoginResult, processLoginErrorResult);
		};

		$scope.init = function() {
			var params = $location.search();
			if (params.error)
				$scope.loginError = true;

			if (params.showNoOauthAccountWarning)
				$scope.showError.noOauthAccountFound = true;

			// this should never happen - replaced by routing policies
			// if (Auth.isLoggedIn()) {
			// 	$location.replace();
			// 	return $location.path($rootScope.referrerUrl || '/');
			// }

			$(".login_name").focus();
		};

		$scope.setLoginRequired = function() {
			$scope.showMsgOnlyLogged = true;
			$rootScope.loginRequired = false;
			$scope.loginError = false;
		};

		if ($rootScope.loginRequired) {
			$scope.setLoginRequired();
		} else {
			$scope.$on('loginRequired', $scope.setLoginRequired);
		}

		$scope.$on('initFinished', $scope.init);

		$rootScope.initFinished && $scope.init();
	}
]);