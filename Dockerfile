FROM node:10-alpine

ENV HOME /root
ENV PORT 80
ENV DEBUG OCW_WEB:*
ENV NODE_ENV production

RUN mkdir -p /www/rytass_meeting_room
ADD dist/ /var/www/rytass_meeting_room

WORKDIR /var/www/rytass_meeting_room

RUN npm i

EXPOSE 80

CMD node /var/www/rytass_meeting_room/index.js