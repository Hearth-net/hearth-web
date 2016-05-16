var testFolder = './test/';
exports.config = {
	seleniumAddress: 'http://localhost:4444/wd/hub',
	allScriptsTimeout: 30000,
	getPageTimeout: 30000,
	capabilities: {
		'browserName': 'chrome' // or 'firefox', 'safari'
	},
	specs: [
		testFolder + 'unauth/marketplace.js',
		testFolder + 'auth/register.js',
		testFolder + 'auth/login.js',
		testFolder + 'auth/bookmarks.js',
		testFolder + 'auth/deleteUser.js'
	],
	suites: {
		'unauth': [testFolder + 'unauth/marketplace.js'],
		'auth': [
			testFolder + 'auth/register.js',
			testFolder + 'auth/login.js',
			testFolder + 'auth/deleteUser.js'
		]
	},
	onPrepare: function() {
		protractor.helpers = require('./test/setup.js');
	},
	params: {
		env: 'local'
	}
};
