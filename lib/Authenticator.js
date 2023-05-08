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
export class Authenticator {
    constructor(username, password) {
        this.AUTH_URL = 'https://auth.dc.ag/auth/realms/cms/protocol/openid-connect/token';
        this.CLIENT_ID = 'themes-development';
        this.SCOPE = 'openid email profile';
        this._username = username;
        this._password = password;
        this._credentials = Credentials.createExpired();
    }
    login() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const loginResponse = yield axios.post(this.AUTH_URL, {
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
        });
    }
    refresh() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const loginResponse = yield axios.post(this.AUTH_URL, {
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
        });
    }
    getAuthorizedUrl(baseUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._credentials.isExpired()) {
                if (this._credentials.isRefreshExpired()) {
                    yield this.login();
                }
                else {
                    yield this.refresh();
                }
            }
            let url = new URL(baseUrl);
            url.searchParams.append("access_token", this._credentials.accessToken);
            url.searchParams.append("id_token", this._credentials.idToken);
            return url.toString();
        });
    }
}
class Credentials {
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
