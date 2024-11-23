#!/bin/tclsh
cd [file dirname [info script]]

source assets/dist/tcl/serviceHelper.tcl
source assets/dist/tcl/fileHelper.tcl
source assets/dist/tcl/queryHelper.tcl

if {[info exists env(QUERY_STRING)] && $env(QUERY_STRING) != "" && $argc == 0} {
	set querystring $env(QUERY_STRING)
} elseif {[info exists argv] && $argc == 1} {
	set querystring [lindex $argv 0]
} else {
	puts "Content-Type: application/json; charset=utf-8"
	puts ""
	puts \{"success":false,"reason":"Could\ not\ detect\ querystring\ or\ arguments."\}
	return
}

array set queryStringParams [getParametersFromQueryString $querystring]

if {![info exists queryStringParams(action)]} {
	puts "Content-Type: application/json; charset=utf-8"
	puts ""
	puts \{"success":false,"reason":"Could\ not\ detect\ value\ 'action'\ in\ querystring\ or\ arguments."\}
	return
}

puts "Content-Type: application/json; charset=utf-8"
puts ""

switch $queryStringParams(action) {
	getServiceVersion {
		if {[array size queryStringParams] == 1} {
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
		if {[array size queryStringParams] == 1} {
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
		if {[array size queryStringParams] == 4} {
			if {[info exists queryStringParams(deleteLogfile)] && $queryStringParams(deleteLogfile) == "true"} {
				deleteFile [getFilePath log]
			}
			if {[info exists queryStringParams(deleteErrfile)] && $queryStringParams(deleteErrfile) == "true"} {
				deleteFile [getFilePath err]
			}
			if {[info exists queryStringParams(deleteClientLogfile)] && $queryStringParams(deleteClientLogfile) == "true"} {
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
		if {[array size queryStringParams] == 4} {
			set res [stopService]
			if {[info exists queryStringParams(deleteLogfile)] && $queryStringParams(deleteLogfile) == "true"} {
				deleteFile [getFilePath log]
			}
			if {[info exists queryStringParams(deleteErrfile)] && $queryStringParams(deleteErrfile) == "true"} {
				deleteFile [getFilePath err]
			}
			if {[info exists queryStringParams(deleteClientLogfile)] && $queryStringParams(deleteClientLogfile) == "true"} {
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
		if {[array size queryStringParams] == 1} {
			set res [restartService]
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
		} elseif {[array size queryStringParams] == 4} {
			set res [stopService]
			if {$res == 1} {
				puts \{"success":false,"reason":"The\ service\ could\ not\ been\ stopped."\}
				return
			} elseif {$res != 0 && $res != -1} {
				puts \{"success":false,"reason":"The\ return\ value\ is\ unknown\ (got:\ '$res')."\}
				return
			}
			if {[info exists queryStringParams(deleteLogfile)] && $queryStringParams(deleteLogfile) == "true"} {
				deleteFile [getFilePath log]
			}
			if {[info exists queryStringParams(deleteErrfile)] && $queryStringParams(deleteErrfile) == "true"} {
				deleteFile [getFilePath err]
			}
			if {[info exists queryStringParams(deleteClientLogfile)] && $queryStringParams(deleteClientLogfile) == "true"} {
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
		puts \{"success":false,"reason":"The\ command\ is\ unknown\ (got:\ '$queryStringParams(action)')."\}
		return
	}
}
puts \{"success":false,"reason":"The\ number\ of\ arguments\ is\ incorrect\ (got:\ [array size queryStringParams])."\}