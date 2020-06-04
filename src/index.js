import { router, route } from 'bottender/router';
import getDateList from './action/getDateList';
import bookMeeting from './action/bookMeeting';
import cancelMeeting from './action/cancelMeeting';

function command(name, Action) {
  return route((context) => context.event.command === name, Action);
}

async function SayHi(context) {
  await context.sendText('Hi!');
}

async function HandleSlashCommand(context) {
  // check the action from button or menu
  console.log(context.event.command);
  console.log(context.event.text);

  // eslint-disable-next-line prettier/prettier
  return router([
    command('/test', SayHi),
    command('/meetings', getDateList),
    command('/book', bookMeeting),
    command('/cancel', cancelMeeting),
  ]);
}

async function HandleDefaultEvent(context) {
  await context.sendText("I didn't receive a slash command");
}

module.exports = async function App(context) {
  // check if an event is from slash command
  if (context.event.isCommand) {
    return HandleSlashCommand;
  }

  return HandleDefaultEvent;
};
