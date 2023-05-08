import * as fs from "fs";
import { RunOptions, Server } from "./Server.js";

function verifyOptions(options: any): boolean {
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

    console.log(options);
    if (
        !verifyOptions(options)
        || !mainTemplateAvailableAndReadable(options.mainTemplateName)
        || !headerPartialTemplateAvailableAndReadable(options.headerPartialTemplateName)
    ) return;

    console.log("here");
    const server = new Server(options as RunOptions);
    server.run();
}

