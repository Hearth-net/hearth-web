angular.module('hearth').config([
	'$stateProvider', '$urlRouterProvider',
	function($stateProvider, $urlRouterProvider) {

		// delay routing - first load all dependencies (user session, translations)
		$urlRouterProvider.deferIntercept();
		$urlRouterProvider.rule(function($injector, $location) {
			const re = /(.+)(\/+)(\?.*)?$/;
			const path = $location.url();

			if (re.test(path)) return path.replace(re, '$1$3')
			return false;
		});

		const { SIGNED_IN, UNAUTH, ADMIN } = window.$$config.policy;

		$stateProvider
			.state('dashboard', {
				url: '/',
				templateUrl: 'assets/pages/dashboard/dashboard.html',
				controller: 'DashboardCtrl',
				reloadOnSearch: false,
			})
			.state('market', {
				// @kamil - query and type params must remain so that they get cleaned on route change
				// TODO even though i have no idea why that happens
				url: '/market?query&type',
				params: {
					showMessage: ''
				},
				templateUrl: 'assets/pages/market/market.html',
				controller: 'MarketCtrl',
				reloadOnSearch: false,
			})
			.state('map', {
				url: '/map',
				templateUrl: 'assets/pages/map/map.html',
				controller: 'MapCtrl',
			})
			.state('communities', {
				//abstract: true,
				url: '/communities',
				templateUrl: 'assets/pages/community/communities.html',
				controller: 'CommunityListCtrl',
				controllerAs: 'vm'
			})
			// .state('communities.my', {
			// 	url: '/communities/my',
			// 	templateUrl: 'assets/pages/community/communityList.html',
			// 	controller: 'CommunityListCtrl',
			// 	controllerAs: 'vm'
			// })
			.state('communities.suggested', {
				url: '/communities/suggested',
				templateUrl: 'assets/pages/community/communityList.html',
				controller: 'CommunityListCtrl',
        		controllerAs: 'vm'
			})
			.state('communities-all', {
				url: '/communities/all',
				templateUrl: 'assets/pages/community/communityList.html',
				controller: 'CommunityListCtrl',
        		controllerAs: 'vm'
			})
			.state('reset-pass', {
				url: '/reset-password',
				templateUrl: 'assets/pages/userForms/resetPassword.html',
				controller: 'ResetPwdCtrl',
				policy: UNAUTH
			})
			.state('forgot-pass', {
				url: '/forgotten-password',
				templateUrl: 'assets/pages/userForms/forgottenPassword.html',
				controller: 'ForgottenPasswordCtrl',
				policy: UNAUTH
			})
			.state('token-login', {
				url: '/token-login/:token',
				controller: 'TokenLoginCtrl',
				policy: UNAUTH
			})
			.state('fill-email', {
				url: '/fill-email/:token',
				templateUrl: 'assets/pages/userForms/fillEmail.html',
				controller: 'FillEmailCtrl'
			})
			.state('confirm-email', {
				url: '/confirm-email',
				templateUrl: 'assets/pages/userForms/confirmEmail.html',
				controller: 'ConfirmEmailCtrl',
				// signes in the new-coming user. so it is probably better to leave available for signed users
				// policy: UNAUTH
			})
			.state('login', {
				url: '/login',
				templateUrl: 'assets/pages/userForms/login.html',
				controller: 'LoginCtrl',
				policy: UNAUTH
			})
			.state('reg', {
				url: '/register?facebook',
				templateUrl: 'assets/pages/userForms/register.html',
				controller: 'RegisterCtrl',
				policy: UNAUTH
			})
			.state('search', {
				url: '/search?query',
				templateUrl: 'assets/pages/fulltext/fulltext.html',
				controller: 'FulltextCtrl'
			})
			.state('feedback', {
				url: '/feedback',
				templateUrl: 'assets/pages/static/feedback.html',
				controller: 'FeedbackCtrl'
			})
			.state('faq', {
				url: '/faq',
				templateUrl: 'assets/pages/static/localizationPage.html',
				controller: 'StaticPageCtrl'
			})
			.state('taxes', {
				url: '/taxes',
				templateUrl: 'assets/pages/static/localizationPage.html',
				controller: 'StaticPageCtrl'
			})
			.state('terms', {
				url: '/terms',
				templateUrl: 'assets/pages/static/localizationPage.html',
				controller: 'StaticPageCtrl'
			})
			.state('privacy-policy', {
				url: '/privacy-policy',
				templateUrl: 'assets/pages/static/localizationPage.html',
				controller: 'StaticPageCtrl'
			})
			.state('support-us', {
				url: '/support-us',
				templateUrl: 'assets/pages/static/localizationPage.html',
				controller: 'StaticPageCtrl'
			})
			.state('components', {
				url: '/components',
				templateUrl: 'assets/pages/static/components.html',
				controller: 'ComponentsCtrl'
			})
			.state('post', {
				url: '/post/:id',
				templateUrl: 'assets/pages/post/postDetail.html',
				controller: 'PostDetail'
			})
			.state('messages', {
				title: 'messages.0',
				url: '/messages',
				templateUrl: 'assets/pages/messages/list.html',
				controller: 'MessagesCtrl',
				policy: SIGNED_IN
			})
			.state('messages.new', {
				titleIgnore: true,
				url: '/new',
				template: '<conversation-add></conversation-add>',
				policy: SIGNED_IN
			})
      // keep all current filter options, when you hit the detail of conversation.
			.state('messages.detail', {
				titleIgnore: true,
				url: '/:id?archived&from_admin&as_replies&community_id&post_id',
				template: '<conversation-detail></conversation-detail>',
				policy: SIGNED_IN
			})
			.state('profile', {
				title: false,
				abstract: true,
				url: '/profile/:id',
				templateUrl: 'assets/pages/profile/profile.html',
				controller: 'ProfileCtrl',
				policy: SIGNED_IN
			})
			.state('profile.default', {
				title: false,
				url: '',
				controller: 'ProfileDataFeedCtrl',
				templateUrl: 'assets/pages/profile/subviews/home.html',
				policy: SIGNED_IN
			})
			.state('profile.subview', {
				title: false,
				url: '/{page}',
				controller: 'ProfileDataFeedCtrl',
				templateUrl: function($stateParams) {
					var pages = ['activities', 'given-ratings', 'received-ratings', 'communities', 'friends', 'followers', 'following', 'posts', 'replies', 'bookmarks'];
					var tplPath = 'assets/pages/profile/subviews/';
					if (!~pages.indexOf($stateParams.page))
						$stateParams.page = 'home';
					return tplPath + $stateParams.page + '.html';
				},
				policy: SIGNED_IN
			})
			.state('profileEdit', {
				url: '/profile-edit',
				templateUrl: 'assets/pages/profile/edit.html',
				controller: 'ProfileEditCtrl',
				policy: SIGNED_IN
			})
			.state('profileSettings', {
				url: '/profile-settings',
				templateUrl: 'assets/pages/profile/editSettings.html',
				controller: 'ProfileSettingsCtrl',
				policy: SIGNED_IN
			})
			.state('communityEdit', {
				url: '/community/:id/edit',
				templateUrl: 'assets/pages/community/editCommunity.html',
				controller: 'CommunityCreateCtrl',
				policy: SIGNED_IN
			})
			.state('community', {
				abstract: true,
				url: '/community/:id',
				templateUrl: 'assets/pages/community/profile.html',
				controller: 'CommunityProfileCtrl',
				//policy: SIGNED_IN
			})
			.state('community.default', {
				title: false,
				url: '',
				controller: 'CommunityDataFeedCtrl',
				templateUrl: 'assets/pages/community/subviews/posts.html',
				///policy: SIGNED_IN
			})
			.state('community.subview', {
				title: false,
				url: '/{page}',
				controller: 'CommunityDataFeedCtrl',
				templateUrl: function($stateParams) {
					var pages = ['activity', 'members', 'given-ratings', 'received-ratings', 'applications', 'about', 'posts'];
					var tplPath = 'assets/pages/community/subviews/';
					
					if (!~pages.indexOf($stateParams.page))
					$stateParams.page = 'posts';
					return tplPath + $stateParams.page + '.html';
				},
				//policy: SIGNED_IN
			})
			.state('communityCreate', {
				title: false,
				url: '/community/create',
				controller: 'CommunityProfileCtrl',
				templateUrl: 'assets/pages/community/createCommunity.html',
				policy: SIGNED_IN
			})
			.state('uikit', {
				url: '/uikit',
				templateUrl: 'assets/pages/uikit/uikit.html',
				controller: 'UiKitCtrl',
			})
			.state('aboutUs', {
				url: '/about-us',
				templateUrl: 'assets/pages/static/AboutUs.html'
			})
			// about page
			.state('about', {
				url: '/about',
				templateUrl: 'assets/pages/about/about.html',
				controller: 'AboutCtrl',
			})
				// ambassadors page
				.state('ambassadors', {
					url: '/about/ambassadors',
					templateUrl: 'assets/pages/about/ambassadors.html',
					selectedTab: 'ambassadors',
					controller: 'AboutCtrl',
					controllerAs: 'ctrl'
				})
				// ambassadors page
				.state('ambassadors-list', {
					url: '/about/ambassadors/list',
					templateUrl: 'assets/pages/about/ambassadors.html',
					selectedTab: 'ambassadorsList',
					controller: 'AboutCtrl',
					controllerAs: 'ctrl'
				})
				// napadnice (spreading)
				.state('spreading', {
					url: '/about/spreading',
					templateUrl: 'assets/pages/about/ambassadors.html',
					selectedTab: 'idealist',
					controller: 'AboutCtrl',
					controllerAs: 'ctrl'
				})
				// udernice (communicate)
				.state('communicate', {
					url: '/about/communicate',
					templateUrl: 'assets/pages/about/ambassadors.html',
					selectedTab: 'todoist',
					controller: 'AboutCtrl',
					controllerAs: 'ctrl'
				})
				// udernice
				.state('similar-projects', {
					url: '/about/similar-projects',
					templateUrl: 'assets/pages/about/ambassadors.html',
					selectedTab: 'similarProjects',
					controller: 'AboutCtrl',
					controllerAs: 'ctrl'
				})
				.state('about-custodians', {
					url: '/about/custodians',
					templateUrl: 'assets/pages/about/ambassadors.html',
					selectedTab: 'custodians',
					controller: 'AboutCtrl',
					controllerAs: 'ctrl'
				})
				.state('custodians', {
					url: '/custodians',
					templateUrl: 'assets/pages/about/ambassadors.html',
					selectedTab: 'custodians',
					controller: 'AboutCtrl',
					controllerAs: 'ctrl'
				})
				.state('principles-of-giving', {
					url: '/about/principles',
					templateUrl: 'assets/pages/about/principles.html',
					selectedTab: 'principles',
					controller: 'AboutCtrl',
				})
				.state('hearth-points', {
					url: '/hearth-points',
					templateUrl: 'assets/pages/static/hearth-point.html',
					controller: 'HearthPointsCtrl',
					controllerAs: 'vm',
					slug: 'hearth.points'
				})
				.state('central-hearth-point', {
					url: '/central-hearth-point',
					templateUrl: 'assets/pages/static/hearth-point.html',
					controller: 'HearthPointsCtrl',
					controllerAs: 'vm',
					slug: 'central.hearth.point'
				})
			.state('ourStory', {
				url: '/our-story',
				templateUrl: 'assets/pages/static/OurStory.html'
			})
			.state('contacts', {
				url: '/contacts',
				templateUrl: 'assets/pages/static/Contacts.html'
			})
			.state('error404', {
				templateUrl: 'assets/pages/static/error404.html',
				controller: 'Error404Ctrl'
			})
			// temp admin only
			.state('gift-categorization', {
				url: '/gift-categorization',
				templateUrl: 'assets/pages/admin/templates/giftCategorization.html',
				controller: 'GiftCategorizationController as vm',
				policy: ADMIN
			})
			.state('events', {
				url: '/events',
				templateUrl: 'assets/pages/events/events.html',
				controller: 'EventsCtrl',
				controllerAs: 'vm',
			})
			.state('event-detail', {
				url: '/event/:id',
				templateUrl: 'assets/pages/events/event.html',
				controller: 'EventCtrl',
				controllerAs: 'vm',
			})
			;

		$urlRouterProvider.otherwise(function($injector, $location) {
			var state = $injector.get('$state');
			state.go('error404');
			return $location.path();
		});
	}
]);
