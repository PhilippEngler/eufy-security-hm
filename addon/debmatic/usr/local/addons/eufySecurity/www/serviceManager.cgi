#!/bin/tclsh
cd [file dirname [info script]]

source assets/dist/tcl/serviceHelper.tcl
source assets/dist/tcl/fileHelper.tcl
source assets/dist/tcl/queryHelper.tcl

set querystring $env(QUERY_STRING)
array set queryStringParams [getParametersFromQueryString $querystring]

set filePathLogfile /var/log/eufySecurity.log
set filePathErrfile /var/log/eufySecurity.err
set filePathClientlLogfile /var/log/eufySecurityClient.log

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
			if {$queryStringParams(deleteLogfile) == "true"} {
				deleteFile [getFilePath log]
			}
			if {$queryStringParams(deleteErrfile) == "true"} {
				deleteFile [getFilePath err]
			}
			if {$queryStringParams(deleteClientLogfile) == "true"} {
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
			if {$queryStringParams(deleteLogfile) == "true"} {
				deleteFile [getFilePath log]
			}
			if {$queryStringParams(deleteErrfile) == "true"} {
				deleteFile [getFilePath err]
			}
			if {$queryStringParams(deleteClientLogfile) == "true"} {
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
		if {[array size queryStringParams] == 4} {
			set res [stopService]
			if {$res == 1} {
				puts \{"success":false,"reason":"The\ service\ could\ not\ been\ stopped."\}
				return
			} elseif {$res != 0 && $res != -1} {
				puts \{"success":false,"reason":"The\ return\ value\ is\ unknown\ (got:\ '$res')."\}
				return
			}
			if {$queryStringParams(deleteLogfile) == "true"} {
				deleteFile [getFilePath log]
			}
			if {$queryStringParams(deleteErrfile) == "true"} {
				deleteFile [getFilePath err]
			}
			if {$queryStringParams(deleteClientLogfile) == "true"} {
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