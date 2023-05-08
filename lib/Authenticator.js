"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Authenticator = void 0;
const axios_1 = __importDefault(require("axios"));
class Authenticator {
    AUTH_URL = 'https://auth.dc.ag/auth/realms/cms/protocol/openid-connect/token';
    CLIENT_ID = 'themes-development';
    SCOPE = 'openid email profile';
    _username;
    _password;
    _credentials;
    constructor(username, password) {
        this._username = username;
        this._password = password;
        this._credentials = Credentials.createExpired();
    }
    async login() {
        try {
            const loginResponse = await axios_1.default.post(this.AUTH_URL, {
                grant_type: 'password',
                scope: this.SCOPE,
                client_id: this.CLIENT_ID,
                username: this._username,
                password: this._password,
            }, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            });
            this._credentials = Credentials.fromOpenidResponse(loginResponse.data);
        }
        catch (error) {
            console.error(error);
        }
    }
    async refresh() {
        try {
            const loginResponse = await axios_1.default.post(this.AUTH_URL, {
                grant_type: 'refresh_token',
                scope: this.SCOPE,
                client_id: this.CLIENT_ID,
                refresh_token: this._credentials.refreshToken,
            }, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            });
            this._credentials = Credentials.fromOpenidResponse(loginResponse.data);
        }
        catch (error) {
            console.error(error);
        }
    }
    async getAuthorizedUrl(baseUrl) {
        if (this._credentials.isExpired()) {
            if (this._credentials.isRefreshExpired()) {
                await this.login();
            }
            else {
                await this.refresh();
            }
        }
        let url = new URL(baseUrl);
        url.searchParams.append("access_token", this._credentials.accessToken);
        url.searchParams.append("id_token", this._credentials.idToken);
        return url.toString();
    }
}
exports.Authenticator = Authenticator;
class Credentials {
    _accessToken;
    _idToken;
    _refreshToken;
    _expiresAt;
    _refreshExpiresAt;
    constructor(accessToken, idToken, refreshToken, expiresIn, refreshExpiresIn) {
        this._accessToken = accessToken;
        this._idToken = idToken;
        this._refreshToken = refreshToken;
        this._expiresAt = new Date(Date.now() + ((expiresIn - 5) * 1000));
        this._refreshExpiresAt = new Date(Date.now() + ((refreshExpiresIn - 5) * 1000));
    }
    static fromOpenidResponse(response) {
        return new Credentials(response.access_token, response.id_token, response.refresh_token, response.expires_in, response.refresh_expires_in);
    }
    isExpired(date = new Date()) {
        return this._expiresAt < date;
    }
    isRefreshExpired(date = new Date()) {
        return this._refreshExpiresAt < date;
    }
    static createExpired() {
        return new Credentials('', '', '', 0, 0);
    }
    get accessToken() {
        return this._accessToken;
    }
    get idToken() {
        return this._idToken;
    }
    get refreshToken() {
        return this._refreshToken;
    }
}
