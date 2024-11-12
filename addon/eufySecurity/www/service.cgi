#!/bin/tclsh
cd [ file dirname [ file normalize [ info script ] ] ]

source assets/dist/tcl/serviceHelper.tcl
source assets/dist/tcl/fileHelper.tcl

set querystring $env(QUERY_STRING)
set querystringarray [split $querystring "&"]

set filePathLogfile /var/log/eufySecurity.log
set filePathErrfile /var/log/eufySecurity.err
set filePathClientlLogfile /var/log/eufySecurityClient.log

puts "Content-Type: application/json; charset=utf-8"
puts ""

if {[llength $querystringarray] == 1} {
    if {[lindex $querystringarray 0] == "getServiceState"} {
        set res [getServiceState]
        if {$res == 0} {
            puts \{"success":true,"running":false\}
        } elseif {$res == "1"} {
            puts \{"success":true,"running":true\}
        } else {
            puts \{"success":false,"reason":"The\ service\ state\ is\ unknown\ (got:\ '$res')."\}
        }
    }
} elseif {[llength $querystringarray] == 4} {
	if {[lindex $querystringarray 0] == "startService"} {
		if {[lindex $querystringarray 1] == "1"} {
            deleteFile $filePathLogfile
		}
		if {[lindex $querystringarray 2] == "1"} {
			deleteFile $filePathErrfile
		}
		if {[lindex $querystringarray 3] == "1"} {
			deleteFile $filePathClientlLogfile
		}
		set res [startService]
		if {$res == "-1"} {
			puts \{"success":false,"reason":"The\ service\ is\ already\ running."\}
		} elseif {$res == "0"} {
			puts \{"success":false,"reason":"The\ service\ could\ not\ been\ started."\}
		} elseif {$res == "1"} {
			puts \{"success":true\}
		} else {
			puts \{"success":false,"reason":"The\ return\ value\ is\ unknown\ (got:\ '$res')."\}
		}
	} elseif {[lindex $querystringarray 0] == "stopService"} {
		if {[lindex $querystringarray 1] == "1"} {
			puts log
			#deleteFile $filePathLogfile
		}
		if {[lindex $querystringarray 2] == "1"} {
			puts log
			#deleteFile $filePathErrfile
		}
		if {[lindex $querystringarray 3] == "1"} {
			puts log
			#deleteFile $filePathClientlLogfile
		}
		set res [stopService]
        if {$res == "-1"} {
			puts \{"success":false,"reason":"The\ service\ is\ already\ stopped."\}
		} elseif {$res == "0"} {
			puts \{"success":true\}
		} elseif {$res == "1"} {
			puts \{"success":false,"reason":"The\ service\ could\ not\ been\ stopped."\}
		} else {
			puts \{"success":false,"reason":"The\ return\ value\ is\ unknown\ (got:\ '$res')."\}
		}
	} elseif {[lindex $querystringarray 0] == "restartService"} {
		set res [stopService]
		if {$res == "1"} {
			puts \{"success":false,"reason":"The\ service\ could\ not\ been\ stopped."\}
			return
		} elseif {$res != "-1"} {
			puts \{"success":false,"reason":"The\ return\ value\ is\ unknown\ (got:\ '$res')."\}
			return
		}
		if {[lindex $querystringarray 1] == "1"} {
			puts log
			#deleteFile $filePathLogfile
		}
		if {[lindex $querystringarray 2] == "1"} {
			puts log
			#deleteFile $filePathErrfile
		}
		if {[lindex $querystringarray 3] == "1"} {
			puts log
			#deleteFile $filePathClientlLogfile
		}
		set res [startService]
		if {$res == "-1"} {
			puts \{"success":false,"reason":"The\ service\ is\ already\ running."\}
		} elseif {$res == "0"} {
			puts \{"success":false,"reason":"The\ service\ could\ not\ been\ started."\}
		} elseif {$res == "1"} {
			puts \{"success":true\}
		} else {
			puts \{"success":false,"reason":"The\ return\ value\ is\ unknown\ (got:\ '$res')."\}
		}
	} else {
		puts \{"success":false,"reason":"The\ command\ is\ unknown\ (got:\ '[lindex $querystringarray 0]')."\}
	}
} else {
	puts \{"success":false,"reason":"The\ number\ of\ arguments\ is\ incorrect\ (got:\ [llength $querystringarray])."\}
}