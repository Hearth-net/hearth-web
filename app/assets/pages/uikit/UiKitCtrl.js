'use strict';

/**
 * @ngdoc controller
 * @name hearth.controllers.UiKitCtrl
 * @description
 */

angular.module('hearth.controllers').controller('UiKitCtrl', [
  '$scope', '$sce', '$compile', '$timeout',
  function ($scope, $sce, $compile, $timeout) {

    // @kamil Can't use controllerAs here because I don't know how to bind to ctrl with $compile
    // const ctrl = this;

    // inited in markup
    $scope.activeTab

    $scope.buttons = [];
    $scope.typographies = [];
    $scope.inputs = [];

    /*
     Data section
     attributes:
     name - element name
     code - element html code
     desc - description/comment
     */

    const getTypographiesData = () => {
      return [
        {name: '', code: '<h1 class="header-1">Header 1 - Pro lidi s otevřeným srdcem</h1>'},
        {name: '', code: '<h2 class="header-2">Header 2 - Pro lidi s otevřeným srdcem</h2>'},
        {name: '', code: '<h3 class="header-3">Header 3 - Pro lidi s otevřeným srdcem</h3>'},
        {name: '', code: '<h4 class="header-4">Header 4 - Pro lidi s otevřeným srdcem</h4>'},
        {name: '', code: '<h5 class="header-5">Header 5 - Pro lidi s otevřeným srdcem</h5>'},
        {name: '', code: '<h6 class="header-6">Header 6 - Pro lidi s otevřeným srdcem</h6>'},
        {
          name: 'Paragraph',
          code: '<p>Co nás baví a naplňuje, <a href="#">posíláme dál</a>. Co sami potřebujeme, dostáváme od druhých. Bez peněz. Bez principu „co za to”. Jen tak, pro radost :-)</p>'
        },
        {
          name: 'Muted and text emphasis',
          code: '<p class="text-muted">Co nás baví a naplňuje, <a href="#">posíláme dál</a>. Co sami potřebujeme, dostáváme od druhých. Bez peněz. Bez principu „co za to”. Jen tak, pro radost :-)</p>'
        },
        {
          name: '',
          code: '<p class="text-danger">Je nám líto, tuto akci <a href="#">nelze provést</a>.</p>'
        },
        {
          name: '',
          code: '<p class="text-warning">Opravdu chcete smazat <a href="#">svůj profil</a>?</p>'
        },
        {
          name: '',
          code: '<p class="text-success">Skvělé, vítejte na palubě. <a href="#">Připoutejte se, prosím</a>!</p>'
        },
        { name: 'Links', code: '<a href="#">This is a link</a>' },
        {
          name: 'Label',
          code: '<div class="label">R2D2</div> <div class="label warning hollow">C3PO</div> <div class="label alert">These aren\'t the labels you\'re looking for</div>'
        },
        {
          name: 'Tags',
          code: '<div class="tags tagsActive"><ul class="tagList"><li>Kniha</li><li>Zahrádkaření</li><li>Plevely</li></ul></div>'
        },        
        { name: 'Alert', code: '<div class="alert-box alert error"><i class="fa fa-warning"></i> This a serious problem</div>' },
        { name: 'Warning', code: '<div class="alert-box warning">This is a warning about some dangerous action</div>' },
        { name: 'Success', code: '<div class="alert-box success">This is a notification of success</div>' },
        { name: 'Info', code: '<div class="alert-box info">This is an information or confirmation</div>' },
      ];
    };

    const getButtonsData = () => {
      return [
        { name: 'Button and link elements'},
        { code: '<a>link</a>' },
        { code: '<a class="button">link button</a>' },
        { code: '<button class="button">button</button>' },
        { name: 'Button sizes' },
        { code: '<button class="button small">small button</button>' },
        { code: '<button class="button">default button</button>' },
        { code: '<button class="button large">large button</button>' },
        { name: 'Button types' },
        { code: '<button class="button">primary button</button>' },
        { code: '<button class="button secondary">secondary button</button>' },
        { code: '<button class="button offer">need</button>', desc: 'The style is set according to post character.' },
        { code: '<button class="button need">offer</button>', desc: 'The style is set according to post character.' },
        {code: '<button class="button dark-gray">dark-gray</button>'},
        { name: 'Icon buttons' },
        {code: '<button class="button"><i class="fa fa-globe"></i><span>text</span></button>'},
        {code: '<button class="button"><i class=\"fa fa-globe\"></i></button>'},
        { name: 'Hollow buttons' },
        {code: '<button class="hollow button">primary inv</button>'},
        {code: '<button class="hollow button large dark-gray"><i class="fa fa-filter"></i> dark-gray inv</button>'},
        {code: '<button class="hollow button offer">hollow offer</button>'},
        {code: '<button class="hollow button need">hollow need</button>'},
        { name: 'Disabled buttons' },
        {code: '<button class="button disabled">disabled</button>'},
        {code: '<button class="large button offer disabled">large offer disabled</button>'},
        {code: '<button class="small button dark-gray disabled">small dark-gray disabled</button>'},
        { name: 'Round buttons'},
        { code: '<button class="button rounded"><i class="fa fa-chevron-down"></i></button>'}
      ];
    };

    const getInputsData = () => {
      return [
        {code: '<input type="text" placeholder="placeholder">'},
        {code: '<input type="number" value="10">'},
        {code: '<textarea placeholder="Text area ..."></textarea>'},
      ];
    };

    function getAvatarData() {
      return {
        code: `<avatar class="block" size="normal" src="loggedUser.avatar.normal" type="\'User\'"></avatar>

<div class="avatar-stack">
  <avatar size="small" src="loggedUser.avatar.normal" type="\'User\'"></avatar>
  <avatar size="small"></avatar>
</div>`,
        selector: '[avatars]',
        scopeId: 'avatars'
      }
    }

    init()

    ///////////////////////////////////////////////////////////////////////

    function init() {
      prepareElementData($scope.buttons, getButtonsData())
      prepareElementData($scope.typographies, getTypographiesData())
      prepareElementData($scope.inputs, getInputsData())
      compileData(getAvatarData())
      compileData(getFormData())
      compileData(getInfoBubbleData())
    }

    function getFormData() {

      // every first attempt to submit will end success, every other will simulate an error
      var submitWillBeSuccess = true;

      // prepare models
      $scope.formLoading;
      $scope.savingFormError;
      $scope.savingFormSuccess;
      $scope.validationError;
      $scope.testFormData = {
        name: '',
        surname: ''
      }
      $scope.genderList = [
        {title: 'GENDER.AGENDER', value: 'agender'},
        {title: 'GENDER.ANDROGYNE', value: 'androgyne'},
        {title: 'GENDER.ANDROGYNOUS', value: 'androgynous'},
        {title: 'GENDER.BIGENDER', value: 'bigender'},
        {title: 'GENDER.CIS', value: 'cis'}
      ]
      // bind submit function to controller
      // ctrl.testFormSubmit = (data, form) => {
      $scope.testFormSubmit = (data, form) => {
        form.$setDirty()

        $scope.savingFormSuccess = false
        $scope.savingFormError = false

        // validation
        $scope.validationError = false
        if (!form.$valid) return $scope.validationError = true

        // simulate API call
        $scope.formLoading = true
        $timeout(() => {
          if (submitWillBeSuccess) {
            $scope.formLoading = false
            $scope.savingFormSuccess = true
            form.$setPristine()
            form.$setUntouched()

          } else {
            $scope.formLoading = false
            $scope.savingFormError = true
          }
          submitWillBeSuccess = !submitWillBeSuccess
        }, 1000)

      }

      // and return template
      return {
        code:
`<form name="testForm" id="testForm" ng-submit="testFormSubmit(testFormData, testForm, uiKit)" novalidate>
  <div ng-show="savingFormSuccess" class="callout cursor-pointer success" ng-click="savingFormSuccess = false" translate="FORM.SAVING_SUCCESS"></div>
  <div ng-show="savingFormError" class="callout cursor-pointer error" ng-click="savingFormError = false">
    <div translate="FORM.SAVING_FAILED"></div>
    <span>reason, if any</span>
  </div>

  <label class="block">
    <span translate="PERSON.NAME"></span>
    <input type="text" name="name" ng-model="testFormData.name" translate-attr="{placeholder: 'PERSON.NAME'}" required minlength="2" />
    <div class="help-text" translate="PERSON.NAME.HELPTEXT"></div>
    <div ng-messages="testForm.name.$error" ng-show="testForm.$submitted || testForm.name.$dirty">
      <div ng-messages-include="assets/components/form/ngMessages/required.html"></div>
      <div ng-messages-include="assets/components/form/ngMessages/minlength.html"></div>
    </div>
  </label>

  <label class="block">
    <span translate="PERSON.SURNAME"></span>
    <input type="text" name="surname" ng-model="testFormData.surname" translate-attr="{placeholder: 'PERSON.SURNAME'}" required />
    <div ng-messages="testForm.surname.$error" ng-show="testForm.$submitted || testForm.surname.$dirty">
      <div ng-message="required" translate="PERSON.SURNAME.ERROR_REQUIRED"></div>
    </div>
  </label>

  <label class="block">
    <span translate="PERSON.SURNAME"></span>
    <select name="gender" ng-model="testFormData.gender" required translate-attr="{placeholder: 'PERSON.GENDER'}" required ng-options="gender.value as (gender.title | translate) for gender in genderList">
      <option value="" translate="GENDER.SELECT"></option>
    </select>
    <div class="help-text">Notice how the placeholder option (with empty value) is entered directly, while all the other options are generated from a controller list</div>
    <div ng-messages="testForm.surname.$error" ng-show="testForm.$submitted || testForm.surname.$dirty">
      <div ng-messages-include="assets/components/form/ngMessages/required.html"></div>
    </div>
  </label>

  <div class="block">
    <div class="box box--checkbox-list">
      <label>
        <checkbox model="testFormData.sth1" name="sth1" class="box box--checkbox">
          <span translate="SOMETHING.ONE"></span>
        </checkbox>
      </label>
      <label>
        <checkbox model="testFormData.sth2" name="sth2" class="box box--checkbox" disabled="testFormData.sth1">
          <span translate="SOMETHING.TWO"></span>
        </checkbox>
      </label>
    </div>
    <div class="help-text">This checkbox list logic doesn't make sense but showcases how to style such lists and how to apply the disabled attribute</div>
  </div>

  <div class="block flex-grid">
    <label>
      <checkbox model="testFormData.sth3" name="sth3">
        <span translate="SOMETHING.THREE"></span>
      </checkbox>
    </label>
    <label>
      <checkbox model="testFormData.sth4" name="sth4">
        <span translate="SOMETHING.FOUR"></span>
      </checkbox>
    </label>
  </div>

  <label class="block">
    <checkbox model="testFormData.eula" required name="eula" class="box box--checkbox" ng-class="{'invalid': testForm.eula.$invalid && (testForm.$submitted || testForm.eula.$dirty)}">
      <span translate="EULA.ACCEPT"></span>
    </checkbox>
    <div class="help-text">Invalid border is set manually</div>
    <div ng-messages="testForm.eula.$error" ng-show="testForm.$submitted || testForm.eula.$dirty">
      <div ng-messages-include="assets/components/form/ngMessages/required.html"></div>
    </div>
  </label>

  <div class="flex flex-divided-medium">
    <button class="button" type="submit" translate="FORM.SUBMIT"></button>
    <i class="fa fa-spinner fa-spin" ng-if="formLoading"></i>
  </div>
</form>`,
        selector: '[form-data]',
        scopeId: 'formData',
      }
    }

    function getInfoBubbleData() {
      $scope.infoBubble
      $scope.infoBubbleModels = [
        // user
        {
          // available immediately
          "_id":"58721035e4fbd8000aaf675d",
          "_type":"User",
          "name":"Luke Skywalker",
          "first_name":"Luke",
          "last_name":"Skywalker",
          "avatar":{
            "normal":"../img/no-avatar.jpg",
            "large":"../img/no-avatar.jpg",
            "size":[400,400]
          },
          "down_votes":0,
          "up_votes":4,

          // available on demand
          "created_at": "2015-04-12T10:06:44.331+02:00",
          "confirmed_at":"2015-04-12T10:08:05.025+02:00",
          "about":"Jsem osůbka,která toho štěstíčka v životě moc nedostává..Nebýt lidí,kterým záleží i na jiných lidech...kdoví kde bych s dcerou byla..Já Vám tady všem moc a mooc děkuju.\nOmlouvám se,že neodepisuju poštou.....vím ,že bych si čas měla najít...,slibuju ,že napravím....",
          "work":"dělnice",
          "facebook":"",
          "googleplus":null,
          "linkedin":null,
          "twitter":null,
          "webs":[],
          "interests":["vyšívání","pletení","filmy o válce...a téměř jakékoliv dokumenty."],
          "only_replies":false,
          "motto":"Jsem osůbka,která toho štěstíčka v životě moc nedostává..Nebýt lidí...",
          "man_country_code":null,
          "user_languages":["cs"],
          "language":"cs",
          "updated_at":"2017-07-04T11:31:12.760+02:00",
          "last_login":"2017-06-11T07:45:34.337+02:00",
          "notification_disabled":null,
          "communities_count":0,
          "followers_count":5,
          "followees_count":0,
          "friends_count":0,
          "post_count":{"needs":3,"offers":1},
          "is_followed":false,
          "is_followee":false,
          "visible_attributes":null,
          "locations":[
            {
              "place_id":"ChIJj6tXOEMaDUcRACoVZg-vAAQ",
              "coordinates":[15.5870415,49.3983782],
              "address":"586 01 Jihlava, Česká republika",
              "short_address":"Jihlava, CZ",
              "formatted_address":"586 01 Jihlava, Česká republika",
            }
          ],
          "formatted_phone":null,
          "email":null,
          "contact_email":null,
          "phone":null,
          "present_password":true,
          "about_shortened":"Jsem osůbka,která toho štěstíčka v životě moc nedostává..Nebýt lidí..."
        },
        // community
        {
          // available immediately
          "_id":"59759aa42097e200149d04b2",
          "_type":"Community",
          "name":"Plutonium pro vsechny",
          "admin":"56980f53e09e1900070006d1",
          "avatar":{
            "normal":"https://hearth-net-topmonks-dev-ugc.s3-eu-west-1.amazonaws.com/tmp_uploads%2F99f2bc64-6b48-49b7-955f-1debb809cb8a%2FPlutonium_ring.jpg",
            "large":"https://hearth-net-topmonks-dev-ugc.s3-eu-west-1.amazonaws.com/tmp_uploads%2F99f2bc64-6b48-49b7-955f-1debb809cb8a%2FPlutonium_ring.jpg",
            "size":null
          },
          "down_votes":0,
          "up_votes":0,
          "short_description":"bullseye",
          "motto":"Kazdy si zaslouzi svych pet kilogramu obohaceneho plutonia"
        },
        // location
        {
          "center":[14.4378005,50.0755381],
          "location":{
            "type":"envelope",
            "coordinates":[[14.2244534,50.177403],[14.7067946,49.9419362]]
          },
          "types":["locality","political"],
          "short_address":"Praha, CZ"
        }
      ]

      return {
          code: `<div class="flex flex-space-between">
  <div class="padding-medium" style="background: pink" info-bubble="infoBubbleModels[0]" info-bubble-type="'user'">Hover me! I'm a user</div>
  <div class="padding-medium" style="background: yellow" info-bubble="infoBubbleModels[1]" info-bubble-type="'community'">Hover me! I'm a community¤</div>
  <div class="padding-medium" style="background: tomato" info-bubble="infoBubbleModels[2]" info-bubble-type="'location'">Hover me! I'm a location</div>
</div>`,
          selector: '[info-bubble-data]',
          scopeId: 'infoBubble'
      }
    }

    ///////////////////////////////////////////////////////////////////////

    /**
     * HELPER FUNCTIONS
     */

    // Bind data directly to template
    function compileData(data) {
      angular.element(data.selector).append($compile(data.code)($scope))
      $scope[data.scopeId] = data.code
    }

    // Prepare data for binding to html
    function prepareElementData(scopeElementList, inputDataList) {
      inputDataList.forEach(element => {
        scopeElementList.push({
          name: element.name || "",
          code: $sce.trustAsHtml(element.code),
          description: (element.desc || "") + " " + element.code
        })
      })
    }

  }
])