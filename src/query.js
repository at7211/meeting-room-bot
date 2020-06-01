import mysql from 'mysql2';
import moment from 'moment';

const pool = mysql.createPool({
  // @rytass host
  // host: '35.229.192.120',
  host: 'localhost',
  user: 'root',
  database: 'rytass_meeting_room',
  password: '7211',
});

const promisePool = pool.promise();

// simple query
export const readList = (dateTime) => {
  return promisePool.query(
    'SELECT * FROM list WHERE date = ? ORDER BY startTime ASC;',
    [dateTime]
  );
};

export const book = async (
  booker,
  rentTime,
  date,
  startTime,
  endTime,
  userId,
  cancelledTime
) => {
  const connection = await promisePool.getConnection();

  await connection.query('START TRANSACTION;');

  const conflicts = await connection
    .query(
      'SELECT * FROM list WHERE date = ? AND endTime > ? AND startTime < ? ORDER BY startTime ASC FOR UPDATE;',
      [date, startTime, endTime]
    )
    .then((result) => result[0]);

  const lastNumberCode = await connection
    .query(
      'SELECT numberCode AS lastNumberCode FROM list WHERE date = ? order by numberCode desc limit 1 FOR UPDATE;',
      [date]
    )
    .then(
      (result) =>
        (result[0][0] && result[0][0].lastNumberCode) ||
        `${moment(date, 'YYYY-MM-DD').format('YYMMDD')}0000`
    );

  const currentNumberCode = String(Number(lastNumberCode) + 1);

  if (conflicts.length) throw new Error('ERROR! booking is conflict');

  await connection.query(
    'INSERT INTO list (numberCode, booker, rentTime, date, startTime, endTime, userId, cancelledTime) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
    [
      currentNumberCode,
      booker,
      rentTime,
      date,
      startTime,
      endTime,
      userId,
      cancelledTime,
    ]
  );

  await connection.query('COMMIT;');
  // check
};

/** EXAMPLE */
// book(
//   'Jay',
//   '2020-05-31 00:04:00',
//   '2020-05-31',
//   '14:30',
//   '16:40',
//   '1',
// )

/** EXAMPLE */
// readList(moment().format('YYYY-MM-DD')).then(x => console.log('x', x[0]));
