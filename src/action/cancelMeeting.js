import { cancel } from '../query';

export default async function cancelMeeting(context) {
  const { text: numberCode } = context.event;
  console.log('numberCode', numberCode);

  if (!/\d*/.test(numberCode)) {
    context.sendText('輸入格式不正確:thinking_face:');

    return;
  }

  await cancel(numberCode);
  await context.sendText('刪除成功:shushing_face:');
}
