import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/user.model.js';
import Event from './models/event.model.js';
import Post from './models/post.model.js';
import Comment from './models/comment.model.js';
import Song from './models/song.model.js';
import Poll from './models/poll.model.js';
import { Follow } from './models/follow.model.js';

dotenv.config();

const SALT = await bcrypt.genSalt(10);

// ── Users ───────────────────────────────────────────────
const SF = { city: 'San Francisco', state: 'California', country: 'US', coordinates: [-122.4194, 37.7749] };
const SR = { city: 'Santa Rosa', state: 'California', country: 'US', coordinates: [-122.7141, 38.4404] };

const users = [
  {
    fullName: 'Alex Rivera',
    username: 'alexrivera',
    email: 'alex@demo.com',
    password: await bcrypt.hash('password123', SALT),
    bio: 'Music lover & event organizer',
    role: 'admin',
    locationSettings: { searchLocation: SF, nearMeRadius: 25 },
    currentCity: SF
  },
  {
    fullName: 'Jordan Chen',
    username: 'jordanchen',
    email: 'jordan@demo.com',
    password: await bcrypt.hash('password123', SALT),
    bio: 'Live music enthusiast. Always looking for the next show.',
    locationSettings: { searchLocation: SF, nearMeRadius: 30 },
    currentCity: SF
  },
  {
    fullName: 'Sam Patel',
    username: 'sampatel',
    email: 'sam@demo.com',
    password: await bcrypt.hash('password123', SALT),
    bio: 'Developer by day, DJ by night',
    locationSettings: { searchLocation: SR, nearMeRadius: 25 },
    currentCity: SR
  },
  {
    fullName: 'Maya Johnson',
    username: 'mayaj',
    email: 'maya@demo.com',
    password: await bcrypt.hash('password123', SALT),
    bio: 'Photographer & creative director',
    locationSettings: { searchLocation: SR, nearMeRadius: 20 },
    currentCity: SR
  }
];

