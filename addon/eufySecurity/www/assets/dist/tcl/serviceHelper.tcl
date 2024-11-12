#!/usr/bin/tclsh

proc getServicePath { } {
    return /usr/local/etc/config/rc.d/eufySecurity
}

# returns 0 for stopped, 1 for running and -1 for unknown
proc getServiceState { } {
    set servicePath [ getServicePath ]

    if { [ file exist $servicePath ] } {
        catch {
            set serviceState [ exec $servicePath status ]
        } serviceState
        regsub {\nchild\ process\ exited\ abnormally$} $serviceState {} serviceState
        if { [ string match "Running" $serviceState ] } {
            return 1
        } elseif { [ string match "Stopped" $serviceState ] } {
            return 0
        } else {
            return -1
        }
    } else {
        set serviceState ""
        catch {
            set serviceState [ exec systemctl status eufySecurity.service ]
        } serviceState
        regsub {\nchild\ process\ exited\ abnormally$} $serviceState {} serviceState
        if { [ string match "*Started eufySecurity.service - eufySecurity." $serviceState ] } {
            return 1
        } elseif { [ string match "*s CPU time." $serviceState ] } {
            return 0
        } else {
            return -1
        }
    }
}

# returns the state of the service after the command: 0 for stopped, 1 for running and -1 for unknown
proc startService { } {
    set servicePath [ getServicePath ]
    set serviceState [ getServiceState ]

    if { $serviceState == "1" } {
        return -1
    }
    
    if { [ file exist $servicePath ] } {
        exec $servicePath start
    } else {
        exec systemctl start eufySecurity.service
    }
    return [ getServiceState ]
}

# returns the state of the service after the command: 0 for stopped, 1 for running and -1 for unknown
proc stopService { } {
    set servicePath [ getServicePath ]
    set serviceState [ getServiceState ]

    if { $serviceState == "0" } {
        return -1
    }
    
    if { [ file exist $servicePath ] } {
        exec $servicePath stop
    } else {
        exec systemctl stop eufySecurity.service
    }
    return [ getServiceState ]
}

# returns the state of the service after the command: 0 for stopped, 1 for running and -1 for unknown
proc restartService { } {
    set servicePath [ getServicePath ]
    
    if { [ file exist  $servicePath ] } {
        exec $servicePath restart
    } else {
        exec systemctl restart eufySecurity.service
    }
    return [ getServiceState ]
}