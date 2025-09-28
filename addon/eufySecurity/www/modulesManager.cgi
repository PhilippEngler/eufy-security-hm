#!/bin/tclsh
cd /usr/local/addons/eufySecurity

source www/assets/dist/tcl/modulesHelper.tcl
source www/assets/dist/tcl/queryHelper.tcl

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
	getInstalledModules {
		if {[dict size $queryStringParams] == 1} {
			set res [getModulesInstalled]
			puts \{"success":true,"data":$res\}
			return
		}
	}
	getOutdatedModules {
		if {[dict size $queryStringParams] == 1} {
			set res [checkModulesOutdated]
			puts \{"success":true,"data":$res\}
			return
		}
	}
	default {
		puts \{"success":false,"reason":"The\ command\ is\ unknown\ (got:\ '[dict get $queryStringParams action]')."\}
		return
	}
}
puts \{"success":false,"reason":"The\ number\ of\ arguments\ is\ incorrect\ (got:\ [dict size $queryStringParams])."\}