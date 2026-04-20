; PIXELB8 FISH_NET - Sovereign Installer Script
#define MyAppName "Pixelb8 Fish_Net"
; This line allows the version to be passed in from your npm command
#ifndef MyAppVersion
  #define MyAppVersion "1.0.0"
#endif
#define MyAppPublisher "PIXELB8"
#define MyAppURL "https://www.pixelb8.lol/"
#define MyAppExeName "FISH_NET.exe"

[Setup]
AppId={{7DD618BE-7B1A-4BCB-8B32-3A8DA127D20F}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\Fish_Net
UninstallDisplayIcon={app}\{#MyAppExeName}
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
DisableProgramGroupPage=yes
; Required for a professional Program Files installation
PrivilegesRequired=admin
OutputBaseFilename=Fish_Net_Setup
; Ensure this matches your icon path
SetupIconFile=.\assets\fishnet.ico
WizardImageFile=.\assets\sideimage.png
WizardSmallImageFile=.\assets\fishnet.png
Compression=lzma
SolidCompression=yes
WizardStyle=modern dark

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; RELATIVE PATHS: Pointing to your dist folder regardless of where the project sits
Source: ".\dist\FISH_NET-win32-x64\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion
Source: ".\dist\FISH_NET-win32-x64\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent