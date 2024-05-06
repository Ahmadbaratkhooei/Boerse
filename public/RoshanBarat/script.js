'use strict';

document.addEventListener('DOMContentLoaded', () => { //wartet auf HTML ladung


    //Funktion zum Abrufen von Benutzerdaten vom Server
    async function fetchUserData() {
        try {
            const response = await fetch('/api/benutzerdaten');
            const userData = await response.json();
            document.getElementById('username').innerText = `Benutzername: ${userData.name}`;
            document.getElementById('account-balance').innerText = `Kontostand: ${userData.kontostand} EUR`;

        } catch (error) {
            console.error('Fehler beim Abrufen von Benutzerdaten:', error);
            displayError('Ungültige Eingabe. Bitte geben Sie einen gültigen BenutzerName ein.');
        }
    }



    // Funktion zur Ausführung von Kauf oder Verkauf von Aktien(Post Umsätze)
    async function executeTransaction(action, AktienName, Anzahl) {
        try {
            const response = await fetch('/api/umsaetze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    aktie: { name: AktienName },
                    anzahl: Anzahl,
                }),
            });

            if (response.status === 201) {
                // Benutzeroberfläche aktualisieren
                await fetchUserData();
                await updateStockChart();
                await fetchTransactions();
            }

            else if (response.status === 422) {
                // Fehlerhafte Eingabe
                const errorResponse = await response.json();
                console.error('Ungültige Aktion:', errorResponse.error);
                displayError(errorResponse.error);
            }

            else {
                console.error('Unerwarteter Fehler beim Kauf/Verkauf von Aktien:', response.statusText);
                displayError('Unerwarteter Fehler beim Kauf/Verkauf von Aktien.');
            }
        } catch (error) {
            console.error('Fehler beim Kauf/Verkauf von Aktien:', error);
            displayError('Fehler beim Kauf/Verkauf von Aktien');


        }
    }



    // Funktion zum Abrufen von Umsatzinformationen(Get Umsätze)
    async function fetchTransactions() {
        try {
            const response = await fetch('/api/umsaetze');
            const transactionsData = await response.json();

            const transactionsContainer = document.getElementById('transactions');
            transactionsContainer.innerHTML = '<h2>Umsätze</h2>\n' + '<br>';
            transactionsData.forEach(transaction => {
                const transactionItem = document.createElement('p');
                transactionItem.innerText =
                    `${transaction.anzahl} Stück ${transaction.aktie.name} (Einheitspreis ist ${transaction.aktie.preis}€) & (Anzahlverfübar ist: ${transaction.aktie.anzahlVerfuegbar} )`;
                transactionsContainer.appendChild(transactionItem);
            });
        } catch (error) {
            console.error('Fehler beim Abrufen von Umsatzdaten:', error);
            displayError('Fehler beim Kauf/Verkauf von Aktien');
        }
    }



    //Kaufen-Button

    document.getElementById('buyButton').addEventListener('click', () => {
        document.getElementById('buyForm').style.display = 'block';
    });

    document.getElementById('buySubmitButton').addEventListener('click', async () => {
        let AktienName = document.getElementById('AktienNameKauf').value;
        let Anzahl = parseInt(document.getElementById('AnzahlKauf').value, 10); //decimal zahlensystem

        if (!AktienName || isNaN(Anzahl) || Anzahl <= 0) {
            displayError('Ungültige Eingabe. Bitte geben Sie einen gültigen Aktiennamen und eine positive Anzahl ein.');
            return;
        }

        await executeTransaction('KAUF', AktienName, Anzahl);
        document.getElementById('buyForm').style.display = 'none';
    });




    //Verkaufen-Button

    document.getElementById('sellButton').addEventListener('click', () => {
        document.getElementById('sellForm').style.display = 'block';
    });

    document.getElementById('sellSubmitButton').addEventListener('click', async () => {
        let AktienName = document.getElementById('AktienNameVerkauf').value;
        let Anzahl = parseInt(document.getElementById('AnzahlVerkauf').value, 10);

        if (!AktienName || isNaN(Anzahl) || Anzahl <= 0) {
            displayError('Ungültige Eingabe. Bitte geben Sie einen gültigen Aktiennamen und eine positive Anzahl ein.');
            return;
        }

        if (Anzahl > 0) {
            Anzahl = -Anzahl;
        }

        await executeTransaction('VERKAUF', AktienName, Anzahl);
        document.getElementById('sellForm').style.display = 'none';
    });



    //grafische Darstellung

    let stockChart;
    async function updateStockChart() {
        try {
            const response = await fetch('/api/aktien');
            const stockData = await response.json();

            const stockChartCanvas = document.getElementById('stock-chart');
            const stockChartContext = stockChartCanvas.getContext('2d');

            const stockLabels = stockData.map(stock => stock.name);
            const stockPrices = stockData.map(stock => stock.preis);

            if (stockChart) {
                stockChart.destroy(); // um immer neue zu erstellen, sonst kein neuer Inhalt
            }

            stockChart = new Chart(stockChartContext, {
                type: 'bar',
                data: {
                    labels: stockLabels,
                    datasets: [{
                        label: 'Aktienkurse (EUR)',
                        data: stockPrices,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });



            // Aktienkurs-Liste erstellen (unter der grafischen Darstellung)

            const stockPricesContainer = document.getElementById('stock-prices');
            stockPricesContainer.innerHTML = `${stockData.map(stock => ` (${stock.name}:${stock.preis} EUR)`).join(', ')}`;


        } catch (error) {
            console.error('Fehler beim Abrufen von Aktiendaten:', error);
            displayError('Fehler beim Abrufen von Aktiendaten');

        }
    }




    //Refresh-Button(manuele Aktualisierung)

    document.getElementById('RefreshButton').addEventListener('click', async () => {
        try {
            await updateStockChart();
        } catch (error) {
            console.error('Fehler beim Anzeigen der Aktienkurse:', error);
            displayError('Fehler beim Anzeigen der Aktienkurse.');
        }
    });


    //Funktion zum Abrufen der sortierter Rangliste vom Server

    async function fetchLeaderboard() {
        try {
            const response = await fetch('/api/depotAlle');
            const leaderboardData = await response.json();

            // Sortierung der Daten nach der Summe(Vermögen)
            leaderboardData.sort((a, b) => b.summe - a.summe);// Elemente in absteigender Reihenfolge

            const leaderboardContainer = document.getElementById('leaderboard');
            leaderboardContainer.innerHTML = '<h2>Rangliste</h2>\n' + '<br>';
            leaderboardData.forEach(entry => {
                const leaderboardItem = document.createElement('p');
                leaderboardItem.innerText = `Benutzer: ${entry.name}, Vermögen: ${entry.summe} EUR`;
                leaderboardContainer.appendChild(leaderboardItem);
            });

        } catch (error) {
            console.error('Fehler beim Abrufen der Rangliste:', error);
            displayError('Fehler beim Abrufen der Rangliste.');
        }
    }



    //Funktion zum Anzeigen von Kauf- und Verkaufsnachrichten

    async function fetchMarketMessages() {
        try {
            const response = await fetch('/api/nachrichten');
            const marketMessagesData = await response.json();

            const marketMessagesContainer = document.getElementById('market-messages');
            marketMessagesContainer.innerHTML = '<h2>Marktnachrichten</h2>\n' + '<br>';
            if (marketMessagesData && marketMessagesData.length > 0) {
                marketMessagesData.forEach(message => {
                    const timestamp = new Date(message.zeit);
                    const formattedDate = timestamp.toLocaleString();
                    const messageItem = document.createElement('p');
                    messageItem.innerText = `${formattedDate}: ${message.text}`;
                    marketMessagesContainer.appendChild(messageItem);
                });
            } else {
                marketMessagesContainer.innerHTML = '<p>Noch keine Marktnachrichten verfügbar.</p>';
            }
        } catch (error) {
            console.error('Fehler beim Abrufen der Marktnachrichten:', error);
            displayError('Fehler beim Abrufen der Marktnachrichten.');
        }
    }




    //---------------Funktion zum Automatische kaufen & verkaufen-----------

    // globale Preisgrenzen für alle Aktien
    const globalBuyPrice = 1.1;
    const globalSellPrice = 30;
    let autoTradeInterval;

    async function autoTrade() {
        try {
            const response = await fetch('/api/aktien');
            const stockData = await response.json();

            for (let stock of stockData) {
                if (stock.preis < globalBuyPrice) {
                    await executeTransaction('KAUF', stock.name, 1);
                } else if (stock.preis > globalSellPrice) {
                    await executeTransaction('VERKAUF', stock.name, -1);
                }
            }
        } catch (error) {
            console.error('Fehler beim automatischen Handel:', error);
            displayError('Fehler beim automatischen Handel');

        }
    }

    function startAutoTrade() {
        autoTrade(); // Führe die Funktion sofort aus
        autoTradeInterval = setInterval(autoTrade, 5000); // jede 5 Sekunde
    }

    function stopAutoTrade() {
        clearInterval(autoTradeInterval);
    }

    //Start-Stop Button

    const startStopButton = document.getElementById('startStopButton');
    startStopButton.addEventListener('click', function () {
        if (autoTradeInterval) {
            stopAutoTrade();
            startStopButton.textContent = 'Start Auto-Trade';
        } else {
            startAutoTrade();
            startStopButton.textContent = 'Stop Auto-Trade';
        }
    });





    // Funktion zum Anzeigen von Fehlermeldungen

    function displayError(errorMessage) {
        const errorContainer = document.getElementById('errors');
        errorContainer.innerHTML = `<p class="error-message">${errorMessage}</p>`;
        // Fehlermeldung nach einigen Sekunden entfernen
        setTimeout(() => {
            errorContainer.innerHTML = '';
        }, 6000);
    }

    function startAutoUpdate() {

        setInterval(async () => {
            await updateStockChart();
        }, 5000); // 5 Sekunde

        setInterval(async () => {
            await fetchLeaderboard();
        }, 5000); // 5 Sekunde

        setInterval(async () => {
            await fetchMarketMessages();
        }, 5000); // 5 Sekunde

    }

    startAutoUpdate();



// Initialisierungen
    fetchUserData();
    fetchTransactions();
    updateStockChart();
    fetchLeaderboard();
    fetchMarketMessages();


});





