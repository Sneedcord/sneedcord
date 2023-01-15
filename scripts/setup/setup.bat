@ECHO off
ECHO.
ECHO                                                                                       
ECHO              ____     _____    ____     ____     ____     _____    ____     ____      
ECHO             /\  _`\  /\  __`\ /\  _`\  /\  _`\  /\  _`\  /\  __`\ /\  _`\  /\  _`\    
ECHO             \ \ \L\_\\ \ \/\ \\ \,\L\_\\ \,\L\_\\ \ \/\_\\ \ \/\ \\ \ \L\ \\ \ \/\ \  
ECHO              \ \  _\/ \ \ \ \ \\/_\__ \ \/_\__ \ \ \ \/_/_\ \ \ \ \\ \ ,  / \ \ \ \ \ 
ECHO               \ \ \/   \ \ \_\ \ /\ \L\ \ /\ \L\ \\ \ \L\ \\ \ \_\ \\ \ \\ \ \ \ \_\ \
ECHO                \ \_\    \ \_____\\ `\____\\ `\____\\ \____/ \ \_____\\ \_\ \_\\ \____/
ECHO                 \/_/     \/_____/ \/_____/ \/_____/ \/___/   \/_____/ \/_/\/ / \/___/ 
ECHO                                                                                       \n--------------------------------
ECHO This will clone and setup all sneedcord repositories,
ECHO if you only want to work on one specific repository
ECHO follow their specific "Getting Started" Guide and exit this script
ECHO.
CHOICE /C YN /m "Are you sure you want to continue (y/n)?"
IF %ERRORLEVEL% == 2 GOTO :end

where /q git
IF ERRORLEVEL 1 (
    ECHO Error: git is not installed.
	ECHO Please Install git from: https://git-scm.com/downloads
	ECHO And make sure its in the path
    GOTO :end
)

where /q node
IF ERRORLEVEL 1 (
	ECHO Error: node is not installed.
	ECHO Please Install NodeJS from: https://nodejs.org/en/download
	ECHO And make sure its in the path
    GOTO :end
)

where /q npm
IF ERRORLEVEL 1 (
	ECHO 'Error: npm is not installed.' >&2
	ECHO Please install npm from: https://nodejs.org/en/download
	ECHO And make sure its in the path
    GOTO :end
)
echo Dependencies are already installed
ECHO.
echo Creating organization directory
ECHO.
MKDIR sneedcord
cd sneedcord
ECHO Cloning all repositories
ECHO.
git clone https://github.com/sneedcord/sneedcord overview
git clone https://github.com/sneedcord/sneedcord-server server
git clone https://github.com/sneedcord/sneedcord-themes themes
git clone https://github.com/sneedcord/sneedcord-plugins plugins
git clone https://github.com/sneedcord/sneedcord-ui ui
git clone https://github.com/sneedcord/sneedcord-client client
git clone https://github.com/sneedcord/sneedcord-landingpage landingpage
git clone https://github.com/sneedcord/css-mediaquery css-mediaquery
git clone https://github.com/sneedcord/react-native-withcss react-native-withcss

echo {"folders":[{"path":"overview"},{"path":"cdn"},{"path":"api"},{"path":"gateway"},{"path":"media"},{"path":"server-util"},{"path":"ui"},{"path":"client"},{"path":"plugins"},{"path":"themes"},{"path":"landingpage"},{"path":"dashboard"},{"path":"support"},{"path":"css-mediaquery"},{"path":"react-native-withcss"}]}> sneedcord.code-workspace

IF ERRORLEVEL 0 (
	CHOICE /c yn /m "Do you want to launch the VS Code workspace?"
	IF %ERRORLEVEL% == 2 GOTO :rpc
	ECHO Opening VS Code Workspace
	code sneedcord.code-workspace
)

:rpc
CHOICE /c yn /m "Do you want to install the Discord Rich Presence?"
IF %ERRORLEVEL% == 2 GOTO :end
cd ..
cd rpc

npm install

npm i pm2 -g
pm2 start --name rpc index.js
pm2 save 
pm2-startup install
:end

ECHO finished installation
@ECHO on
PAUSE
