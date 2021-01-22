#!/bin/bash
#
# script to generate the CCU addon package.

# generate tempdir
mkdir -p tmp
rm -rf tmp/*

# copy all relevant stuff
cp -a update_script tmp/
chmod 755 tmp/update_script
cp -a rc.d tmp/
cp -a eufySecurity tmp/
cp -a eufySecurity-addon.cfg tmp/
cp -a VERSION tmp/

# generate archive
cd tmp
tar --owner=root --group=root -czvf ../eufySecurity-ccu3-$(cat ../VERSION).tar.gz *
cd ..
rm -rf tmp
