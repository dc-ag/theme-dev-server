var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import axios from "axios";
import * as fs from "fs";
import { createServer } from "http";
import mustache from "mustache";
import { Authenticator } from "./Authenticator.js";
export class Server {
    constructor(options) {
        var _a;
        this._port = (_a = options.port) !== null && _a !== void 0 ? _a : 3000;
        this._authenticator = new Authenticator(options.username, options.password);
        this._dataBaseUrl = options.dataBaseUrl;
        this._language = options.language;
        this._mainTemplateName = options.mainTemplateName;
        this._headerPartialTemplateName = options.headerPartialTemplateName;
        this._basicAuthUsername = options.basicAuthUsername;
        this._basicAuthPassword = options.basicAuthPassword;
        this._themeName = options.themeName;
    }
    run() {
        const server = createServer(this.requestHandler.bind(this));
        server.listen(this._port, () => {
            console.log(`Server is listening on ${this._port}`);
        });
    }
    requestHandler(request, response) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            if (request.url === undefined)
                return;
            if (request.url === "/favicon.ico")
                return;
            const pathWithTheme = `/themes/${this._themeName}`;
            if (request.url.startsWith(pathWithTheme)) {
                const possibleFilePath = request.url.slice(pathWithTheme.length + 1);
                if (fs.existsSync(possibleFilePath)) {
                    console.debug(`Found local file ${possibleFilePath}`);
                    return response.end(fs.readFileSync(possibleFilePath));
                }
            }
            let responseOrNull = yield this.getContentData(request.url);
            if (responseOrNull === null)
                return response.end("");
            let contentData = responseOrNull.data;
            if ((_a = request.url.split('/').pop()) === null || _a === void 0 ? void 0 : _a.includes('.')) {
                response.setHeader("content-type", (_b = responseOrNull.headers["content-type"]) !== null && _b !== void 0 ? _b : "");
                response.setHeader("transfer-encoding", (_c = responseOrNull.headers["transfer-encoding"]) !== null && _c !== void 0 ? _c : "");
                response.chunkedEncoding = true;
                return response.end(contentData, 'binary');
            }
            const mainTemplate = fs.readFileSync(this._mainTemplateName, "utf8");
            const headerPartial = fs.readFileSync(this._headerPartialTemplateName, "utf8");
            const masterFrontendTemplate = yield this.getMasterFrontendTemplateContent();
            const renderedContent = mustache.render(masterFrontendTemplate, Object.assign(Object.assign({}, JSON.parse(contentData.toString('binary'))), { themeRoot: `/themes/${this._themeName}` }), {
                headerPartial: headerPartial,
                bodyPartial: mainTemplate,
            });
            response.setHeader("content-type", "text/html");
            response.end(renderedContent);
        });
    }
    getMasterFrontendTemplateContent() {
        return __awaiter(this, void 0, void 0, function* () {
            let url = this._dataBaseUrl + "/templates/masterFrontend.mustache";
            console.debug(`Requesting ${url}`);
            url = yield this._authenticator.getAuthorizedUrl(url);
            const response = yield axios.get(url).catch(reason => {
                console.error(`Failed fetching ${url}`);
                return {
                    data: ""
                };
            });
            return response.data;
        });
    }
    getContentData(url) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const initialUrl = url;
            console.debug(`Requesting ${this._dataBaseUrl}${initialUrl}`);
            let headers = {
                "accept-language": this._language,
                accept: "application/json",
            };
            if (!url.startsWith('/')) {
                url = `/${url}`;
            }
            if (!url.startsWith('/themes/') && !((_a = url.split('/').pop()) === null || _a === void 0 ? void 0 : _a.includes("."))) {
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
            url = yield this._authenticator.getAuthorizedUrl(url);
            const response = yield axios.get(url, {
                headers: headers,
                responseEncoding: 'binary',
                responseType: "arraybuffer"
            }).catch(reason => {
                console.error(`Failed fetching ${this._dataBaseUrl}${initialUrl}`);
                return null;
            });
            if ((response === null || response === void 0 ? void 0 : response.status) !== 200) {
                return null;
            }
            return response;
        });
    }
}
