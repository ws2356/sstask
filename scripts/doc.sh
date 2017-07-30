#! /usr/bin/env sh

script="$0"
index=`dirname "$script"`/../index.js
docdir=`dirname "$script"`/../docs

echo $script
echo $index
echo $docdir

[ -d "$docdir" ] || mkdir "$docdir"
documentation build "${index}" -f md >"${docdir}/index.md"

