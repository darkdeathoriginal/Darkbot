const { Module } = require('../index');
const simpleGit = require('simple-git');
const git = simpleGit();

Module(
    { pattern: "update ?(.*)", fromMe: true, desc: "Test command", use: "utility" },
    async (m, match) => {
        await git.fetch();
        var commits = await git.log(['main' + '..origin/' + 'main']);
        var mss = '';
        if (commits.total === 0) {
            mss = "*Bot up to date!*"
            return await m.send(mss);
        }

        else if(match[1] == "start"){
            await require("simple-git")().reset("hard",["HEAD"])
            await require("simple-git")().pull()
            await m.send("_Successfully updated. Please manually update npm modules if applicable!_")
            process.exit(0); 
        }
        
        else {
            var changelog = "_Pending updates:_\n\n";
            for (var i in commits.all){
            changelog += `${(parseInt(i)+1)}• *${commits.all[i].message}*\n`
            }
        }

        changelog+=`\n_Use ".update start" to start the update_`
        m.send(changelog)
    }
  );