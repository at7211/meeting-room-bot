const moment = require('moment');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TOKEN_PATH = path.resolve(__dirname, '../', 'token.json');
const CREDENTIAL_PATH = path.resolve(__dirname, '../', 'credentials.json')


function authorize(credentials) {
  const {client_secret, client_id, redirect_uris} = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const token = fs.readFileSync(TOKEN_PATH);

  oAuth2Client.setCredentials(JSON.parse(token));

  return oAuth2Client;
}

export async function insertEvent(resource) {
  const event = {
    'summary': resource.summary || '未命名會議',
    'location': '一樓會議室',
    'description': resource.description,
    'start': {
      'dateTime': moment(resource.startTime, 'YYYY-MM-DD HH:mm').toISOString(),
    },
    'end': {
      'dateTime': moment(resource.endTime, 'YYYY-MM-DD HH:mm').toISOString(),
    },
    'attendees': [resource.userEmail],
    'reminders': {
      'useDefault': false,
      'overrides': [
        {'method': 'email', 'minutes': 24 * 60},
        {'method': 'popup', 'minutes': 10},
      ],
    },
  };

  console.log('event', event);

  const content = fs.readFileSync(CREDENTIAL_PATH);

  const auth = authorize(JSON.parse(content));

  const calendar = await google.calendar({version: 'v3', auth});

  const response = await calendar.events.insert({
    calendarId: 'rytass.com_cvj20q5g4u6iiri6126eka0aj0@group.calendar.google.com',
    resource: event,
  });

  return response.data.id;
}

export async function deleteEvent(eventId) {
  const content = fs.readFileSync(CREDENTIAL_PATH);

  const auth = authorize(JSON.parse(content));

  const calendar = await google.calendar({version: 'v3', auth});
  console.log(eventId);
  calendar.events.delete({
    calendarId: 'rytass.com_cvj20q5g4u6iiri6126eka0aj0@group.calendar.google.com',
    eventId: eventId,
  }).catch(e => console.log(JSON.stringify(e)));
}
