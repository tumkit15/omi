var path = require('path');
var join = path.join;
var basename = path.basename;
var fs = require('fs');
var vfs = require('vinyl-fs');
var renameSync = fs.renameSync;
var existsSync = fs.existsSync;
var chalk = require('chalk');
var through = require('through2');
var emptyDir  = require('empty-dir');
var info = require('./logger').info;
var error = require('./logger').error;
var success = require('./logger').success;
var isCnFun = require('./utils').isCnFuc;
var emptyFs = require('./utils').emptyFs;

function init(args){
    var omiCli = chalk.bold.cyan("Omi-Cli");
    var isCn = isCnFun(args.language);
    var customPrjName = args.project || '';
    var tpl = join(__dirname, '../template/app-ts');
    var dest = join(process.cwd(), customPrjName);
    var projectName = basename(dest);
    var mirror = args.mirror;

    console.log();
    console.log(omiCli + (!isCn ? " is booting... ": " 正在启动..."));
    console.log(omiCli + (!isCn ? " will execute init command... ": " 即将执行 init 命令..."));

    if(existsSync(dest) && !emptyDir.sync(dest)) {
        console.log();
        process.stdout.write(!isCn ? "This directory isn't empty, empty it? [Y/N] ": "此文件夹不为空，是否需要清空？ [Y/N]: ");
        process.stdin.resume();
        process.stdin.setEncoding('utf-8');
        process.stdin.on('data', (chunk) => {
            chunk = chunk.replace(/\s\n|\r\n/g, '');
            if(chunk !== 'y' && chunk !== 'Y') {
                process.exit(0);
            } else {
                console.log(chalk.bold.cyan("Omi-Cli")+ (!isCn ?  ' is emptying this directory...' : ' 正在清空此文件夹...'));
                emptyFs(dest);
                createApp()
            }
        });
    } else {
        createApp()
    }


    function createApp() {
        console.log();
        console.log(chalk.bold.cyan("Omi-Cli") + (!isCn ? ' will creating a new omi app in ' : ' 即将创建一个新的应用在 ') + dest);

        vfs.src(['**/*', '!mode_modules/**/*'], {cwd: tpl, cwdbase: true, dot: true})
            .pipe(template(dest, tpl))
            .pipe(vfs.dest(dest))
            .on('end', function(){
                try{
                    info('Rename', 'gitignore -> .gitignore');
                    renameSync(join(dest, 'gitignore'), join(dest, '.gitignore'));
                    if(customPrjName) {
                        try{
                            process.chdir(customPrjName);
                        }
                        catch (err) {
                            console.log(error(err));
                        }
                    }
                    info('Install', 'We will install dependencies, if you refuse, press ctrl+c to abort, and install dependencies by yourself. :>');
                    console.log();
                    require('./install')(mirror, done)
                } catch(e){
                    console.log(error(e))
                }
            })
            .resume();
    }

    function done(){
        console.log();
        console.log();
        console.log();
        success(`Congratulation! "${projectName}" has been created successful! `);
        console.log(`
    
Using the scaffold with  Webpack ,
    
if you are not in ${projectName}, please run 'cd ${projectName}', then you can:
    
    > ${chalk.bold.white('npm run dev')}         Starts the development server
    > ${chalk.bold.white('npm run dist')}        Publish your project`);
        console.log();
        console.log(`${chalk.bold.cyan('Omix!')} https://alloyteam.github.io/omix` )
    }

}

function template(dest, cwd) {
    return through.obj(function (file, enc, cb) {
        if (!file.stat.isFile()) {
            return cb();
        }

        info('Copy', file.path.replace(cwd + '/', ''));
        this.push(file);
        cb();
    });
}

module.exports = init;