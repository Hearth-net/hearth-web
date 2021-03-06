var MailListener = require("mail-listener2");
var Promise = require("es6-promise").Promise;
const beacon = require('./utils.js').beacon;

function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

var emailRandomId = getRandomInt(1, 99999999999999999);

module.exports = {
	options: {
		testPassword: 'testovaci',
		useConfig: 'local',
		local: {
			baseUrl: 'http://0.0.0.0:9000/app',
			appPath: '/',
  	    	name: 'Hearth',
    	  	surname: '' ,
			loginName: 'jenkins.uzivatel@mailinator.com', //hearth-e2e-tester@mailinator.com', // test user email
			loginPassword: 'jenkins.uzivatel@mailinator.com', //hearth-e2e-tester@mailinator.com', 			// test user password
			loginFullName: '',
			loginTrimmedName: 'E2E teste…'
		},
		jenkins: {
			baseUrl: 'http://jenkins:9000/app',
			appPath: '/',
			name: 'Jenkins',
			surname: '' ,
			loginName: 'jenkins.uzivatel@mailinator.com', // test user email
			loginPassword: 'jenkins.uzivatel@mailinator.com', 			// test user password
			loginFullName: '',
			loginTrimmedName: 'E2E teste…'
		},
		dev: {
			baseUrl: 'http://dev.hearth.net/app',
			appPath: '/',
			name: 'Hearth',
			surname: '' ,
			loginName: 'hearth-e2e-tester@mailinator.com', // test user email
			loginPassword: 'hearth-e2e-tester@mailinator.com', 			// test user password
			loginFullName: '',
			loginTrimmedName: 'E2E teste…'
		},
		stage: {
			baseUrl: 'http://stage.hearth.net/app',
			appPath: '/',
			name: 'Hearth',
			surname: '' ,
			loginName: 'hearth-e2e-tester@mailinator.com', // test user email
			loginPassword: 'hearth-e2e-tester@mailinator.com', 			// test user password
			loginFullName: '',
			loginTrimmedName: 'E2E teste…'
		}
	},
	config: function () {
		return this.options[browser.params.env];
	},
	login: function () {
		browser.manage().deleteAllCookies();
		this.navigateTo('login');
		element(by.model('data.username')).sendKeys(this.config().loginName);
		element(by.model('data.password')).sendKeys(this.config().loginPassword);
	    beacon('login-button').click();
	},
	logout: function () {
		this.navigateTo('market');
		this.hoverTopUserMenu();
		element(by.css('#profile-drop a[ng-click="logout()"]')).click();
	},
	hoverTopUserMenu: function () {
		browser
			.actions()
			.mouseMove(browser.findElement(protractor.By.css('.dropdown-container a[dropdown="#profile-drop"]:nth-child(1)')))
			.perform();
	},
	navigateToFull: function (where) {
		browser.get(where);
	},
	navigateTo: function (where) {
		// make protractor go to baseUrl with where param
		browser.get(this.config().baseUrl + '' + this.config().appPath + '' + where);
	},
	expectAlertBox: function (type) {
		expect(element(by.css('.alert-box.' + type )).isDisplayed()).toBe(true);
		browser.driver.sleep(3600);
		expect(element(by.css('.alert-box.' + type )).isPresent()).toBe(false);
	},
	hasClass: function (element, cls) {
		return element.getAttribute('class').then(function (classes) {
			return classes.split(' ').indexOf(cls) !== -1;
		});
	},
	getRegConfirmUrlFromText: function(text) {
	    return text.match(/(https:\/\/.[^"^>]*confirm-email\?hash=[^"^>^<]*)/ig);
	},
	parseLocation: function (href) {
	    var match = href.match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)(\/[^?#]*)(\?[^#]*|)(#.*|)$/);
	    return match && {
	        protocol: match[1],
	        host: match[2],
	        hostname: match[3],
	        port: match[4],
	        pathname: match[5],
	        search: match[6],
	        hash: match[7]
	    }
	},
	getEmailListener: function() {

		// here goes your email connection configuration
		var mailListener = new MailListener({
		    username: "testovaci@hearth.net",
		    password: "7urucHebra",
		    host: "imap.gmail.com",
		    port: 993, // imap port
		    tls: true,
		    debug: console.log,
		    tlsOptions: { rejectUnauthorized: false },
		    mailbox: "Tests", // mailbox to monitor
		    // searchFilter: ["UNSEEN", "FLAGGED"], // the search filter being used after an IDLE notification has been retrieved
		    markSeen: true // all fetched email will be marked as seen and not fetched next time
		    // fetchUnreadOnStart: true, // use it only if you want to get all unread email on lib start. Default is `false`,
		    // mailParserOptions: {streamAttachments: true}, // options to be passed to mailParser lib.
		    // attachments: true, // download attachments as they are encountered to the project directory
		    // attachmentOptions: { directory: "attachments/" } // specify a download directory for attachments
		});

		mailListener.start();

		mailListener.on("server:connected", function(){
		    console.log("Mail listener initialized");
		});

		mailListener.on("error", function(err){
			console.log("Error during MailListener operation:");
  			console.log(err);
		});

		return function () {
			return new Promise(function(resolve, reject) {
			    mailListener.on("mail", function(mail){
			    	console.log("Got an email!");
			        resolve(mail);
			    });
			});
		}
	},
	getRandomInt: getRandomInt,
	getTestEmail: function () {
		return 'testovaci+'+emailRandomId+'@hearth.net';
	}
};
