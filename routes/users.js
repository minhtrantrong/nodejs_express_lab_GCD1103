var express = require('express');
var router = express.Router();
const authenticate = require('../models/authenticator');
const table_display = require('../models/table_display');
const crud = require('../models/db_crud');
const select_form = require('../models/dropdown_list');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('users', {title: "User Page"});
});
/* GET the login page */
router.get('/login', function(req, res, next) {
  res.render('login', {
    title: "Login Page", 
    warn_message: ""});
});
/* GET the logout link */
router.get('/logout', function(req, res, next) {
  req.session.destroy();
  res.redirect('/users/login')
});
/* POST by the login form */
router.post('/login', async function(req, res, next) {
  let uname = req.body.uname;
  let pword = req.body.pword; 
  // if correct username and password, then redirect the profile page
  authen_result = await authenticate(uname, pword)
  if (authen_result.auth) {
    req.session.username = uname;
    req.session.shop = authen_result.shop;
    if (req.session.shop == "director"){
      res.redirect('/users/director');
    } else if (req.session.shop == "admin"){
      res.redirect('/users/admin');
    } else {
      res.redirect('/users/profile');
    }
  }
  else {
    res.render('login', {
      title: "Login Page", 
      warn_message: "Wrong username or password, please try again!"})
  }
});

/* GET users/profile. */
router.get('/profile', async function(req, res, next) {
  // check username in session to make sure that user logged in.
  if (req.session.username){
    let uname = req.session.username;
    let shop = req.session.shop;
    console.log(`Session username: ${uname}`);
    let table_string = await table_display('products', shop, 0);
    res.render('profile', {title: shop, product_cells: table_string, user: uname});
  } else {
    res.redirect('/users/login')
  }
});
/* GET users/director. */
router.get('/director', async function(req, res, next) {
  // check username in session to make sure that user logged in.
  let uname = req.session.username;
  let shop = req.session.shop;
  let shop_id = (req.session.shop_id)? req.session.shop_id : 0;
  let interval = (req.session.interval)? req.session.interval*1000 : 5000
  let table_string = await table_display('products', shop, shop_id);
  let form_string = await select_form();
  // console.log(table_string)
  if (uname){
    res.render('director', {title: "Director",
      user: uname, 
      product_cells: table_string, 
      select_form: form_string,
      interval: interval})
  } else {
    res.redirect('/users/login')
  }
});
/* Router for shop selection, POST */
router.post('/director', async function(req, res, next) {
  // Save selected shop_id into session
  req.session.shop_id = req.body.shop_selected;
  res.redirect('/users/director');
});
/* Routerfor /users/crud, POST */
router.post('/crud', async function(req, res, next) {
  let req_body = req.body;
  await crud(req_body);
  res.redirect('/users/profile');
});
/* Router for /refreshtime, POST */
router.post('/refreshtime', async function(req, res, next) {
  // Save selected interval into session
  req.session.interval = req.body.interval;
  res.redirect('/users/director');
});
module.exports = router;
