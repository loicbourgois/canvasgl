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
gulp.task('test', ['lint', 'karma']);
gulp.task('karma', karma);
gulp.task('karma-continuous', karmaContinuous);
gulp.task('watch', watch);

function lint() {
	return gulp.src(files)
		.pipe(eslint('.eslintrc.json'))
		.pipe(eslint.format());
}

function karma(done) {
	new Server({
		configFile: __dirname + '/karma.conf.js',
		singleRun: true
	}, done).start();
}

function karmaContinuous(done) {
	new Server({
		configFile: __dirname + '/karma.conf.js',
		singleRun: false
	}, done).start();
}

function watch() {
	return gulp.watch(files, ['lint', 'karma-continuous']);
}
