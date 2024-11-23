#!/bin/tclsh
cd [file dirname [info script]]

source assets/dist/tcl/fileHelper.tcl
source assets/dist/tcl/dateHelper.tcl
source assets/dist/tcl/queryHelper.tcl

set querystring $env(QUERY_STRING)
array set queryStringParams [getParametersFromQueryString $querystring]

if {[array size queryStringParams] == 2} {
	switch $queryStringParams(file) {
		log -
		err -
		clientLog {
			set fileExists [existFile [getFilePath $queryStringParams(file)]]
			set fileContent [getFileContent [getFilePath $queryStringParams(file)]]
		}
		default {
			puts "Content-Type: application/json; charset=utf-8"
			puts ""
			puts \{"success":false,"reason":"The\ subcommand\ is\ unknown\ (got:\ '$queryStringParams(file)')."\}
			return
		}
	}
} else {
	puts \{"success":false,"reason":"The\ number\ of\ arguments\ is\ incorrect\ (got:\ [array size queryStringParams])."\}
	return
}

switch $queryStringParams(action) {
	getcontent {
		puts "Content-Type: application/json; charset=utf-8"
		puts ""
		if {$fileExists == "false"} {
			puts \{"success":false,"reason":"The\ file\ does\ not\ exists."\}
		} elseif {$fileContent == ""} {
			puts \{"success":true,"hasData":false\}
		} elseif {$fileContent == -1} {
			puts \{"success":false,"reason":"Error\ handling\ file."\}
		} else {
			puts \{"success":true,"hasData":true,"data":"[urlEncode $fileContent]"\}
		}
	}
	download {
		set host [info hostname]
		set currentDate [getDateTimeString]
		puts "Content-Type: text/plain; charset=utf-8"
		switch $queryStringParams(file) {
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
		if {$fileContent != "" && $fileContent != -1} {
			puts $fileContent
		} else {
			puts ""
		}
	}
	emptyfile {
		switch $queryStringParams(file) {
			log -
			err -
			clientLog {
				set res [emptyFile [getFilePath $queryStringParams(file)]]
			}
		}
		puts "Content-Type: application/json; charset=utf-8"
		puts ""
		if {$res == "true"} {
			puts \{"success":true\}
		} else {
			puts \{"success":false\}
		}
	}
	default {
		puts "Content-Type: application/json; charset=utf-8"
		puts ""
		puts \{"success":false,"reason":"The\ command\ is\ unknown\ (got:\ '$queryStringParams(action)')."\}
	}
}