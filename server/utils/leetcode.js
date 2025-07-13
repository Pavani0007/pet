// // utils/leetcode.js
// import axios from 'axios';

// /**
//  * Fetch LeetCode Daily Challenge for a given date (YYYY‑MM‑DD, UTC).
//  * Returns { title, titleSlug, difficulty }  or  null if not found.
//  */
// export const fetchDailyChallenge = async (isoDateStr) => {
//   const query = `
//     query daily($date: String!) {
//       dailyCodingChallengeV2(date: $date) {
//         question { title titleSlug difficulty }
//       }
//     }`;
//   const res = await axios.post(
//     'https://leetcode.com/graphql',
//     { query, variables: { date: isoDateStr } },
//     { headers: { 'Content-Type': 'application/json' } }
//   );

//   return res.data?.data?.dailyCodingChallengeV2?.question ?? null;
// };
