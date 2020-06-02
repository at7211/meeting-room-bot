import { readList } from './query';

async function HandleSlashCommand(context) {
  // check the action from button or menu
  console.log(context.event.command);
  console.log(context.event.text);

  const d = await readList('2020-05-31');

  await context.sendText(
    `booker ${d[0][0].booker}`
  );

  await context.sendText(
    `I received slash command '${context.event.command}' with arguments: '${context.event.text}'`
  );

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
