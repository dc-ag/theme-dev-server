Package to run a small webserver for developing a theme for the dynamic commerce ecosystem.

## Install

`npm install dynamic-commerce-theme-dev-server`

## Basic usage

```javascript
import { run } from "dc-ag-theme-dev-server";

// NEVER COMMIT YOUR CREDENTIALS

var options = {
    username: "",                   // Your Usename/E-Mail
    password: "",                   // Your password
    dataBaseUrl: "",                // Base URL of the website
    language: "",                   // The language you whish the website to be in (e.g. de-DE)
    themeName: "",                  // The name of the theme currently being worked with
    //basicAuthUsername: "",        // (optional) If the website has additional Basic Auth enabled
    //basicAuthPasswor?: "",        // (optional) If the website has additional Basic Auth enabled
    //port: 3000,                   // Port on which to run the local server on
    //mainTemplateName: "",         // Main template (defaults to main.mustache)
    //headerPartialTemplateName: "" // Header Partial template (defaults to headerPartial.mustache)
}

run(options);
```

