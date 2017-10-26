const express = require('express')
const passport = require('passport')
const config = require('../config')
const router = express.Router()

const User = require('../models/User')
const Portfolio = require('../models/Portfolio')
const Transaction = require('../models/transaction')

// ======= Creating a new Portfolio =======
router.post('/addportfolio', passport.authenticate('jwt', config.jwtSession), (req, res, nex) => {
  let userID = req.user._id
  let portfolioName = req.body.portfolioName
  let newPortfolio = new Portfolio({
    userID,
    name: portfolioName,
    value: req.body.cash,
    startingPortfolio: [{
      stockTicker: 'PFAPPCASH',
      number: req.body.cash,
      buyPrice: 1
    }],
    currentPortfolio: [{
      stockTicker: 'PFAPPCASH',
      number: req.body.cash,
      buyPrice: 1,
      breakevenPrice: 1
    }]
  })
  newPortfolio.save((error, portfolio) => {
    if (error) {
      res.json({
        errorMessage: "Something went wrong, couldn't save new Portfolio"
      })
    } else {
      let portfolioID = portfolio._id
      User.findByIdAndUpdate(userID, {
        $push: {
          portfolios: portfolioID
        }
      }, () => {
        res.json({
          success: true,
          errorMessage: false
        })
      })
    }
  })
})

// ======= Adding a Stock to a Portfolio =======
router.post('/addstock', passport.authenticate('jwt', config.jwtSession), (req, res, nex) => {
  let userID = req.user._id
  let portfolioID = req.body.portfolioID
  let date = req.body.date
  let ticker = req.body.ticker
  let quantity = req.body.quantity
  let price = req.body.price

  // check if useriD = PF ID, then update PF, then create transaction
  Portfolio.findById(portfolioID).then(portfolio => {
    // Checking that the PF belongs to the user requesting the info
    if (userID.equals(portfolio.userID)) {
      // Current portfolio becomes old portfolio
      let oldPortfolio = Object.assign({}, portfolio.current)
      // Creating new transaction
      let newTransaction = new Transaction({
        date,
        userID,
        portfolioID,
        affectedStocks: [{
          ticker,
          preNum: oldPortfolio.stocks.ticker,
          change: quantity,
          atPrice: price,
          postNum: oldPortfolio.stocks.ticker + quantity
        }]
      })
      newTransaction.save((error) => {
        if (error) {
          res.json({
            errorMessage: "Something went wrong, couldn't save new Portfolio"
          })
        } else {
          portfolio.history.push(oldPortfolio)
          portfolio.date = date
          portfolio.stocks.ticker = oldPortfolio.stocks.ticker + quantity

          portfolio.save((error) => {
            if (error) {
              res.json({
                errorMessage: "Something went wrong, couldn't save new Portfolio"
              })
            } else {
              res.json({
                success: true,
                errorMessage: false
              })
            }
          })
        }
      })
    } else {
      res.json({errorMessage: 'unauthorized'})
    }
  })
})

// ======= Getting the User's Portfolios =======
router.get('/user/portfolios', passport.authenticate('jwt', config.jwtSession), (req, res, next) => {
  let userID = req.user._id
  Portfolio.find({userID}).then(portfolios => {
    res.json(portfolios)
  })
})

// ======= Getting a single Portfolio, given ID =======
router.post('/user/portfolio', passport.authenticate('jwt', config.jwtSession), (req, res, next) => {
  let userID = req.user._id
  let portfolioID = req.body.portfolioID

  Portfolio.findById(portfolioID).then(portfolio => {
    // Checking that the PF belongs to the user requesting the info
    if (userID.equals(portfolio.userID)) {
      res.json(portfolio)
    } else {
      res.json({errorMessage: 'unauthorized'})
    }
  })
})

/* Testing */
router.get('/', function (req, res, next) {
  getLastPrices(['snap', 'fb', 'aapl']).then((data) => {
    console.log('DATA', data)
    res.json(data)
  })
})

router.get('/getall', (req, res, next) => {
  getAllListedStocksOnIEX().then((data) => {
    res.json(data)
  })
})

module.exports = router

// IEX API
const axios = require('axios')

// Testing axios post for signup
axios.post('http://localhost:3000/signup', {
  name: 'name',
  username: 'woo',
  password: 'yes'
})

// IEX base url
const IEX = axios.create({
  baseURL: 'https://api.iextrading.com/1.0'
})

// Get real-time price
// Last provides trade data for executions on IEX. It is a near real time,intraday API that provides IEX last sale price, size and time.
function getLastPrice (ticker) {
  let url = `/tops/last?symbols=${ticker}`
  return IEX.get(url).then(response => response.data)
}

function getLastPrices (tickers) {
  let url = `/tops/last/?symbols=${tickers[0]}`
  let length = tickers.length
  for (let i = 1; i < length; i++) {
    url += ',' + tickers[i]
  }
  return IEX.get(url).then(response => response.data)
}

// Screener functions testing

//  Returns a list of all stocks listed on IEX
// exchange
function getAllListedStocksOnIEX () {
  let url = '/ref-data/symbols'
  return IEX.get(url).then(response => {
    return {
      length: response.data.length,
      tickerList: response.data
    }
  })
}

// Todo:
//   - find other data to query
