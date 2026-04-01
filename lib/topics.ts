export const TOPICS = [
  { slug: "overall",           name: "Overall",           description: "General college prestige and reputation" },
  { slug: "computer-science",  name: "Computer Science",  description: "CS programs, research, and tech placements" },
  { slug: "business",          name: "Business",          description: "Undergraduate business and MBA programs" },
  { slug: "engineering",       name: "Engineering",       description: "Engineering programs across disciplines" },
  { slug: "biology",           name: "Biology",           description: "Life sciences and pre-med programs" },
  { slug: "psychology",        name: "Psychology",        description: "Psychology research and clinical programs" },
  { slug: "economics",         name: "Economics",         description: "Economics research and career outcomes" },
  { slug: "political-science", name: "Political Science", description: "Political science and public policy" },
  { slug: "communications",    name: "Communications",    description: "Journalism, media, and communications" },
  { slug: "mathematics",       name: "Mathematics",       description: "Math programs and research" },
  { slug: "post-grad-success", name: "Post-Grad Success", description: "Career outcomes, salaries, and placement rates" },
  { slug: "quality-of-life",   name: "Quality of Life",   description: "Campus life, location, and student experience" },
] as const;

export type TopicSlug = typeof TOPICS[number]["slug"];

export const DEFAULT_TOPIC_SLUG = "overall";

// First 5 shown as pills; the rest go in the "More" dropdown
export const PINNED_COUNT = 5;

export function getTopicName(slug: string): string {
  return TOPICS.find(t => t.slug === slug)?.name ?? slug;
}

export function getTopicQuestion(slug: string, name: string): string {
  if (slug === "overall") return "Which college is better overall?";
  if (slug === "quality-of-life") return `Which school has better ${name}?`;
  if (slug === "post-grad-success") return `Which school has better ${name}?`;
  return `Which school is stronger for ${name}?`;
}

export function isValidTopicSlug(slug: string): slug is TopicSlug {
  return TOPICS.some(t => t.slug === slug);
}
