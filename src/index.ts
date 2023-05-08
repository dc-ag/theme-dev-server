import * as fs from "fs";
import { RunOptions, Server } from "./Server.js";

function verifyOptions(options: any): boolean {
    if (options.username === undefined) {
        console.error('"username" not defined in options!');
        return false;
    }

    if (options.password === undefined) {
        console.error('"password" not defined in options!');
        return false;
    }

    if (options.dataBaseUrl === undefined) {
        console.error('"dataBaseUrl" not defined in options!');
        return false;
    }

    if (options.language === undefined) {
        console.error('"language" not defined in options!');
        return false;
    }

    if (options.themeName === undefined) {
        console.error('"themeName" not defined in options!');
        return false;
    }
    return true;
}

function mainTemplateAvailableAndReadable(mainTemplateName: string) {
    try {
        fs.readFileSync(mainTemplateName, "utf8");
    } catch {
        console.error(`Could not read main template. Make sure you have a ${mainTemplateName} in your project root folder`);
        return false;
    }
    return true;
}

function headerPartialTemplateAvailableAndReadable(headerPartialTemplateName: string) {
    try {
        fs.readFileSync(headerPartialTemplateName, "utf8");
    } catch {
        console.error(`Could not read header partial template. Make sure you have a ${headerPartialTemplateName} in your project root folder`);
        return false;
    }
    return true;
}

export function run(options: any) {
    if (options.mainTemplateName === undefined) {
        options.mainTemplateName = "main.mustache";
    }

    if (options.headerPartialTemplateName === undefined) {
        options.headerPartialTemplateName = "headerPartial.mustache";
    }

    if (
        !verifyOptions(options)
        || !mainTemplateAvailableAndReadable(options.mainTemplateName)
        || !headerPartialTemplateAvailableAndReadable(options.headerPartialTemplateName)
    ) return;

    const server = new Server(options as RunOptions);
    server.run();
}

