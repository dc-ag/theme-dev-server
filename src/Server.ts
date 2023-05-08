import axios from "axios";
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

    constructor(options: RunOptions) {
        this._port = options.port ?? 3000;
        this._authenticator = new Authenticator(options.username, options.password);
        this._dataBaseUrl = options.dataBaseUrl;
        this._language = options.language;
        this._mainTemplateName = options.mainTemplateName;
        this._headerPartialTemplateName = options.mainTemplateName;
        this._basicAuthUsername = options.basicAuthUsername;
        this._basicAuthPassword = options.basicAuthPassword;
    }

    public run(): void {
        const server = createServer(this.requestHandler.bind(this));

        console.log("run");
        server.listen(this._port, () => {
            console.log(`Server is listening on ${this._port}`);
        });
    }

    private async requestHandler(request: IncomingMessage, response: ServerResponse) {
        if (request.url === undefined) return;
        if (request.url === "favicon.ico") return;

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

        const renderedContent = mustache.render(
            masterFrontendTemplate,
            { ...contentData, themeRoot: "" },
            {
                headerPartial: headerPartial,
                bodyPartial: mainTemplate,
            }
        );

        response.setHeader("content-type", "text/html");
        response.end(renderedContent);
    }

    private async getMasterFrontendTemplateContent() {
        return await fetch(this._dataBaseUrl + "/templates/masterFrontend.mustache")
            .then((res) => res.text())
            .then((body) => {
                return body;
            });
    }

    private async getContentData(url: string) {
        let headers: any = {
            "accept-language": this._language,
            accept: "application/json",
        }

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
        };

        url = await this._authenticator.getAuthorizedUrl(url);

        console.log(url + "\n\n");
        const response = await axios.get(url, {
            headers: headers
        });

        if (response.status !== 200) {
            console.error(`Couldn't fetch ${url}`);
            return null;
        }
        return response.data;
    }
}