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
export declare class Server {
    private _authenticator;
    private _port;
    private _dataBaseUrl;
    private _language;
    private _mainTemplateName;
    private _headerPartialTemplateName;
    private _basicAuthUsername?;
    private _basicAuthPassword?;
    constructor(options: RunOptions);
    run(): void;
    private requestHandler;
    private getMasterFrontendTemplateContent;
    private getContentData;
}
