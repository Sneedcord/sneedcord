#!/bin/sh
cat sneedcord.txt
echo
cat << EOF
--------------------------------------
sneedcord Open Source Contribution Setup
strg+c/strg+d to exit
-------------------------------------------
This will clone and setup all repositories,
if you only want to work on one specific repository
follow their specific Getting Started Guide and exit this script
----------------------------------------------------------------
EOF
printf "Are you sure you want to continue (y/N)?"
read -p "" CONT
if [ "$CONT" != "y" ]; then
  echo Aborting setup
  exit 1
fi
echo ---------------------
echo Checking dependencies
if ! [ -x "$(command -v git)" ]; then
  echo Error: git is not installed.
  echo Please Install git from: https://git-scm.com/downloads
  echo And make sure its in the path
  exit 1
fi
if ! [ -x "$(command -v node)" ]; then
  echo Error: node is not installed.
  echo Please Install NodeJS from: https://nodejs.org/en/download
  echo And make sure its in the path
  exit 1
fi
if ! [ -x "$(command -v npm)" ]; then
  echo 'Error: npm is not installed.' >&2
  echo Please install npm from: https://nodejs.org/en/download
  echo And make sure its in the path
  exit 1
fi
echo ✓ Dependencies are already installed
echo -------------------------------
echo Creating organization directory
mkdir sneedcord
cd sneedcord
echo Cloning all repositories

sh ../clone_all_repos.sh
mv ../sneedcord.code-workspace ./sneedcord.code-workspace

while true; do
   echo "Do you wish to launch the VSCode workspace?"
    read -p "[y/n]: " yn
    case $yn in
        [Yy]* ) echo Opening VS Code Workspace ; code sneedcord.code-workspace ; break;;
        [Nn]* ) break;;
    esac
done

echo Installation finished
