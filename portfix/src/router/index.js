import Vue from 'vue'
import Router from 'vue-router'
import SignUp from '@/components/SignUp'
import LoginPage from '@/components/LoginPage'
import Home from '@/components/Home'
import Screener from '@/components/Screener'
import AddPortfolioPage from '@/components/AddPortfolioPage'
import SellStockPage from '@/components/SellStockPage'
import AddStockPage from '@/components/AddStockPage'
import Test from '@/components/Test'
import PFdetailPage from '@/components/PFdetailPage'
import StockPage from '@/components/StockPage'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home,
      meta: { requiresAuth: true }
    },
    {
      path: '/sign-up',
      name: 'SignUp',
      component: SignUp
    },
    {
      path: '/login',
      name: 'LoginPage',
      component: LoginPage
    },
    {
      path: '/addportfolio',
      name: 'AddPortfolioPage',
      component: AddPortfolioPage
    },
    {
      path: '/portfolio/addstock/:id',
      name: 'AddStockPage',
      component: AddStockPage
    },
    {
      path: '/portfolio/sellstock/:id',
      name: 'SellStock',
      component: SellStockPage
    },
    {
      path: '/test',
      name: 'Test',
      component: Test
    },
    {
      path: '/portfolio/:id',
      name: 'PFdetailPage',
      component: PFdetailPage
    },
    {
      path: '/stock/:id',
      name: 'StockPage',
      component: StockPage
    },
    {
      path: '/stockscreener',
      name: 'Screener',
      component: Screener
    }
  ]
})
