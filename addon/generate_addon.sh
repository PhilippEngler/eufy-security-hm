#!/bin/bash
#
# script to generate the CCU addon packages.

echo "Start createing the addon packages..."

# generate tempdir
echo "Create directory tmp."
mkdir -p tmp
rm -rf tmp/*

# copy all relevant stuff
echo "Copy all common addon files."
cp -a AddOnData/update_script tmp/
chmod 755 tmp/update_script
cp -a AddOnData/rc.d tmp/
cp -a AddOnData/eufySecurity tmp/
#cp -a AddOnData/devices-ext/. tmp/eufySecurity/www/assets/devices
cp -a AddOnData/eufySecurity-addon.cfg tmp/
cp -a AddOnData/VERSION tmp/

# generate Version folder
echo "Create a folder for the addon packages."
mkdir -p build/$(cat AddOnData/VERSION)

# generate official ccu3 archive
#echo "Create ccu3 addon package..."
#cp -a AddOnData/node-ccu3/. tmp/eufySecurity/bin/
#cd tmp
#tar --owner=root --group=root -czf ../build/$(cat VERSION)/eufySecurity-ccu3-$(cat VERSION).tar.gz *
#cd ..
#echo "...done."

# generate official arm32 archive
echo "Create arm32 addon package..."
cp -a AddOnData/node-arm32/. tmp/eufySecurity/bin/
cd tmp
tar --owner=root --group=root -czf ../build/$(cat VERSION)/eufySecurity-arm32-$(cat VERSION).tar.gz *
cd ..
echo "...done."

# generate official arm64 archive
echo "Create arm64 addon package..."
cp -a AddOnData/node-arm64/. tmp/eufySecurity/bin/
cd tmp
tar --owner=root --group=root -czf ../build/$(cat VERSION)/eufySecurity-arm64-$(cat VERSION).tar.gz *
cd ..
echo "...done."

# generate official amd64 archive
echo "Create amd64 addon package..."
cp -a AddOnData/node-amd64/. tmp/eufySecurity/bin/
cd tmp
tar --owner=root --group=root -czf ../build/$(cat VERSION)/eufySecurity-amd64-$(cat VERSION).tar.gz *
cd ..
echo "...done."

# generate internal ccu3 archive
#echo "Create ccu3 internal addon package..."
#cp -a AddOnData/devices-int/. tmp/eufySecurity/www/assets/devices
#cp -a AddOnData/node-armv7/. tmp/eufySecurity/bin/
#cd tmp
#tar --owner=root --group=root -czf ../build/$(cat VERSION)/eufySecurity-ccu3-$(cat VERSION)_INTERNAL.tar.gz *
#cd ..
#echo "...done."

# generate internal arm64 archive
#echo "Create arm64 internal addon package..."
#cp -a AddOnData/node-arm64/. tmp/eufySecurity/bin/
#cd tmp
#tar --owner=root --group=root -czf ../build/$(cat VERSION)/eufySecurity-arm64-$(cat VERSION)_INTERNAL.tar.gz *
#cd ..
#echo "...done."

# generate internal amd64 archive
#echo "Create amd64 internal addon package..."
#cp -a AddOnData/node-amd64/. tmp/eufySecurity/bin/
#cd tmp
#tar --owner=root --group=root -czf ../build/$(cat VERSION)/eufySecurity-amd64-$(cat VERSION)_INTERNAL.tar.gz *
#cd ..
#echo "...done."

echo "Removing tmp directory."
rm -rf tmp
echo "Done createing addon packages. Exiting."