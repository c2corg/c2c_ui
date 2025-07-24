#!/bin/sh

cd /c2c_ci
npm ci
npm run lint:no-fix
npm run build
