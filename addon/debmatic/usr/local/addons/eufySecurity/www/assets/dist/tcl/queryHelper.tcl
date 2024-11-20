#!/usr/bin/tclsh

proc getParametersFromQueryString {queryString} {
    array set parameters {}
    foreach item [split $queryString "&"] {
        if {[regexp {^([^=]+)=(.*)$} $item -> key value]} {
            set parameters([decodeValue $key]) [decodeValue $value]
        }
    }
    return [array get parameters]
}
proc decodeValue {string} {
    set mapped [string map [list + { } "\\" "\\\\"] $string]
    regsub -all {(%[0-9A-Fa-f0-9]{2})+} $mapped {[utf8 \0]} mapped
    return [subst -novar -noback $mapped]
}