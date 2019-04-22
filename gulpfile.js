/**
 * 
 * @authors zzl81cn (zzl81cn@gmail.com)
 * @date    2015-07-10 09:49:00
 * @version $Id$
 */

let gulp = require("gulp"),
	runSequence = require("run-sequence"),
	autoprefixer = require("gulp-autoprefixer"),
	browserSync = require("browser-sync").create(),
	// less = require("gulp-less"),
	// mincss = require("gulp-minify-css"),
	del = require("del"),
	gulpif = require("gulp-if"),
	notify = require("gulp-notify"),
	plumber = require("gulp-plumber"),
	sass = require("gulp-sass"),
	sprity = require("sprity"),
	// sass = require("gulp-ruby-sass"),
	uglify = require("gulp-uglify"),
	connect = require("gulp-connect"),
	fileInclude = require("gulp-file-include"),
	merge = require('merge-stream'),
	rev = require("gulp-rev"),
	revReplace = require("gulp-rev-replace");

// staticPath
var
	src = "./src",
	dest = "./dist";
// proxyStaticPath
var	staticSrc = ["./src"],
	proxyURL = "http://192.168.16.167:9998";

gulp.task("pure-serve", function () {
  connect.server({
    root: "dist",
    port: 9001
  });
  // when process exits:
  // connect.serverClose();
});

// generate sprite.png and _sprite.scss
gulp.task("sprites", function () {
	return sprity.src({
		src: "./src/images/public/nav-sprite/*.{png,jpg}"
		// style: "./sprite.css",
		// ... other optional options
		// for example if you want to generate scss instead of css
		// processor: "sass", // make sure you have installed sprity-sass
	})
		.pipe(gulpif("*.png", gulp.dest("./src/images/public/")
			// , gulp.dest("./src/css/")
		));
});


// gulp.task("serve", ["lessTask","sassTask","jsminTask"], function(){
gulp.task("serve", ["sassTask","jsminTask"], function(){
	browserSync.init({
		// 启动server后打开默认页面
		open: false,
		// scrollToTop
		// scrollProportionally: false,
		//镜像模式点击，滚动和表单在任何设备上输入将被镜像到所有设备里
		ghostMode: {
			clicks: false,
			forms: true,
			scroll: false
		},
		// staticServerPath 开启代理时此属性需要禁用
		server: "src",
		// Disable UI completely
		ui: false,
		// Change the default weinre port
		// ui: {
		// 	port: 8080,
		// 	weinre: {
		// 		port: 9090
		// 	}
		// }

		// 文件夹列表模式
		// directory: true,
		port: 9001
		// 代理配置
		/*// 本地文件目录
		serveStatic: staticSrc,
		 ,proxy:{
			// 代理域
			target: proxyURL
			// ,ws:true
		}*/
	});
	// gulp.watch("./less/*.less", ["lessTask"]);
	gulp.watch("./src/styles/sass/**/*.scss", ["sassTask"]);
	// gulp.watch("./js/*.js", ["jsminTask"]);
	// node-sass require
	// gulp.watch("./css/*.css", ["autoPrefixer"]);
	gulp.watch(["./src/**/*.html","./src/**/*.js"], {interval: 500}).on("change", browserSync.reload);
});

// gulp-ruby-sass, Used gulp-sass replace this plugins.
/*gulp.task("sassTask", function(){
	return sass("./src/styles/sass/!*.scss")
    .on("error", sass.logError)
		.pipe(autoprefixer({
					browsers: ["last 2 versions","Firefox <= 20"],
					cascade: false
				}))			
    .pipe(gulp.dest("./src/styles"))
    .pipe(browserSync.stream());
});*/

// 1.compile styles add MD5 code
gulp.task("compile", ["clean"], function () {
	var js = gulp.src("src/public/js/libs/*.js", {base: "src/public"})
		.pipe(uglify());

	var css = gulp.src("src/public/styles/*.scss", {base: "src/public"})
		.pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
		.pipe(sass({outputStyle: "expanded"}))
		.pipe(autoprefixer({
			browsers: ["last 2 versions", "Firefox <= 20"],
			cascade: false
		}));
	return merge(js, css)
		.pipe(rev())
		.pipe(gulp.dest("dist/static"))
		.pipe(rev.manifest())
		.pipe(gulp.dest("dist/tmp"));
});
// 2.replace MD5
gulp.task("replace", ["compile"], function () {
	gulp.src("src/*.html")
		.pipe(revReplace({manifest: gulp.src("dist/tmp/rev-manifest.json")}))
		.pipe(gulp.dest("dist"));
});
// 3.cp static files
gulp.task("cpFiles", function() {
	return gulp.src([
		"src/**",
		"!src/public/js/**",
		"!src/public/styles/**",
		"!src/*.html",
		"!src/build_page"
	])
		.pipe(gulp.dest("dist"))
});
gulp.task("testBuild", function (done) {
	runSequence(["replace"], ["cpFiles"], done)
})

// gulp-sass
gulp.task("sassTask", function () {
	return gulp.src("./src/styles/sass/*.scss")
		.pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
		// compressed,expanded
		.pipe(sass({outputStyle: "expanded"}))
		.pipe(autoprefixer({
			browsers: ["last 2 versions", "Firefox <= 20"],
			cascade: false
		}))
		.pipe(gulp.dest("./src/styles"))
		.pipe(browserSync.stream());
});

// less task
/*gulp.task("lessTask", function(){
	// multiple files change to array type (["","",...])
	return gulp.src("less/!*.less")
			.pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
			.pipe(less())
			// .pipe(mincss({compatibility: "ie7"}))
			// .pipe(mincss())
			.pipe(autoprefixer({
						browsers: ["last 2 versions","Firefox <= 20"],
						cascade: false
					}))			

			.pipe(gulp.dest("css"))
			.pipe(browserSync.stream());
});*/

gulp.task("jsminTask", function(){
	return gulp.src("./js/*.js")
		.pipe(uglify())
		.pipe(gulp.dest("./js-min"));
});

gulp.task("spliceHTML", function () {
	// 适配src/pages中所有文件夹下的所有html，排除pages的include文件夹中html
	gulp.src(["./src/build_page/*.html"])
		.pipe(fileInclude({
			prefix: "@@",
			basepath: "@file",
			context: {
				name: "Text parameter"
			}
		}))
		.pipe(gulp.dest("./src"));
});

// clean types
gulp.task("clean", function () {
	del("dist");
});
// Clean dist directory
gulp.task("clean:normal", function (cb) {
	del([
		// 这里我们使用一个通配模式来匹配 `dist` 文件夹中的所有东西
		"dist/**/*"
		// 如果我们不希望删掉这个文件，所以我们取反这个匹配模式
		//"!dist/mobile/deploy.json"
	], cb);
});

// Copy src specifild file to dist folder.
gulp.task("copyfile", function(){
	return gulp.src(
		["src/*.html", "src/styles/*.css", "src/fonts/**/*", "src/img/**/*", "src/lib/**/*", "src/js/**/*"],
		{base: "./src"}
	)
		.pipe(gulp.dest("dist", {base: "./"}));
});

// Start deploy
gulp.task("dist", ["clean:normal", "copyfile"]);
/* gulp.task("dist", ["clean:normal"], function(done) {
	runSequence(
		["copyfile"],
	done)
}); */

// Only watch sass types files
gulp.task("watchSass", function(){
	gulp.watch("./src/styless/sass/**/*.scss", ["sassTask"]);
});

gulp.task("default", ["serve"]);

// Only watch less types files
// gulp.task("default", function(){
// 	gulp.watch("less/source.less",["lessTask"]);
// });