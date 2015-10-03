@echo off
cls

@echo on
java -jar ./closurecompiler/compiler.jar ^
 --compilation_level ADVANCED_OPTIMIZATIONS ^
 --warning_level=VERBOSE ^
 --jscomp_warning=visibility ^
 --summary_detail_level=3 ^
 --define='COMPILED=true' ^
 --js ^
 ../js/apploader.js ^
 ../js/audio.js ^
 ../js/input.js ^
 ../js/network.js ^
 ../js/bgame.js ^
 ../js/wglc.js ^
 ../js/sc_main.js ^
 ../js/gl-matrix.js ^
 ../js/car.js ^
 ../js/util.js ^
 ../js/mesh.js ^
 ../js/phys.js ^
 --externs ../js/externs.js ^
 --js_output_file ../site/compiled.js ^
 --source_map_format=V3 ^
 --create_source_map ../compiled.js.map

@echo off
pause