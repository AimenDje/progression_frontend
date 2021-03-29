#Commandes pour build et run l'image Docker
# docker build -t "progression" .
# docker run -d -p 8080:8080 progression

FROM node:lts-alpine as build-stage



# install simple http server for serving static content
RUN npm install -g http-server



# make the 'app' folder the current working directory
WORKDIR /app



# copy both 'package.json' and 'package-lock.json' (if available)
COPY app/package*.json ./


# install project dependencies
RUN npm install

# copy project files and folders to the current working directory (i.e. 'app' folder)
COPY app/ /app

# build app for production with minification
#RUN npm run build

# Développement
EXPOSE 8080
CMD [ "npm", "run", "serve" ]


# Production 
# FROM nginx:stable-alpine as production-stage
# COPY --from=build-stage /app/dist /usr/share/nginx/html
# EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]