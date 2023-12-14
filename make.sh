#!/bin/sh

DT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../.."
if [ "$1" = "debug" ]; then
	DEBUG="debug"
else
	OUT_DIR=$1
	DEBUG=$2
fi

# If not run from DataTables build script, redirect to there
if [ -z "$DT_BUILD" ]; then
	cd $DT_DIR/build
	./make.sh extension ColReorder $DEBUG
	cd -
	exit
fi

# Change into script's own dir
cd $(dirname $0)

DT_SRC=$(dirname $(dirname $(pwd)))
DT_BUILT="${DT_SRC}/built/DataTables"
. $DT_SRC/build/include.sh

# Copy CSS
rsync -r css $OUT_DIR
css_frameworks colReorder $OUT_DIR/css

# JS - compile and then copy into place
$DT_SRC/node_modules/typescript/bin/tsc

rsync -r js/*.js $OUT_DIR/js

## Remove the import - our wrapper does it for UMD as well as ESM
sed -i "s#import DataTable from '../../../types/types';##" $OUT_DIR/js/dataTables.colReorder.js

js_frameworks colReorder $OUT_DIR/js "jquery datatables.net-FW datatables.net-colreorder"

HEADER="$(head -n 3 js/dataTables.colReorder.ts)"
OUT=$OUT_DIR $DT_SRC/node_modules/rollup/dist/bin/rollup \
    --banner "$HEADER" \
    --config rollup.config.mjs

js_wrap $OUT_DIR/js/dataTables.colReorder.js "jquery datatables.net"

rm js/*.d.ts
rm js/dataTables.colReorder.js js/functions.js js/ColReorder.js

# Copy Types
if [ -d $OUT_DIR/types ]; then
	rm -r $OUT_DIR/types		
fi
mkdir $OUT_DIR/types

if [ -d types/ ]; then
	cp types/* $OUT_DIR/types
else
	if [ -f types.d.ts ]; then
		cp types.d.ts $OUT_DIR/types
	fi
fi

# Copy and build examples
rsync -r examples $OUT_DIR
examples_process $OUT_DIR/examples

# Readme and license
cp Readme.md $OUT_DIR
cp License.txt $OUT_DIR

