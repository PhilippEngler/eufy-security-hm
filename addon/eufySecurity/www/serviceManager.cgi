#!/bin/tclsh
cd [file dirname [file normalize [info script]]]

source assets/dist/tcl/serviceHelper.tcl
source assets/dist/tcl/fileHelper.tcl
source assets/dist/tcl/queryHelper.tcl

set querystring $env(QUERY_STRING)
set queryStringParams [getParametersFromQueryString $querystring]

set filePathLogfile /var/log/eufySecurity.log
set filePathErrfile /var/log/eufySecurity.err
set filePathClientlLogfile /var/log/eufySecurityClient.log

puts "Content-Type: application/json; charset=utf-8"
puts ""

switch [dict get $queryStringParams action] {
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
			if {[dict get $queryStringParams deleteLogfile] == "true"} {
				deleteFile $filePathLogfile
			}
			if {[dict get $queryStringParams deleteErrfile] == "true"} {
				deleteFile $filePathErrfile
			}
			if {[dict get $queryStringParams deleteClientLogfile] == "true"} {
				deleteFile $filePathClientlLogfile
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
			if {[dict get $queryStringParams deleteLogfile] == "true"} {
				deleteFile $filePathLogfile
			}
			if {[dict get $queryStringParams deleteErrfile] == "true"} {
				deleteFile $filePathErrfile
			}
			if {[dict get $queryStringParams deleteClientLogfile] == "true"} {
				deleteFile $filePathClientlLogfile
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
			if {[dict get $queryStringParams deleteLogfile] == "true"} {
				deleteFile $filePathLogfile
			}
			if {[dict get $queryStringParams deleteErrfile] == "true"} {
				deleteFile $filePathErrfile
			}
			if {[dict get $queryStringParams deleteClientLogfile] == "true"} {
				deleteFile $filePathClientlLogfile
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