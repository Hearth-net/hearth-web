const beacon = require('../utils.js').beacon;

describe('hearth unauth marketplace', function () {

  beforeEach(function () {
    protractor.helpers.navigateTo('/market?lang=cs');
  });

  // should see marketplace with items
  it('should see items', function () {
    var filterBar = element(by.className('filterbar-wrap'));
    var marketContainer = element(by.className('marketplace-items-container'));

    expect(filterBar.isDisplayed()).toBeTruthy();
    expect(marketContainer.isDisplayed()).toBeTruthy();
  });

  // should see 15 items
  it('should see 15 items on market', function () {
    var marketItems = element.all(by.css('.item-common.item-post'));
    expect(marketItems.count()).toBe(15);
  });

  // should see 30 items, temporary more than 15. There is not enough english posts
  it('should see more than 15 items when scrolled down', function () {

    // 15 items before we start
    var marketItems = element.all(by.css('.item-common.item-post'));
    expect(marketItems.count()).toBe(15);

    browser.executeScript('window.scrollTo(0,20000);').then(function () {
      browser.sleep(2000);
      // 30 items afterwards
      expect(marketItems.count()).toBeGreaterThan(15);
    })
  });

  // should be able to switch to map
  // it('should be able to switch to map view', function () {
  //   browser.sleep(1000);
  //   var marketContainer = element(by.className('marketplace-items-container'));
  //   var switchToMapLink = element(by.css('[test-beacon="filterbar-show-posts-on-map"]'));
  //   var mapContainer = element(by.className('marketplace-map-container'));

  //   // market is visible
  //   expect(marketContainer.isDisplayed()).toBeTruthy();
  //   expect(switchToMapLink.isDisplayed()).toBeTruthy();
  //   expect(mapContainer.isPresent()).toBeFalsy();

  //   switchToMapLink.click().then(function () {
  //     // map is visible
  //     expect(marketContainer.isPresent()).toBeFalsy();
  //     expect(mapContainer.isDisplayed()).toBeTruthy();

  //     // click again to switch back to marketplace
  //     switchToMapLink.click().then(function () {
  //       expect(marketContainer.isDisplayed()).toBeTruthy();
  //       expect(mapContainer.isPresent()).toBeFalsy();
  //     });
  //   });
  // });

  // should see login after click on some action buttons od desktop
  it('should see login dialog after try to create gift on desktop', function () {
    browser.manage().window().setSize(1200, 800);
    loginDialogTest('desktop');
  });

  // should see login after click on some action buttons od tablet
  it('should see login dialog after try to create gift on tablet', function () {
    browser.manage().window().setSize(800, 600);
    loginDialogTest('tablet');
  });

  // should see login after click on some action buttons od mobile
  it('should see login dialog after try to create gift on mobile', function () {
    browser.manage().window().setSize(320, 480);
    loginDialogTest('mobile');
  });


  // should see navigation for mobile on small screen size od desktop
  it('should see navigation for mobile on small screen size', function () {
    browser.manage().window().setSize(320, 480);
    navigationTest('mobile');
  });


  // should see navigation for tablet on medium screen size
  it('should see navigation for tablet on medium screen size', function () {
    // tablet screen size
    browser.manage().window().setSize(800, 600);
    navigationTest('tablet');
  });

  // should see navigation for tablet on big screen size
  it('should see navigation for tablet on big screen size', function () {
    // desktop screen size
    browser.manage().window().setSize(1200, 800);
    navigationTest('desktop');
  });


  function loginDialogTest(type) {
    var createButton = beacon('new-post-button');
    var loginModal = element(by.css('.register-login-dialog .alert-box.alert'));
    var loginModalCloseButton = element(by.css('.register-login-dialog span.close'));
    var iconAdd = beacon('open-new-post-dialog-toggle-mobile');

    if (type === 'mobile' || type === 'tablet') {
      if (type === 'mobile') {
        expect(iconAdd.isDisplayed()).toBeTruthy();
        expect(createButton.isDisplayed()).toBeFalsy();
      }
      if (type === 'tablet') {
        expect(iconAdd.isDisplayed()).toBeTruthy();
        expect(createButton.isDisplayed()).toBeFalsy();
      }
      iconAdd.click().then(function () {
        browser.sleep(500);
        expect(loginModal.isDisplayed()).toBeTruthy();
        loginModalCloseButton.click();
      }).then(function () {
        browser.sleep(500);
        expect(loginModal.isPresent()).toBeFalsy();
      });
    }

    if (type === 'desktop') {
      expect(iconAdd.isDisplayed()).toBeFalsy(); // on desktop, mobile icon isnt displayed
      createButton.click().then(function () {
        browser.sleep(500);
        expect(loginModal.isDisplayed()).toBeTruthy();
        loginModalCloseButton.click();
      }).then(function () {
        browser.sleep(500);
        expect(loginModal.isPresent()).toBeFalsy();
      });
    }
  }

  // specific for mobile and tablet
  function navigationTest(type) {
    var container = beacon('off-canvas-wrapper');
    var topBar = beacon('nav-bar');
    var searchBar = beacon('search-bar-mobile-container');
    var iconAdd = beacon('open-new-post-dialog-toggle-mobile');
    var iconSearch = beacon('search-bar-toggle-mobile');
    var toggleButton = beacon('nav-bar-menu-toggle');
    // var leftSidebar = element(by.css('aside.left-off-canvas-menu'));

    var topBarDesktop = element(by.css('nav.top-bar'));
    var searchBoxDesktop = element(by.css('nav.top-bar #searchBox'));

    if (type === 'mobile' || type == 'tablet') {
      // topbar is visible, left sidebar is hidden, searchbar is hidden
      expect(topBar.isDisplayed()).toBeTruthy();
      expect(protractor.helpers.hasClass(container, 'move-right')).toBe(false);
      expect(searchBar.isDisplayed()).toBeFalsy();

      // icons are visible
      expect(iconAdd.isDisplayed()).toBeTruthy();
      expect(iconSearch.isDisplayed()).toBeTruthy();
      expect(toggleButton.isDisplayed()).toBeTruthy();

      // after click on search button, the form should expand
      iconSearch.click().then(function () {
        expect(searchBar.isDisplayed()).toBeTruthy();
      });

      // // after click on hamburger button, left sidebar should appear
      // toggleButton.click().then(function () {
      //   expect(leftSidebar.isDisplayed()).toBeTruthy();
      //   expect(protractor.helpers.hasClass(container, 'move-right')).toBe(true);
      // });
    }

    if (type === 'desktop') {
      // topbar is visible, left sidebar is hidden, searchbar is hidden
      expect(topBarDesktop.isDisplayed()).toBeTruthy();
      expect(searchBoxDesktop.isDisplayed()).toBeTruthy();
      expect(iconAdd.isDisplayed()).toBeFalsy();
    }
  }


});
