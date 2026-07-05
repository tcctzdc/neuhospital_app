# Mini-program API smoke test (PowerShell)
# Usage:
#   .\scripts\test-miniprogram-apis.ps1
#   .\scripts\test-miniprogram-apis.ps1 -Username "13890000002" -Password "password123"
#   .\scripts\test-miniprogram-apis.ps1 -AccessToken "eyJ..."   # from DevTools Storage

param(
    [string]$BaseUrl = "http://127.0.0.1:8080/api",
    [string]$Username = "13890000001",
    [string]$Password = "password123",
    [string]$AccessToken = "",
    [switch]$RegisterIfLoginFails
)

$ErrorActionPreference = "Continue"
$pass = 0
$fail = 0
$skip = 0
$token = $null
$patientId = $null

function Write-Result($method, $path, $ok, $detail) {
    $icon = if ($ok -eq "PASS") { "[OK]  " } elseif ($ok -eq "SKIP") { "[SKIP]" } else { "[FAIL]" }
    if ($ok -eq "PASS") { $script:pass++ } elseif ($ok -eq "SKIP") { $script:skip++ } else { $script:fail++ }
    $color = if ($ok -eq "PASS") { "Green" } elseif ($ok -eq "SKIP") { "Yellow" } else { "Red" }
    Write-Host "$icon $method $path" -ForegroundColor $color
    if ($detail) { Write-Host "       $detail" -ForegroundColor Gray }
}

function Invoke-Api {
    param(
        [string]$Method = "GET",
        [string]$Path,
        [object]$Body = $null,
        [bool]$UseToken = $true,
        [bool]$SkipToken = $false
    )
    $uri = "$BaseUrl$Path"
    $headers = @{ "Content-Type" = "application/json" }
    if ($UseToken -and -not $SkipToken -and $token) {
        $headers["Authorization"] = "Bearer $token"
    }
    try {
        $params = @{
            Uri = $uri
            Method = $Method
            Headers = $headers
            TimeoutSec = 10
            UseBasicParsing = $true
        }
        if ($Body -ne $null -and $Method -ne "GET") {
            $params["Body"] = ($Body | ConvertTo-Json -Compress)
        }
        $resp = Invoke-WebRequest @params
        $text = $resp.Content
        if ([string]::IsNullOrWhiteSpace($text)) {
            return @{ Status = $resp.StatusCode; Ok = ($resp.StatusCode -eq 200); Raw = "(empty)" }
        }
        try {
            $json = $text | ConvertFrom-Json
            $ok = $false
            if ($json.PSObject.Properties.Name -contains "code") {
                $ok = ($json.code -eq 200)
            } elseif ($json.PSObject.Properties.Name -contains "accessToken") {
                $ok = $true
            } else {
                $ok = ($resp.StatusCode -eq 200)
            }
            return @{ Status = $resp.StatusCode; Ok = $ok; Body = $json; Raw = $text.Substring(0, [Math]::Min(150, $text.Length)) }
        } catch {
            return @{ Status = $resp.StatusCode; Ok = ($resp.StatusCode -eq 200); Body = $null; Raw = $text.Substring(0, [Math]::Min(150, $text.Length)) }
        }
    } catch {
        $status = 0
        $msg = $_.Exception.Message
        if ($_.Exception.Response) {
            $status = [int]$_.Exception.Response.StatusCode
            try {
                $sr = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
                $msg = $sr.ReadToEnd()
                if ($msg.Length -gt 150) { $msg = $msg.Substring(0, 150) + "..." }
            } catch {}
        }
        return @{ Status = $status; Ok = $false; Body = $null; Raw = $msg }
    }
}

function Test-Get($path) {
    $r = Invoke-Api -Method GET -Path $path
    if ($r.Ok) { Write-Result "GET" $path "PASS" $r.Raw }
    else { Write-Result "GET" $path "FAIL" "HTTP $($r.Status) $($r.Raw)" }
}

Write-Host ""
Write-Host "=== Mini-program API smoke test ===" -ForegroundColor Cyan
Write-Host "BaseUrl: $BaseUrl"
Write-Host ""

