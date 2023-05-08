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
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const fs = __importStar(require("fs"));
const Server_js_1 = require("./Server.js");
function verifyOptions(options) {
    if (options.username === undefined) {
        console.log('"username" not defined in options!');
        return false;
    }
    if (options.password === undefined) {
        console.log('"password" not defined in options!');
        return false;
    }
    if (options.dataBaseUrl === undefined) {
        console.log('"dataBaseUrl" not defined in options!');
        return false;
    }
    if (options.language === undefined) {
        console.log('"language" not defined in options!');
        return false;
    }
    return true;
}
function mainTemplateAvailableAndReadable(mainTemplateName) {
    try {
        fs.readFileSync(mainTemplateName, "utf8");
    }
    catch {
        console.error(`Could not read main template. Make sure you have a ${mainTemplateName} in your project root folder`);
        return false;
    }
    return true;
}
function headerPartialTemplateAvailableAndReadable(headerPartialTemplateName) {
    try {
        fs.readFileSync(headerPartialTemplateName, "utf8");
    }
    catch {
        console.error(`Could not read header partial template. Make sure you have a ${headerPartialTemplateName} in your project root folder`);
        return false;
    }
    return true;
}
function run(options) {
    if (options.mainTemplateName === undefined) {
        options.mainTemplateName = "main.mustache";
    }
    if (options.headerPartialTemplateName === undefined) {
        options.headerPartialTemplateName = "headerPartial.mustache";
    }
    console.log(options);
    if (!verifyOptions(options)
        || !mainTemplateAvailableAndReadable(options.mainTemplateName)
        || !headerPartialTemplateAvailableAndReadable(options.headerPartialTemplateName))
        return;
    console.log("here");
    const server = new Server_js_1.Server(options);
    server.run();
}
exports.run = run;
