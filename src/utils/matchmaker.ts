import { BlockShape } from "../types";

export interface OpponentConfig {
  username: string;
  avatar: string;
  rating: number;
  bio: string;
  speedMs: number; // Block placement speed
  greeting: string;
  winQuote: string;
  loseQuote: string;
}

export const MATCHMAKER_POOL: OpponentConfig[] = [
  {
    username: "Marcus_V",
    avatar: "avatar1",
    rating: 1450,
    bio: "Hardcore puzzle grid designer. I optimize row combinations.",
    speedMs: 3800,
    greeting: "Let's see if your JSTL servlet speed matches my board skills!",
    winQuote: "Calculated placements. Better luck next time!",
    loseQuote: "Exceptional grid layout. Your combo was too swift!"
  },
  {
    username: "Elena_K",
    avatar: "avatar3",
    rating: 1820,
    bio: "Double-cascade master from Berlin. Competitive block champion.",
    speedMs: 2900,
    greeting: "Prepared for a global speed clash? I don't build gaps!",
    winQuote: "Beautiful double lines. Victory runs in my profile!",
    loseQuote: "Your packing density was pristine. Bravo!"
  },
  {
    username: "Koji_S",
    avatar: "avatar5",
    rating: 1150,
    bio: "Dynamic JEE server-side fan. Coder by day, block solver by night.",
    speedMs: 4500,
    greeting: "Connecting JDBC... Matchmaking socket open. Good luck!",
    winQuote: "Database commit successful! Full points logged.",
    loseQuote: "My collection was crowded. No valid slots remaining!"
  },
  {
    username: "Cap_JSTL",
    avatar: "avatar2",
    rating: 1610,
    bio: "I don't use frameworks, I write pure taglibs and custom loops.",
    speedMs: 3200,
    greeting: "Tag libraries compile fast, but my grid clears faster!",
    winQuote: "Standard page compilation successful. Grid clean!",
    loseQuote: "A fatal overlap exception occurred on line 8!"
  },
  {
    username: "PixelQueen",
    avatar: "avatar4",
    rating: 1980,
    bio: "Rank #12 on international standings. Streak focus is absolute.",
    speedMs: 2400,
    greeting: "Beware! I play the corners and run a highly aggressive board.",
    winQuote: "Untouchable packing! Back to practice, challenger.",
    loseQuote: "Wow, you managed to clear line after line. Legendary play!"
  }
];

export function getRandomOpponent(excludeName?: string): OpponentConfig {
  const filtered = excludeName 
    ? MATCHMAKER_POOL.filter(o => o.username !== excludeName)
    : MATCHMAKER_POOL;
  const idx = Math.floor(Math.random() * filtered.length);
  return filtered[idx];
}

export const QUEUE_MESSAGES = [
  "Connecting to global Matchmaking Broker...",
  "Querying secure server peer pools...",
  "Running ping tests against regional Tomcat nodes...",
  "Evaluating active player latency...",
  "Checking standby queue lists...",
  "Matching with suitable tournament challenger...",
  "Synchronizing game board sockets... Complete!"
];
