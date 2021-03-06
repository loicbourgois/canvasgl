// Karma configuration
// Generated on Sat Jan 20 2018 17:25:51 GMT+0000 (GMT)

module.exports = function(config) {
	config.set({

		// base path that will be used to resolve all patterns (eg. files, exclude)
		basePath: '',


		// frameworks to use
		// available frameworks: https://npmjs.org/browse/keyword/karma-adapter
		frameworks: ['jasmine'],


		// list of files / patterns to load in the browser
		files: [
			'./src/*.js',
			'./spec/*.js'
		],


		// list of files / patterns to exclude
		exclude: [
		],


		// preprocess matching files before serving them to the browser
		// available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
		preprocessors: {
		},


		// test results reporter to use
		// possible values: 'dots', 'progress'
		// available reporters: https://npmjs.org/browse/keyword/karma-reporter
		reporters: ['dots'],


		// web server port
		port: 9876,


		// enable / disable colors in the output (reporters and logs)
		colors: true,


		// level of logging
		// possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
		logLevel: config.LOG_INFO,


		// enable / disable watching file and executing tests whenever any file changes
		autoWatch: true,


		// Continuous Integration mode
		// if true, Karma captures browsers, runs the tests and exits
		singleRun: true,

		// Concurrency level
		// how many browser should be started simultaneous
		concurrency: Infinity,

		browserNoActivityTimeout: 60000,
		browserDisconnectTolerance: 3
	});

	// start these browsers
	// available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
	// https://swizec.com/blog/how-to-run-javascript-tests-in-chrome-on-travis/swizec/6647
	if (process.env.TRAVIS) {
		config.browsers.push('chrome_travis_ci');
		config.customLaunchers = {
			chrome_travis_ci: {
				base: 'Chrome',
				flags: ['--no-sandbox']
			}
		};
	} else {
		config.browsers.push('Chrome');
	}
};
