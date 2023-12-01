const  htmlFormatter ={
    bold: (text) => `<b>${text}</b>`,
    italic: (text) => `<i>${text}</i>`,
    underline: (text) => `<u>${text}</u>`,
    strike: (text) => `<s>${text}</s>`,
    link: (text, url) => `<a href="${url}">${text}</a>`,
    br: () => `<br/>`,
    hr: () => `<hr/>`,
    code: (text) => `<code>${text}</code>`,
    pre: (text) => `<pre>${text}</pre>`,
    blockquote: (text) => `<blockquote>${text}</blockquote>`,
}
module.exports = htmlFormatter