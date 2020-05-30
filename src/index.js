module.exports = async function App(context) {
  await context.sendText(`I received '${context.event.text}'`);
};
