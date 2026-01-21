$pythonProcs = Get-WmiObject Win32_Process | Where-Object { $_.CommandLine -like '*app.py*' }
if ($pythonProcs) {
    Write-Host "Found backend processes. Terminating..."
    $pythonProcs | ForEach-Object { 
        Write-Host "Killing Process ID: $($_.ProcessId)"
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }
} else {
    Write-Host "No running backend found."
}

$nodeProcs = Get-WmiObject Win32_Process | Where-Object { $_.CommandLine -like '*vite*' }
if ($nodeProcs) {
    Write-Host "Found frontend processes. Terminating..."
    $nodeProcs | ForEach-Object { 
        Write-Host "Killing Process ID: $($_.ProcessId)"
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }
} else {
    Write-Host "No running frontend found."
}
