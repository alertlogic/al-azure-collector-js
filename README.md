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
    "lint": "jshint --show-non-errors --exclude \"./node_modules/*\" **/*.js",
    "test": "JUNIT_REPORT_PATH=./test/report.xml nyc --reporter=cobertura --reporter=text mocha --colors"
  },
  "devDependencies": {
    "jshint": "^2.13.6",
    "mocha": "^10.8.2",
    "mocha-jenkins-reporter": "^0.4.8",
    "nyc": "^17.1.0",
    "sinon": "^18.0.1"
  },
  "dependencies": {
    "@alertlogic/al-collector-js": "^3.0.20",
    "@azure/arm-appservice": "^5.8.0",
    "@azure/identity": "^4.3.0",
    "@azure/storage-blob": "^12.25.0",
    "@azure/storage-queue": "^12.21.0",
    "parse-key-value": "^1.0.0",
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
- [Node.js sinon testing tool](http://sinonjs.org/)
- [Node.js nock HTTP request mocking tool](https://github.com/nock/nock)

