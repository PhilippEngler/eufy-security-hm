#!/usr/bin/tclsh

proc existFile {filePath} {
    if {[file exist $filePath]} {
        return true
    } else {
        return false
    }
}

proc getFileContent {filePath} {
    set fileData ""
    set filePointer -1
    
    if {![file exist $filePath] || [catch {open $filePath r} filePointer]} {
        set fileData "-1"
    } else {
        set fileData [read $filePointer]
        close $filePointer
    }
    
    return $fileData
}

proc emptyFile {filePath} {
    if {![file exist $filePath] || [catch {open $filePath r+} filePointer]} {
        return false
    } else {
        chan truncate $filePointer 0
        close $filePointer
        return true
    }
}

proc deleteFile {filePath} {
    file delete $filePath
    return true
}

proc init {} {
    variable replaceMap
    # characters that should not be replaced
    variable charsNotReplace a-zA-Z0-9
    for {set i 0} {$i <= 256} {incr i} { 
        set c [format %c $i]
        if {![string match \[$charsNotReplace\] $c]} {
            set replaceMap($c) %[format %.2X $i]
        }
    }
    # characters that should be replaced with a special value
    array set replaceMap {" " %20 \n %0A}
}

proc urlEncode {string} {
    init
    variable replaceMap
    variable charsNotReplace

    regsub -all \[^$charsNotReplace\] $string {$replaceMap(&)} string
    regsub -all {[][{})\\]\)} $string {\\&} string
    return [subst -nocommand $string]
}