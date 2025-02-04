const config = require("./config.js")
const axios   = require("axios")
const { Bot }   = require("grammy")
const express = require("express")

const client = new Bot(config.token)
const app = express()
app.use(express.json())

var escape = (t) => t.replace(/(?<!\\)([|{\[\]*_~}+)`(#>!=\-.])/gm, '\\$1') // https://stackoverflow.com/questions/40626896/telegram-does-not-escape-some-markdown-characters#comment132933479_71313944
// var html2md = (t) => t.replace()
var send = (m, p) => client.api.sendMessage(config.chatID, m, p ?? config.sendParams)
var link = (n, u, lox) => `[${escape(n)}](${lox ? "" : config.domain}${u})`

// bunch of very bad regex look away please
var desc = (t) => t.replaceAll("&quot;", "\"").replaceAll("&nbsp;", " ")
                   .replaceAll("<br>", "\n").replaceAll("*\t", "• ").replaceAll("*   [ ]", "🔘").replaceAll("*   [x]", "☑️")
                   .replace(/<figure.+<\/figure>/gm, "\\[таблица\\]").replace(/<img .+ src="(.+)">/, link("[изображение]", "$1"))
                   .replace(/(?<!])\((.+)\)/gm, "\\($1\\)").replace(/<mention .+ data-id="([0-9]+)".+<\/mention>/, link("[$1]", "/work_packages/$1"))
                   .replace(/\[(.+)\]\((.+)\)/gm, link("$1", "$2", true)).replace(/(?<!\\)([.](?![^(]*\)))/gm, "\\.")

var acheck = (res, type, name) => {
    if(res.status != 200) return console.log(`[op] failed to fetch ${name} [${res.status}]:`, res.data);
    if(!res.data) return console.log(`[op] failed to fetch ${name}: body is empty`);
    if(typeof res.data != "object") return console.log(`[op] failed to fetch ${name}: body is not json`, res.data);
    if(res.data._type != type) return console.log(`[op] failed to fetch ${name}: type is not Collection`, res.data);
    return res.data
}

var aregx = [
    [/^(.+) изменено с (.+) на (.+)$/, (r, raw) => { // i hate "this" so much bruh
        var d = raw.match(r)
        if(d) return `*${escape(d[1])}* было изменено с _${escape(d[2])}_ на _${escape(d[3])}_`
    }],
    [/^Описание ([установлена|изменена])/, (r, raw, wp) => {
        var d = raw.match(r)
        var de = wp.description.raw != ""
        if(d) return `*Описание* было ${de ? d[1] == "установлена" ? "установлено" : "изменено" : "удалено"}${de ? `:\n${desc(wp.description.raw)}` : ""}`
    }],
    [/^(.+) присвоено значение (.+)$/, (r, raw) => {
        var d = raw.match(r)
        if(d) return `*${escape(d[1])}* установлено на _${escape(d[2])}_`
    }],
    [/^(.+) удалена \((.+)\)$/, (r, raw) => {
        var d = raw.match(r)
        if(d) return `*${escape(d[1])}* удалено \\(~_${escape(d[2])}_~\\)`
    }],
]

config.optoken = "Basic " + Buffer.from("apikey:" + config.optoken).toString("base64")

app.post("/meow/rawr/hewwo/op", (req, res) => {
    if(req.headers['x-forwarded-for'] || req.socket.remoteAddress != "::ffff:172.20.0.6") return res.status(401).json({error: "auth", details: "go away"});
    var b = req.body
    res.status(200).json({success: true})
    switch(b.action) {
        case "work_package:created":
            var wp = b.work_package, em = b.work_package._embedded;
            send(`🛠 Новый таск ${link(`[#${wp.id}] ${wp.subject}`, `/work_packages/${wp.id}`)} \\(${escape(em.type.name)}${em.status.isDefault ? "" : `, ${escape(em.status.name)}`}\\) на проекте ${link(`${em.project.name}`, `/projects/${em.project.id}`)} от ${link(em.author.name, `/users/${em.author.id}`)}${wp.description.raw != "" ? `:\n${desc(wp.description.raw)}` : ""}`)
        break
        case "work_package:updated":
            var wp = b.work_package, em = b.work_package._embedded;
            axios({method: "get", url: `${config.domain}${wp._links.activities.href}`, headers: {Authorization: config.optoken}}).then(res => {
                var data = acheck(res, "Collection", "activities"); if(!data) return;
                var el = res.data._embedded.elements[res.data._embedded.elements.length - 1]; if(el) {
                    axios({method: "get", url: `${config.domain}${el._links.user.href}`, headers: {Authorization: config.optoken}}).then(res => {
                        var user = acheck(res, "User", "user"); if(!user) return;
                        var ela = el.details[0]
                        var text = "", change = false
                        switch(el._type) {
                            case "Activity":
                                aregx.forEach(el => {
                                    var t = el[1](el[0], ela.raw, wp)
                                    if(t) text = t, change = true;
                                })
                            break
                            case "Activity::Comment":
                                aregx.forEach(el => {
                                    var t = el[1](el[0], ela.raw, wp)
                                    if(t) text = t, change = true;
                                })
                                text = text + `\n${el.comment.raw}`
                            break
                        }
                        if(text == "") return;
                        if(change) send(`📝 Таск ${link(`[#${wp.id}] ${wp.subject}`, `/work_packages/${wp.id}`)} \\(${escape(em.type.name)}\\) на проекте ${link(`${em.project.name}`, `/projects/${em.project.id}`)} был изменен ${link(user.name, user._links.showUser.href)}${text != "" ? (":\n\\- " + text) : ""}`)
                        else send(`📨 ${link(user.name, user._links.showUser.href)} оставил комментарий на ${link(`[#${wp.id}] ${wp.subject}`, `/work_packages/${wp.id}`)} \\(${escape(em.type.name)}\\) на проекте ${link(`${em.project.name}`, `/projects/${em.project.id}`)}${text != "" ? (":\n\\- " + text) : ""}`)
                    })
                }
            })
        break
    }
})

app.listen(config.port, () => console.log(`[express] listening at port ${config.port}`))
