import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'

const app = express()

app.use(cors())
app.use(bodyParser.json())

const port = process.env.PORT

mongoose.connect(process.env.DATABASE_URL)

const userSchema = new mongoose.Schema({
    userId: String,
    userEmail: String
})

const librarySchema = new mongoose.Schema({
    gameImg: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    game: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Game'
    }
})

const gameSchema = new mongoose.Schema({
    gameImg: String,
    yearPublished: Number,
    playerCountMin: Number,
    playerCountMax: Number,
    description: String,
})

const playerSchema = new mongoose.Schema({
    playerName: String,
    playerImg: String,
    
})

const logSchema = new mongoose.Schema({
    duration: String,
    score: Number,
    game: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Game'
    },
    player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
    }
})

const User = mongoose.model('User', userSchema)

const Library = mongoose.model('Library', librarySchema)

const Game = mongoose.model('Game', gameSchema)

const Player = mongoose.model('Player', playerSchema)

const Log = mongoose.model('Log', logSchema)

app.listen(port, () => {
    console.log(`listening on port ${port}`)
})

// Main Welcome Page
app.get('/', (req, res) => {
    res.json({
        message: "Welcome to PlayPal"
    })
})

// Library - All added Games
app.get('/library', async (req, res) => {
    try {

    } catch (error) {
        
    }
})

// Single View of a Game
app.get('/library/:gameId', async (req, res) => {
    try {
        
    } catch (error) {
        
    }
})

app.post('/library/add', async (req, res) => {
    try {
        const response = fetch(`process.env.SEARCH_API${req.body}`)
        const data = await response.json()
        res.json()
    } catch (error) {
        
    }
})
