import moment from 'moment';
import { readList } from '../query';

export default async function checkConflict(date, startTime, endTime) {
  const [list] = await readList(date);

  return list
    ?.filter((date) => !date.cancelledTime)
    .find(
    (meeting) =>
      moment(meeting.endTime, 'HH:mm').isAfter(moment(startTime, 'HH:mm')) &&
      moment(meeting.startTime, 'HH:mm').isBefore(moment(endTime, 'HH:mm'))
  );
}
