#!/usr/bin/tclsh

proc getDateTimeString {} {
    set currentTime [clock seconds]
    
    return [clock format $currentTime -format %Y%m%d_%H%M%S]
}