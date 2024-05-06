"use strict";

const User=require("./User");
const Aktie=require("./Aktie");
const Umsatz=require("./Umsatz");
const Finder=require("../helper/Finder");

class Boerse{

    constructor() {
        this.alleAktien = [new Aktie("Microsoft"), new Aktie("Apple"), new Aktie("Niantic"),
                new Aktie("AMD"), new Aktie("Intel"), new Aktie("Facebook")];
        this.users =  [
            new User("max", "max", this.alleAktien),
            new User("moritz", "moritz", this.alleAktien),
            new User("Roshan", "Roshan", this.alleAktien),
            new User("Barat", "Barat", this.alleAktien),
            new User("Paul", "Paul", this.alleAktien),

        ];
        this.finder=new Finder(this.users,this.alleAktien);
        this.nachrichten = [];
        this.schritte = 0;
        setInterval(this.aktualisiereAktienkurse.bind(this), 500);
    };

    aktualisiereAktienkurse() {
        // Zähler für Kursveränderungen
        this.schritte++;
        for (let i = 0; i < this.alleAktien.length; i++) {

            // Zufällige Veränderung der Parameter einer Sinus-Schwingung
            if (Math.random() < 0.01) {
                this.alleAktien[i].grundWert += 20 - Math.random() * 40;
                if (this.alleAktien[i].grundWert < 10) {
                    this.alleAktien[i].grundWert = 10;
                }
            }
            if (Math.random() < 0.08) {
                this.alleAktien[i].amplitude += 15 - Math.random() * 30;
                if (this.alleAktien[i].amplitude < 1) {
                    this.alleAktien[i].amplitude = 1;
                }
            }
            if (Math.random() < 0.01) {
                this.alleAktien[i].phase += 10 - Math.random() * 20;
            }
            if (Math.random() < 0.10) {
                this.alleAktien[i].phasenLaenge += 30 - Math.random() * 60;
                if (this.alleAktien[i].phasenLaenge < 50) {
                    this.alleAktien[i].phasenLaenge = 50;
                }
            }

            // Rauschen berechnen
            let rauschen = 4 - Math.random() * 2;
            // Berechnen der Sinus-Schwingung
            this.alleAktien[i].preis = Math.round(100 * Math.sin((this.schritte + this.alleAktien[i].phase) / this.alleAktien[i].phasenLaenge) * this.alleAktien[i].amplitude
                + this.alleAktien[i].grundWert + rauschen) / 100;
            if (this.alleAktien[i].preis < 0) {
                this.alleAktien[i].preis = 1;
            }
        }
    }

    static createUmsatz(aktie,anzahl){
        return new Umsatz(aktie,anzahl);
    }

}

module.exports = Boerse;