Write-Host "--- Auth ---" -ForegroundColor Cyan
if ($AccessToken) {
    $token = $AccessToken
    Write-Result "POST" "/auth/login" "PASS" "using -AccessToken"
} else {
$login = Invoke-Api -Method POST -Path "/auth/login" -Body @{ username = $Username; password = $Password } -SkipToken $true -UseToken $false
if (-not $login.Ok -and $RegisterIfLoginFails) {
    Write-Host "Login failed, trying register..." -ForegroundColor Yellow
    $phone = "138" + (Get-Random -Minimum 10000000 -Maximum 99999999)
    $null = Invoke-Api -Method POST -Path "/auth/register" -Body @{
        username = $Username; password = $Password; realName = "TestPatient"; phone = $phone; gender = "MALE"
    } -SkipToken $true -UseToken $false
    $login = Invoke-Api -Method POST -Path "/auth/login" -Body @{ username = $Username; password = $Password } -SkipToken $true -UseToken $false
}
if ($login.Body.accessToken) {
    $token = $login.Body.accessToken
    Write-Result "POST" "/auth/login" "PASS" "token ok"
} elseif ($login.Body.data.accessToken) {
    $token = $login.Body.data.accessToken
    Write-Result "POST" "/auth/login" "PASS" "token ok (wrapped)"
} else {
    Write-Result "POST" "/auth/login" "FAIL" $login.Raw
    Write-Host "Use your mini-program account, or -AccessToken from DevTools Storage." -ForegroundColor Red
}
}

if ($token) {
    $me = Invoke-Api -Method GET -Path "/auth/me"
    if ($me.Ok) {
        $data = if ($me.Body.data) { $me.Body.data } else { $me.Body }
        $patientId = $data.bizId
        Write-Result "GET" "/auth/me" "PASS" "patientId=$patientId"
    } else {
        Write-Result "GET" "/auth/me" "FAIL" $me.Raw
    }
}

Write-Host ""
Write-Host "--- Registration ---" -ForegroundColor Cyan
Test-Get "/departments"
Test-Get "/doctors/page?pageNo=1&pageSize=10"
Test-Get "/schedules?pageNo=1&pageSize=10"
Test-Get "/registrations/my"

Write-Host ""
Write-Host "--- Payment ---" -ForegroundColor Cyan
Test-Get "/payment/pending"

Write-Host ""
Write-Host "--- Records ---" -ForegroundColor Cyan
if ($patientId) {
    Test-Get "/outpatient/records?patientId=$patientId&pageNo=1&pageSize=10"
    Test-Get "/patients/$patientId"
    Test-Get "/prescriptions?patientId=$patientId&pageNo=1&pageSize=10"
    Test-Get "/check-requests?patientId=$patientId&pageNo=1&pageSize=10"
    Test-Get "/inspection-requests?patientId=$patientId&pageNo=1&pageSize=10"
} else {
    Write-Result "GET" "/outpatient/records" "SKIP" "no patientId"
}

Write-Host ""
Write-Host "--- AI ---" -ForegroundColor Cyan
if ($token) {
    $ai = Invoke-Api -Method POST -Path "/ai/chat/sessions" -Body @{ sessionType = "INQUIRY" }
    if ($ai.Ok) {
        $sess = if ($ai.Body.data) { $ai.Body.data } else { $ai.Body }
        $sessionNo = $sess.sessionNo
        if (-not $sessionNo) { $sessionNo = $sess.id }
        Write-Result "POST" "/ai/chat/sessions" "PASS" "sessionNo=$sessionNo"
        if ($sessionNo) {
            $msg = Invoke-Api -Method POST -Path "/ai/chat/sessions/$sessionNo/messages" -Body @{ content = "hello"; role = "USER" }
            if ($msg.Ok) { Write-Result "POST" "/ai/chat/sessions/{id}/messages" "PASS" "" }
            else { Write-Result "POST" "/ai/chat/sessions/{id}/messages" "FAIL" $msg.Raw }
        }
    } else {
        Write-Result "POST" "/ai/chat/sessions" "FAIL" $ai.Raw
    }
} else {
    Write-Result "POST" "/ai/chat/sessions" "SKIP" "not logged in"
}

Write-Host ""
Write-Host "--- Summary ---" -ForegroundColor Cyan
Write-Host "PASS: $pass  FAIL: $fail  SKIP: $skip"
if ($fail -gt 0) {
    Write-Host "Check backend logs for SQL/schema errors (e.g. missing fee_amount column)."
}
Write-Host ""
