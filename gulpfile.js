const gulp = require('gulp');
const eslint = require('gulp-eslint');
const Server = require('karma').Server;

const files = [
	'./*/*.js',
	'*.js',
	'*/*.html',
];

gulp.task('default', ['lint', 'test-continuous', 'watch']);
gulp.task('lint', lint);
gulp.task('test', test);
gulp.task('test-continuous', testContinuous);
gulp.task('watch', watch);

function lint() {
	return gulp.src(files)
		.pipe(eslint('.eslintrc.json'))
		.pipe(eslint.format());
}

function test(done) {
	new Server({
		configFile: __dirname + '/karma.conf.js',
		singleRun: true
	}, done).start();
}

function testContinuous(done) {
	new Server({
		configFile: __dirname + '/karma.conf.js',
		singleRun: false
	}, done).start();
}

function watch() {
	return gulp.watch(files, ['lint', 'test-continuous']);
}
