FROM node:22-slim AS builder

# install git to install plugins
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app
COPY package.json .
COPY package-lock.json* .
COPY .npmrc* .
COPY local-plugins/ ./local-plugins/
COPY quartz/ ./quartz/
COPY quartz.lock.json* .
RUN npm ci && npx quartz plugin install

FROM node:22-slim
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/ /usr/src/app/
COPY . .
RUN test -f /usr/src/app/quartz.ts
RUN grep -Fq "const contentRoot = path.resolve(argv.directory)" /usr/src/app/quartz/build.ts
RUN mkdir -p content
EXPOSE 2222 3001
CMD ["npx", "quartz", "build", "--serve", "--port", "2222"]
