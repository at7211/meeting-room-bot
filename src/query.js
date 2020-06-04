import mysql from 'mysql2';
import moment from 'moment';
moment.locale('zh-tw');

const pool = mysql.createPool({
  host: '35.229.192.120',
  user: 'rytass',
  database: 'rytass_meetings',
  password: 'rytass2O15',
});

const promisePool = pool.promise();

// simple query
export const readList = (dateTime) => {
  return promisePool.query(
    'SELECT * FROM list WHERE date = ? ORDER BY startTime ASC;',
    [dateTime]
  );
};

export const cancel = (numberCode) => {
  return promisePool.query(
    'UPDATE list SET cancelledTime = ? WHERE numberCode = ?',
    [moment().format('YYYY-MM-DD HH:mm:ss'), numberCode]
  )
  .catch(e => console.error('e', e));
};

export const book = async (
  booker,
  date,
  startTime,
  endTime,
  userId,
  purpose
) => {
  const connection = await promisePool.getConnection();

  await connection.query('START TRANSACTION;');

  const conflicts = await connection
    .query(
      'SELECT * FROM list WHERE date = ? AND endTime > ? AND startTime < ? ORDER BY startTime ASC FOR UPDATE;',
      [date, startTime, endTime]
    )
    .then((result) => result[0].filter((meeting) => meeting.cancelledTime));

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
    'INSERT INTO list (numberCode, booker, rentTime, date, startTime, endTime, userId, purpose) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
    [
      currentNumberCode,
      booker,
      moment().format('YYYY-MM-DD HH:mm:ss'),
      date,
      startTime,
      endTime,
      userId,
      purpose,
    ]
  );

  await connection.query('COMMIT;');

  connection.release();

  return currentNumberCode;
};
