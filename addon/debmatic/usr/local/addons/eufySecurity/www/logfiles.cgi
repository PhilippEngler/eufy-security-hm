#!/bin/tclsh
cd [file dirname [info script]]

source assets/dist/tcl/fileHelper.tcl
source assets/dist/tcl/dateHelper.tcl
source assets/dist/tcl/queryHelper.tcl

if {[info exists env(QUERY_STRING)] && $env(QUERY_STRING) != "" && $argc == 0} {
	array set queryStringParams [getParametersFromQueryString $env(QUERY_STRING)]
} elseif {$argc > 0} {
	puts "Content-Type: application/json; charset=utf-8"
	puts ""
	puts \{"success":false,"reason":"Detected\ arguments.\ This\ script\ can\ not\ handle\ arguments."\}
	return
} else {
	puts "Content-Type: application/json; charset=utf-8"
	puts ""
	puts \{"success":false,"reason":"Could\ not\ detect\ querystring."\}
	return
}

if {![info exists queryStringParams(action)]} {
	puts "Content-Type: application/json; charset=utf-8"
	puts ""
	puts \{"success":false,"reason":"Could\ not\ detect\ value\ 'action'\ in\ querystring."\}
	return
}

if {![info exists queryStringParams(file)]} {
	puts "Content-Type: application/json; charset=utf-8"
	puts ""
	puts \{"success":false,"reason":"Could\ not\ detect\ value\ 'file'\ in\ querystring."\}
	return
}

if {[array size queryStringParams] == 2} {
	switch $queryStringParams(file) {
		log -
		err -
		clientLog -
		installLog {
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
			installLog {
				puts "Content-Disposition: attachment; filename=install_${host}_${currentDate}.log"
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
			clientLog -
			installLog {
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