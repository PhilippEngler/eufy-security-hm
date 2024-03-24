#!/bin/tclsh
cd [ file dirname [ file normalize [ info script ] ] ]

source assets/dist/tcl/fileHelper.tcl

set res [emptyFile /var/log/eufySecurity.err]

puts "Content-Type: application/json; charset=utf-8"
puts ""
if {$res == true} {
	puts \{"success":true\}
} else {
	puts \{"success":false\}
}