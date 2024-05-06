"use strict";

const Depot=require("./Depot");

class User {

    constructor(name, passwd, alleAktien) {
        this.name = name;
        this.passwd = passwd;
        this.kontostand = 10000;
        this.depot = new Depot(alleAktien);
        this.umsaetze = [];
    }

    buy (aktie, anzahl) {

        if (aktie.preis * anzahl > this.kontostand) {
            throw "Zu wenig Guthaben für Aktienkauf.";
        }
        this.kontostand -= this.depot.buy(aktie, anzahl);
    };

    toJSON () {
        return {
            "name": this.name,
            "kontostand": this.kontostand
        };
    };
}

module.exports = User;