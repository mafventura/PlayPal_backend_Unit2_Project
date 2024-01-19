import 'dotenv/config'
import express, { Router} from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'
import { parse } from 'dotenv'
import serverless from 'serverless-http'

const api = express()
const router = Router()

api.use(cors())
api.use(bodyParser.json())

mongoose.connect(process.env.DATABASE_URL)

const userSchema = new mongoose.Schema({
    userEmail: {
        type: String,
        required: true
    },
    lastLogin: {
        type: Date,
        required: true
    }
})

const gameSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    gameName: String,
    cover: String

})

const playerSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    playerName: String,
    playerImg: String
})

const logSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    game: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Game'
    },
    durationHours: Number,
    durationMinutes: Number,
    scores: [{
        player: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Player',
        },
        score: {
            type: Number
        }
    }]
})

const User = mongoose.model('User', userSchema)

const Game = mongoose.model('Game', gameSchema)

const Player = mongoose.model('Player', playerSchema)

const Log = mongoose.model('Log', logSchema)

// * GET'S ---------------------------------------------------------------------------------------------------------------------------------------

// Main Welcome Page
router.get('/', (req, res) => {
    res.json({
        message: "Welcome to PlayPal"
    })
})

// Games - All added Games
router.get('/games', async (req, res) => {
    const userEmail = req.headers['user-email']
    const user = await User.findOne({ 'userEmail': userEmail })
    const games = await Game.find({}).sort('gameName')
    const gamesfiltered = games.filter((game) => {
        return game.user.equals(user._id)  
    })
    res.json(gamesfiltered)
})

// Games - Single View of a Game
router.get('/games/:gameId', async (req, res) => {
    const game = await Game.findById(req.params.gameId)
    res.json(game)
})

// Players - Show All Players
router.get('/players', async (req, res) => {
    const userEmail = req.headers['user-email']
    const user = await User.findOne({ 'userEmail': userEmail })
    const players = await Player.find({ }).sort('playerName')
    const playersfiltered = players.filter((player) => {
        console.log(player);
        return player.user.equals(user._id)
    })
    res.json(playersfiltered)
})

// Players - Show Single Players
router.get('/players/:playerId', async (req, res) => {
    const player = await Player.findById(req.params.playerId)
    res.json(player)
})

// Logs - Show All Logs
router.get('/logs', async (req, res) => {
    const logs = await Log.find({}).populate('scores.player')
    res.json(logs)
})


// Logs - Show Single Log From Game
router.get('/logs/:logId', async (req, res) => {
    const log = await Log.findById(req.params.logId).populate('game')
    res.json(log)
})

// User - Show User Info
router.get('/users', async (req, res) => {
    const user = await User.find({})
    res.json(user)
})

// User - Show User Info
router.get('/users/:userId', async (req, res) => {
    const user = await User.findById(req.params.userId)
    res.json(user)
})

// * POST'S ---------------------------------------------------------------------------------------------------------------------------------------

//Games - Add a New Game
router.post('/games/add', async (req, res) => {
    try {
        const game = req.body
        const user = await User.findOne({"userEmail": game.user})
        const newGame = new Game({
            user,
            gameName: game.gameName,
            cover: game.cover
        })

        await newGame.save()

        console.log('Game saved to MongoDB:', newGame);
        res.sendStatus(200)

    } catch (error) {
        console.error('Error saving new game to MongoDB:', error);
        res.status(500).send('Error saving new game to MongoDB');
    }
})

router.post('/players/add', async (req, res) => {
    try {
        const player = req.body
        const userEmail = req.headers['user-email']
        const user = await User.findOne({"userEmail": userEmail})
        console.log('user', user);
        const newPlayer = new Player({
            user,
            playerName: player.playerName,
            playerImg: player.playerImg
        })

        await newPlayer.save()

        console.log('Player saved to MongoDB:', newPlayer);
        res.sendStatus(200)

    } catch (error) {
        console.error('Error saving new player to MongoDB:', error);
        res.status(500).send('Error saving new player to MongoDB');
    }
})

