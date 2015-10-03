cls
java -jar ./closurecompiler/compiler.jar ^
 --compilation_level ADVANCED_OPTIMIZATIONS ^
 --warning_level=VERBOSE ^
 --jscomp_warning=visibility ^
 --summary_detail_level=3 ^
 --define='COMPILED=true' ^
 --js ^
 ../js/server.js ^
 ../js/gl-matrix.js ^
 ../js/car.js ^
 ../js/util.js ^
 ../js/mesh.js ^
 ../js/phys.js ^
 --externs ../js/externs.js ^
 --js_output_file ../js/server_min.js