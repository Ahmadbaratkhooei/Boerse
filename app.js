"use strict";

const express = require("express"),
    morgan = require("morgan"),
    basicAuth = require("basic-auth-connect"),
    bodyParser = require("body-parser"),
    swaggerUi = require('swagger-ui-express'),
    yamljs = require("yamljs"),
    swaggerDocument = yamljs.load('./swagger.yaml'),
    app = express();
const Boerse=require("./models/Boerse");

/**
 * Start der Börse
 * @type {Boerse}
 */
const boerse = new Boerse();
const finder=boerse.finder;


/**
 * aktiviere Logger des Servers in passendem Logging-Level
 */
app.use(morgan("dev"));
/* change here for more verbous output, e.g. tiny or combined) */

// parse application/json
app.use(bodyParser.json());


/**
 * aktiviere einfache Authentifizierung
 */
app.use(basicAuth(function (user, pass) {
  // Authentifizierung OK, wenn daten zu einem Nutzer passen
  for (let i = 0; i < boerse.users.length; i++) {
    if (user === boerse.users[i].name && pass === boerse.users[i].passwd) {
      return true;
    }
  }
  return false;
}));

/**
 * Ordner als statischen Inhalt bereitstellen
 */
app.use(express.static('public'));

//Middleware

/**
 * REST Schnittstellen / API
 */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/', function (req, res) {
  res.render('index');
});

app.get('/api/aktien', function (req, res) {
  res.jsonp(boerse.alleAktien);
});

app.get('/api/benutzerdaten', function (req, res) {
  res.jsonp(finder.findUserByName(req.user));
});

app.get('/api/depotAlle', function (req, res) {
  let besitzAlle = new Array(boerse.users.length);
  for (let i = 0; i < boerse.users.length; i++) {
    besitzAlle[i] = {"name": boerse.users[i].name, "summe": boerse.users[i].kontostand + boerse.users[i].depot.wert()}
  }
  res.jsonp(besitzAlle);
});

app.get('/api/depot', function (req, res) {
  let user = finder.findUserByName(req.user);
  res.jsonp({"positionen": user.depot.depotPositionen, "wert": user.depot.wert()});
});

/* mit dem Parameter letzteZeit kommen nur neuere Nachrichten*/
app.get('/api/nachrichten', function (req, res) {
  if (req.query.letzteZeit) {
    const letzteZeit = parseInt(req.query.letzteZeit);
    let messages = [];
    for (let i = 0; i < boerse.nachrichten.length; i++) {
      if (boerse.nachrichten[i].zeit > letzteZeit) {
        messages[messages.length] = boerse.nachrichten[i];
      }
    }
    res.jsonp(messages);
  }
  else {
    res.jsonp(boerse.nachrichten);
  }
});

app.get('/api/umsaetze/:id', function (req, res) {
  let user = finder.findUserByName(req.user);
  let index = parseInt(req.params.id);
  if (!user.umsaetze[index]) {
    res.status(422).send("error: index not found");
  }
  res.jsonp(user.umsaetze[index]);
});

app.get('/api/umsaetze', function (req, res) {
  let user = finder.findUserByName(req.user);
  res.status(200).send(user.umsaetze);
});

/** kauft oder verkauft Aktien
 * liefert success- oder error-Objekt
 * */
app.post('/api/umsaetze', function (req, res) {
  let user;
  let aktie;
  let anzahl;
  try {
    user = finder.findUserByName(req.user);
    aktie = finder.findAktieByName(req.body.aktie.name);
    anzahl = parseInt(req.body.anzahl);
    if (anzahl === null || isNaN(anzahl)) {
      throw "ungueltige anzahl";
    }
    user.buy(aktie, anzahl);
  }
  catch (err) {
    //console.log(JSON.stringify(err));
    res.status(422).send({"error": err});
    return;
  }

  let nachrichtenText;
  if (anzahl > 0) {
    nachrichtenText = "KAUF: " + user.name + ": " + anzahl + " " + aktie.name;
  }
  else {
    nachrichtenText = "VERKAUF: " + user.name + ": " + (-1 * anzahl) + " " + aktie.name;
  }

  const date = new Date();
  boerse.nachrichten[boerse.nachrichten.length] = {
    "zeit": date.getTime(),
    "uhrzeit": date.getHours() + ":" + date.getMinutes(),
    "text": nachrichtenText
  };

  const umsatz = Boerse.createUmsatz(aktie,anzahl);
  user.umsaetze.push(umsatz);
  res.status(201).send({"success": nachrichtenText, "umsatz": umsatz});
});

module.exports = app;