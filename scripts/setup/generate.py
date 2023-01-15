# script to:
# - get all repo git urls from the sneedcord orga and format them to make the process of updating the setup script less tiresome
# - create a workspace file for VScode

import requests

workspace = {
  "folders":[]
}
repos = ""
response = requests.get("https://api.github.com/users/sneedcord/repos").json()

for repo in response:
  name = repo['name'].replace('sneedcord-','')
  workspace["folders"].append({"path":f"{name}"})
  repos += f"git clone {repo['git_url']} {name}\n"

with open("clone_all_repos.sh","w") as f:
  f.write(repos)

with open("sneedcord.code-workspace", "w") as f:
  f.write(str(workspace).replace("'",'"'))
