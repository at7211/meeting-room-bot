FROM node:12-slim

ENV HOME /root
ENV PORT 80
ENV NODE_ENV production

RUN mkdir -p /www/rytass_meeting_room
ADD dist/ /var/www/rytass_meeting_room

WORKDIR /var/www/rytass_meeting_room

RUN npm i

EXPOSE 80

CMD [ "npm", "start" ]