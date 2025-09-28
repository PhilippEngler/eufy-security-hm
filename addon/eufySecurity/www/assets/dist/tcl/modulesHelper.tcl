#!/usr/bin/tclsh

proc getModulesInstalled {} {
    set res [catch {exec -ignorestderr /usr/local/addons/eufySecurity/bin/nodejs/bin/npm list --omit=dev --json} result]
    if {$res == 0} {
        return [string trim $result]
    } else {
        return [string trim $result "child process exited abnormally"]
    }
}

proc checkModulesOutdated {} {
    set res [catch {exec -ignorestderr /usr/local/addons/eufySecurity/bin/nodejs/bin/npm outdated --omit=dev --json} result]
    if {$res == 0} {
        return [string trim $result]
    } else {
        return [string trim $result "child process exited abnormally"]
    }
}

proc updateModules {} {
    set res [catch {exec /usr/local/addons/eufySecurity/bin/nodejs/bin/npm update --omit=dev --json} result]
    if {$res == 0} {
        return [string trim $result]
    } else {
        return [string trim $result "child process exited abnormally"]
    }
}