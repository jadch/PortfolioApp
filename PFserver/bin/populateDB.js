#! /app/bin/node
const path = require('path')
require('dotenv').config({path: path.join(__dirname, '../.env')})
const axios = require('axios')
const mongoose = require('mongoose')
const _ = require('lodash')

mongoose.connect(process.env.MONGODB_URI, { useMongoClient: true })

const Stock = require('../models/Stock')

// IEX base url
const IEX = axios.create({
  baseURL: 'https://api.iextrading.com/1.0'
})

function getAllListedStocksOnIEX () {
  let url = '/ref-data/symbols'
  return IEX.get(url).then(response => {
    return response.data
  }).catch((error) => {
    console.error('ERROR FETCHING ALL LISTED STOCKS, ', error)
  })
}

function populateDB100 (stocks) {
  let url = `/stock/market/batch?symbols=${stocks}&types=quote,company,stats,peers,financials`

  return IEX.get(url).then(response => {
    let stocks = Object.keys(response.data)

    return Promise.all(stocks.map((stock) => {
      let stockObj = response.data[stock]

      let newStock = {
        ticker: stockObj.quote.symbol,
        companyName: stockObj.quote.companyName,
        sector: stockObj.quote.sector,
        price: {
          latestPrice: stockObj.quote.latestPrice,
          latestUpdate: stockObj.quote.latestUpdate
        },
        company: {
          CEO: stockObj.company.CEO,
          description: stockObj.company.description
        },
        stats: {
          marketcap: stockObj.stats.marketcap,
          beta: stockObj.stats.beta,
          week52high: stockObj.stats.week52high,
          week52low: stockObj.stats.week52low,
          week52change: stockObj.stats.week52change,
          dividendRate: stockObj.stats.dividendRate,
          dividendYield: stockObj.stats.dividendYield,
          latestEPS: stockObj.stats.latestEPS,
          latestEPSDate: stockObj.stats.latestEPSDate,
          returnOnEquity: stockObj.stats.returnOnEquity,
          EBITDA: stockObj.stats.EBITDA,
          revenue: stockObj.stats.EBITDA,
          grossProfit: stockObj.stats.grossProfit,
          cash: stockObj.stats.cash,
          debt: stockObj.stats.debt,
          ttmEPS: stockObj.stats.ttmEPS,
          revenuePerShare: stockObj.stats.debt,
          returnOnAssets: stockObj.stats.returnOnAssets,
          profitMargin: stockObj.stats.profitMargin,
          priceToSales: stockObj.stats.priceToSales,
          priceToBook: stockObj.stats.priceToBook,
          day200MovingAvg: stockObj.stats.day200MovingAvg,
          day50MovingAvg: stockObj.stats.day50MovingAvg,
          institutionPercent: stockObj.stats.institutionPercent,
          year5ChangePercent: stockObj.stats.year5ChangePercent,
          year2ChangePercent: stockObj.stats.year2ChangePercent,
          year1ChangePercent: stockObj.stats.year1ChangePercent,
          ytdChangePercent: stockObj.stats.ytdChangePercent,
          month6ChangePercent: stockObj.stats.month6ChangePercent,
          month3ChangePercent: stockObj.stats.month3ChangePercent,
          month1ChangePercent: stockObj.stats.month1ChangePercent,
          day5ChangePercent: stockObj.stats.day5ChangePercent
        },
        peers: stockObj.peers
      }

      return Stock.findOneAndUpdate(
        {ticker: newStock.ticker},
        newStock,
        {upsert: true, new: true}
      ).catch((error) => {
        console.error('Error saving stock, ', error)
      })
    }))
  }).catch((error) => {
    console.error('ERROR FETCHING FINANCIALS, ', error)
  })
}

function populateDB () {
  return getAllListedStocksOnIEX().then(response => {
    let stocksArray = response.map(item => item.symbol)
    let chunks = _.chunk(stocksArray, 100)

    return Promise.all(chunks.map(chunk => {
      let stocks = chunk.join()

      return populateDB100(stocks)
    }))
  })
}

populateDB()
.then(() => mongoose.connection.close())
