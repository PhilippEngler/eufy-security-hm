#!/bin/tclsh
cd [file dirname [info script]]

source assets/dist/tcl/fileHelper.tcl
source assets/dist/tcl/dateHelper.tcl

set querystring $env(QUERY_STRING)
set querystringarray [split $querystring "&"]

if {[llength $querystringarray] == 2} {
	if {[lindex $querystringarray 1] == "log"} {
		set fileExists [existFile /var/log/eufySecurity.log]
		set fileContent [getFileContent /var/log/eufySecurity.log]
	} elseif {[lindex $querystringarray 1] == "err"} {
		set fileExists [existFile /var/log/eufySecurity.err]
		set fileContent [getFileContent /var/log/eufySecurity.err]
	} elseif {[lindex $querystringarray 1] == "clientLog"} {
		set fileExists [existFile /var/log/eufySecurityClient.log]
		set fileContent [getFileContent /var/log/eufySecurityClient.log]
	} else {
		puts "Content-Type: application/json; charset=utf-8"
		puts ""
		puts \{"success":false,"reason":"The\ subcommand\ is\ unknown\ (got:\ '[lindex $querystringarray 1]')."\}
		return
	}

	if {[lindex $querystringarray 0] == "getContent"} {
		puts "Content-Type: application/json; charset=utf-8"
		puts ""
		if {$fileExists == "false"} {
			puts \{"success":false,"reason":"The\ file\ does\ not\ exists."\}
		} elseif {$fileContent == ""} {
			puts \{"success":true,"hasData":false\}
		} elseif {$fileContent == "-1"} {
			puts \{"success":false,"reason":"Error\ handling\ file."\}
		} else {
			puts \{"success":true,"hasData":true,"data":"[urlEncode $fileContent]"\}
		}
	} elseif {[lindex $querystringarray 0] == "download"} {
		set host [info hostname]
		set currentDate [getDateTimeString]
		puts "Content-Type: text/plain; charset=utf-8"
		if {[lindex $querystringarray 1] == "log"} {
			puts "Content-Disposition: attachment; filename=eufySecurity_${host}_${currentDate}.log"
		} elseif {[lindex $querystringarray 1] == "err"} {
			puts "Content-Disposition: attachment; filename=eufySecurity_${host}_${currentDate}.err"
		} elseif {[lindex $querystringarray 1] == "clientLog"} {
			puts "Content-Disposition: attachment; filename=eufySecurity_${host}_${currentDate}_client.log"
		}
		puts ""
		if {$fileContent != "" && $fileContent != "-1"} {
			puts $fileContent
		} else {
			puts ""
		}
	} elseif {[lindex $querystringarray 0] == "emptyFile"} {
		if {[lindex $querystringarray 1] == "log"} {
			set res [emptyFile /var/log/eufySecurity.log]
		} elseif {[lindex $querystringarray 1] == "err"} {
			set res [emptyFile /var/log/eufySecurity.err]
		} elseif {[lindex $querystringarray 1] == "clientLog"} {
			set res [emptyFile /var/log/eufySecurityClient.log]
		}

		puts "Content-Type: application/json; charset=utf-8"
		puts ""
		if {$res == "true"} {
			puts \{"success":true\}
		} else {
			puts \{"success":false\}
		}
	} else {
		puts "Content-Type: application/json; charset=utf-8"
		puts ""
		puts \{"success":false,"reason":"The\ command\ is\ unknown\ (got:\ '[lindex $querystringarray 0]')."\}
	}
} else {
	puts "Content-Type: application/json; charset=utf-8"
	puts ""
	puts \{"success":false,"reason":"The\ number\ of\ arguments\ is\ incorrect\ (got:\ [llength $querystringarray])."\}
}