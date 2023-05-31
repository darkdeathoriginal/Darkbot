const { Module } = require('../index');
const axios = require('axios')
const cheerio = require('cheerio')
const fs = require("fs")


Module({pattern: 'manga ?(.*)', fromMe: true ,desc: ' manga downloader\n.manga one piece ', use: ' utility ',}, async (m,match) => {
    if(!match[1]){return await m.send("manga not specified.")}
    let tt=match[1]
    const url ="https://ww5.manganelo.tv/search/"+tt
    let news=[]
    axios(url)
    .then(async response =>{
        const html = response.data
        const ch = cheerio.load(html)
        const article= []
        ch('.panel-search-story>.search-story-item h3',html).each(function(){
            
           
            const title = ch(this).find('a').text()
            const lin ="https://ww5.manganelo.tv/"+ch(this).find('a').attr('href')
        
            article.push({
                title,
                lin
            })
        })
        
        this.manga = this.manga?this.manga:{}
        let data = {}
        let text="**Manga result**\n\n"
        let n=1;
        
        for(let i of article){
         data[n]={url:i.lin,title:i.title}
         text+=n+", **"+i.title+"**\n"
         n++;
        }
        
        text+="\nReply with the number to download notes."
        this.manga[m.jid] = {}
        this.manga[m.jid].data = data
        let a = await m.send(text)
        this.manga[m.jid].key = a
        this.manga[m.jid].state = "manga"
        return;
    }).catch(err => console.log(err))
    
    });
    
    
    Module({
      pattern: 'message',
      fromMe: true
      }, (async (m, match) => {
            if(!m.quoted || !this.manga || this.manga[m.jid]?.key.id != m?.quoted?.id) return;
            var no = /\d+/.test(m.message.message) ? m.message.message.match(/\d+/)[0] : false
            if (!no) throw "_Reply must be  a number_";
            let manga = this.manga[m.jid]
            if(!manga.data[no]) return await m.send("invalid number")
            if(manga.state == "manga"){
            const url = manga.data[no].url
            let news=[]
            axios(url)
            .then(async response =>{
                const html = response.data
                const ch = cheerio.load(html)
                const article= []
                ch('.row-content-chapter .a-h',html).each(function(){
    
    
                    const title = ch(this).find('a').text()
                    const lin ="https://ww5.manganelo.tv/"+ch(this).find('a').attr('href')
    
                    article.push({
                        title,
                        lin
                    })
                })
                this.manga = this.manga?this.manga:{}
                let data = {}
                let text="**"+manga.data[no].title+"**\n\n"
                let n=1;
    
                for(let i of article){
                 data[n]={url:i.lin,title:i.title}
                 text+=n+", **"+i.title+"**\n"
                 n++;
                }
    
                text+="\nReply with the number to download notes."
                this.manga[m.jid] = {}
                this.manga[m.jid].data = data
                await m.edit(text,manga.key.id);
                this.manga[m.jid].key = manga.key
                this.manga[m.jid].state = "chapter"
                return;
            })}
            if(manga.state == "chapter"){
                m.send("please wait...")
                const url = manga.data[no].url
                axios(url)
                .then(async response =>{
                    const html = response.data
                    const ch = cheerio.load(html)
                    const article= []
                    let name=0;
                    ch('.container-chapter-reader img',html).each(function(){
    
    
                        const lin = ch(this).attr('data-src')
                        article.push({
                            lin
                        })
                    })
                    // await Promise.all(article.map((a, i) => dl(a.lin, `${i.toString().padStart(2, '0')}`)));
                    for(let i of article){
                     await dl(i.lin,`${name.toString().padStart(2, "0")}`)
                     name++
                    }
                    await pdf(m,manga.data[no].title)
                    await new Promise(resolve => setTimeout(resolve, 2000));
            
            })}
            
      }));
                
    function dl(text, ttt) {
      return new Promise((resolve, reject) => {
        if (!fs.existsSync("./temp/pdf")) {
          fs.mkdirSync("./temp/pdf");
        }
        const len = ttt;
        const fileUrl = text;
        const dest = "./temp/pdf/" + len + ".png";
    
        axios({
          method: "get",
          url: fileUrl,
          responseType: "stream",
          timeout: 60000,
        })
          .then((response) => {
            response.data
              .pipe(fs.createWriteStream(dest))
              .on("error", function (error) {
                reject(new Error(`Error occurred while writing to file: ${error}`));
              })
              .on("finish", function () {
                resolve();
              });
          })
          .catch((error) => {
            reject(error);
          });
      });
    }
    
    
    async function pdf(m, title) {
      try {
        const imgToPDF = require("image-to-pdf");
        const list = await fs.readdirSync("./temp/pdf/");
        const images = list.map((file) => `./temp/pdf/${file}`);
        const pdfPath = "./temp/output.pdf";
    
        await new Promise((resolve, reject) => {
          const pdfStream = imgToPDF(images, imgToPDF.sizes.A3);
          pdfStream.on("error", reject);
          pdfStream.pipe(fs.createWriteStream(pdfPath))
            .on("error", reject)
            .on("finish", resolve);
        });
    
        const pdfData = await fs.promises.readFile(pdfPath);
    
        await m.sendMessage(m.jid,{
            document: pdfData,
            fileName: `${title}.pdf`,
          }
        );
    
        // for (const file of images) {
        //   await fs.promises.unlink(file);
        // }
        // await fs.promises.unlink(pdfPath);
      } catch (err) {
        console.error(`Failed to create PDF for ${title}:`, err);
      }
    }