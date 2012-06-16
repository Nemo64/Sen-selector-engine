# NOTE: this compiling script needs google's closure compiler.
UNCOMPRESSED="Sen.js"
COMPRESSED="Sen.min.js"
java -jar compiler/compiler.jar --compilation_level ADVANCED_OPTIMIZATIONS --output_wrapper "(function(){%output%})();" --js $UNCOMPRESSED --js_output_file $COMPRESSED --summary_detail_level 3 --warning_level VERBOSE $1
# output the sizes
origSize=`more $UNCOMPRESSED | wc -c`
minSize=`more $COMPRESSED | wc -c`
gzipSize=`gzip -c --best $COMPRESSED | wc -c`
echo
echo "original size    : $origSize bytes"
echo "compressed size  : $minSize bytes"
echo "gzipped would be : $gzipSize bytes"
echo

