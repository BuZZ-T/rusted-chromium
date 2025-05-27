FROM node:24-alpine AS build

WORKDIR /build

COPY . /build/
COPY ./package.json /build
COPY ./package-lock.json /build

RUN npm ci
RUN npm run build -- --outDir ./dist

FROM node:24-alpine AS production

WORKDIR /app

COPY --from=build /build/dist /app/
COPY ./bin/rusted-chromium.js /app/bin/rusted-chromium.js

RUN npm install --omit=dev

ENTRYPOINT ["node", "/app/bin/rusted-chromium.js"]
