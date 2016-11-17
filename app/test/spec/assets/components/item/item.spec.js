describe('item directive - market place item', function () {
  var $compile,
    $rootScope,
    $httpBackend;

  beforeEach(function () {
    module('hearth');

    // 3rd party
    module('pascalprecht.translate');
    module('ui.router.state');
    module('ngResource');
    module('ngDialog');
    module('angulartics');
    module('tmh.dynamicLocale');
    module('ngActionCable');
    module('ngSanitize');
    module('htmlTemplates');
  });

  beforeEach(inject(function ($injector, _$compile_, _$rootScope_, $controller) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;

    $httpBackend = $injector.get('$httpBackend');

    $httpBackend.whenGET(API_SESSION_PATH).respond(function () {
      return [200, ['success'], {}];
    });

    $httpBackend.whenGET(MESSAGES_JSON_EN_WHEN).respond(readJSON(MESSAGES_JSON_EN_RESPONSE));
  }));


  it('check 2-way binding in the post', function () {
    prepareData();

    // Compile a piece of HTML containing the directive
    var element = angular.element('<item item="item"></item>');
    element = $compile(element)($rootScope);

    // fire all the watches
    $rootScope.$digest();

    // change the scope values
    $rootScope.item.title = 'Changed title of the post';
    $rootScope.item.author.name = 'Changed name';
    $rootScope.item.text = 'Changed item description';
    $rootScope.item.keywords = ['Changed'];

    $rootScope.$digest();

    var titleElement = element.querySelectorAll('[test-beacon="marketplace-item-post-title"]');
    var authorNameElement = element.querySelectorAll('[test-beacon="marketplace-item-author-name"]');
    var textElement = element.querySelectorAll('[test-beacon="marketplace-item-text"]');
    var replyElement = element.querySelectorAll('[test-beacon="marketplace-reply"]');
    var keywordsElement = element.querySelectorAll('[test-beacon="marketplace-keywords"]');

    // 2-way binding should be disabled
    expect(titleElement.html()).toEqual('Title of the post');
    expect(authorNameElement.html()).toEqual('David Hearth');
    expect(textElement.html()).toEqual('Item description');
    expect(replyElement.html()).toEqual('NO_REPLY');
    expect(keywordsElement.html()).toEqual('gift');

    // 2-way binding should be enabled
    $rootScope.item.reply_count = 1;
    $rootScope.$digest();
    replyElement = element.querySelectorAll('[test-beacon="marketplace-reply"]');
    // another element is loaded due to change of reply_count
    expect(replyElement.html()).toBeUndefined();

  });

  function prepareData() {
    $rootScope.item = {
      _id: '123456789',
      title: 'Title of the post',
      text: 'Item description',
      type: 'need', //need,offer
      reply_count: 0,
      author: {
        _id: '521f5d48b8f421d7200049d2',
        _type: 'User',
        name: 'David Hearth',
        updated_at: "2015-10-26T11:00:05.948+01:00",
        down_votes: 10,
        up_votes: 8,
        karma: "44%",
        avatar: {
          large: null,
          normal: null
        }
      },
      keywords: ['gift'],
      attachments_attributes: ''
    };

    $rootScope.isPostActive = function (item) {
      return true;
    };

  }

});
