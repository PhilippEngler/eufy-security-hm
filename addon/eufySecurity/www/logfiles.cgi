#!/bin/tclsh
cd [file dirname [file normalize [info script]]]

source assets/dist/tcl/fileHelper.tcl
source assets/dist/tcl/dateHelper.tcl
source assets/dist/tcl/queryHelper.tcl

set querystring $env(QUERY_STRING)
set queryStringParams [getParametersFromQueryString $querystring]

if {[dict size $queryStringParams] == 2} {
	switch [dict get $queryStringParams file] {
		log -
		err -
		clientLog {
			set fileExists [existFile [getFilePath [dict get $queryStringParams file]]]
			set fileContent [getFileContent [getFilePath [dict get $queryStringParams file]]]
		}
		default {
			puts "Content-Type: application/json; charset=utf-8"
			puts ""
			puts \{"success":false,"reason":"The\ subcommand\ is\ unknown\ (got:\ '[dict get $queryStringParams file]')."\}
			return
		}
	}
} else {
	puts "Content-Type: application/json; charset=utf-8"
	puts ""
	puts \{"success":false,"reason":"The\ number\ of\ arguments\ is\ incorrect\ (got:\ [dict size $queryStringParams])."\}
	return
}

switch [dict get $queryStringParams action] {
	getcontent {
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
	}
	download {
		set host [info hostname]
		set currentDate [getDateTimeString]
		puts "Content-Type: text/plain; charset=utf-8"
		if {$fileContent != "" && $fileContent != -1} {
			switch [dict get $queryStringParams file] {
				log {
					puts "Content-Disposition: attachment; filename=eufySecurity_${host}_${currentDate}.log"
				}
				err {
					puts "Content-Disposition: attachment; filename=eufySecurity_${host}_${currentDate}.err"
				}
				clientLog {
					puts "Content-Disposition: attachment; filename=eufySecurity_${host}_${currentDate}_client.log"
				}
			}
			puts ""
			puts $fileContent
		} else {
			puts "Content-Type: application/json; charset=utf-8"
			puts ""
			puts \{"success":false,"reason":"The\ file\ is\ not\ available."\}
		}
	}
	emptyfile {
		if {$fileContent != "" && $fileContent != -1} {
			switch [dict get $queryStringParams file] {
				log -
				err -
				clientLog {
					set res [emptyFile [getFilePath [dict get $queryStringParams file]]]
				}
			}
		} else {
			set res false
			set reason "The file is not available."
		}
		puts "Content-Type: application/json; charset=utf-8"
		puts ""
		if {$res == "true"} {
			puts \{"success":true\}
		} elseif {[info exists reason]} {
			puts \{"success":false\,"reason":"$reason"\}
		} else {
			puts \{"success":false\}
		}
	}
	default {
		puts "Content-Type: application/json; charset=utf-8"
		puts ""
		puts \{"success":false,"reason":"The\ command\ is\ unknown\ (got:\ '[dict get $queryStringParams action]')."\}
	}
}