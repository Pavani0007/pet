import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function fetchCommits(owner, repo) {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    console.error('Please set GITHUB_TOKEN in .env');
    return;
  }

  try {
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/commits`,
      {
        headers: { Authorization: `token ${token}` },
      }
    );

    console.log(`Latest commits for ${owner}/${repo}:`);
    response.data.forEach((commit, i) => {
      console.log(
        `${i + 1}`
      );
    });
  } catch (error) {
    console.error('Error fetching commits:', error.message);
  }
}

// Replace these with the repo you want to test:
fetchCommits('facebook', 'react');
