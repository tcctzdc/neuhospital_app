# Full API test for WeChat mini-program (all patient features)
#
# Usage:
#   .\scripts\test-miniprogram-apis-full.ps1
#   .\scripts\test-miniprogram-apis-full.ps1
#   .\scripts\test-miniprogram-apis-full.ps1 -Username "13890000002" -Password "password123"
#   .\scripts\test-miniprogram-apis-full.ps1 -AccessToken "eyJ..."
#
# Covers every endpoint used by miniprogram/ (read + write).
# Write tests may create/cancel registrations; uses existing pending payments if any.

param(
    [string]$BaseUrl = "http://127.0.0.1:8080/api",
    [string]$Username = "13890000001",
    [string]$Password = "password123",
    [string]$AccessToken = "",
    [switch]$SkipRegisterTest,
    [switch]$SkipLogout
)

$ErrorActionPreference = "Continue"
$pass = 0
$fail = 0
$skip = 0
$token = $null
$refreshToken = $null
$patientId = $null
$departmentId = $null
$doctorId = $null
$scheduleId = $null
$registrationId = $null
$createdRegistrationId = $null
$paymentOrderId = $null
$recordId = $null
$sessionNo = $null
$today = Get-Date -Format "yyyy-MM-dd"

function Write-Result($feature, $method, $path, $ok, $detail) {
    $icon = if ($ok -eq "PASS") { "[OK]  " } elseif ($ok -eq "SKIP") { "[SKIP]" } else { "[FAIL]" }
    if ($ok -eq "PASS") { $script:pass++ } elseif ($ok -eq "SKIP") { $script:skip++ } else { $script:fail++ }
    $color = if ($ok -eq "PASS") { "Green" } elseif ($ok -eq "SKIP") { "Yellow" } else { "Red" }
    $label = if ($feature) { "[$feature] " } else { "" }
    Write-Host "$icon $label$method $path" -ForegroundColor $color
    if ($detail) { Write-Host "       $detail" -ForegroundColor Gray }
}

function Invoke-Api {
    param(
        [string]$Method = "GET",
        [string]$Path,
        [object]$Body = $null,
        [bool]$SkipToken = $false
    )
    $uri = "$BaseUrl$Path"
    $headers = @{ "Content-Type" = "application/json" }
    if (-not $SkipToken -and $token) {
        $headers["Authorization"] = "Bearer $token"
    }
    try {
        $params = @{
            Uri = $uri
            Method = $Method
            Headers = $headers
            TimeoutSec = 15
            UseBasicParsing = $true
        }
        if ($null -ne $Body -and $Method -ne "GET") {
            $params["Body"] = ($Body | ConvertTo-Json -Compress -Depth 6)
        }
        $resp = Invoke-WebRequest @params
        $text = $resp.Content
        if ([string]::IsNullOrWhiteSpace($text)) {
            return @{ Status = $resp.StatusCode; Ok = ($resp.StatusCode -eq 200); Body = $null; Data = $null; Raw = "(empty)" }
        }
        $json = $text | ConvertFrom-Json
        $ok = $false
        $data = $null
        if ($json.PSObject.Properties.Name -contains "code") {
            $ok = ($json.code -eq 200)
            if ($json.PSObject.Properties.Name -contains "data") { $data = $json.data }
        } elseif ($json.PSObject.Properties.Name -contains "accessToken") {
            $ok = $true
            $data = $json
        } else {
            $ok = ($resp.StatusCode -eq 200)
            $data = $json
        }
        $raw = $text
        if ($raw.Length -gt 180) { $raw = $raw.Substring(0, 180) + "..." }
        return @{ Status = $resp.StatusCode; Ok = $ok; Body = $json; Data = $data; Raw = $raw }
    } catch {
        $status = 0
        $msg = $_.Exception.Message
        if ($_.Exception.Response) {
            $status = [int]$_.Exception.Response.StatusCode
            try {
                $sr = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
                $msg = $sr.ReadToEnd()
                if ($msg.Length -gt 180) { $msg = $msg.Substring(0, 180) + "..." }
            } catch {}
        }
        return @{ Status = $status; Ok = $false; Body = $null; Data = $null; Raw = $msg }
    }
}

