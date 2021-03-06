import mysql from 'mysql2';
import moment from 'moment';
import { deleteEvent } from './calendar';

moment.locale('zh-tw');

const pool = mysql.createPool({
  host: process.env.DATABASE_PASSWORD,
  user: 'rytass',
  database: 'rytass_meetings',
  password: process.env.DATABASE_PASSWORD,
});

const promisePool = pool.promise();

// simple query
export const readList = (dateTime) => {
  return promisePool.query(
    'SELECT * FROM list WHERE date = ? ORDER BY startTime ASC;',
    [dateTime]
  );
};

export const cancel = async (numberCode) => {
  const eventId = await promisePool.query(
    'SELECT eventId FROM list WHERE numberCode = ?;',
    [numberCode]
  )
  .then((result) => {
    console.log('result', result);
    return result[0][0].eventId
  })
  .catch(e => console.error('e', e));

  return promisePool.query(
    'UPDATE list SET cancelledTime = ? WHERE numberCode = ?',
    [moment().format('YYYY-MM-DD HH:mm:ss'), numberCode]
  )
  .then(() => deleteEvent(eventId))
  .catch(e => console.error('e', e));
};

export const book = async (
  booker,
  date,
  startTime,
  endTime,
  userId,
  purpose,
  eventId,
) => {
  const connection = await promisePool.getConnection();

  await connection.query('START TRANSACTION;');

  const conflicts = await connection
    .query(
      'SELECT * FROM list WHERE date = ? AND endTime > ? AND startTime < ? ORDER BY startTime ASC FOR UPDATE;',
      [date, startTime, endTime]
    )
    .then((result) => result[0].filter((meeting) => !meeting.cancelledTime));

  const lastNumberCode = await connection
    .query(
      'SELECT numberCode AS lastNumberCode FROM list WHERE date = ? order by numberCode desc limit 1 FOR UPDATE;',
      [date]
    )
    .then(
      (result) =>
        result[0]?.[0]?.lastNumberCode ??
        `${moment(date, 'YYYY-MM-DD').format('YYMMDD')}0000`
    );

  const currentNumberCode = String(Number(lastNumberCode) + 1);

  if (conflicts.length) {
    await connection.query('ROLLBACK;');

    connection.release();

    throw new Error('ERROR! booking is conflict');
  }

  await connection.query(
    'INSERT INTO list (numberCode, booker, rentTime, date, startTime, endTime, userId, purpose, eventId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
    [
      currentNumberCode,
      booker,
      moment().format('YYYY-MM-DD HH:mm:ss'),
      date,
      startTime,
      endTime,
      userId,
      purpose,
      eventId,
    ]
  );

  await connection.query('COMMIT;');

  connection.release();

  return currentNumberCode;
};
