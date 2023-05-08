import axios from "axios";

export class Authenticator {
    private AUTH_URL = 'https://auth.dc.ag/auth/realms/cms/protocol/openid-connect/token';
    private CLIENT_ID = 'themes-development';
    private SCOPE = 'openid email profile';

    private _username: string;
    private _password: string;

    private _credentials: Credentials;

    constructor(username: string, password: string) {
        this._username = username;
        this._password = password;
        this._credentials = Credentials.createExpired();
    }

    private async login(): Promise<void> {
        try {
            const loginResponse = await axios.post(this.AUTH_URL, {
                grant_type: 'password',
                scope: this.SCOPE,
                client_id: this.CLIENT_ID,
                username: this._username,
                password: this._password,
            },{
                headers:{
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            });
            this._credentials = Credentials.fromOpenidResponse(loginResponse.data as OpenidResponse);
        } catch (error) {
            console.error(error);
        }
    }

    private async refresh(): Promise<void> {
        try {
            const loginResponse = await axios.post(this.AUTH_URL, {
                grant_type: 'refresh_token',
                scope: this.SCOPE,
                client_id: this.CLIENT_ID,
                refresh_token: this._credentials.refreshToken,
            },{
                headers:{
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            });
            this._credentials = Credentials.fromOpenidResponse(loginResponse.data as OpenidResponse);
        } catch (error) {
            console.error(error);
        }
    }

    public async getAuthorizedUrl(baseUrl: string): Promise<string> {
        if (this._credentials.isExpired()) {
            if (this._credentials.isRefreshExpired()) {
                await this.login();
            } else {
                await this.refresh();
            }
        }
        let url = new URL(baseUrl);
        url.searchParams.append("access_token", this._credentials.accessToken);
        url.searchParams.append("id_token", this._credentials.idToken);

        return url.toString();
    }
}

class Credentials {
    private _accessToken: string;
    private _idToken: string;
    private _refreshToken: string;
    private _expiresAt: Date;
    private _refreshExpiresAt: Date;

    constructor(accessToken: string, idToken: string, refreshToken: string, expiresIn: number, refreshExpiresIn: number) {
        this._accessToken = accessToken;
        this._idToken = idToken;
        this._refreshToken = refreshToken;
        this._expiresAt = new Date(Date.now() + ((expiresIn - 5) * 1000));
        this._refreshExpiresAt = new Date(Date.now() + ((refreshExpiresIn - 5) * 1000));
    }

    public static fromOpenidResponse(response: OpenidResponse) {
        return new Credentials(
            response.access_token,
            response.id_token,
            response.refresh_token,
            response.expires_in,
            response.refresh_expires_in
        );
    }

    public isExpired(date: Date = new Date()): boolean {
        return this._expiresAt < date;
    }

    public isRefreshExpired(date: Date = new Date()): boolean {
        return this._refreshExpiresAt < date;
    }

    public static createExpired(): Credentials {
        return new Credentials('', '', '', 0, 0);
    }

    public get accessToken(): string {
        return this._accessToken;
    }

    public get idToken(): string {
        return this._idToken;
    }

    public get refreshToken(): string {
        return this._refreshToken;
    }
}

interface OpenidResponse {
    access_token: string;
    expires_in: number;
    refresh_expires_in: number;
    refresh_token: string;
    token_type: string;
    id_token: string;
    "not-before-policy": number;
    session_state: string;
    scope: string;
}