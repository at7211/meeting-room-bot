import fetch from 'node-fetch';

export default function getUserDisplayName(userId) {
  return fetch(
    `https://slack.com/api/users.info?token=${process.env.SLACK_ACCESS_TOKEN}&user=${userId}&pretty=1`
  )
    .then((response) => {
      return response.json();
    })
    .then(
      (response) =>
        response.user.profile.display_name || response.user.profile.real_name
    )
    .catch((e) => console.log('e', e));
}
