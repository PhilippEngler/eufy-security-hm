#!/usr/bin/tclsh

proc getParametersFromQueryString {queryString} {
    set parameters {}
    foreach item [split $queryString "&"] {
        if {[regexp {^([^=]+)=(.*)$} $item -> key value]} {
            dict set parameters [decodeValue $key] [decodeValue $value]
        }
    }
    return $parameters
}
proc decodeValue {string} {
    set mapped [string map [list + { } "\\" "\\\\"] $string]
    regsub -all {(%[0-9A-Fa-f0-9]{2})+} $mapped {[utf8 \0]} mapped
    return [subst -novar -noback $mapped]
}