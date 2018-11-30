# al-azure-collector-js

[![Build Status](https://secure.travis-ci.org/alertlogic/al-azure-collector-js.png?branch=master)](http://travis-ci.org/alertlogic/al-azure-collector-js)

Alert Logic cloud collector for Azure common library.


# Overview

This repository contains the common JavaScript functions used by Node.js collectors in the Azure cloud.

# HOWTO use this library in an Azure function

Create a `package.json` file for [npm](https://www.npmjs.com/) 2.7.0 (or greater) in the root of your Azure function Node.js root directory.  Include this repo in the `dependencies` and `devDependencies` section as required.  

For example:

```
{
  "name": "al-my-collector",
  "version": "1.0.0",
  "description": "Alert Logic My Collector",
  "repository": {},
  "private": true,
  "scripts": {
    "start": "node index.js",
    "lint": "jshint --exclude \"./node_modules/*\" **/*.js",
    "test": "JUNIT_REPORT_PATH=./test/report.xml nyc --reporter=cobertura mocha --colors --reporter mocha-jenkins-reporter"
  },
  "devDependencies": {
    "jshint": "^2.9.5",
    "mocha": "^3.5.3",
    "mocha-jenkins-reporter": "^0.3.10",
    "nyc": "^11.3.0",
    "rewire": "^2.5.2",
    "sinon": "^3.3.0"
  },
  "dependencies": {
    "async": "*",
    "moment": "^2.19.2",
    "request": "*",
    "request-promise-native": "*",
    "al-azure-collector-js": "git://github.com/alertlogic/al-azure-collector-js#master"
  },
  "author": "Alert Logic Inc."
}
```

# Library Structure

The library provides some common building blocks for implementing Azure collectors.
Helper function and classes are grouped by Azure functions an Alert Logic collector usually consist of.

## Master

Contains helper classes and functions for Master Azure function for performing registration, periodic health checks and deregistration.

## Updater

Contains base class for implementing Updater Azure function action for updating entire Azure Web Application. 

## Collector

Contains wrappers over Ingestion service API and helpful utilities for data formatting.

## Scaler

Contains helpers for scaling in and out any Azure resources deployed together with a collector.


# Known Issues/ Open Questions

- TBD.

# Useful Links

- [Node.js static code analysis tool](http://jshint.com/install/)
- [Node.js rewire testing tool](https://github.com/jhnns/rewire)
- [Node.js sinon testing tool](http://sinonjs.org/)
- [Node.js nock HTTP request mocking tool](https://github.com/nock/nock)

