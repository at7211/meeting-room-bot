import { cancel } from '../query';

export default async function cancelMeeting(context) {
  const { text: numberCode } = context.event;

  if (!/\d*/.test(numberCode)) {
    await context.chat.postMessage({
      response_type: 'in_channel',
      text: '輸入格式不正確:thinking_face:',
    });

    return;
  }

  await cancel(numberCode);
  await context.chat.postMessage({
    response_type: 'in_channel',
    text: '刪除成功:shushing_face:',
  });
}
