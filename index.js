import http, { ServerResponse, ClientRequest } from "http";
import colors from "colors";
import mustache from "mustache";
import fs from "fs";
import fetch from "node-fetch";

const mainTemplateName = "main.mustache";
const headerPartialTemplateName = "headerPartial.mustache";

export function run(options, port = 3000) {
  if (
    !validateOptions(options) ||
    !mainTemplateAvailableAndReadable() ||
    !headerPartialTemplateAvailableAndReadable()
  ) {
    return;
  }

  /**
   * @param {ClientRequest} request
   * @param {ServerResponse} response
   */
  const requestHandler = async (request, response) => {
    if (request.url === "/favicon.ico") {
      return;
    }

    if(request.url != '/') {
      const possibleFilePath = request.url.substr(1);
      if(fs.existsSync(possibleFilePath)) {
        response.end(fs.readFileSync(possibleFilePath));
        return;
      }
    }

    const mainTemplate = fs.readFileSync(mainTemplateName, "utf8");
    const headerPartial = fs.readFileSync(headerPartialTemplateName, "utf8");
    const masterFrontendTemplate = await getMasterFrontendTemplateContent(
      options.dataBaseUrl
    );
    const contentData = await getContentData(
      options.dataBaseUrl + request.url,
      options.language
    );

    const renderedContent = mustache.render(
      masterFrontendTemplate,
      {...contentData, themeRoot : ""},
      {
        headerPartial: headerPartial,
        bodyPartial: mainTemplate,
      }
    );

    response.setHeader("content-type", "text/html");
    response.end(renderedContent);
  };

  const server = http.createServer(requestHandler);

  server.listen(port, (err) => {
    if (err) {
      return console.log(`Something went wrong`.red, err);
    }

    console.log(`Server is listening on ${port}`.green);
  });
}

async function getMasterFrontendTemplateContent(baseUrl) {
  return await fetch(baseUrl + "/templates/masterFrontend.mustache")
    .then((res) => res.text())
    .then((body) => {
      return body;
    });
}

async function getContentData(url, language) {
  return await fetch(url, {
    headers: {
      "accept-language": language,
      accept: "application/json",
    },
  })
    .then((res) => res.json())
    .then((body) => {
      return body;
    });
}

function validateOptions(options) {
  if (options.dataBaseUrl === undefined || options.dataBaseUrl === "") {
    console.log(
      "dataBaseUrl is not valid, please provide a url like http://YOURDOMAIN.de"
        .red
    );
    return false;
  }

  if (options.language === undefined || options.language === "") {
    console.log(
      "language is not valid, please provide a language like de-DE".red
    );
    return false;
  }

  return true;
}

function mainTemplateAvailableAndReadable() {
  try {
    fs.readFileSync(mainTemplateName, "utf8");
  } catch {
    console.log(
      `Could not read main template. Make sure you have a ${mainTemplateName} in your project root folder`
        .red
    );
    return false;
  }

  return true;
}

function headerPartialTemplateAvailableAndReadable() {
  try {
    fs.readFileSync(headerPartialTemplateName, "utf8");
  } catch {
    console.log(
      `Could not read header partial template. Make sure you have a ${headerPartialTemplateName} in your project root folder`
        .red
    );
    return false;
  }

  return true;
}
