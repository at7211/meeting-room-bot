import fetch from 'node-fetch';

export default function getUserInfo(userId) {
  return fetch(
    `https://slack.com/api/users.info?token=${process.env.SLACK_ACCESS_TOKEN}&user=${userId}&pretty=1`
  )
    .then((response) => {
      return response.json();
    })
    .then(
      (response) => {
        console.log('response', response)
        return {
            name: response.user.profile.display_name ?? response.user.profile.real_name ?? '',
            email: response.user.profile.email ?? '',
        }
      }
    )
    .catch((e) => console.log('e', e));
}
