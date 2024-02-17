#!/bin/tclsh
source assets/dist/tcl/fileHelper.tcl
source assets/dist/tcl/dateHelper.tcl

set fileContent [getFileContent /var/log/eufySecurityClient.log]
set currentDate [getDateTimeString]

set host [info hostname]

puts "Content-Type: text/plain; charset=utf-8"
puts "Content-Disposition: attachment; filename=eufySecurity_${host}_${currentDate}_client.log"
puts ""

if {$fileContent != "" && $fileContent != "-1"} {
	puts $fileContent
} else {
	puts ""
}