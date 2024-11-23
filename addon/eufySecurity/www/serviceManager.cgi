#!/bin/tclsh
cd [file dirname [file normalize [info script]]]

source assets/dist/tcl/serviceHelper.tcl
source assets/dist/tcl/fileHelper.tcl
source assets/dist/tcl/queryHelper.tcl

if {[info exists env(QUERY_STRING)] && $env(QUERY_STRING) != "" && $argc == 0} {
	set queryStringParams [getParametersFromQueryString $env(QUERY_STRING)]
} elseif {[info exists argv] && $argc == 1} {
	set queryStringParams [getParametersFromQueryString [lindex $argv 0]]
} else {
	puts "Content-Type: application/json; charset=utf-8"
	puts ""
	puts \{"success":false,"reason":"Could\ not\ detect\ querystring\ or\ arguments."\}
	return
}

if {![dict exists $queryStringParams action]} {
	puts "Content-Type: application/json; charset=utf-8"
	puts ""
	puts \{"success":false,"reason":"Could\ not\ detect\ value\ 'action'\ in\ querystring\ or\ arguments."\}
	return
}

puts "Content-Type: application/json; charset=utf-8"
puts ""

switch [dict get $queryStringParams action] {
	getServiceVersion {
		if {[dict size $queryStringParams] == 1} {
			set res [getServiceVersion]
			if {$res != -1} {
				puts \{"success":true,"version":"$res"\}
				return
			} else {
				puts \{"success":false,"reason":"The\ file\ does\ not\ exists."\}
				return
			}
		}
	}
	getServiceState {
		if {[dict size $queryStringParams] == 1} {
			set res [getServiceState]
			if {$res == 0} {
				puts \{"success":true,"running":false\}
				return
			} elseif {$res == 1} {
				puts \{"success":true,"running":true\}
				return
			} else {
				puts \{"success":false,"reason":"The\ service\ state\ is\ unknown\ (got:\ '$res')."\}
				return
			}
		}
	}
	startService {
		if {[dict size $queryStringParams] == 4} {
			if {[dict exists $queryStringParams deleteLogfile] && [dict get $queryStringParams deleteLogfile] == "true"} {
				deleteFile [getFilePath log]
			}
			if {[dict exists $queryStringParams deleteErrfile] && [dict get $queryStringParams deleteErrfile] == "true"} {
				deleteFile [getFilePath err]
			}
			if {[dict exists $queryStringParams deleteClientLogfile] && [dict get $queryStringParams deleteClientLogfile] == "true"} {
				deleteFile [getFilePath clientLog]
			}
			set res [startService]
			if {$res == -1} {
				puts \{"success":false,"reason":"The\ service\ is\ already\ running."\}
				return
			} elseif {$res == 0} {
				puts \{"success":false,"reason":"The\ service\ could\ not\ been\ started."\}
				return
			} elseif {$res == 1} {
				puts \{"success":true\}
				return
			} else {
				puts \{"success":false,"reason":"The\ return\ value\ is\ unknown\ (got:\ '$res')."\}
				return
			}
		}
	}
	stopService {
		if {[dict size $queryStringParams] == 4} {
			set res [stopService]
			if {[dict exists $queryStringParams deleteLogfile] && [dict get $queryStringParams deleteLogfile] == "true"} {
				deleteFile [getFilePath log]
			}
			if {[dict exists $queryStringParams deleteErrfile] && [dict get $queryStringParams deleteErrfile] == "true"} {
				deleteFile [getFilePath err]
			}
			if {[dict exists $queryStringParams deleteClientLogfile] && [dict get $queryStringParams deleteClientLogfile] == "true"} {
				deleteFile [getFilePath clientLog]
			}
			if {$res == -1} {
				puts \{"success":false,"reason":"The\ service\ is\ already\ stopped."\}
				return
			} elseif {$res == 0} {
				puts \{"success":true\}
				return
			} elseif {$res == 1} {
				puts \{"success":false,"reason":"The\ service\ could\ not\ been\ stopped."\}
				return
			} else {
				puts \{"success":false,"reason":"The\ return\ value\ is\ unknown\ (got:\ '$res')."\}
				return
			}
		}
	}
	restartService {
		if {[dict size $queryStringParams] == 4} {
			set res [stopService]
			if {$res == 1} {
				puts \{"success":false,"reason":"The\ service\ could\ not\ been\ stopped."\}
				return
			} elseif {$res != 0 && $res != -1} {
				puts \{"success":false,"reason":"The\ return\ value\ is\ unknown\ (got:\ '$res')."\}
				return
			}
			if {[dict exists $queryStringParams deleteLogfile] && [dict get $queryStringParams deleteLogfile] == "true"} {
				deleteFile [getFilePath log]
			}
			if {[dict exists $queryStringParams deleteErrfile] && [dict get $queryStringParams deleteErrfile] == "true"} {
				deleteFile [getFilePath err]
			}
			if {[dict exists $queryStringParams deleteClientLogfile] && [dict get $queryStringParams deleteClientLogfile] == "true"} {
				deleteFile [getFilePath clientLog]
			}
			set res [startService]
			if {$res == -1} {
				puts \{"success":false,"reason":"The\ service\ is\ already\ running."\}
				return
			} elseif {$res == 0} {
				puts \{"success":false,"reason":"The\ service\ could\ not\ been\ started."\}
				return
			} elseif {$res == 1} {
				puts \{"success":true\}
				return
			} else {
				puts \{"success":false,"reason":"The\ return\ value\ is\ unknown\ (got:\ '$res')."\}
				return
			}
		}
	}
	default {
		puts \{"success":false,"reason":"The\ command\ is\ unknown\ (got:\ '[dict get $queryStringParams action]')."\}
		return
	}
}
puts \{"success":false,"reason":"The\ number\ of\ arguments\ is\ incorrect\ (got:\ [dict size $queryStringParams])."\}