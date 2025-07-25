#!/bin/bash
#
# script to generate the addon packages.

CURRENT_DIR=$(pwd)

PKG_VERSION=$(cat $CURRENT_DIR/AddOnData/VERSION)
if [[ $PKG_VERSION == *"-b"* ]]; then
  # for debian the beta version have minor number 10X
  PKG_VERSION_DEB_MAIN=$(echo "$PKG_VERSION" | sed -e 's/-b[0-9]*//g')
  PKG_VERSION_DEB_ADD=$(echo "$PKG_VERSION" | sed -e 's/[0-9].[0-9].[0-9]-b/10/g')
elif [[ $PKG_VERSION == *"-rc"* ]]; then
  # for debian the rc version have minor number 20X
  PKG_VERSION_DEB_MAIN=$(echo "$PKG_VERSION" | sed -e 's/-rc[0-9]*//g')
  PKG_VERSION_DEB_ADD=$(echo "$PKG_VERSION" | sed -e 's/[0-9].[0-9].[0-9]-rc/20/g')
else
  # for debian the release version have minor number 300
  PKG_VERSION_DEB_MAIN=$PKG_VERSION
  PKG_VERSION_DEB_ADD=300
fi

echo "Start creating the addon packages..."

# generate tempdir
echo "Create directory tmp."
WORK_DIR=$(mktemp -d)
echo $WORK_DIR

# copy all relevant stuff
echo "Copy all common addon files."
cp -a $CURRENT_DIR/AddOnData/update_script $WORK_DIR/
chmod 755 $WORK_DIR/update_script
cp -a $CURRENT_DIR/AddOnData/rc.d $WORK_DIR/
cp -a $CURRENT_DIR/AddOnData/eufySecurity $WORK_DIR/
cp -a $CURRENT_DIR/AddOnData/eufySecurity-addon.cfg $WORK_DIR/
cp -a $CURRENT_DIR/AddOnData/VERSION $WORK_DIR/

# generate Version folder
echo "Create a folder for the addon packages."
BUILD_DIR=$(mkdir -p $CURRENT_DIR/build/$PKG_VERSION)

# creating the architecure array
#declare -A architectures=(["ccu3"]="0" ["arm32"]="1" ["arm64"]="2" ["amd64"]="3")
declare -A architectures=(["arm32"]="0" ["arm64"]="1" ["amd64"]="2")

for ARCH in "${!architectures[@]}"
do
    echo "Creating $ARCH addon packages..."
    echo "  Creating $ARCH tar.gz addon package..."
    cp -a $CURRENT_DIR/AddOnData/bin-$ARCH/. $WORK_DIR/eufySecurity/bin/
    cd $WORK_DIR
    tar --owner=root --group=root -czf $CURRENT_DIR/build/$PKG_VERSION/eufySecurity-$ARCH-$PKG_VERSION.tar.gz *
    echo "  ...done."

    echo "  Creating $ARCH deb addon package..."
    TARGET_DIR=$WORK_DIR/eufySecurity-$ARCH-$PKG_VERSION
    mkdir -p $TARGET_DIR/usr/local/addons/eufySecurity
    cp -a $WORK_DIR/eufySecurity-addon.cfg $TARGET_DIR/usr/local/addons/eufySecurity
    cp -a $WORK_DIR/VERSION $TARGET_DIR/usr/local/addons/eufySecurity
    cp -a $WORK_DIR/eufySecurity/* $TARGET_DIR/usr/local/addons/eufySecurity
    cp -a $CURRENT_DIR/AddOnData/debmatic/* $TARGET_DIR

    for file in $TARGET_DIR/DEBIAN/*
    do
        DEPENDS="Pre-Depends: debmatic (>= 3.67.10-100)"
        #DEPENDS="$DEPENDS, tcl8.6"

        sed -i "s/{PKG_VERSION}/$PKG_VERSION_DEB_MAIN-$PKG_VERSION_DEB_ADD/g" $file
        sed -i "s/{PKG_ARCH}/$ARCH/g" $file
        sed -i "s/{DEPENDS}/$DEPENDS/g" $file
    done

    dpkg-deb --build $WORK_DIR/eufySecurity-$ARCH-$PKG_VERSION $CURRENT_DIR/build/$PKG_VERSION/eufySecurity-$ARCH-$PKG_VERSION.deb >> /dev/null
    rm -rf $TARGET_DIR

    echo "  ...done."
    cd $CURRENT_DIR
    echo "...done."
done

echo "Removing tmp directory."
rm -rf $WORK_DIR
echo "Done creating addon packages. Exiting."