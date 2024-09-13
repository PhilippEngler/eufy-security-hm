#!/bin/tclsh
cd [ file dirname [ file normalize [ info script ] ] ]

source assets/dist/tcl/fileHelper.tcl

set fileExists [existFile /var/log/eufySecurity.log]
set fileContent [getFileContent /var/log/eufySecurity.err]

puts "Content-Type: application/json; charset=utf-8"
puts ""
if {$fileExists == false} {
	puts \{"success":false,"reason":"The\ file\ does\ not\ exists."\}
} elseif {$fileContent == ""} {
	puts \{"success":true,"hasData":false\}
} elseif {$fileContent == "-1"} {
	puts \{"success":false,"reason":"Error\ handling\ file."\}
} else {
	puts \{"success":true,"hasData":true,"data":"[urlEncode $fileContent]"\}
}