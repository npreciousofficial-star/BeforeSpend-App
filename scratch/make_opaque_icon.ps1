Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\Admin\Downloads\BeforeSpend Files\BeforeSpend Favicon.png"
$src = [System.Drawing.Image]::FromFile($srcPath)

$bmp = New-Object System.Drawing.Bitmap 180, 180
$g = [System.Drawing.Graphics]::FromImage($bmp)

# Solid dark blue background #0A192F (RGB: 10, 25, 47) for iOS Safari
$bgColor = [System.Drawing.Color]::FromArgb(255, 10, 25, 47)
$g.Clear($bgColor)

$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

# Center the logo icon nicely with 16px padding
$g.DrawImage($src, 16, 16, 148, 148)

$bmp.Save("c:\Users\Admin\Downloads\BeforeSpend\public\apple-touch-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Save("c:\Users\Admin\Downloads\BeforeSpend\public\apple-touch-icon-precomposed.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Save("c:\Users\Admin\Downloads\BeforeSpend\public\pwa-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$bmp.Dispose()
$src.Dispose()

Write-Host "SUCCESS: Opaque 180x180 PWA Apple Touch Icon generated!"
