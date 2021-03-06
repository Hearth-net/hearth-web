'use strict';

/**
 * @ngdoc directive
 * @name hearth.directives.item
 * @description
 * @restrict E
 *
 * options = {
 * 	disableLoading: false
 * 	getParams: {},
 * 	getData: $resource function,
 * 	templateUrl: String,
 *	bindToScope: {}, // object that will be merged to post scope
 *	cb: function
 * }
 *
 * example:
 *	<item-list options="ctrl.listOptions"></item-list>
 *
 */
angular.module('hearth.directives').directive('itemList', [
	'$rootScope', '$compile', 'PostScope', '$templateRequest',
	function($rootScope, $compile, PostScope, $templateRequest) {
		return {
			restrict: 'E',
			scope: {
				options: '='
			},
			template: '<div content></div><div loading show="loading && !options.disableLoading"></div>',
			link: function(scope, el) {

				var content = el[0].querySelector('[content]')

				const listener = $rootScope.$on('itemList.refresh', () => init({ erase: true }) );

				scope.$on('$destroy', () => {
					listener()
				})

				scope.$watch('options', (newVal, oldVal) => {
					if (newVal && newVal !== oldVal) {
						init({ erase: false }) // scroll
					}
				})

				init({ erase: true }) // init with erase div

				/////////////////

				function init(params) {
					scope.loading = true;
					scope.options = scope.options || {};
					if (typeof scope.options.getData !== 'function') return;// throw new TypeError('Unsupported itemList setup');
					var responseTransform = scope.options.responseTransform || angular.identity;

					var items = [];
					if (params && params.erase === true) content.innerHTML = '';

					// call for data
					var promise = scope.options.getData(scope.options.getParams || {});

					// normalize $resource and $q api
					promise = promise.$promise || promise;

					promise.then(res => {
						items = responseTransform(res);
						if (items && items.data && items.data.length) items = items.data; // ugly, but need the prop!
						return $templateRequest(scope.options.templateUrl);
					}).then(template => {
						scope.loading = false;
						const compiledTemplate = $compile(template);
						const fragment = document.createDocumentFragment();
						items.length && items.forEach(item => {
							const _scope = PostScope.getPostScope(item, $rootScope);
							angular.merge(_scope, scope.options.bindToScope || {});
							_scope.delayedView = false;
							_scope.inactivateTags = !!scope.options.inactivateTags;
							compiledTemplate(_scope, clone => {
								fragment.appendChild(clone[0]);
							})
						})
						if (params && params.erase === true) content.innerHTML = '';
						content.appendChild(fragment);
						if (typeof scope.options.cb === 'function') scope.options.cb(items);
					}).catch(err => {
						scope.loading = false;
						console.log('Error getting items:', err);
					})
				}

			}
		}
	}
])