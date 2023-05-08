"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = void 0;
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs"));
const http_1 = require("http");
const mustache_1 = __importDefault(require("mustache"));
const Authenticator_js_1 = require("./Authenticator.js");
class Server {
    _authenticator;
    _port;
    _dataBaseUrl;
    _language;
    _mainTemplateName;
    _headerPartialTemplateName;
    _basicAuthUsername;
    _basicAuthPassword;
    constructor(options) {
        this._port = options.port ?? 3000;
        this._authenticator = new Authenticator_js_1.Authenticator(options.username, options.password);
        this._dataBaseUrl = options.dataBaseUrl;
        this._language = options.language;
        this._mainTemplateName = options.mainTemplateName;
        this._headerPartialTemplateName = options.mainTemplateName;
        this._basicAuthUsername = options.basicAuthUsername;
        this._basicAuthPassword = options.basicAuthPassword;
    }
    run() {
        const server = (0, http_1.createServer)(this.requestHandler.bind(this));
        console.log("run");
        server.listen(this._port, () => {
            console.log(`Server is listening on ${this._port}`);
        });
    }
    async requestHandler(request, response) {
        if (request.url === undefined)
            return;
        if (request.url === "favicon.ico")
            return;
        if (request.url != '/') {
            const possibleFilePath = request.url.substr(1);
            if (fs.existsSync(possibleFilePath)) {
                response.end(fs.readFileSync(possibleFilePath));
                return;
            }
        }
        const mainTemplate = fs.readFileSync(this._mainTemplateName, "utf8");
        const headerPartial = fs.readFileSync(this._headerPartialTemplateName, "utf8");
        const masterFrontendTemplate = await this.getMasterFrontendTemplateContent();
        const contentData = await this.getContentData(request.url);
        const renderedContent = mustache_1.default.render(masterFrontendTemplate, { ...contentData, themeRoot: "" }, {
            headerPartial: headerPartial,
            bodyPartial: mainTemplate,
        });
        response.setHeader("content-type", "text/html");
        response.end(renderedContent);
    }
    async getMasterFrontendTemplateContent() {
        return await fetch(this._dataBaseUrl + "/templates/masterFrontend.mustache")
            .then((res) => res.text())
            .then((body) => {
            return body;
        });
    }
    async getContentData(url) {
        let headers = {
            "accept-language": this._language,
            accept: "application/json",
        };
        if (!url.startsWith('/')) {
            url = `/${url}`;
        }
        if (!url.startsWith('/themes/')) {
            url = `/dc/preview${url}`;
        }
        url = `${this._dataBaseUrl}${url}`;
        if (!url.startsWith("http")) {
            url = `http://${url}`;
        }
        if (this._basicAuthUsername !== undefined && this._basicAuthPassword !== undefined) {
            const authorizationHeaderString = Buffer.from(`${this._basicAuthUsername}:${this._basicAuthPassword}`).toString('base64');
            headers.authorization = `Basic ${authorizationHeaderString}`;
        }
        ;
        url = await this._authenticator.getAuthorizedUrl(url);
        console.log(url + "\n\n");
        const response = await axios_1.default.get(url, {
            headers: headers
        });
        if (response.status !== 200) {
            console.error(`Couldn't fetch ${url}`);
            return null;
        }
        return response.data;
    }
}
exports.Server = Server;
