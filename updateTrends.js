import https from 'https';
import { readFile, writeFile } from 'fs/promises';

const TOP_STORIES_URL = 'https://hacker-news.firebaseio.com/v0/topstories.json';
const ITEM_URL = id => `https://hacker-news.firebaseio.com/v0/item/${id}.json`;

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      })
      .on('error', reject);
  });
}

async function fetchTopStories(limit = 5) {
  const ids = await fetchJson(TOP_STORIES_URL);
  const topIds = ids.slice(0, limit);
  const stories = [];

  for (const id of topIds) {
    const item = await fetchJson(ITEM_URL(id));
    stories.push(item);
  }

  return stories;
}

function generateTrendSection(stories) {
  const today = new Date().toISOString().split('T')[0];
  let md = `\n---\n\n# 📰 오늘의 개발 트렌드 (Updated: ${today})\n\n`;

  stories.forEach((story, i) => {
    const title = story.title || 'No title';
    const url = story.url || `https://news.ycombinator.com/item?id=${story.id}`;
    md += `### ${i + 1}. [${title}](${url})\n`;
    md += `💬 ${story.score} points | 🧑‍💻 by ${story.by}\n\n`;
  });

  return md;
}

const stories = await fetchTopStories();
const trendsMarkdown = generateTrendSection(stories);

// 기존 README 내용 읽기
const readmePath = 'README.md';
const originalReadme = await readFile(readmePath, 'utf8');

// --- 이후 내용은 덮어쓰기 (기존 고정 내용 유지)
const fixedPart = originalReadme.split('---')[0]; // '---' 기준으로 고정 부분 분리
const updatedReadme = fixedPart.trim() + trendsMarkdown;

await writeFile(readmePath, updatedReadme, 'utf8');

console.log('✅ README.md updated with today’s developer trends!');