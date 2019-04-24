var gulp = require('gulp');
var del = require('del');
var merge = require('merge-stream');
var uglify = require('gulp-uglify');
var rev = require('gulp-rev');
var replace = require('gulp-rev-replace');
var less = require('gulp-less');


gulp.task('clean', function () {
    return del(['dist']);
});

gulp.task('compile', ['clean'], function () {

    var js = gulp.src('src/static/scripts/*.js', {base: 'src/static'})
        .pipe(uglify()); //压缩静态目录中的js

    var css = gulp.src('src/static/styles/*.less', {base: 'src/static'})
        .pipe(less()); //编译静态目录中的le ss

    var img = gulp.src('src/static/images/*.less', {base: 'src/static'});

    return merge(js, css, img)
        .pipe(rev())
        .pipe(gulp.dest('dist/static'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('dist/tmp'));
});

// 在每次编译时给静态资源更名增加版本号! 这个important
gulp.task('revision', ['compile'], function () {

    return gulp.src('dist/static/**')
        .pipe(rev())
        .pipe(gulp.dest('dist/static'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('dist/tmp'));
});
// 将hbs中用到这些静态资源的地方改为正确的更改后的名字
gulp.task('replace', ['compile'], function () {

    return gulp.src('src/views/*.hbs')
        .pipe(replace({manifest: gulp.src('dist/tmp/rev-manifest.json')}))
        .pipe(gulp.dest('dist/views'));
});
// 依赖三个任务, 他src中除了静态文件以外的直接复制了过去涉及静态资源编译的几个文件和目录都被排除在copy的列表之外了

gulp.task('copy', ['clean', 'compile', 'replace'], function () {
    return gulp.src([
        'src/**',
        '!src/static/**',
        '!src/views/**'
    ])
        .pipe(gulp.dest('dist'));
});

gulp.task('build', ['clean', 'compile', 'replace', 'copy'], function () {
    return del(['dist/tmp']);
});

gulp.task('default', ['clean', 'build']);