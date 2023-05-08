export declare class Authenticator {
    private AUTH_URL;
    private CLIENT_ID;
    private SCOPE;
    private _username;
    private _password;
    private _credentials;
    constructor(username: string, password: string);
    private login;
    private refresh;
    getAuthorizedUrl(baseUrl: string): Promise<string>;
}
