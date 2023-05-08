import axios, { AxiosResponse } from "axios";
import * as fs from "fs";
import { IncomingMessage, ServerResponse, createServer } from "http";
import mustache from "mustache";
import { Authenticator } from "./Authenticator.js";

export interface RunOptions {
    username: string;
    password: string;
    basicAuthUsername?: string;
    basicAuthPassword?: string;
    dataBaseUrl: string;
    language: string;
    port?: number;
    mainTemplateName: string;
    headerPartialTemplateName: string;
    themeName: string;
}

export class Server {
    private _authenticator: Authenticator;
    private _port: number;
    private _dataBaseUrl: string;
    private _language: string;
    private _mainTemplateName: string;
    private _headerPartialTemplateName: string;
    private _basicAuthUsername?: string;
    private _basicAuthPassword?: string;
    private _themeName: string;

    constructor(options: RunOptions) {
        this._port = options.port ?? 3000;
        this._authenticator = new Authenticator(options.username, options.password);
        this._dataBaseUrl = options.dataBaseUrl;
        this._language = options.language;
        this._mainTemplateName = options.mainTemplateName;
        this._headerPartialTemplateName = options.headerPartialTemplateName;
        this._basicAuthUsername = options.basicAuthUsername;
        this._basicAuthPassword = options.basicAuthPassword;
        this._themeName = options.themeName;
    }

    public run(): void {
        const server = createServer(this.requestHandler.bind(this));

        server.listen(this._port, () => {
            console.log(`Server is listening on ${this._port}`);
        });
    }

    private async requestHandler(request: IncomingMessage, response: ServerResponse) {
        if (request.url === undefined) return;
        if (request.url === "/favicon.ico") return;

        const pathWithTheme = `/themes/${this._themeName}`;
        if (request.url.startsWith(pathWithTheme)) {
            const possibleFilePath = request.url.slice(pathWithTheme.length + 1);

            if (fs.existsSync(possibleFilePath)) {
                console.debug(`Found local file ${possibleFilePath}`);
                return response.end(fs.readFileSync(possibleFilePath));
            }
        }

        let responseOrNull = await this.getContentData(request.url);

        if (responseOrNull === null) return response.end("");

        let contentData: Buffer = responseOrNull.data;

        if (request.url.split('/').pop()?.includes('.')) {
            response.setHeader("content-type", responseOrNull.headers["content-type"] ?? "");
            response.setHeader("transfer-encoding", responseOrNull.headers["transfer-encoding"] ?? "");
            response.chunkedEncoding = true;
            return response.end(contentData, 'binary');
        }

        const mainTemplate = fs.readFileSync(this._mainTemplateName, "utf8");
        const headerPartial = fs.readFileSync(this._headerPartialTemplateName, "utf8");
        const masterFrontendTemplate = await this.getMasterFrontendTemplateContent();

        const renderedContent = mustache.render(
            masterFrontendTemplate,
            { ...JSON.parse(contentData.toString('binary')), themeRoot: `/themes/${this._themeName}` },
            {
                headerPartial: headerPartial,
                bodyPartial: mainTemplate,
            }
        );

        response.setHeader("content-type", "text/html");
        response.end(renderedContent);
    }

    private async getMasterFrontendTemplateContent() {
        let url = this._dataBaseUrl + "/templates/masterFrontend.mustache";
        console.debug(`Requesting ${url}`);
        url = await this._authenticator.getAuthorizedUrl(url);
        const response = await axios.get(url).catch(reason => {
            console.error(`Failed fetching ${url}`)
            return {
                data: ""
            }
        });
        return response.data;
    }

    private async getContentData(url: string): Promise<AxiosResponse | null> {
        const initialUrl = url;
        console.debug(`Requesting ${this._dataBaseUrl}${initialUrl}`);
        let headers: any = {
            "accept-language": this._language,
            accept: "application/json",
        }

        if (!url.startsWith('/')) {
            url = `/${url}`;
        }

        if (!url.startsWith('/themes/') && !url.split('/').pop()?.includes(".")) {
            url = `/dc/preview${url}`;
        }
        url = `${this._dataBaseUrl}${url}`;

        if (!url.startsWith("http")) {
            url = `http://${url}`;
        }

        if (this._basicAuthUsername !== undefined && this._basicAuthPassword !== undefined) {
            const authorizationHeaderString = Buffer.from(`${this._basicAuthUsername}:${this._basicAuthPassword}`).toString('base64');
            headers.authorization = `Basic ${authorizationHeaderString}`;
        };

        url = await this._authenticator.getAuthorizedUrl(url);

        const response = await axios.get(url, {
            headers: headers,
            responseEncoding: 'binary',
            responseType: "arraybuffer"
        }).catch(reason => {
            console.error(`Failed fetching ${this._dataBaseUrl}${initialUrl}`);
            return null;
        });

        if (response?.status !== 200) {
            return null;
        }
        return response;
    }
}