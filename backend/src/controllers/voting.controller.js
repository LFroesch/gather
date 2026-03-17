import Song from "../models/song.model.js";
import Vote from "../models/vote.model.js";
import DailyChart from "../models/dailyChart.model.js";
import User from "../models/user.model.js";

// Get today's songs with vote counts
export const getTodaysSongs = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all songs with today's vote counts
    const songsWithVotes = await Song.aggregate([
      {
        $lookup: {
          from: 'votes',
          let: { songId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$songId', '$$songId'] },
                    { $gte: ['$voteDate', today] },
                    { $lt: ['$voteDate', tomorrow] }
                  ]
                }
              }
            }
          ],
          as: 'todaysVotes'
        }
      },
      {
        $addFields: {
          dailyVoteCount: { $size: '$todaysVotes' },
          userHasVoted: {
            $in: [req.user._id, '$todaysVotes.userId']
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'submittedBy',
          foreignField: '_id',
          as: 'submitter',
          pipeline: [{ $project: { username: 1, profilePic: 1 } }]
        }
      },
      {
        $sort: { dailyVoteCount: -1, createdAt: -1 }
      },
      {
        $project: {
          todaysVotes: 0
        }
      }
    ]);

    // Check if user has voted today
    const userVotedToday = await Vote.findOne({
      userId: req.user._id,
      voteDate: {
        $gte: today,
        $lt: tomorrow
      }
    });

    res.status(200).json({
      songs: songsWithVotes,
      userHasVotedToday: !!userVotedToday,
      votedSongId: userVotedToday?.songId || null
    });
  } catch (error) {
    console.error("Error in getTodaysSongs: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Submit a new song
export const submitSong = async (req, res) => {
  try {
    const { title, artist, album, externalId, previewUrl } = req.body;

    if (!title || !artist) {
      return res.status(400).json({ message: "Title and artist are required" });
    }

    // Check if song already exists
    const existingSong = await Song.findOne({ title: title.trim(), artist: artist.trim() });
    if (existingSong) {
      return res.status(400).json({ message: "Song already exists" });
    }

    const newSong = new Song({
      title: title.trim(),
      artist: artist.trim(),
      album: album?.trim() || "",
      externalId: externalId || {},
      previewUrl: previewUrl || "",
      submittedBy: req.user._id
    });

    await newSong.save();
    await newSong.populate('submittedBy', 'username profilePic');

    res.status(201).json({ song: newSong, message: "Song submitted successfully" });
  } catch (error) {
    console.error("Error in submitSong: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Vote for a song
export const voteSong = async (req, res) => {
  try {
    const { songId } = req.params;
    const { deviceFingerprint } = req.body;

    if (!deviceFingerprint) {
      return res.status(400).json({ message: "Device fingerprint required" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if user already voted today
    const existingVote = await Vote.findOne({
      userId: req.user._id,
      voteDate: {
        $gte: today,
        $lt: tomorrow
      }
    });

    if (existingVote) {
      return res.status(400).json({ message: "You have already voted today" });
    }

    // Check if device already voted (anti-fraud)
    const deviceVote = await Vote.findOne({
      deviceFingerprint,
      voteDate: {
        $gte: today,
        $lt: tomorrow
      }
    });

    if (deviceVote) {
      return res.status(400).json({ message: "This device has already voted today" });
    }

    // Verify song exists and is active
    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({ message: "Song not found" });
    }
    if (!song.isActive) {
      return res.status(400).json({ message: "This song is no longer accepting votes" });
    }

    // Create vote
    const vote = new Vote({
      userId: req.user._id,
      songId,
      deviceFingerprint,
      voteDate: new Date()
    });

    await vote.save();

    // Update song daily votes
    await Song.findByIdAndUpdate(songId, {
      $inc: { dailyVotes: 1, totalVotes: 1 }
    });

    // Update user voting stats
    const user = await User.findById(req.user._id);
    const streak = user.votingStats.lastVoteDate && 
      new Date(user.votingStats.lastVoteDate).toDateString() === new Date(Date.now() - 86400000).toDateString()
      ? user.votingStats.votingStreak + 1 
      : 1;

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'votingStats.totalVotes': 1 },
      $set: { 
        'votingStats.votingStreak': streak,
        'votingStats.lastVoteDate': new Date()
      }
    });

    res.status(200).json({ message: "Vote recorded successfully" });
  } catch (error) {
    console.error("Error in voteSong: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get daily chart (historical)
export const getDailyChart = async (req, res) => {
  try {
    const { date } = req.params;
    const queryDate = date ? new Date(date) : new Date();
    queryDate.setHours(0, 0, 0, 0);

    let chart = await DailyChart.findOne({ date: queryDate })
      .populate('songs.songId', 'title artist album albumArt submittedBy')
      .populate('songs.songId.submittedBy', 'username profilePic');

    if (!chart) {
      // Generate chart for the requested date
      const tomorrow = new Date(queryDate);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const songs = await Song.aggregate([
        {
          $lookup: {
            from: 'votes',
            let: { songId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$songId', '$$songId'] },
                      { $gte: ['$voteDate', queryDate] },
                      { $lt: ['$voteDate', tomorrow] }
                    ]
                  }
                }
              }
            ],
            as: 'dayVotes'
          }
        },
        {
          $addFields: {
            voteCount: { $size: '$dayVotes' }
          }
        },
        {
          $match: { voteCount: { $gt: 0 } }
        },
        {
          $sort: { voteCount: -1 }
        }
      ]);

      const chartSongs = songs.map((song, index) => ({
        songId: song._id,
        votes: song.voteCount,
        rank: index + 1,
        previousRank: null
      }));

      const totalVotes = songs.reduce((sum, song) => sum + song.voteCount, 0);
      const uniqueVoters = await Vote.distinct('userId', {
        voteDate: {
          $gte: queryDate,
          $lt: tomorrow
        }
      });

      chart = new DailyChart({
        date: queryDate,
        songs: chartSongs,
        totalVotes,
        uniqueVoters: uniqueVoters.length,
        isFinalized: queryDate < new Date().setHours(0, 0, 0, 0)
      });

      await chart.save();
      await chart.populate('songs.songId', 'title artist album albumArt submittedBy');
      await chart.populate('songs.songId.submittedBy', 'username profilePic');
    }

    res.status(200).json(chart);
  } catch (error) {
    console.error("Error in getDailyChart: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get voting stats
export const getVotingStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const stats = await Vote.aggregate([
      {
        $facet: {
          todayStats: [
            {
              $match: {
                voteDate: {
                  $gte: today,
                  $lt: tomorrow
                }
              }
            },
            {
              $group: {
                _id: null,
                totalVotes: { $sum: 1 },
                uniqueVoters: { $addToSet: '$userId' }
              }
            },
            {
              $project: {
                totalVotes: 1,
                uniqueVoters: { $size: '$uniqueVoters' }
              }
            }
          ],
          allTimeStats: [
            {
              $group: {
                _id: null,
                totalVotes: { $sum: 1 },
                uniqueVoters: { $addToSet: '$userId' }
              }
            },
            {
              $project: {
                totalVotes: 1,
                uniqueVoters: { $size: '$uniqueVoters' }
              }
            }
          ]
        }
      }
    ]);

    const result = {
      today: stats[0].todayStats[0] || { totalVotes: 0, uniqueVoters: 0 },
      allTime: stats[0].allTimeStats[0] || { totalVotes: 0, uniqueVoters: 0 }
    };

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getVotingStats: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};