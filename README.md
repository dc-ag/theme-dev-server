Package to run a small webserver for developing a theme for the dynamic commerce ecosystem.

## Install

`npm install dynamic-commerce-theme-dev-server`

## Basic usage

```javascript
import {run} from "dynamic-commerce-theme-dev-server";

const options = {
    dataBaseUrl: "http://YOURDOMAIN.de",
    language: "de-DE"
}

run(options);
```

