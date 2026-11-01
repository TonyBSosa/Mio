param([switch]$Aplicar)
$ErrorActionPreference = 'Stop'
$repo = 'TonyBSosa/Mio'
$root = Split-Path $PSScriptRoot -Parent
$source = Get-Content -LiteralPath (Join-Path $root 'docs/backlog.md') -Raw -Encoding UTF8
$sections = [regex]::Matches($source, '(?ms)^## (HU-\d{2}) · ([^\r\n]+)\r?\n(.*?)(?=^## |\z)')
if ($sections.Count -lt 15) { throw 'Se requieren al menos 15 historias.' }
if (-not $Aplicar) {
    $sections | ForEach-Object { Write-Output "$($_.Groups[1].Value) · $($_.Groups[2].Value)" }
    Write-Output 'Vista previa. Usar -Aplicar para crear las issues en TonyBSosa/Mio tras gh auth login.'
    exit 0
}
& gh auth status
if ($LASTEXITCODE -ne 0) { throw 'Inicia sesión con gh auth login antes de publicar.' }
$existingJson = & gh issue list --repo $repo --state all --limit 1000 --json number,title,url
if ($LASTEXITCODE -ne 0) { throw 'No se pudieron consultar las issues.' }
$existing = $existingJson | ConvertFrom-Json
$labelsJson = & gh label list --repo $repo --limit 1000 --json name
if ($LASTEXITCODE -ne 0) { throw 'No se pudieron consultar etiquetas.' }
$knownLabels = @($labelsJson | ConvertFrom-Json | ForEach-Object { $_.name })
$labelColors = @{ historia='1D76DB'; MVP='0E8A16'; P0='B60205'; P1='FBCA04'; P2='C5DEF5'; 'corte-2'='5319E7'; futuro='D4C5F9' }
foreach ($name in $labelColors.Keys) {
    if ($knownLabels -notcontains $name) {
        & gh label create $name --repo $repo --color $labelColors[$name]
        if ($LASTEXITCODE -ne 0) { throw "No se pudo crear etiqueta $name" }
    }
}
$results = @()
foreach ($section in $sections) {
    $id = $section.Groups[1].Value
    $title = "$id · $($section.Groups[2].Value)"
    $found = @($existing | Where-Object { $_.title -match "^$id(?:\s|:|·|$)" })
    if ($found.Count -gt 1) { throw "Hay varias issues para $id; revisarlas antes de continuar." }
    if ($found.Count -eq 1) {
        Write-Output "Ya existe: $($found[0].url)"
        $results += [pscustomobject]@{ historia=$id; url=$found[0].url; accion='existente' }
        continue
    }
    $labels = @('historia')
    if ($section.Groups[3].Value.Contains('`MVP`')) { $labels += 'MVP' }
    elseif ($section.Groups[3].Value.Contains('`corte-2`')) { $labels += 'corte-2' }
    else { $labels += 'futuro' }
    foreach ($priority in @('P0','P1','P2')) {
        if ($section.Groups[3].Value.Contains(('`' + $priority + '`'))) { $labels += $priority }
    }
    $body = $section.Groups[3].Value.Trim() + "`n`nDefinición de Hecho: https://github.com/$repo/blob/main/docs/definicion-de-hecho.md`nMapa: https://github.com/$repo/blob/main/docs/mapa-historias.md"
    $tempBody = [IO.Path]::GetTempFileName()
    try {
        [IO.File]::WriteAllText($tempBody, $body, [Text.UTF8Encoding]::new($false))
        $url = & gh issue create --repo $repo --title $title --body-file $tempBody --label ($labels -join ',')
        if ($LASTEXITCODE -ne 0) { throw "No se pudo publicar $id. Es seguro volver a ejecutar el script." }
        $results += [pscustomobject]@{ historia=$id; url=($url -join '').Trim(); accion='creada' }
        Write-Output $url
    } finally { Remove-Item -LiteralPath $tempBody -Force }
}
$evidenceDir = Join-Path $root 'docs/evidencias'
New-Item -ItemType Directory -Path $evidenceDir -Force | Out-Null
$results | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $evidenceDir 'issues-semana-2.json') -Encoding UTF8
Write-Output 'Publicación terminada. Las historias permanecen abiertas hasta cumplir su Definición de Hecho.'
