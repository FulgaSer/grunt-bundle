'use strict';

module.exports = function (grunt) {
    var path=require('path');
    var EXPR_IMPORT=/import(?:\s+)?[(]?['"]([^'"]*)['"][)]?;?/g;
    var EXPR_FILE=/\w+\.js/;

    grunt.registerMultiTask('bundle', 'Grunt task for Bundle', function() {
        var required=[];
        var type=this.data['type'] || '.js';
        var base=this.data['cwd'];

        var parse=function(file){
            var src=grunt.file.read(file);
            var folder=path.dirname(file);

            return src.replace(/@?import(?:\s+)?[(]?['"]([^'"]*)['"][)]?;?/g,function(req,item){
                return include(item.trim(),folder);
            });
        };

        var filter=function(file){
            var ext=path.extname(file);
            return !ext || ext==type;
        };

        var include=function(url,folder){
            var absolute=path.isAbsolute(url);
            var item=path.join(absolute?base:folder,url);

            if(required.indexOf(item)==-1){
                required.push(item);

                if(grunt.file.isFile(item)) return parse(item);
                if(grunt.file.isDir(item)){
                    var file=item+'/index'+type;

                    if(grunt.file.isFile(file)){
                        required.push(file);
                        return parse(file);
                    }
                    else {
                        return grunt.file.expand({cwd:item},'*').filter(filter).map(function(file){
                            return include(file,item);
                        }).join('\n');
                    }
                }
                grunt.log.warn('Source file "' + item + '" not found.');
            }
            return '';
        };

        this.files.forEach(function(opt){
            var src=opt.src.map(function(file){
                if(!base)base=path.dirname(file);
                return include(file,opt.cwd || '');
            }).join('\n');

            grunt.file.write(opt.dest, src);
            grunt.log.writeln('File "' + opt.dest + '" created.');
        });

        grunt.config('bundle.'+this.target+'.required',required);
        if(this.data.tasks) grunt.task.run(this.data.tasks);
    });
};