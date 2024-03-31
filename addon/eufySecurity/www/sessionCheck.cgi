#!/bin/tclsh
#adapted from jens-maus (https://github.com/homematic-community/hm_pdetect/blob/6e77c59d403087d63e00e6affd3d9e2653fc332e/addon/www/inc/session.tcl)
cd [ file dirname [ file normalize [ info script ] ] ]

source assets/dist/tcl/sessionHelper.tcl

if { $argc == 1 } {
    variable sid $argv

    if {[check_session $sid]} {
        puts 1
    } else {
        puts 0
    }
} else {
    puts -1
}