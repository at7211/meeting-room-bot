import { readList } from '../query';
import moment from 'moment';

moment.locale('zh-tw');

export default async function getDateList(context) {
  const text = context.event?.text || '';
  const responseList = [];

  if (text && !/\d{1,2}\/?\d{1,2}/.test(text)) {
    await context.chat.postMessage({
      response_type: 'in_channel',
      text: '輸入格式不正確:thinking_face:',
    });

    return;
  }

  const date = text
    ? moment(text, 'MM/DD').format('YYYY-MM-DD')
    : moment().format('YYYY-MM-DD');

  const [list] = await readList(date);

  if (!list.length) {
    context.chat.postMessage({
      response_type: 'in_channel',
      text: `${date}尚無預定會議:mb:`,
    });

    return;
  }

  list.forEach((meeting) => {
    const {
      booker,
      startTime,
      endTime,
      purpose,
      numberCode,
      cancelledTime,
    } = meeting;

    if (cancelledTime) return;

    responseList.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `
          ${date} ${startTime}-${endTime} ${purpose || '未命名會議'}\n登記人：${booker} 會議編號: ${numberCode}
        `}
    });
  });

  if (!responseList.length) {
    await context.sendText(`${date}尚無預定會議:mb:`);

    return;
  }

  await context.chat.postMessage({
    response_type: 'in_channel',
    blocks: responseList,
  });
}
