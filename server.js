import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'
import { parse } from 'dotenv'

const app = express()

app.use(cors())
app.use(bodyParser.json())

const port = process.env.PORT

app.listen(port, () => {
    console.log(`listening on port ${port}`)
})

mongoose.connect(process.env.DATABASE_URL)

const userSchema = new mongoose.Schema({
    userId: String,
    userEmail: {
        type: String,
        required: true
    },
    lastLogin: {
        type: Date,
        required: true
    }
})

const librarySchema = new mongoose.Schema({
    game: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Game'
    }
})

const gameSchema = new mongoose.Schema({
    gameName: String,
})

const playerSchema = new mongoose.Schema({
    playerName: String,
    
})

const logSchema = new mongoose.Schema({
    game: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Game'
    },
    duration: String,
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

const Library = mongoose.model('Library', librarySchema)

const Game = mongoose.model('Game', gameSchema)

const Player = mongoose.model('Player', playerSchema)

const Log = mongoose.model('Log', logSchema)

// * GET'S ---------------------------------------------------------------------------------------------------------------------------------------

// Main Welcome Page
app.get('/', (req, res) => {
    res.json({
        message: "Welcome to PlayPal"
    })
})

// Library - All added Games
app.get('/games', async (req, res) => {
    const games = await Library.find({}).populate('game')
    res.json(games)
})

// Games - Single View of a Game
app.get('/games/:gameId', async (req, res) => {
    const game = await Game.findById(req.params.id)
    res.json(game)
})

// Players - Show All Players
app.get('/players', async (req, res) => {
    const player = await Player.find({}).sort('playerName')
    res.json(player)
})

// Players - Show Single Players
app.get('/players/:playerId', async (req, res) => {
    const player = await Player.findById(req.params.id)
    res.json(player)
})

// Logs - Show Single Log From Game
app.get('/log/:log_id', async (req, res) => {
    const log = await Log.findById(req.params.id)
    res.json(log)
})

// User - Show User Info
app.get('/user', async (req, res) => {
    const user = await User.findById(req.params.id)
    res.json(user)
})

// * POST'S ---------------------------------------------------------------------------------------------------------------------------------------

//Library - Add a New Game
app.post('/games/add', async (req, res) => {
    try {
        const game = req.body
        const newGame = new Game({
            gameName: game.gameName
        })

        newGame.save()

        console.log('Game saved to MongoDB:', newGame);
        res.json(newGame);
        res.sendStatus(200)

    } catch (error) {
        console.error('Error saving new game to MongoDB:', err);
        res.status(500).send('Error saving new game to MongoDB');
    }
})

app.post('/players/add', async (req, res) => {
    try {
        const player = req.body
        const newPlayer = new Player({
            playerName: player.playerName
        })

        newPlayer.save()

        console.log('Player saved to MongoDB:', newPlayer);
        res.json(newPlayer);
        res.sendStatus(200)

    } catch (error) {
        console.error('Error saving new player to MongoDB:', err);
        res.status(500).send('Error saving new player to MongoDB');
    }
})

app.post('/user/add', async (req, res) => {
    try {
        const user = req.body
        const newUser = new User({
            userId: user.userId,
        })

        newUser.save()

        console.log('User saved to MongoDB:', newUser);
        res.json(newUser);
        res.sendStatus(200)

    } catch (error) {
        console.error('Error saving new user to MongoDB:', err);
        res.status(500).send('Error saving new user to MongoDB');
    }
})

app.post('/logs/add', async (req, res) => {
    try {
        const log = req.body
        const newLog = new Log({
            game: log.gameId,
            duration: log.duration,
            scores: log.scores.map(scoreValues => ({
                player: scoreValues.playerId,
                score: scoreValues.score
            }))
        })

        newLog.save()

        console.log('Log saved to MongoDB:', newLog);
        res.json(newLog);
        res.sendStatus(200)

    } catch (error) {
        console.error('Error saving new log to MongoDB:', err);
        res.status(500).send('Error saving new log to MongoDB');
    }
})

// * PUT'S ---------------------------------------------------------------------------------------------------------------------------------------
app.put('/games/:gameId', async (req, res) => {
    try {
        await Game.findByIdAndUpdate({"_id": req.params.id}, {gameName: req.body.gameName}, { new: true })

        console.log('Game edit saved to MongoDB:', updatedGame);
        res.sendStatus(200)

    } catch (error) {
        console.error('Error editing game to MongoDB:', err);
        res.status(500).send('Error editing game  to MongoDB');
    }
})

app.put('/log/:logId', async (req, res) => {
    try {
        await Log.findByIdAndUpdate({"_id": req.params.id}, {
            game: req.body.gameId,
            duration: req.body.duration,
            scores: req.body.map(scoreValues => ({
                player: scoreValues.playerID,
                score: scoreValues.score
            }))
        }, { new: true })

        console.log('Log edit saved to MongoDB:', updatedLog);
        res.sendStatus(200)

    } catch (error) {
        console.error('Error editing log to MongoDB:', err);
        res.status(500).send('Error editing log  to MongoDB');
    }
})

app.put('/players/playerId', async (req, res) => {
    try {
        await Player.findByIdAndUpdate({"_id": req.params.id}, {playerName: req.body.playerName}, { new: true })
    } catch (error) {
        
    }
})


// * DELETE'S ---------------------------------------------------------------------------------------------------------------------------------------

app.delete('/games/:gameId', async (req, res) => {
    try {
        await Game.deleteOne({"_id": req.params.id})

        console.log('Deleted game from MongoDB:', newLog);
        res.sendStatus(200)
    } catch (error) {
        console.error('Error deleting game from MongoDB:', err);
        res.status(500).send('Error deleting game from MongoDB');
    }
})

app.delete('/log/:logId', async (req, res) => {
    try {
        await Log.deleteOne({"_id": req.params.id})

        console.log('Deleted log from MongoDB:', newLog);
        res.sendStatus(200)
    } catch (error) {
        console.error('Error deleting log from MongoDB:', err);
        res.status(500).send('Error deleting log from MongoDB');
    }
})

app.delete('/players/:playerId', async (req, res) => {
    try {
        await Player.deleteOne({"_id": req.params.id})

        console.log('Deleted player from MongoDB:', newLog);
        res.sendStatus(200)
    } catch (error) {
        console.error('Error deleting player from MongoDB:', err);
        res.status(500).send('Error deleting player from MongoDB');
    }
})