// ── Songs ───────────────────────────────────────────────
const songData = [
  { title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera' },
  { title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours' },
  { title: 'Redbone', artist: 'Childish Gambino', album: 'Awaken, My Love!' },
  { title: 'Dreams', artist: 'Fleetwood Mac', album: 'Rumours' },
  { title: 'Midnight City', artist: 'M83', album: 'Hurry Up, We\'re Dreaming' },
  { title: 'Electric Feel', artist: 'MGMT', album: 'Oracular Spectacular' },
  { title: 'Do I Wanna Know?', artist: 'Arctic Monkeys', album: 'AM' },
  { title: 'Green Light', artist: 'Lorde', album: 'Melodrama' },
];

// ── Helpers ─────────────────────────────────────────────
const futureDate = (daysFromNow, hour = 19) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return d;
};

// ── Main ────────────────────────────────────────────────
async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clean up existing seed data if present
  const seedEmails = users.map(u => u.email);
  const existingSeedUsers = await User.find({ email: { $in: seedEmails } });
  if (existingSeedUsers.length > 0) {
    const seedUserIds = existingSeedUsers.map(u => u._id);
    await Post.deleteMany({ author: { $in: seedUserIds } });
    await Event.deleteMany({ creator: { $in: seedUserIds } });
    await Comment.deleteMany({ author: { $in: seedUserIds } });
    await Follow.deleteMany({ $or: [{ follower: { $in: seedUserIds } }, { following: { $in: seedUserIds } }] });
    await Song.deleteMany({ submittedBy: { $in: seedUserIds } });
    await Poll.deleteMany({ creator: { $in: seedUserIds } });
    // Remove seed users from other users' followers/following arrays
    await User.updateMany({}, { $pull: { followers: { $in: seedUserIds }, following: { $in: seedUserIds } } });
    await User.deleteMany({ _id: { $in: seedUserIds } });
    console.log('Cleaned up existing seed data');
  }

  // Users
  const createdUsers = await User.insertMany(users);
  const [alex, jordan, sam, maya] = createdUsers;
  console.log(`Created ${createdUsers.length} users`);

  // Follows (alex <-> jordan, sam -> alex, maya -> jordan, maya -> alex)
  const follows = [
    { follower: alex._id, following: jordan._id },
    { follower: jordan._id, following: alex._id },
    { follower: sam._id, following: alex._id },
    { follower: maya._id, following: jordan._id },
    { follower: maya._id, following: alex._id },
  ];
  await Follow.insertMany(follows);

  // TODO: Friendships & Messages

  // Update follower/following arrays on User docs
  for (const f of follows) {
    await User.findByIdAndUpdate(f.follower, { $push: { following: f.following } });
    await User.findByIdAndUpdate(f.following, { $push: { followers: f.follower } });
  }
  console.log(`Created ${follows.length} follow relationships`);

  // Events
  const events = [
    {
      title: 'Rooftop Vinyl Night',
      description: 'Bring your favorite records and enjoy sunset vibes on the rooftop. Full bar and light snacks provided.',
      creator: alex._id,
      location: { ...SF, venue: 'El Techo de Lolinda' },
      date: futureDate(3),
      endDate: futureDate(3, 23),
      category: 'entertainment',
      maxAttendees: 50,
      image: 'https://plus.unsplash.com/premium_photo-1670992114662-1f102c1cec79?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // TODO: add photo
      tags: ['music', 'vinyl', 'rooftop'],
      attendees: [
        { user: jordan._id, status: 'yes' },
        { user: maya._id, status: 'yes' },
        { user: sam._id, status: 'maybe' }
      ]
    },
    {
      title: 'Tech Meetup: Building with AI',
      description: 'Monthly tech meetup focused on practical AI applications. Lightning talks + networking.',
      creator: sam._id,
      location: { ...SR, venue: 'SOFA Santa Rosa' },
      date: futureDate(7, 18),
      endDate: futureDate(7, 21),
      category: 'professional',
      image: '', // TODO: add photo
      tags: ['tech', 'AI', 'networking'],
      attendees: [
        { user: alex._id, status: 'yes' },
        { user: jordan._id, status: 'yes' }
      ]
    },
    {
      title: 'Saturday Morning Trail Run',
      description: 'Casual 5K trail run through Golden Gate Park. All paces welcome. Meet at the trailhead.',
      creator: jordan._id,
      location: { ...SF, coordinates: [-122.4862, 37.7694], venue: 'Golden Gate Park - Panhandle Entrance' },
      date: futureDate(5, 8),
      category: 'sports',
      image: '', // TODO: add photo
      tags: ['running', 'outdoors', 'fitness'],
      attendees: [
        { user: alex._id, status: 'yes' },
        { user: maya._id, status: 'maybe' }
      ]
    },
    {
      title: 'Photography Walk: Street Portraits',
      description: 'Grab your camera and join us for a guided street photography walk through downtown. Tips and feedback included.',
      creator: maya._id,
      location: { ...SR, venue: 'Railroad Square Historic District' },
      date: futureDate(10, 16),
      endDate: futureDate(10, 19),
      category: 'educational',
      maxAttendees: 15,
      image: '', // TODO: add photo
      tags: ['photography', 'creative', 'workshop'],
      attendees: [
        { user: alex._id, status: 'yes' },
        { user: jordan._id, status: 'yes' },
        { user: sam._id, status: 'yes' }
      ]
    },
    {
      title: 'Indie Band Showcase',
      description: 'Three local bands perform original music. Doors open at 7, first act at 8. All ages welcome.',
      creator: jordan._id,
      location: { ...SF, venue: 'The Independent' },
      date: futureDate(6, 20),
      endDate: futureDate(6, 23),
      category: 'concert',
      maxAttendees: 200,
      image: 'https://images.unsplash.com/photo-1576912656434-b1a36d08fb3e?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // TODO: add photo
      tags: ['livemusic', 'indie', 'bands'],
      attendees: [
        { user: alex._id, status: 'yes' },
        { user: maya._id, status: 'yes' },
        { user: sam._id, status: 'maybe' }
      ]
    },
    {
      title: 'Taco & Tequila Festival',
      description: 'Sample tacos from 10+ local vendors, craft tequila tastings, and live mariachi. Bring your appetite.',
      creator: alex._id,
      location: { ...SF, venue: 'SoMa StrEat Food Park' },
      date: futureDate(12, 12),
      endDate: futureDate(12, 18),
      category: 'food',
      maxAttendees: 300,
      image: 'https://images.unsplash.com/photo-1686560740263-d6a19edbcd1f?q=80&w=1331&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // TODO: add photo
      tags: ['food', 'tacos', 'festival'],
      attendees: [
        { user: jordan._id, status: 'yes' },
        { user: sam._id, status: 'yes' },
        { user: maya._id, status: 'yes' }
      ]
    },
    {
      title: 'Glow Party at The Grand',
      description: 'UV lights, body paint station, and DJ sets until 2am. 21+ only. Dress to glow.',
      creator: sam._id,
      location: { ...SF, venue: 'The Grand Nightclub' },
      date: futureDate(8, 22),
      endDate: futureDate(9, 2),
      category: 'nightlife',
      maxAttendees: 150,
      image: '', // TODO: add photo
      tags: ['party', 'dj', 'nightlife'],
      attendees: [
        { user: alex._id, status: 'yes' },
        { user: jordan._id, status: 'maybe' }
      ]
    },
    {
      title: 'Beach Cleanup & BBQ',
      description: 'Help clean up Ocean Beach in the morning, then enjoy a free BBQ lunch. Gloves and bags provided.',
      creator: maya._id,
      location: { ...SF, coordinates: [-122.5108, 37.7599], venue: 'Ocean Beach' },
      date: futureDate(14, 9),
      endDate: futureDate(14, 14),
      category: 'community',
      image: '', // TODO: add photo
      tags: ['volunteer', 'beach', 'community'],
      attendees: [
        { user: alex._id, status: 'yes' },
        { user: jordan._id, status: 'yes' },
        { user: sam._id, status: 'yes' }
      ]
    }
  ];
  const createdEvents = await Event.insertMany(events);
  console.log(`Created ${createdEvents.length} events`);

  // Posts
  const posts = [
    {
      content: 'Just set up the rooftop for Friday — this is going to be something special. Who\'s coming?',
      author: alex._id,
      location: SF,
      type: 'event-related',
      event: createdEvents[0]._id,
      likes: [jordan._id, maya._id]
    },
    {
      content: 'Found this incredible record store on Haight Street today. The owner has been collecting for 40 years.',
      author: jordan._id,
      location: { ...SF, coordinates: [-122.4312, 37.7700] },
      likes: [alex._id, sam._id, maya._id]
    },
    {
      content: 'Working on a new AI project that generates playlist recommendations based on mood. Early results are promising!',
      author: sam._id,
      location: SR,
      likes: [alex._id]
    },
    {
      content: 'Golden hour at Spring Lake never gets old. Shot this on a walk yesterday.',
      author: maya._id,
      location: { ...SR, coordinates: [-122.7100, 38.4480] },
      likes: [alex._id, jordan._id]
    },
    {
      content: 'Who else is excited for the trail run this weekend? Weather looks perfect.',
      author: jordan._id,
      location: SF,
      type: 'event-related',
      event: createdEvents[2]._id,
      likes: [maya._id]
    },
    {
      content: 'Just wrapped up the AI meetup planning. Got three amazing speakers lined up — details dropping soon.',
      author: sam._id,
      location: SR,
      type: 'event-related',
      event: createdEvents[1]._id,
      likes: [alex._id, jordan._id]
    }
  ];
  const createdPosts = await Post.insertMany(posts);
  console.log(`Created ${createdPosts.length} posts`);

  // Comments
  const comments = [
    { text: 'Count me in! Should I bring anything?', author: jordan._id, parentType: 'post', parentId: createdPosts[0]._id, likes: [alex._id, maya._id] },
    { text: 'Can\'t wait for this one 🎶', author: maya._id, parentType: 'post', parentId: createdPosts[0]._id, likes: [alex._id] },
    { text: 'Which store? I need to check it out!', author: sam._id, parentType: 'post', parentId: createdPosts[1]._id, likes: [jordan._id, alex._id] },
    { text: 'Haight Street has so many hidden gems', author: alex._id, parentType: 'post', parentId: createdPosts[1]._id, likes: [jordan._id] },
    { text: 'Would love to beta test this when it\'s ready', author: jordan._id, parentType: 'post', parentId: createdPosts[2]._id, likes: [sam._id] },
    { text: 'Stunning shot! What camera do you use?', author: alex._id, parentType: 'post', parentId: createdPosts[3]._id, likes: [maya._id, jordan._id] },
    { text: 'Spring Lake is so underrated', author: sam._id, parentType: 'post', parentId: createdPosts[3]._id, likes: [] },
    { text: 'I\'m in! What pace are we thinking?', author: alex._id, parentType: 'post', parentId: createdPosts[4]._id, likes: [jordan._id] },
    { text: 'Who are the speakers? So curious!', author: alex._id, parentType: 'post', parentId: createdPosts[5]._id, likes: [sam._id, jordan._id] },
    { text: 'This venue is going to be perfect for the event', author: jordan._id, parentType: 'event', parentId: createdEvents[0]._id, likes: [alex._id] },
    { text: 'Really looking forward to the AI talks', author: alex._id, parentType: 'event', parentId: createdEvents[1]._id, likes: [sam._id, jordan._id] },
  ];
  await Comment.insertMany(comments);
  console.log(`Created ${comments.length} comments`);

  // Songs (distribute submitters)
  const submitters = [alex, jordan, sam, maya, alex, jordan, sam, maya];
  const songs = songData.map((s, i) => ({
    ...s,
    submittedBy: submitters[i]._id,
    totalVotes: Math.floor(Math.random() * 20) + 1,
    dailyVotes: Math.floor(Math.random() * 8)
  }));
  await Song.insertMany(songs);
  console.log(`Created ${songs.length} songs`);

  // Polls
  const polls = [
    {
      question: 'Best venue for the next community meetup?',
      options: [
        { text: 'El Techo Rooftop', voters: [jordan._id, maya._id] },
        { text: 'SOFA Santa Rosa', voters: [sam._id] },
        { text: 'Golden Gate Park', voters: [alex._id] },
      ],
      creator: alex._id,
      location: SF,
      category: 'planning',
      placeName: 'El Techo de Lolinda',
      expiresAt: futureDate(5),
      status: 'approved',
    },
    {
      question: 'What time works best for weekend events?',
      options: [
        { text: 'Morning (8-11am)', voters: [jordan._id] },
        { text: 'Afternoon (12-4pm)', voters: [alex._id, maya._id] },
        { text: 'Evening (5-9pm)', voters: [sam._id] },
        { text: 'Late night (9pm+)', voters: [] },
      ],
      creator: jordan._id,
      location: SF,
      category: 'opinion',
      expiresAt: futureDate(3),
      status: 'approved',
    },
    {
      question: 'Should we add a monthly photography contest?',
      options: [
        { text: 'Yes, with prizes!', voters: [alex._id, jordan._id, maya._id] },
        { text: 'Yes, just for fun', voters: [sam._id] },
        { text: 'Not interested', voters: [] },
      ],
      creator: maya._id,
      location: SR,
      category: 'opinion',
      expiresAt: futureDate(7),
      status: 'approved',
    },
    {
      question: 'Favorite type of community event?',
      options: [
        { text: 'Music & concerts', voters: [alex._id, jordan._id] },
        { text: 'Tech talks', voters: [sam._id] },
        { text: 'Outdoor activities', voters: [maya._id] },
        { text: 'Food & drinks', voters: [] },
      ],
      creator: sam._id,
      location: SR,
      category: 'general',
      expiresAt: futureDate(10),
      status: 'approved',
    },
    {
      question: 'Best taco spot in SF?',
      options: [
        { text: 'La Taqueria', voters: [alex._id, jordan._id] },
        { text: 'El Farolito', voters: [sam._id, maya._id] },
        { text: 'Tacos El Patron', voters: [] },
      ],
      creator: jordan._id,
      location: SF,
      category: 'recommendations',
      expiresAt: futureDate(6),
      status: 'approved',
    },
    {
      question: 'Would you join a weekend kickball league?',
      options: [
        { text: 'Absolutely!', voters: [jordan._id, maya._id] },
        { text: 'Maybe if the time works', voters: [alex._id] },
        { text: 'Not my thing', voters: [sam._id] },
      ],
      creator: alex._id,
      location: SF,
      category: 'fun',
      expiresAt: futureDate(8),
      status: 'approved',
    },
  ];
  await Poll.insertMany(polls);
  console.log(`Created ${polls.length} polls`);

  console.log('\nSeed complete! Demo credentials:');
  console.log('  alex@demo.com / password123 (admin)');
  console.log('  jordan@demo.com / password123');
  console.log('  sam@demo.com / password123');
  console.log('  maya@demo.com / password123');

  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
