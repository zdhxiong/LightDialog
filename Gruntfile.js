module.exports = function(grunt) {

	//插件配置
	grunt.initConfig({
		//语法检查
		jshint: {
			all: ['Gruntfile.js', 'js/lightDialog.js']
		},
		//压缩js
		uglify: {
			my_target: {
				files: {
					'js/lightDialog.min.js': ['js/lightDialog.js']
				}
			}
		},
		//less编译器
		less: {
//			development: {
//				files: {
//					"css/app.css": "css/app.less"
//				}
//			},
			production: {
				options: {
					cleancss: true
				},
				files: {
					"css/lightDialog.min.css": "css/lightDialog.css"
				}
			}
		},
		//监视器
		watch: {
			css: {
				files: 'css/**/*.css',
				tasks: ['less','cachebuster']
			},
			scripts: {
				files: 'js/lightDialog.js',
				tasks: ['jshint','uglify']
			}
		}
	});

	//使用的插件
	grunt.loadNpmTasks('grunt-contrib-concat');	//合并
	grunt.loadNpmTasks('grunt-contrib-uglify');	//压缩js
	grunt.loadNpmTasks('grunt-contrib-jshint');	//js语法检查
	grunt.loadNpmTasks('grunt-contrib-less');	//less编译器
	grunt.loadNpmTasks('grunt-contrib-watch');	//监视器
	//grunt.loadNpmTasks('grunt-cachebuster');	//自动生成版本号

	//执行命令
	grunt.registerTask('default', ['jshint','uglify','less']);
};