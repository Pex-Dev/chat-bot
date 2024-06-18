const { src, dest, watch } = require('gulp');
const gulpPlumber = require('gulp-plumber');
const sass = require('gulp-sass')(require('sass'));

function compilarSass(done) {
    src('sass/**/*.scss')
        .pipe(gulpPlumber())
            .pipe(sass())
            .on('error',(error)=>{
                console.log("\u001b[1;31m ERROR EN LA COMPILACION DE SASS: ",error.message);
                this.emit('end');
            })
            .pipe(dest('css/'))
                .on('end',()=>{
                    console.log("\u001b[1;32m CODIGO SASS COMPILADO CORRECTAMENTE");
                    done();
                })
}
function dev(done){
    watch('sass/**/*.scss',compilarSass);
    done();
}

exports.dev = dev;