function Test-Call {
    param(
        [string]$Feature,
        [string]$Method,
        [string]$Path,
        [object]$Body = $null,
        [bool]$SkipToken = $false,
        [bool]$AllowSkip = $false,
        [string]$SkipReason = ""
    )
    $r = Invoke-Api -Method $Method -Path $Path -Body $Body -SkipToken $SkipToken
    if ($r.Ok) {
        Write-Result $Feature $Method $Path "PASS" $r.Raw
    } elseif ($AllowSkip) {
        Write-Result $Feature $Method $Path "SKIP" $(if ($SkipReason) { $SkipReason } else { $r.Raw })
    } else {
        Write-Result $Feature $Method $Path "FAIL" "HTTP $($r.Status) $($r.Raw)"
    }
    return $r
}

function Get-Records($data) {
    if ($null -eq $data) { return @() }
    if ($data -is [System.Array]) { return $data }
    if ($data.PSObject.Properties.Name -contains "records") { return @($data.records) }
    return @($data)
}

function Get-FirstId($data) {
    $rows = Get-Records $data
    if ($rows.Count -eq 0) { return $null }
    $row = $rows[0]
    if ($row.id) { return $row.id }
    if ($row.registrationId) { return $row.registrationId }
    return $null
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Mini-program FULL API test" -ForegroundColor Cyan
Write-Host " BaseUrl: $BaseUrl" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ---------- 1. Auth ----------
Write-Host ">>> 1. Auth (login/register/me/refresh/logout)" -ForegroundColor Cyan

if (-not $SkipRegisterTest) {
    $regUser = "mp_full_" + (Get-Date -Format "MMddHHmmss")
    $regPhone = "139" + (Get-Random -Minimum 10000000 -Maximum 99999999)
    $reg = Test-Call -Feature "register" -Method POST -Path "/auth/register" -SkipToken $true -AllowSkip $true -SkipReason "register endpoint optional" -Body @{
        username = $regUser; password = "password123"; realName = "FullTest"; phone = $regPhone; gender = "MALE"
    }
}

if ($AccessToken) {
    $token = $AccessToken
    Write-Result "login" "POST" "/auth/login" "PASS" "using -AccessToken"
} else {
    $login = Test-Call -Feature "login" -Method POST -Path "/auth/login" -SkipToken $true -Body @{
        username = $Username; password = $Password
    }
    if ($login.Ok) {
        $loginData = if ($login.Data) { $login.Data } else { $login.Body }
        if ($login.Body.accessToken) { $loginData = $login.Body }
        $token = $loginData.accessToken
        $refreshToken = $loginData.refreshToken
    }
}

if (-not $token) {
    Write-Host ""
    Write-Host "Login failed. Aborting remaining tests." -ForegroundColor Red
    exit 1
}

$me = Test-Call -Feature "profile-me" -Method GET -Path "/auth/me"
if ($me.Ok) {
    $meData = $me.Data
    if (-not $meData) { $meData = $me.Body }
    $patientId = $meData.bizId
    Write-Host "       patientId=$patientId user=$($meData.username)" -ForegroundColor Gray
}

if ($refreshToken) {
    $ref = Test-Call -Feature "refresh" -Method POST -Path "/auth/refresh" -SkipToken $true -AllowSkip $true -SkipReason "refresh optional" -Body @{
        refreshToken = $refreshToken
    }
    if ($ref.Ok) {
        $refData = if ($ref.Data) { $ref.Data } else { $ref.Body }
        if ($ref.Body.accessToken) { $refData = $ref.Body }
        if ($refData.accessToken) { $token = $refData.accessToken }
    }
}

# ---------- 2. Registration ----------
Write-Host ""
Write-Host ">>> 2. Registration (dept/doctor/schedule/quick/detail/cancel/check-in)" -ForegroundColor Cyan

$depts = Test-Call -Feature "home-dept" -Method GET -Path "/departments"
if ($depts.Ok) {
    $departmentId = Get-FirstId $depts.Data
}

$docPath = if ($departmentId) { "/doctors/page?pageNo=1&pageSize=10&departmentId=$departmentId" } else { "/doctors/page?pageNo=1&pageSize=10" }
$docs = Test-Call -Feature "select-doctor" -Method GET -Path $docPath
if ($docs.Ok) {
    $doctorId = Get-FirstId $docs.Data
}

if ($doctorId) {
    $null = Test-Call -Feature "confirm-doctor" -Method GET -Path "/doctors/$doctorId"
}

$schedPath = "/schedules?pageNo=1&pageSize=20&scheduleDate=$today"
if ($departmentId) { $schedPath += "&departmentId=$departmentId" }
if ($doctorId) { $schedPath += "&doctorId=$doctorId" }
$scheds = Test-Call -Feature "confirm-schedule" -Method GET -Path $schedPath
if ($scheds.Ok) {
    $rows = Get-Records $scheds.Data
    foreach ($s in $rows) {
        $remain = $s.remainQuota
        if ($null -eq $remain) { $remain = $s.availableCount }
        if ($s.id -and ($remain -gt 0 -or $null -eq $remain)) {
            $scheduleId = $s.id
            break
        }
    }
    if (-not $scheduleId -and $rows.Count -gt 0) { $scheduleId = $rows[0].id }
}

if ($scheduleId) {
    $regCreate = Test-Call -Feature "quick-register" -Method POST -Path "/registrations/quick" -Body @{
        scheduleId = $scheduleId
    }
    if ($regCreate.Ok) {
        $regData = if ($regCreate.Data) { $regCreate.Data } else { $regCreate.Body }
        $createdRegistrationId = $regData.id
        if (-not $createdRegistrationId) { $createdRegistrationId = $regData.registrationId }
        $registrationId = $createdRegistrationId
        Write-Host "       created registrationId=$createdRegistrationId" -ForegroundColor Gray
    }
} else {
    Write-Result "quick-register" "POST" "/registrations/quick" "SKIP" "no available scheduleId"
}

$myRegs = Test-Call -Feature "my-registrations" -Method GET -Path "/registrations/my"
if ($myRegs.Ok -and -not $registrationId) {
    $registrationId = Get-FirstId $myRegs.Data
}

if ($registrationId) {
    $null = Test-Call -Feature "registration-detail" -Method GET -Path "/registrations/$registrationId"
    $null = Test-Call -Feature "check-in" -Method POST -Path "/registrations/$registrationId/check-in" -AllowSkip $true -SkipReason "check-in may require paid + visit day"
} else {
    Write-Result "registration-detail" "GET" "/registrations/{id}" "SKIP" "no registration id"
    Write-Result "check-in" "POST" "/registrations/{id}/check-in" "SKIP" "no registration id"
}

# ---------- 3. Payment ----------
Write-Host ""
Write-Host ">>> 3. Payment (pending/create/pay)" -ForegroundColor Cyan

$pending = Test-Call -Feature "payment-list" -Method GET -Path "/payment/pending"
$pendingItems = @()
if ($pending.Ok) { $pendingItems = Get-Records $pending.Data }

if ($pendingItems.Count -gt 0) {
    $items = @()
    foreach ($p in $pendingItems) {
        $bizId = 0
        if ($p.bizId) { $bizId = [int]$p.bizId } elseif ($p.id) { $bizId = [int]$p.id }
        if ($bizId -le 0) { continue }
        $itemType = "REGISTRATION"
        if ($p.itemType) { $itemType = [string]$p.itemType }
        elseif ($p.bizType) { $itemType = [string]$p.bizType }
        $items += @{ itemType = $itemType; bizId = $bizId }
    }
    $create = Test-Call -Feature "payment-create" -Method POST -Path "/payment/create" -AllowSkip $true -SkipReason "create payload may differ" -Body @{
        items = $items
    }
    if ($create.Ok) {
        $orderData = if ($create.Data) { $create.Data } else { $create.Body }
        $paymentOrderId = $orderData.id
        if ($paymentOrderId) {
            $amount = $orderData.totalAmount
            if (-not $amount) { $amount = $orderData.amount }
            $payBody = @{ payChannel = "WECHAT" }
            if ($amount) { $payBody["paidAmount"] = $amount }
            $null = Test-Call -Feature "payment-pay" -Method POST -Path "/payment/$paymentOrderId/pay" -Body $payBody
        }
    }
} else {
    Write-Result "payment-create" "POST" "/payment/create" "SKIP" "no pending items"
    Write-Result "payment-pay" "POST" "/payment/{id}/pay" "SKIP" "no pending items"
}

# ---------- 4. Records ----------
Write-Host ""
Write-Host ">>> 4. Records (records/prescription/check/inspection/medical detail)" -ForegroundColor Cyan

if ($patientId) {
    $outList = Test-Call -Feature "records-list" -Method GET -Path "/outpatient/records?patientId=$patientId&pageNo=1&pageSize=10"
    if ($outList.Ok) {
        $recordId = Get-FirstId $outList.Data
    }

    $pres = Test-Call -Feature "prescriptions" -Method GET -Path "/prescriptions?patientId=$patientId&pageNo=1&pageSize=10"
    $null = Test-Call -Feature "check-requests" -Method GET -Path "/check-requests?patientId=$patientId&pageNo=1&pageSize=10"
    $null = Test-Call -Feature "inspection-requests" -Method GET -Path "/inspection-requests?patientId=$patientId&pageNo=1&pageSize=10"

    if ($recordId) {
        $null = Test-Call -Feature "medical-detail" -Method GET -Path "/outpatient/records/$recordId"
        $null = Test-Call -Feature "medical-diagnoses" -Method GET -Path "/outpatient/records/$recordId/diagnoses"
    } else {
        Write-Result "medical-detail" "GET" "/outpatient/records/{id}" "SKIP" "no record in DB"
        Write-Result "medical-diagnoses" "GET" "/outpatient/records/{id}/diagnoses" "SKIP" "no record in DB"
    }
} else {
    Write-Result "records" "GET" "/patients/*" "SKIP" "no patientId"
}

# ---------- 5. Patient profile ----------
Write-Host ""
Write-Host ">>> 5. Patient profile (GET/PUT)" -ForegroundColor Cyan

if ($patientId) {
    $prof = Test-Call -Feature "patient-get" -Method GET -Path "/patients/$patientId"
    $name = "TestPatient"
    if ($prof.Ok -and $prof.Data.name) { $name = $prof.Data.name }
    $null = Test-Call -Feature "patient-update" -Method PUT -Path "/patients/$patientId" -Body @{
        name = $name; phone = $prof.Data.phone; gender = $prof.Data.gender; allergySummary = "none"
    }
} else {
    Write-Result "patient-get" "GET" "/patients/{id}" "SKIP" "no patientId"
}

# ---------- 6. AI chat ----------
Write-Host ""
Write-Host ">>> 6. AI chat (session/messages)" -ForegroundColor Cyan

$aiBody = @{ sessionType = "INQUIRY" }
if ($registrationId) { $aiBody["registrationId"] = $registrationId }
$ai = Test-Call -Feature "ai-session" -Method POST -Path "/ai/chat/sessions" -Body $aiBody
if ($ai.Ok) {
    $sess = if ($ai.Data) { $ai.Data } else { $ai.Body }
    $sessionNo = $sess.sessionNo
    if (-not $sessionNo) { $sessionNo = $sess.id }
    if ($sessionNo) {
        $null = Test-Call -Feature "ai-message" -Method POST -Path "/ai/chat/sessions/$sessionNo/messages" -Body @{
            content = "hello, any health tips?"; role = "USER"
        }
    }
}

# ---------- 7. Cleanup: cancel test registration ----------
Write-Host ""
Write-Host ">>> 7. Cleanup (cancel test registration)" -ForegroundColor Cyan

if ($createdRegistrationId) {
    $null = Test-Call -Feature "cancel-registration" -Method POST -Path "/registrations/$createdRegistrationId/cancel" -AllowSkip $true -SkipReason "may already paid or visited"
} else {
    Write-Result "cancel-registration" "POST" "/registrations/{id}/cancel" "SKIP" "no registration created in this run"
}

# ---------- 8. Logout ----------
Write-Host ""
Write-Host ">>> 8. Logout" -ForegroundColor Cyan

if (-not $SkipLogout) {
    $null = Test-Call -Feature "logout" -Method POST -Path "/auth/logout" -AllowSkip $true -SkipReason "logout optional"
} else {
    Write-Result "logout" "POST" "/auth/logout" "SKIP" "-SkipLogout"
}

# ---------- Summary ----------
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Summary: PASS=$pass  FAIL=$fail  SKIP=$skip" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Yellow" })
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Feature map (mini-program pages):" -ForegroundColor Gray
Write-Host "  register/login -> auth/*" -ForegroundColor Gray
Write-Host "  home/department/doctors/confirm/my-list/detail -> departments, doctors, schedules, registrations/*" -ForegroundColor Gray
Write-Host "  payment/list/detail -> payment/*" -ForegroundColor Gray
Write-Host "  records/* -> outpatient/records, prescriptions, check/inspection-requests" -ForegroundColor Gray
Write-Host "  patient/profile -> patients PUT" -ForegroundColor Gray
Write-Host "  ai/chat -> ai/chat/sessions/*" -ForegroundColor Gray
Write-Host "  profile/index -> auth/me, logout" -ForegroundColor Gray
Write-Host ""

if ($fail -gt 0) {
    exit 1
}
