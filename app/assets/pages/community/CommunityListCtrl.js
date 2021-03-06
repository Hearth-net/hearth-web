'use strict';

/**
 * @ngdoc controller
 * @name hearth.controllers.CommunityListCtrl
 * @description
 */

angular.module('hearth.controllers').controller('CommunityListCtrl', [
	'$scope', '$rootScope', 'Community', 'CommunityMemberships', 'Auth', '$state', '$filter', 'UniqueFilter', 'Fulltext', 'PostAux', '$sce', 'ProfileUtils',
	function($scope, $rootScope, Community, CommunityMemberships, Auth, $state, $filter, UniqueFilter, Fulltext, PostAux, $sce, ProfileUtils) {
    var vm = this;
    vm.list = [];
    vm.myCommunities;
    vm.loading = true;
    vm.loaded = false;
    vm.shouldLoadMore = true;
    vm.total = null;

    var ItemFilter = new UniqueFilter();

    var templatePath = 'assets/components/post/posts/post.html';
    var templateUrl = $sce.getTrustedResourceUrl(templatePath);

    var offset = 0;
    var pageSize = 5;

		vm.finishLoading = function (res) {
      vm.loading = false;
      vm.loaded = true;
      vm.total = vm.total + (res.length || 0);
      vm.shouldLoadMore = (res.length > 0);
		}

    vm.loadNext = () => {
      if (vm.loading || !vm.shouldLoadMore) return;
      vm.getSearchOpts(++offset);
    }

    vm.getSearchOpts = (offset = 0) => {
      vm.loading = true;
			vm.communityGiftListOptions = {
        getData: Community.getRelatedPosts,
        getParams: {
          limit: pageSize,
          offset: offset * pageSize 
        },
        templateUrl: templateUrl,
				inactivateTags: true,
        cb: vm.finishLoading,
      };
    }

    vm.getAllCommunities = () => {
      var conf = {
        limit: 20,
        offset: vm.list.length
      };

      Community.query(conf, (res) => {
        if (res) {
          res = ItemFilter.filter(res);

          res.forEach(function (item) {
            item.description = $filter('ellipsis')($filter('linky')(item.description, '_blank'));
          });
        }
        vm.list = vm.list.concat(res);
      });
    }

    vm.loadMore = () => {
      vm.getAllCommunities();
    }

 
    var initCommunities = () => {  
      $rootScope.$on('communities:loaded', () => { // for when loaded straight from login
        vm.myCommunities = $rootScope.myCommunities; 
      });
      vm.myCommunities = $rootScope.myCommunities;
      vm.getSearchOpts();
    };



    
    if ($state.current.name == 'communities-all') {
      vm.getAllCommunities();
    } else {
      if (!$rootScope.loggedUser || !$rootScope.loggedUser._id) return $state.go('communities-all', {})
      else initCommunities() 
    }
  }
]);
