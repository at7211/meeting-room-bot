const moment = require('moment');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { google } = require('googleapis');
const qs = require('querystring');

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
];

const TOKEN_PATH = path.resolve(__dirname, '../', 'token.json');
const CREDENTIAL_PATH = path.resolve(__dirname, '../', 'credentials.json')

// fs.readFile(CREDENTIAL_PATH, (err, content) => {
//   if (err) return console.log('Error loading client secret file:', err);

//   authorize(JSON.parse(content), listEvents);
// });

function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);

    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);

      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

export function listEvents(auth) {
  const calendar = google.calendar({version: 'v3', auth});
  calendar.events.list({
    calendarId: 'rytass.com_cvj20q5g4u6iiri6126eka0aj0@group.calendar.google.com',
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const events = res.data.items;
    if (events.length) {
      console.log('Upcoming 10 events:');
      events.map((event, i) => {
        const start = event.start.dateTime || event.start.date;
        console.log(`${start} - ${event.summary}`);
      });
    } else {
      console.log('No upcoming events found.');
    }
  });
}

export async function insertEvent(resource) {
  let eventId = '';

  await fs.readFile(CREDENTIAL_PATH, async (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);

    console.log('1')

    await authorize(JSON.parse(content), async (auth) => {
      console.log('2')
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

      const calendar = await google.calendar({version: 'v3', auth});

      await calendar.events.insert({
        calendarId: 'rytass.com_cvj20q5g4u6iiri6126eka0aj0@group.calendar.google.com',
        resource: event,
      }, async function(err, event) {
        if (err) {
          console.log('There was an error contacting the Calendar service: ' + err);
          return;
        }

        console.log('event', event);
        console.log('Event created: %s', event.data.htmlLink);
        eventId = await event.data.htmlLink;
      });
    });
  });

  return qs.parse(eventId.replace(/^\?/, ''));
}

export function deleteEvent(eventId) {
  fs.readFile(CREDENTIAL_PATH, (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);

    console.log('eventId', eventId);

    authorize(JSON.parse(content), (auth) => {
      const calendar = google.calendar({version: 'v3', auth});

      calendar.events.delete({
        calendarId: 'rytass.com_cvj20q5g4u6iiri6126eka0aj0@group.calendar.google.com',
        eventId: eventId,
      }, function(err, event) {
        if (err) {
          console.log('There was an error contacting the Calendar service: ' + err);
          return;
        }

        console.log('event', event);
      });
    });
  });
}
