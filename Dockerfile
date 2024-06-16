FROM node:20-alpine as build

WORKDIR /build

COPY . /build/
COPY ./package.json /build
COPY ./package-lock.json /build

RUN npm ci
RUN npm run build -- --outDir ./dist

FROM node:20-alpine

WORKDIR /app

COPY --from=build /build/dist /app/
COPY ./bin/rusted-chromium.js /app/bin/rusted-chromium.js

RUN npm install --omit=dev

ENTRYPOINT ["node", "/app/bin/rusted-chromium.js"]
