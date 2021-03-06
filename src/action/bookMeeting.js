import moment from 'moment';
import checkConflict from '../helper/checkConflict';
import getUserInfo from '../helper/getUserInfo';
import { book } from '../query';
import { insertEvent } from '../calendar';

moment.locale('zh-tw');

export default async function bookMeeting(context) {
  const { text } = context.event;
  const {
    user: {
      id: userId,
    },
  } = context.session;

  if (!text) {
    context.sendText('拍謝我沒 get 到，再說一次');

    return;
  }

  // eslint-disable-next-line no-useless-escape
  const meetingTime = text.match(/(\d{1,2}[\/-]?\d{1,2}\s*)?([\d:：]{4,5})[-~]?([\d:：]{4,5})\s*(.*)/);

  if (!meetingTime) {
    context.sendText('格式不符合:open_mouth:');

    return;
  }

  const [, date, startTime, endTime, purpose] = meetingTime;

  const formatDate = date ? moment(date, 'MM/DD').format('YYYY-MM-DD') : moment().format('YYYY-MM-DD');
  const formatStartTime = moment(startTime, 'HH:mm').format('HH:mm');
  const formatEndTime = moment(endTime, 'HH:mm').format('HH:mm');

  if (!startTime || !endTime) {
    context.sendText('格式不符合:open_mouth:');

    return;
  }

  const hasConflictInfo = await checkConflict(
    formatDate,
    formatStartTime,
    formatEndTime
  );

  if (hasConflictInfo) {
    context.sendText(
      `會議時間衝突，請找<@${hasConflictInfo.userId}>喬:face_with_monocle:`
    );

    return;
  }

  // get userInfo
  const userInfo = await getUserInfo(userId);

  const event = {
    summary: purpose,
    description: '',
    startTime: `${formatDate} ${formatStartTime}`,
    endTime: `${formatDate} ${formatEndTime}`,
    userEmail: userInfo.email,
  }

  const responseList = [{
    type: "section",
    text: {
        type: 'plain_text',
        emoji: true,
        text: '會議時間已登記',
    }
   }];

  // get google calendar event id
  await insertEvent(event).then(eventId => {
    book(userInfo.name, formatDate, formatStartTime, formatEndTime, userId, purpose, eventId)
      .then(numberCode => {
        console.log('numberCode', numberCode)
        responseList.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${purpose || '未命名會議'}*\n${formatDate} ${formatStartTime}-${formatEndTime}\n一樓會議室\n登記人：${userInfo.name}\n會議編號：${numberCode}`
          },
          accessory: {
            type: 'image',
            image_url: 'https://api.slack.com/img/blocks/bkb_template_images/notifications.png',
            alt_text: 'calendar thumbnail',
          },
        });

        context.chat.postMessage({
          text: `*${purpose || '未命名會議'}*\n${formatDate} ${formatStartTime}-${formatEndTime}\n一樓會議室\n登記人：${userInfo.name}\n會議編號：${numberCode}`,
          blocks: responseList,
        });
      });
  });
}