router.post('/users/add', async (req, res) => {
    try {
        const now = new Date()
        const user = req.body

        const existingUser = await User.findOne({ userEmail: user.userEmail })

        if(!existingUser) {
            const newUser = new User({
                userEmail: user.userEmail,
                lastLogin: now
            })

            await newUser.save()

            console.log('New user saved to MongoDB:', newUser);
            res.sendStatus(200)
        
        } else {
            await User.findOneAndUpdate({"userEmail": user.userEmail}, {lastLogin: now})
            console.log('User updated to MongoDB');
        res.sendStatus(200)
        }
        
        

    } catch (error) {
        console.error('Error saving/updating user to MongoDB:', error);
        res.status(500).send('Error saving/updating user to MongoDB');
    }
})

router.post('/log/add/:gameId', async (req, res) => {
    try {
        const userEmail = req.headers['user-email']
        const user = await User.findOne({ 'userEmail': userEmail })
        const log = req.body
        console.log('LOG.body:', log);

        const logEntry = new Log({
            user: user._id,
            game: req.params.gameId,
            durationHours: log.durationHours,
            durationMinutes: log.durationMinutes,
            scores: []
        });

        const promises = log.scores.map(async (scoreValues) => {
            const player = await Player.findOne({ 'playerName': scoreValues.playerName });

            logEntry.scores.push({
                player: player._id,
                score: scoreValues.score
            });
        });

        await Promise.all(promises);

        await logEntry.save();

        console.log('Log saved to MongoDB:', logEntry);
        res.sendStatus(200);

    } catch (error) {
        console.error('Error saving new log to MongoDB:', error);
        res.status(500).send('Error saving new log to MongoDB');
    }
    });

// * PUT'S ---------------------------------------------------------------------------------------------------------------------------------------
router.put('/games/:gameId', async (req, res) => {
    try {
        await Game.findByIdAndUpdate({"_id": req.params.gameId}, {gameName: req.body.gameName, cover: req.body.cover}, { new: true })

        console.log('Game edit saved to MongoDB');
        res.sendStatus(200)

    } catch (error) {
        console.error('Error editing game to MongoDB:', error);
        res.status(500).send('Error editing game  to MongoDB');
    }
})

router.put('/logs/:logId', async (req, res) => {
    try {
        await Log.findByIdAndUpdate({"_id": req.params.logId}, {
            game: req.body.gameId,
            durationHours: req.body.durationHours,
            durationMinutes: req.body.durationMinutes,
            scores: req.body.scores.map(scoreValues => ({
                player: scoreValues.playerID,
                score: scoreValues.score
            }))
        }, { new: true })

        console.log('Log edit saved to MongoDB');
        res.sendStatus(200)

    } catch (error) {
        console.error('Error editing log to MongoDB:', error);
        res.status(500).send('Error editing log  to MongoDB');
    }
})

router.put('/players/edit/:playerId', async (req, res) => {
    try {
        await Player.findByIdAndUpdate({"_id": req.params.playerId}, {playerName: req.body.playerName, playerImg: req.body.playerImg}, { new: true })

        console.log('Player edit saved to MongoDB');
        res.sendStatus(200)
    } catch (error) {
        console.error('Error editing player to MongoDB:', error);
        res.status(500).send('Error editing player  to MongoDB');
    }
})


// * DELETE'S ---------------------------------------------------------------------------------------------------------------------------------------

router.delete('/games/:gameId', async (req, res) => {
    try {
        await Game.deleteOne({"_id": req.params.gameId})

        console.log('Deleted game from MongoDB');
        res.sendStatus(200)
    } catch (error) {
        console.error('Error deleting game from MongoDB:', error);
        res.status(500).send('Error deleting game from MongoDB');
    }
})

router.delete('/logs/:logId', async (req, res) => {
    try {
        await Log.deleteOne({"_id": req.params.logId})

        console.log('Deleted log from MongoDB');
        res.sendStatus(200)
    } catch (error) {
        console.error('Error deleting log from MongoDB:', error);
        res.status(500).send('Error deleting log from MongoDB');
    }
})

router.delete('/players/:playerId', async (req, res) => {
    try {
        await Player.deleteOne({"_id": req.params.playerId})

        console.log('Deleted player from MongoDB');
        res.sendStatus(200)
    } catch (error) {
        console.error('Error deleting player from MongoDB:', error);
        res.status(500).send('Error deleting player from MongoDB');
    }
})

api.use('/api/', router)
export const handler = serverless(api)