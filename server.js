import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'
import { parse } from 'dotenv'

const app = express()

app.use(cors())
app.use(bodyParser.json())
app.use('/games', getUserByEmail)
app.use('/players', getUserByEmail)

const port = process.env.PORT

app.listen(port, () => {
    console.log(`listening on port ${port}`)
})

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

async function getUserByEmail(req, res, next) {
    try {
        const userEmail = req.query.userEmail

        if(!userEmail) {
            return res.status(400).json({ message: 'User email is required.' })
        }

        const user = await User.findOne({userEmail})

        if(!user) {
            return res.status(400).json({ message: 'User not found.' })
        }

        req.user = user;
        next()

    } catch (error) {
        console.error('Error getting user by email:', error)
        res.status(500).json({ message: 'Internal Server Error'})
    }
}

// * GET'S ---------------------------------------------------------------------------------------------------------------------------------------

// Main Welcome Page
app.get('/', (req, res) => {
    res.json({
        message: "Welcome to PlayPal"
    })
})

// Games - All added Games
app.get('/games', async (req, res) => {
    const games = await Game.find({ user: req.user._id }).sort('gameName')
    res.json(games)
})

// Games - Single View of a Game
app.get('/games/:gameId', async (req, res) => {
    const game = await Game.findById(req.params.gameId)
    res.json(game)
})

// Players - Show All Players
app.get('/players', async (req, res) => {
    const players = await Player.find({ user: req.user._id }).sort('playerName')
    res.json(players)
})

// Players - Show Single Players
app.get('/players/:playerId', async (req, res) => {
    const player = await Player.findById(req.params.playerId)
    res.json(player)
})

// Logs - Show All Logs
app.get('/logs', async (req, res) => {
    const logs = await Log.find({}).populate({
        path: 'scores.player',
        model: 'Player',
        select: 'playerName playerImg'
    })
    res.json(logs)
})


// Logs - Show Single Log From Game
app.get('/logs/:logId', async (req, res) => {
    const log = await Log.findById(req.params.logId).populate('game')
    res.json(log)
})

// User - Show User Info
app.get('/users', async (req, res) => {
    const user = await User.find({})
    res.json(user)
})

// User - Show User Info
app.get('/users/:userId', async (req, res) => {
    const user = await User.findById(req.params.userId)
    res.json(user)
})

// * POST'S ---------------------------------------------------------------------------------------------------------------------------------------

//Games - Add a New Game
app.post('/games/add', async (req, res) => {
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

app.post('/players/add', async (req, res) => {
    try {
        const player = req.body
        console.log(req.body);
        const user = await User.findOne({"userEmail": player.user})
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

app.post('/users/add', async (req, res) => {
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

app.post('/log/add/:gameId', async (req, res) => {
    try {
        const log = req.body
        const newLog = new Log({
            game: req.params.gameId,
            durationHours: log.durationHours,
            durationMinutes: log.durationMinutes,
            scores: log.scores.map(scoreValues => ({
                player: scoreValues.playerId,
                score: scoreValues.score
            }))
        })

        await newLog.save()

        console.log('Log saved to MongoDB:', newLog);
        res.sendStatus(200)

    } catch (error) {
        console.error('Error saving new log to MongoDB:', error);
        res.status(500).send('Error saving new log to MongoDB');
    }
})

// * PUT'S ---------------------------------------------------------------------------------------------------------------------------------------
app.put('/games/:gameId', async (req, res) => {
    try {
        await Game.findByIdAndUpdate({"_id": req.params.gameId}, {gameName: req.body.gameName, cover: req.body.cover}, { new: true })

        console.log('Game edit saved to MongoDB');
        res.sendStatus(200)

    } catch (error) {
        console.error('Error editing game to MongoDB:', error);
        res.status(500).send('Error editing game  to MongoDB');
    }
})

app.put('/logs/:logId', async (req, res) => {
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

app.put('/players/:playerId', async (req, res) => {
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

app.delete('/games/:gameId', async (req, res) => {
    try {
        await Game.deleteOne({"_id": req.params.gameId})

        console.log('Deleted game from MongoDB');
        res.sendStatus(200)
    } catch (error) {
        console.error('Error deleting game from MongoDB:', error);
        res.status(500).send('Error deleting game from MongoDB');
    }
})

app.delete('/logs/:logId', async (req, res) => {
    try {
        await Log.deleteOne({"_id": req.params.logId})

        console.log('Deleted log from MongoDB');
        res.sendStatus(200)
    } catch (error) {
        console.error('Error deleting log from MongoDB:', error);
        res.status(500).send('Error deleting log from MongoDB');
    }
})

app.delete('/players/:playerId', async (req, res) => {
    try {
        await Player.deleteOne({"_id": req.params.playerId})

        console.log('Deleted player from MongoDB');
        res.sendStatus(200)
    } catch (error) {
        console.error('Error deleting player from MongoDB:', error);
        res.status(500).send('Error deleting player from MongoDB');
    }
})