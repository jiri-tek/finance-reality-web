/**
 * Google Apps Script pro odesílání formulářových dat do Google Sheets
 * a zasílání emailových notifikací
 *
 * PROJEKT: FINANCE & REALITY – Metelka & Bracková
 *
 * NÁVOD NA INSTALACI:
 *
 * 1. Otevřete Google Sheets tabulku:
 *    https://docs.google.com/spreadsheets/d/10wgotv6pxPfcP3tATYOrfM2gTCjcsopIa-pRdY3k5iI/edit
 * 2. Klikněte na Rozšíření > Apps Script
 * 3. Smažte veškerý výchozí kód a vložte tento skript
 * 4. Klikněte na Nasadit > Nové nasazení
 * 5. Vyberte typ: Webová aplikace
 * 6. Nastavte:
 *    - Execute as: Me (vaš@email.com)
 *    - Who has access: Anyone (kdokoli)
 * 7. Klikněte Nasadit
 * 8. Zkopírujte URL webové aplikace
 * 9. Vložte tuto URL do souboru final.html do konstanty GOOGLE_SCRIPT_URL
 *
 * STRUKTURA TABULKY:
 * List musí mít název "leads" a sloupce:
 * Číslo | Datum | Jméno | Email | Telefon | Lokalita | Typ dotazu | Zpráva
 *
 * EMAILOVÉ NOTIFIKACE:
 * Po každém vyplnění formuláře se automaticky odešle email na:
 * - lukas.metelka@zfpa.cz (Lukáš Metelka)
 */

function doPost(e) {
  try {
    // ID Google Sheets tabulky Finance & Reality
    var sheetId = "10wgotv6pxPfcP3tATYOrfM2gTCjcsopIa-pRdY3k5iI";
    var sheetName = "leads";

    // Otevřít tabulku a list
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName(sheetName);

    // Pokud list neexistuje, vytvořit ho s hlavičkami
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(["Číslo", "Datum", "Jméno", "Email", "Telefon", "Lokalita", "Typ dotazu", "Zpráva"]);
    }

    // Parsovat přijatá data
    var data = JSON.parse(e.postData.contents);

    // Získat poslední číslo zakázky a inkrementovat
    var lastRow = sheet.getLastRow();
    var leadNumber = lastRow > 1 ? lastRow : 1;

    // Formátovat datum česky
    var now = new Date();
    var formattedDate = Utilities.formatDate(now, "Europe/Prague", "dd.MM.yyyy HH:mm");

    // Mapovat typ dotazu na čitelný text
    var typeMap = {
      'finance': 'Finance',
      'reality': 'Reality',
      'both': 'Finance i Reality'
    };
    var typeText = typeMap[data.type] || data.type;

    // Zapsat data do nového řádku
    sheet.appendRow([
      leadNumber,
      formattedDate,
      data.name,
      data.email,
      data.phone || '-',
      data.locality || '-',
      typeText,
      data.message || '-'
    ]);

    // Odeslat emailovou notifikaci
    sendEmailNotification(data, leadNumber, typeText);

    // Vrátit úspěšnou odpověď
    return ContentService.createTextOutput(JSON.stringify({
      "result": "success",
      "message": "Data byla úspěšně uložena",
      "leadNumber": leadNumber
    })).setMimeType(ContentService.MimeType.JSON);

  } catch(error) {
    // V případě chyby vrátit error
    return ContentService.createTextOutput(JSON.stringify({
      "result": "error",
      "error": error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Funkce pro odeslání emailové notifikace
 */
function sendEmailNotification(data, leadNumber, typeText) {
  // Příjemci notifikací (pro testování)
  var recipients = "staffa.ppc@gmail.com";
  var subject = "Nová poptávka z webu Finance & Reality #" + leadNumber;

  var emailBody = "Byla odeslána nová poptávka z webové stránky Finance & Reality.\n\n" +
                  "Detail poptávky č. " + leadNumber + ":\n" +
                  "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                  "Jméno: " + data.name + "\n" +
                  "E-mail: " + data.email + "\n" +
                  "Telefon: " + (data.phone || "neuvedeno") + "\n" +
                  "Lokalita: " + (data.locality || "neuvedena") + "\n" +
                  "Typ dotazu: " + typeText + "\n\n" +
                  "Zpráva:\n" +
                  (data.message || "Bez zprávy") + "\n\n" +
                  "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                  "Datum odeslání: " + new Date().toLocaleString('cs-CZ', {timeZone: 'Europe/Prague'}) + "\n\n" +
                  "Tento e-mail byl odeslán automaticky z webu Finance & Reality.";

  try {
    MailApp.sendEmail({
      to: recipients,
      subject: subject,
      body: emailBody
    });
  } catch(error) {
    Logger.log("Chyba při odesílání emailu: " + error.toString());
  }
}

/**
 * Testovací funkce pro ověření funkčnosti
 * Spusťte tuto funkci v Apps Script editoru pro otestování
 */
function testDoPost() {
  var testData = {
    postData: {
      contents: JSON.stringify({
        name: "Test Uživatel",
        email: "test@example.com",
        phone: "+420 123 456 789",
        locality: "Brno",
        type: "both",
        message: "Toto je testovací zpráva z webu Finance & Reality."
      })
    }
  };

  var result = doPost(testData);
  Logger.log(result.getContent());
}

/**
 * Testovací funkce pro ověření odesílání emailů
 */
function testEmailNotification() {
  var testData = {
    name: "Test Uživatel",
    email: "test@example.com",
    phone: "+420 123 456 789",
    locality: "Brno",
    type: "both",
    message: "Toto je testovací poptávka pro ověření emailové notifikace."
  };

  sendEmailNotification(testData, 999, "Finance i Reality");
  Logger.log("Testovací email byl odeslán na staffa.ppc@gmail.com");
}

/**
 * Funkce pro CORS - povolení OPTIONS požadavků
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    "result": "success",
    "message": "API Finance & Reality je aktivní"
  })).setMimeType(ContentService.MimeType.JSON);
}
